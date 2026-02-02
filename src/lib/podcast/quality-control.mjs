import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AudioQualityAnalyzer {
  constructor(options = {}) {
    this.thresholds = {
      minimumDuration: options.minimumDuration || 60,
      maximumDuration: options.maximumDuration || 3600,
      minimumSize: options.minimumSize || 0.5,
      maximumSize: options.maximumSize || 100,
      silenceThreshold: options.silenceThreshold || -40,
      maxSilenceDuration: options.maxSilenceDuration || 2,
      volumeRange: options.volumeRange || [0.3, 0.8],
      ...options.customThresholds
    };
  }

  async analyzeAudioFile(filePath) {
    console.log(`[Quality Analyzer] 分析音频文件: ${filePath}`);
    
    try {
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      const audioInfo = await this.getAudioDuration(filePath);
      
      const analysis = {
        filePath,
        fileSize: fileSizeMB,
        fileSizeFormatted: `${fileSizeMB.toFixed(2)} MB`,
        duration: audioInfo.duration,
        durationFormatted: this.formatDuration(audioInfo.duration),
        sampleRate: audioInfo.sampleRate,
        channels: audioInfo.channels,
        bitrate: audioInfo.bitrate,
        timestamp: new Date().toISOString()
      };
      
      analysis.silence = await this.detectSilence(filePath);
      analysis.volume = await this.analyzeVolume(filePath);
      analysis.qualityScore = this.calculateQualityScore(analysis);
      analysis.issues = this.identifyIssues(analysis);
      analysis.approved = analysis.qualityScore >= (this.thresholds.qualityThreshold || 0.7);
      
      return analysis;
    } catch (error) {
      console.error('[Quality Analyzer] 分析音频失败:', error);
      throw error;
    }
  }

  async getAudioDuration(filePath) {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=sample_rate,channels -of json "${filePath}"`
      );
      
      const metadata = JSON.parse(stdout);
      
      if (metadata.format && metadata.format.duration) {
        return {
          duration: Math.round(parseFloat(metadata.format.duration)),
          sampleRate: metadata.streams[0]?.sample_rate || 44100,
          channels: metadata.streams[0]?.channels || 2,
          bitrate: metadata.format?.bit_rate || 128000
        };
      }
      
      return {
        duration: 0,
        sampleRate: 44100,
        channels: 2,
        bitrate: 128000
      };
    } catch (error) {
      console.warn('[Quality Analyzer] FFprobe 不可用，使用默认值:', error);
      return {
        duration: 120,
        sampleRate: 44100,
        channels: 2,
        bitrate: 128000
      };
    }
  }

  async detectSilence(filePath) {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${filePath}" -af "silencedetect=noise=${this.thresholds.silenceThreshold}dB:d=${this.thresholds.maxSilenceDuration}" -f null -`
      );
      
      const output = stdout;
      const silenceDurations = output.match(/silence_duration: ([\d.]+)/g) || [];
      const totalSilence = silenceDurations.reduce((sum, match) => sum + parseFloat(match[1]), 0);
      
      return {
        detected: silenceDurations.length > 0,
        count: silenceDurations.length,
        totalDuration: totalSilence,
        averageDuration: totalSilence / (silenceDurations.length || 1),
        percentage: (totalSilence / this.getAudioDuration(filePath).then(r => r.duration)) * 100
      };
    } catch (error) {
      console.warn('[Quality Analyzer] 静音检测不可用:', error);
      return {
        detected: false,
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        percentage: 0
      };
    }
  }

  async analyzeVolume(filePath) {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${filePath}" -af "volumedetect" -f null -`
      );
      
      const meanVolumeMatch = stdout.match(/mean_volume: ([\-\d.]+)/);
      const maxVolumeMatch = stdout.match(/max_volume: ([\-\d.]+)/);
      
      const meanVolume = meanVolumeMatch ? parseFloat(meanVolumeMatch[1]) : -20;
      const maxVolume = maxVolumeMatch ? parseFloat(maxVolumeMatch[1]) : -10;
      
      const [minVolume, maxVolumeThreshold] = this.thresholds.volumeRange;
      
      const normalizedMean = (meanVolume - minVolume) / (maxVolumeThreshold - minVolume);
      
      return {
        mean: meanVolume,
        max: maxVolume,
        normalized: normalizedMean,
        inRange: normalizedMean >= 0 && normalizedMean <= 1,
        level: this.getVolumeLevel(normalizedMean)
      };
    } catch (error) {
      console.warn('[Quality Analyzer] 音量分析不可用:', error);
      return {
        mean: -20,
        max: -10,
        normalized: 0.5,
        inRange: true,
        level: 'normal'
      };
    }
  }

  calculateQualityScore(analysis) {
    let score = 0;
    const weights = {
      duration: 0.25,
      size: 0.15,
      volume: 0.25,
      silence: 0.2,
      consistency: 0.15
    };
    
    const durationScore = this.scoreDuration(analysis.duration);
    score += durationScore * weights.duration;
    
    const sizeScore = this.scoreSize(analysis.fileSize);
    score += sizeScore * weights.size;
    
    const volumeScore = this.scoreVolume(analysis.volume);
    score += volumeScore * weights.volume;
    
    const silenceScore = this.scoreSilence(analysis.silence);
    score += silenceScore * weights.silence;
    
    const consistencyScore = this.scoreConsistency(analysis);
    score += consistencyScore * weights.consistency;
    
    return Math.min(1, Math.max(0, score));
  }

  scoreDuration(duration) {
    if (duration < this.thresholds.minimumDuration) {
      return 0.2;
    }
    
    if (duration > this.thresholds.maximumDuration) {
      return 0.5;
    }
    
    const idealMin = this.thresholds.minimumDuration * 1.5;
    const idealMax = this.thresholds.maximumDuration * 0.8;
    
    if (duration >= idealMin && duration <= idealMax) {
      return 1.0;
    }
    
    const distance = Math.min(
      Math.abs(duration - idealMin),
      Math.abs(duration - idealMax)
    );
    
    return Math.max(0.5, 1.0 - (distance / 600));
  }

  scoreSize(size) {
    if (size < this.thresholds.minimumSize) {
      return 0.2;
    }
    
    if (size > this.thresholds.maximumSize) {
      return 0.5;
    }
    
    const idealMin = this.thresholds.minimumSize * 2;
    const idealMax = this.thresholds.maximumSize * 0.6;
    
    if (size >= idealMin && size <= idealMax) {
      return 1.0;
    }
    
    const distance = Math.min(
      Math.abs(size - idealMin),
      Math.abs(size - idealMax)
    );
    
    return Math.max(0.5, 1.0 - (distance / 50));
  }

  scoreVolume(volume) {
    if (!volume || !volume.inRange) {
      return 0.5;
    }
    
    return volume.normalized >= 0.3 && volume.normalized <= 0.8 ? 1.0 : 0.7;
  }

  scoreSilence(silence) {
    if (!silence || !silence.detected) {
      return 1.0;
    }
    
    if (silence.percentage > 30) {
      return 0.3;
    }
    
    if (silence.percentage > 20) {
      return 0.5;
    }
    
    return 0.8;
  }

  scoreConsistency(analysis) {
    let consistencyScore = 1.0;
    
    if (analysis.bitrate < 64000) {
      consistencyScore *= 0.7;
    }
    
    if (analysis.sampleRate < 22050) {
      consistencyScore *= 0.8;
    }
    
    if (analysis.channels < 1) {
      consistencyScore *= 0.6;
    }
    
    return consistencyScore;
  }

  identifyIssues(analysis) {
    const issues = [];
    
    if (analysis.duration < this.thresholds.minimumDuration) {
      issues.push({
        type: 'duration',
        severity: 'high',
        message: `音频时长过短 (${analysis.durationFormatted})，建议至少 ${this.formatDuration(this.thresholds.minimumDuration)}`
      });
    }
    
    if (analysis.duration > this.thresholds.maximumDuration) {
      issues.push({
        type: 'duration',
        severity: 'medium',
        message: `音频时长过长 (${analysis.durationFormatted})，可能影响用户体验`
      });
    }
    
    if (analysis.fileSize < this.thresholds.minimumSize) {
      issues.push({
        type: 'size',
        severity: 'high',
        message: `文件大小过小 (${analysis.fileSizeFormatted})，可能生成失败`
      });
    }
    
    if (analysis.fileSize > this.thresholds.maximumSize) {
      issues.push({
        type: 'size',
        severity: 'medium',
        message: `文件大小过大 (${analysis.fileSizeFormatted})，超过 ${this.thresholds.maximumSize} MB 限制`
      });
    }
    
    if (analysis.volume && !analysis.volume.inRange) {
      issues.push({
        type: 'volume',
        severity: 'medium',
        message: `音量不在正常范围 (${analysis.volume.level})，建议调整`
      });
    }
    
    if (analysis.silence && analysis.silence.percentage > 20) {
      issues.push({
        type: 'silence',
        severity: 'medium',
        message: `静音过多 (${analysis.silence.percentage.toFixed(1)}%)，影响用户体验`
      });
    }
    
    return issues;
  }

  getVolumeLevel(normalized) {
    if (normalized < 0.3) return 'too_low';
    if (normalized > 0.8) return 'too_high';
    return 'normal';
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

export async function validatePodcastQuality(audioPath, contentLength, options = {}) {
  const analyzer = new AudioQualityAnalyzer(options);
  
  try {
    const analysis = await analyzer.analyzeAudioFile(audioPath);
    
    const result = {
      approved: analysis.approved,
      score: analysis.qualityScore,
      scoreFormatted: `${(analysis.qualityScore * 100).toFixed(1)}%`,
      analysis,
      issues: analysis.issues,
      timestamp: new Date().toISOString()
    };
    
    if (!result.approved) {
      console.warn('[Quality Control] 质量检查未通过:', result.scoreFormatted);
      console.warn('[Quality Control] 问题:', result.issues.map(i => i.message).join(', '));
    } else {
      console.log('[Quality Control] 质量检查通过:', result.scoreFormatted);
    }
    
    return result;
  } catch (error) {
    console.error('[Quality Control] 质量验证失败:', error);
    throw error;
  }
}

export async function enhanceAudioQuality(audioPath, outputPath, options = {}) {
  const enhancements = {
    normalizeAudio: options.normalizeAudio !== false,
    removeSilence: options.removeSilence !== false,
    adjustVolume: options.adjustVolume,
    fadeIntro: options.fadeIntro !== false,
    fadeOutro: options.fadeOutro !== false,
    ...options.customEnhancements
  };
  
  console.log(`[Audio Enhancer] 增强音频: ${audioPath}`);
  
  const filters = [];
  
  if (enhancements.normalizeAudio) {
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  }
  
  if (enhancements.removeSilence) {
    filters.push('silenceremove=stop_periods=1:stop_duration=1:start_periods=1:start_silence=0.1');
  }
  
  if (enhancements.adjustVolume) {
    filters.push(`volume=${enhancements.adjustVolume}`);
  }
  
  if (enhancements.fadeIntro) {
    filters.push('afade=t=in:st=0:d=1');
  }
  
  if (enhancements.fadeOutro) {
    filters.push('afade=t=out:st=0:d=1');
  }
  
  const filterString = filters.join(',');
  
  try {
    let command = `ffmpeg -i "${audioPath}"`;
    
    if (filterString) {
      command += ` -af "${filterString}"`;
    }
    
    command += ` -c:a libmp3lame -b:a 128k "${outputPath}"`;
    
    console.log('[Audio Enhancer] 执行命令:', command);
    
    await execAsync(command);
    
    console.log('[Audio Enhancer] 音频增强完成');
    
    return {
      success: true,
      outputPath,
      filters: filterString
    };
  } catch (error) {
    console.error('[Audio Enhancer] 音频增强失败:', error);
    throw error;
  }
}