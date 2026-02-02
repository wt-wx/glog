import { processBlogContent } from './content-processor.mjs';
import { generateAndDownloadPodcast, validatePodcast } from './podcast-generator.mjs';
import {
  createConversionStatus,
  updateConversionStatus,
  updateStageStatus,
  updateProgress,
  getConversionStatus,
  CONVERSION_STATUS
} from './status-manager.mjs';
import {
  validatePodcastQuality,
  enhanceAudioQuality
} from './quality-control.mjs';
import {
  getGlobalMonitor,
  trackConversion,
  trackError
} from './performance-monitor.mjs';
import {
  recommendVoiceStyle,
  createStyleOptions,
  adaptContentForStyle
} from './voice-style-manager.mjs';
import {
  generateAndDownloadAudio as elevenlabsGenerate,
  getAvailableVoices as fetchElevenLabsVoices,
  recommendVoiceForContent
} from './elevenlabs-enhancer.mjs';

const AUDIO_ENGINE = process.env.PODCAST_AUDIO_ENGINE || 'wondercraft';
const ENABLE_ENHANCEMENT = process.env.ENABLE_AUDIO_ENHANCEMENT !== 'false';
const ENABLE_QUALITY_CONTROL = process.env.ENABLE_QUALITY_CONTROL !== 'false';
const ENABLE_VOICE_STYLE_DETECTION = process.env.ENABLE_VOICE_STYLE_AUTO_DETECTION !== 'false';

