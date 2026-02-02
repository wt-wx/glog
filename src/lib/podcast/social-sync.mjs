export class SocialMediaManager {
  constructor(platforms = {}) {
    this.platforms = platforms;
  }

  async postToTwitter(message, options = {}) {
    console.log(`[Social Media] 发送 Twitter/X: ${message.substring(0, 50)}...`);
    
    const twitterApiKey = process.env.X_BEARER_TOKEN;
    
    if (!twitterApiKey) {
      throw new Error('Twitter API 密钥未设置，请检查环境变量 X_BEARER_TOKEN');
    }
    
    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${twitterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: message
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[Social Media] Twitter 发送成功: ${data.id}`);
      
      return {
        success: true,
        platform: 'twitter',
        postId: data.id,
        url: `https://twitter.com/i/status/${data.id}`
      };
    } catch (error) {
      console.error('[Social Media] Twitter 发送失败:', error);
      throw error;
    }
  }

  async postToMastodon(message, instanceUrl, options = {}) {
    console.log(`[Social Media] 发送 Mastodon: ${message.substring(0, 50)}...`);
    
    try {
      const response = await fetch(`${instanceUrl}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.accessToken || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: message
        })
      });
      
      if (!response.ok) {
        throw new Error(`Mastodon API 错误: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[Social Media] Mastodon 发送成功: ${data.id}`);
      
      return {
        success: true,
        platform: 'mastodon',
        postId: data.id,
        url: `${instanceUrl}/@${data.username}/${data.id}`
      };
    } catch (error) {
      console.error('[Social Media] 发送 Mastodon 失败:', error);
      throw error;
    }
  }

  async postToLinkedIn(message, options = {}) {
    console.log(`[Social Media] 发送 LinkedIn: ${message.substring(0, 50)}...`);
    
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('LinkedIn API 密钥未设置');
    }
    
    try {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: 'urn:li:person',
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              'shareCommentaryV2': {
                'text': message
              },
              'shareMediaCategory': 'NONE'
            }
          },
          visibility: 'PUBLIC'
        })
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API 错误: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[Social Media] LinkedIn 发送成功: ${data.id}`);
      
      return {
        success: true,
        platform: 'linkedin',
        postId: data.id,
        url: data.activities?.[0]?.['ugc:shareUrl']
      };
    } catch (error) {
      console.error('[Social Media] 发送 LinkedIn 失败:', error);
      throw error;
    }
  }

  async announceNewEpisode(episodeData) {
    const message = `🎙️ 新播客上线！${episodeData.title}\n\n${episodeData.description}\n\n收听链接: ${episodeData.shareUrl}\n\n#播客 #AI #技术分享`;
    
    const results = [];
    
    if (this.platforms.twitter) {
      try {
        const twitterResult = await this.postToTwitter(message);
        results.push(twitterResult);
      } catch (error) {
        console.error('[Social Media] Twitter 发布失败:', error);
      }
    }
    
    if (this.platforms.mastodon && this.platforms.mastodon.instanceUrl) {
      try {
        const mastodonResult = await this.postToMastodon(message, this.platforms.mastodon.instanceUrl);
        results.push(mastodonResult);
      } catch (error) {
        console.error('[Social Media] Mastodon 发布失败:', error);
      }
    }
    
    if (this.platforms.linkedin) {
      try {
        const linkedinResult = await this.postToLinkedIn(message);
        results.push(linkedinResult);
      } catch (error) {
        console.error('[Social Media] LinkedIn 发布失败:', error);
      }
    }
    
    console.log(`[Social Media] 社交媒体同步完成，成功: ${results.length}/${results.length}`);
    
    return {
      success: true,
      results,
      timestamp: new Date().toISOString()
    };
  }

  async formatEpisodeAnnouncement(episodeData, options = {}) {
    const {
      title = episodeData.title,
      description = episodeData.description,
      shareUrl = episodeData.shareUrl,
      duration = episodeData.duration,
      author = episodeData.author || 'AI Podcast Generator',
      tags = episodeData.keywords || []
    } = options;
    
    const maxLength = options.maxLength || 280;
    
    const message = `🎙️ 新播客上线！\n\n标题: ${title.substring(0, 50)}\n\n`;
    
    if (description) {
      message += `${description.substring(0, 100 - (title.length + 3))}...\n\n`;
    }
    
    message += `时长: ${duration.minutes} 分钟\n\n收听链接: ${shareUrl.substring(0, maxLength - 5)}\n\n`;
    
    if (tags && tags.length > 0) {
      message += `标签: ${tags.slice(0, 3).map(t => '#' + t).join(' ')}\n\n`;
    }
    
    if (author) {
      message += `播客主理: ${author}\n\n`;
    }
    
    message += `#播客 #AI #技术 #分享`;
    
    return message;
  }
}

export function createSocialManager(platforms = {}) {
  return new SocialMediaManager(platforms);
}