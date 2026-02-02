import fs from 'fs/promises';
import path from 'path';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export async function getAvailableVoices(apiKey) {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API 请求失败: ${response.status}`);
    }

    const voices = await response.json();
    return voices.voices || [];
  } catch (error) {
    console.error('[ElevenLabs] 获取语音列表失败:', error);
    throw error;
  }
}

export async function getAvailableModels(apiKey) {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/models`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ElevenLabs] 获取模型列表失败:', error);
    throw error;
  }
}

export async function generateTextToSpeech(apiKey, options) {
  const {
    text,
    voiceId,
    modelId = 'eleven_multilingual_v2',
    voiceSettings = {},
    outputFormat = 'mp3_44100_128'
  } = options;

  const voiceSettingsWithDefaults = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true,
    ...voiceSettings
  };

  const requestBody = {
    text,
    model_id: modelId,
    voice_settings: voiceSettingsWithDefaults
  };

  if (voiceId && typeof voiceId === 'string' && voiceId.length > 0) {
    requestBody.voice_id = voiceId;
  }

  console.log(`[ElevenLabs] 生成语音请求: 模型=${modelId}, 语音=${voiceId || 'default'}, 文本长度=${text.length} 字符`);

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API 错误响应:', errorText);
      
      if (response.status === 401) {
        throw new Error('ElevenLabs API 密钥无效，请检查环境变量 ELEVENLABS_API_KEY');
      }
      
      if (response.status === 403 || response.status === 429) {
        throw new Error('ElevenLabs API 配额已用完或无权限');
      }
      
      if (response.status === 400) {
        throw new Error(`请求参数错误: ${errorText}`);
      }
      
      throw new Error(`ElevenLabs API 请求失败: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[ElevenLabs] 语音生成成功: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      success: true,
      audioBuffer: Buffer.from(audioBuffer),
      size: audioBuffer.byteLength
    };
  } catch (error) {
    console.error('[ElevenLabs] 语音生成失败:', error);
    throw error;
  }
}

export async function downloadGeneratedAudio(audioBuffer, savePath) {
  console.log('[ElevenLabs] 保存音频文件...');
  
  try {
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(savePath, audioBuffer);
    
    console.log('[ElevenLabs] 音频文件已保存:', savePath);
    
    return {
      success: true,
      path: savePath,
      size: audioBuffer.length
    };
  } catch (error) {
    console.error('[ElevenLabs] 保存音频文件失败:', error);
    throw error;
  }
}

export async function generateAndDownloadAudio(text, options) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('未设置 ELEVENLABS_API_KEY 环境变量');
  }

  const fileName = `elevenlabs-${Date.now()}.mp3`;
  const savePath = path.join(process.cwd(), 'public/podcasts', fileName);
  
  try {
    const generationResult = await generateTextToSpeech(apiKey, options);
    
    if (!generationResult.success || !generationResult.audioBuffer) {
      throw new Error('音频生成失败，未返回音频数据');
    }
    
    const downloadResult = await downloadGeneratedAudio(generationResult.audioBuffer, savePath);
    
    return {
      success: true,
      audioPath: `/podcasts/${fileName}`,
      localPath: savePath,
      size: downloadResult.size,
      sizeFormatted: `${(downloadResult.size / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    console.error('[ElevenLabs] 生成并下载音频失败:', error);
    throw error;
  }
}

export async function getVoiceSettingsForStyle(style) {
  const voiceSettings = {
    professional: {
      stability: 0.8,
      similarity_boost: 0.8,
      style: 0,
      use_speaker_boost: true
    },
    conversational: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.2,
      use_speaker_boost: true
    },
    dramatic: {
      stability: 0.4,
      similarity_boost: 0.7,
      style: 0.5,
      use_speaker_boost: true
    },
    calm: {
      stability: 0.9,
      similarity_boost: 0.85,
      style: 0,
      use_speaker_boost: false
    },
    energetic: {
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.4,
      use_speaker_boost: true
    }
  };
  
  return voiceSettings[style] || voiceSettings.professional;
}

export async function recommendVoiceForContent(content, language = 'zh') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('未设置 ELEVENLABS_API_KEY 环境变量');
  }
  
  try {
    const voices = await getAvailableVoices(apiKey);
    
    const contentLength = content.length;
    
    if (contentLength < 500) {
      return voices.find(v => v.labels.includes('short-form') || v.labels.includes('broadcast'));
    } else if (contentLength < 2000) {
      return voices.find(v => v.labels.includes('narration') || v.labels.includes('conversational'));
    } else {
      return voices.find(v => v.labels.includes('long-form') || v.labels.includes('stable'));
    }
  } catch (error) {
    console.error('[ElevenLabs] 推荐语音失败:', error);
    return null;
  }
}