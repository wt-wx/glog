import fs from 'fs/promises';
import path from 'path';

const WONDERCRAFT_API = 'https://api.wondercraft.ai/v1/generate';

export async function generatePodcast(blogContent, options = {}) {
  const config = {
    api_key: process.env.WONDERCRAFT_API_KEY,
    input_text: blogContent.script,
    voice_style: options.voiceStyle || 'professional_conversational',
    output_format: 'podcast_episode',
    include_intro: options.includeIntro !== false,
    include_outro: options.includeOutro !== false,
    background_music: options.backgroundMusic || 'subtle_tech',
    language: options.language || 'zh-CN'
  };

  console.log('[Podcast Generator] 开始生成播客音频...');
  
  try {
    const response = await fetch(WONDERCRAFT_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Wondercraft API 请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Podcast Generator] 播客生成成功:', result.id);
    
    return {
      success: true,
      data: result,
      audioUrl: result.audio_url,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('[Podcast Generator] 播客生成失败:', error);
    
    if (error.message.includes('401')) {
      throw new Error('Wondercraft API 密钥无效，请检查环境变量 WONDERCRAFT_API_KEY');
    }
    
    if (error.message.includes('403') || error.message.includes('429')) {
      throw new Error('Wondercraft API 配额已用完或无权限');
    }
    
    throw error;
  }
}

export async function downloadAudio(audioUrl, savePath) {
  console.log('[Podcast Generator] 开始下载音频文件...');
  
  try {
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`下载音频失败: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(savePath, buffer);
    
    console.log('[Podcast Generator] 音频文件已保存:', savePath);
    
    return {
      success: true,
      path: savePath,
      size: buffer.length
    };
  } catch (error) {
    console.error('[Podcast Generator] 下载音频失败:', error);
    throw error;
  }
}

export async function generateAndDownloadPodcast(blogContent, podcastId, options = {}) {
  const fileName = `${podcastId}-${Date.now()}.mp3`;
  const savePath = path.join(process.cwd(), 'public/podcasts', fileName);
  
  try {
    const generationResult = await generatePodcast(blogContent, options);
    
    if (!generationResult.success || !generationResult.audioUrl) {
      throw new Error('音频生成失败，未返回音频URL');
    }
    
    const downloadResult = await downloadAudio(generationResult.audioUrl, savePath);
    
    return {
      success: true,
      audioPath: `/podcasts/${fileName}`,
      localPath: savePath,
      metadata: generationResult.metadata,
      size: downloadResult.size
    };
  } catch (error) {
    console.error('[Podcast Generator] 生成并下载播客失败:', error);
    throw error;
  }
}

export async function validatePodcast(audioPath) {
  try {
    const buffer = await fs.readFile(audioPath);
    const sizeInMB = buffer.length / (1024 * 1024);
    
    if (sizeInMB < 0.1) {
      throw new Error('音频文件过小，可能生成失败');
    }
    
    if (sizeInMB > 100) {
      throw new Error('音频文件过大，超过100MB限制');
    }
    
    return {
      valid: true,
      size: sizeInMB,
      sizeFormatted: `${sizeInMB.toFixed(2)} MB`
    };
  } catch (error) {
    console.error('[Podcast Generator] 验证播客失败:', error);
    throw error;
  }
}