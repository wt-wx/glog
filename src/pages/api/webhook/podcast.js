import { getCollection } from 'astro:content';
import { convertBlogToPodcast } from '../../lib/podcast/index.mjs';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { postId, action } = body;
    
    if (!postId) {
      return Response.json({ 
        success: false, 
        error: '缺少必要参数: postId' 
      }, { status: 400 });
    }
    
    if (action !== 'published') {
      return Response.json({ 
        success: false, 
        error: '不支持的操作类型，仅支持 published' 
      }, { status: 400 });
    }
    
    console.log(`[Webhook] 收到播客转换请求: ${postId}`);
    
    const allPosts = await getCollection('blog');
    const blogPost = allPosts.find(post => post.id === postId || post.slug === postId);
    
    if (!blogPost) {
      return Response.json({ 
        success: false, 
        error: `未找到博客文章: ${postId}` 
      }, { status: 404 });
    }
    
    const options = {
      voiceStyle: body.options?.voiceStyle || 'professional_conversational',
      includeIntro: body.options?.includeIntro !== false,
      includeOutro: body.options?.includeOutro !== false,
      backgroundMusic: body.options?.backgroundMusic || 'subtle_tech'
    };
    
    convertBlogToPodcast(blogPost, options)
      .then((result) => {
        console.log(`[Webhook] 播客转换成功: ${result.podcastId}`);
      })
      .catch((error) => {
        console.error(`[Webhook] 播客转换失败:`, error);
      });
    
    return Response.json({ 
      success: true, 
      message: '播客转换已启动，正在后台处理',
      postId
    });
    
  } catch (error) {
    console.error('[Webhook] 处理请求失败:', error);
    
    return Response.json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    
    const { getConversionProgress } = await import('../../lib/podcast/index.mjs');
    
    if (postId) {
      const progress = await getConversionProgress(postId);
      
      if (!progress) {
        return Response.json({ 
          success: false, 
          error: '未找到转换状态' 
        }, { status: 404 });
      }
      
      return Response.json({ 
        success: true, 
        progress 
      });
    } else {
      const { getAllConversionStatus } = await import('../../lib/podcast/status-manager.mjs');
      const allStatus = await getAllConversionStatus();
      
      return Response.json({ 
        success: true, 
        conversions: allStatus 
      });
    }
    
  } catch (error) {
    console.error('[Webhook] 获取状态失败:', error);
    
    return Response.json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    }, { status: 500 });
  }
}