export async function convertBlogToPodcast(blogPost, options = {}) {
  const postId = blogPost.id || blogPost.slug;
  const podcastId = `podcast-${postId}-${Date.now()}`;

  const monitor = getGlobalMonitor({
    logLevel: process.env.PERFORMANCE_LOG_LEVEL || 'info',
    persistLogs: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
    enableMetrics: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false'
  });

  await monitor.log('info', 'conversion', `开始转换博客: ${blogPost.data.title} (ID: ${postId})`);

  try {
    await createConversionStatus(postId, {
      podcastId,
      blogTitle: blogPost.data.title,
      blogUrl: `/blog/${blogPost.slug}`
    });

    await updateConversionStatus(postId, {
      status: CONVERSION_STATUS.PROCESSING,
      progress: 10
    });

    await monitor.log('info', 'conversion', '步骤 1/5: 处理博客内容...');
    const contentTimer = await monitor.startTimer('content-processing');
    await updateStageStatus(postId, 'contentProcessing', { status: 'in_progress' });

    const processedContent = await processBlogContent(blogPost);

    await monitor.log('info', 'conversion', `内容处理完成，预计时长: ${processedContent.duration.minutes} 分钟`);

    await updateStageStatus(postId, 'contentProcessing', {
      status: 'completed',
      result: { title: processedContent.title, duration: processedContent.duration }
    });
    await updateProgress(postId, 20);
    await monitor.endTimer(contentTimer);

    let audioPath, audioResult;

    if (AUDIO_ENGINE === 'elevenlabs' && options.useElevenLabs) {
      await monitor.log('info', 'conversion', '步骤 2/5: 使用 ElevenLabs 生成播客音频...');
      const elevenlabsTimer = await monitor.startTimer('elevenlabs-generation');
      await updateStageStatus(postId, 'audioGeneration', { status: 'in_progress' });

      const styleOptions = createStyleOptions(blogPost, options.voiceStyle);
      const adaptedContent = ENABLE_VOICE_STYLE_DETECTION
        ? adaptContentForStyle(processedContent.script, styleOptions.styleKey)
        : processedContent.script;

      const voiceRecommendation = await recommendVoiceForContent(adaptedContent);

      audioResult = await elevenlabsGenerate(adaptedContent, {
        voiceId: voiceRecommendation?.voice_id || options.voiceId,
        modelId: options.modelId || process.env.DEFAULT_VOICE_MODEL || 'eleven_multilingual_v2',
        voiceSettings: styleOptions.style.voiceSettings
      });

      await monitor.log('info', 'conversion', `ElevenLabs 音频生成完成，大小: ${audioResult.sizeFormatted}`);

      await updateStageStatus(postId, 'audioGeneration', { status: 'completed' });
      await updateProgress(postId, 50);
      await monitor.endTimer(elevenlabsTimer);
    } else {
      await monitor.log('info', 'conversion', '步骤 2/5: 使用 Wondercraft 生成播客音频...');
      const wondercraftTimer = await monitor.startTimer('wondercraft-generation');
      await updateStageStatus(postId, 'audioGeneration', { status: 'in_progress' });

      audioResult = await generateAndDownloadPodcast(processedContent, podcastId, {
        voiceStyle: options.voiceStyle || styleOptions?.styleKey || 'professional_conversational',
        includeIntro: options.includeIntro !== false,
        includeOutro: options.includeOutro !== false,
        backgroundMusic: options.backgroundMusic || 'subtle_tech'
      });

      await monitor.log('info', 'conversion', `Wondercraft 音频生成完成，大小: ${audioResult.sizeFormatted}`);

      await updateStageStatus(postId, 'audioGeneration', { status: 'completed' });
      await updateProgress(postId, 50);
      await monitor.endTimer(wondercraftTimer);
    }

    audioPath = audioResult.localPath;

    if (ENABLE_ENHANCEMENT) {
      await monitor.log('info', 'conversion', '步骤 3/5: 音频后期处理...');
      const enhancementTimer = await monitor.startTimer('audio-enhancement');
      await updateStageStatus(postId, 'audioEnhancement', { status: 'in_progress' });

      const enhancedPath = audioPath.replace('.mp3', '-enhanced.mp3');

      await enhanceAudioQuality(audioPath, enhancedPath, {
        normalizeAudio: options.normalizeAudio !== false,
        removeSilence: options.removeSilence !== false,
        adjustVolume: options.adjustVolume,
        fadeIntro: options.fadeIntro !== false,
        fadeOutro: options.fadeOutro !== false
      });

      audioPath = enhancedPath;
      audioResult.audioPath = audioResult.audioPath.replace('/podcasts/', '/podcasts/podcast-').replace('.mp3', '-enhanced.mp3');

      await monitor.log('info', 'conversion', '音频增强完成');

      await updateStageStatus(postId, 'audioEnhancement', { status: 'completed' });
      await updateProgress(postId, 70);
      await monitor.endTimer(enhancementTimer);
    } else {
      await updateStageStatus(postId, 'audioEnhancement', { status: 'completed', reason: 'enhancement disabled' });
      await updateProgress(postId, 70);
    }

    if (ENABLE_QUALITY_CONTROL) {
      await monitor.log('info', 'conversion', '步骤 4/5: 验证音频质量...');
      const validationTimer = await monitor.startTimer('quality-validation');
      await updateStageStatus(postId, 'qualityValidation', { status: 'in_progress' });

      const validation = await validatePodcastQuality(audioPath, processedContent.script?.length || 0, {
        qualityThreshold: parseFloat(process.env.PODCAST_QUALITY_THRESHOLD) || 0.8,
        minimumDuration: parseInt(process.env.MIN_PODCAST_DURATION) || 60,
        maximumDuration: parseInt(process.env.MAX_PODCAST_DURATION) || 3600
      });

      await monitor.log('info', 'conversion', `质量检查结果: ${validation.scoreFormatted}`);

      if (!validation.approved) {
        await monitor.log('warn', 'conversion', '质量检查未通过，发现问题:', {
          issues: validation.issues.map(i => i.message)
        });

        const retryAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
        const currentAttempt = options.retryAttempt || 0;

        if (currentAttempt < retryAttempts) {
          await monitor.log('info', 'conversion', `尝试重新生成 (${currentAttempt + 1}/${retryAttempts})...`);
          options.retryAttempt = currentAttempt + 1;
          return await convertBlogToPodcast(blogPost, options);
        }
      }

      await updateStageStatus(postId, 'qualityValidation', {
        status: 'completed',
        result: validation
      });
      await updateProgress(postId, 85);
      await monitor.endTimer(validationTimer);
    } else {
      await updateStageStatus(postId, 'qualityValidation', {
        status: 'completed',
        reason: 'quality control disabled'
      });
      await updateProgress(postId, 85);
    }

    await monitor.log('info', 'conversion', '步骤 5/5: 完成转换...');

    const finalResult = {
      success: true,
      podcastId,
      postId,
      audioPath: audioResult.audioPath,
      audioUrl: `${process.env.SITE_URL || 'https://glog.geniux.net'}${audioResult.audioPath}`,
      duration: processedContent.duration,
      metadata: {
        title: processedContent.title,
        description: processedContent.description,
        tags: processedContent.tags
      },
      createdAt: new Date().toISOString(),
      audioEngine: AUDIO_ENGINE,
      enhanced: ENABLE_ENHANCEMENT,
      qualityScore: validation?.score || null,
      styleUsed: styleOptions?.styleName || options.voiceStyle
    };

    await updateConversionStatus(postId, {
      status: CONVERSION_STATUS.COMPLETED,
      progress: 100,
      ...finalResult
    });

    await monitor.log('info', 'conversion', `✅ 转换完成: ${blogPost.data.title}`);
    await monitor.log('info', 'conversion', `播客链接: ${finalResult.audioUrl}`);

    return finalResult;

  } catch (error) {
    await monitor.log('error', 'conversion', `❌ 转换失败: ${error.message}`);
    await trackError(error, { postId, operation: 'convertBlogToPodcast' });

    await updateConversionStatus(postId, {
      status: CONVERSION_STATUS.FAILED,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

export async function retryConversion(postId, blogPost, options = {}) {
  await monitor.log('info', 'conversion', `重试转换博客: ${postId}`);

  await createConversionStatus(postId, {
    retry: true,
    previousError: 'Manual retry requested'
  });

  return await convertBlogToPodcast(blogPost, options);
}

export async function getConversionProgress(postId) {
  const status = await getConversionStatus(postId);

  if (!status) {
    return null;
  }

  return {
    status: status.status,
    progress: status.progress,
    stages: status.stages,
    createdAt: status.createdAt,
    updatedAt: status.updatedAt,
    result: status.status === CONVERSION_STATUS.COMPLETED ? {
      audioUrl: status.audioUrl,
      duration: status.duration
    } : null,
    error: status.status === CONVERSION_STATUS.FAILED ? status.error : null
  };
}

export async function batchConvertBlogPosts(blogPosts, options = {}) {
  await monitor.log('info', 'batch', `批量转换 ${blogPosts.length} 篇博客`);

  const results = [];

  for (let i = 0; i < blogPosts.length; i++) {
    const blogPost = blogPosts[i];
    await monitor.log('info', 'batch', `处理 ${i + 1}/${blogPosts.length}: ${blogPost.data.title}`);

    try {
      const result = await convertBlogToPodcast(blogPost, options);
      results.push({ success: true, post: blogPost, result });
    } catch (error) {
      await monitor.log('error', 'batch', `批量转换失败: ${blogPost.data.title}`, error);
      results.push({ success: false, post: blogPost, error: error.message });
    }

    if (options.delayBetweenConversions && i < blogPosts.length - 1) {
      await monitor.log('info', 'batch', `等待 ${options.delayBetweenConversions}ms 后继续...`);
      await new Promise(resolve => setTimeout(resolve, options.delayBetweenConversions));
    }
  }

  const successCount = results.filter(r => r.success).length;
  await monitor.log('info', 'batch', `批量转换完成: ${successCount}/${blogPosts.length} 成功`);

  return results;
}

export async function getAvailableVoices(engine = null) {
  const targetEngine = engine || AUDIO_ENGINE;

  if (targetEngine === 'elevenlabs') {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      return await fetchElevenLabsVoices(apiKey);
    }
  }

  return [];
}

export async function getConversionSettings() {
  return {
    audioEngine: AUDIO_ENGINE,
    enhancementEnabled: ENABLE_ENHANCEMENT,
    qualityControlEnabled: ENABLE_QUALITY_CONTROL,
    voiceStyleDetectionEnabled: ENABLE_VOICE_STYLE_DETECTION,
    performanceMonitoringEnabled: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
    qualityThreshold: parseFloat(process.env.PODCAST_QUALITY_THRESHOLD) || 0.8,
    maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    minDuration: parseInt(process.env.MIN_PODCAST_DURATION) || 60,
    maxDuration: parseInt(process.env.MAX_PODCAST_DURATION) || 3600,
    defaultModel: process.env.DEFAULT_VOICE_MODEL || 'eleven_multilingual_v2',
    defaultStability: parseFloat(process.env.DEFAULT_VOICE_STABILITY) || 0.7,
    defaultSimilarity: parseFloat(process.env.DEFAULT_VOICE_SIMILARITY) || 0.75
  };
}