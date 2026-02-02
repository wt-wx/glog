import { createClient, getPodcastShowId } from './transistor-client.mjs';

export class PodcastHostingManager {
  constructor(apiKey, siteUrl) {
    this.client = createClient(apiKey);
    this.siteUrl = siteUrl;
    this.showId = null;
    this.episodeMap = new Map();
  }

  async initializePodcastShow(podcastTitle, podcastDescription) {
    console.log('[Hosting Manager] 初始化播客节目...');
    
    try {
      const shows = await this.client.getShows();
      
      if (!shows.data || shows.data.length === 0) {
        console.log('[Hosting Manager] 未找到播客节目，创建新节目...');
        
        const showData = {
          title: podcastTitle,
          description: podcastDescription,
          category: 'Technology',
          language: 'zh-cn',
          author: 'AI Podcast Generator',
          explicit: false
        };
        
        const createdShow = await this.client.createShow(showData);
        this.showId = createdShow.data.id;
        console.log(`[Hosting Manager] 播客节目已创建: ${this.showId} - ${podcastTitle}`);
      } else {
        this.showId = shows.data[0].id;
        console.log(`[Hosting Manager] 使用现有播客节目: ${this.showId}`);
      }
      
      return {
        success: true,
        showId: this.showId
      };
    } catch (error) {
      console.error('[Hosting Manager] 初始化播客节目失败:', error);
      throw error;
    }
  }

  async publishEpisode(episodeData) {
    if (!this.showId) {
      throw new Error('播客节目未初始化，请先调用 initializePodcastShow');
    }

    console.log(`[Hosting Manager] 发布 episode: ${episodeData.title}`);
    
    try {
      const draftEpisode = await this.client.createEpisode(this.showId, {
        title: episodeData.title,
        description: episodeData.description,
        summary: episodeData.summary,
        audio_url: episodeData.audioUrl,
        keywords: episodeData.keywords || '',
        author: episodeData.author,
        number: episodeData.number,
        season: episodeData.season,
        type: episodeData.type || 'full',
        image_url: episodeData.imageUrl
      });
      
      console.log(`[Hosting Manager] Episode 已创建 (draft): ${draftEpisode.data.id}`);
      
      const publishedEpisode = await this.client.publishEpisode(draftEpisode.data.id);
      
      console.log(`[Hosting Manager] Episode 已发布: ${publishedEpisode.data.id}`);
      
      return {
        success: true,
        episodeId: publishedEpisode.data.id,
        publishedAt: publishedEpisode.data.attributes.published_at,
        shareUrl: publishedEpisode.data.attributes.share_url,
        embedHtml: publishedEpisode.data.attributes.embed_html,
        transcriptUrl: publishedEpisode.data.attributes.transcript_url
      };
    } catch (error) {
      console.error('[Hosting Manager] 发布 episode 失败:', error);
      throw error;
    }
  }

  async scheduleEpisode(episodeData, scheduledFor) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    console.log(`[Hosting Manager] 调度发布 episode: ${episodeData.title} at ${scheduledFor}`);
    
    try {
      const scheduledEpisode = await this.client.createEpisode(this.showId, {
        title: episodeData.title,
        description: episodeData.description,
        summary: episodeData.summary,
        audio_url: episodeData.audioUrl,
        keywords: episodeData.keywords || '',
        author: episodeData.author,
        number: episodeData.number,
        season: episodeData.season,
        type: episodeData.type || 'full',
        image_url: episodeData.imageUrl
      });
      
      await this.client.scheduleEpisode(scheduledEpisode.data.id, scheduledFor);
      
      console.log(`[Hosting Manager] Episode 已调度: ${scheduledEpisode.data.id}`);
      
      return {
        success: true,
        episodeId: scheduledEpisode.data.id,
        scheduledFor,
        status: 'scheduled'
      };
    } catch (error) {
      console.error('[Hosting Manager] 调度 episode 失败:', error);
      throw error;
    }
  }

  async getShowInfo() {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    try {
      const showInfo = await this.client.getShow(this.showId, {
        fields: ['title', 'description', 'feed_url', 'author', 'category', 'language', 'image_url']
      });
      
      console.log(`[Hosting Manager] 节目信息:`, showInfo.data.attributes);
      
      return {
        success: true,
        showId: this.showId,
        title: showInfo.data.attributes.title,
        description: showInfo.data.attributes.description,
        feedUrl: showInfo.data.attributes.feed_url,
        author: showInfo.data.attributes.author,
        category: showInfo.data.attributes.category,
        language: showInfo.data.attributes.language
      };
    } catch (error) {
      console.error('[Hosting Manager] 获取节目信息失败:', error);
      throw error;
    }
  }

  async getEpisodes(options = {}) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    try {
      const params = {
        status: 'published',
        order: 'desc'
      };
      
      if (options.limit) {
        params['pagination[per]'] = options.limit;
      }
      
      const episodesResponse = await this.client.getEpisodes(this.showId, params);
      
      const episodes = episodesResponse.data.map(ep => ({
        id: ep.id,
        title: ep.attributes.title,
        description: ep.attributes.description,
        summary: ep.attributes.summary || '',
        duration: ep.attributes.duration,
        publishedAt: ep.attributes.published_at,
        audioUrl: ep.attributes.media_url,
        shareUrl: ep.attributes.share_url,
        imageUrl: ep.attributes.image_url,
        keywords: ep.attributes.keywords || '',
        author: ep.attributes.author,
        number: ep.attributes.number,
        season: ep.attributes.season,
        type: ep.attributes.type,
        explicit: ep.attributes.explicit
      }));
      
      console.log(`[Hosting Manager] 获取到 ${episodes.length} 个 episodes`);
      
      return {
        success: true,
        episodes,
        count: episodes.length
      };
    } catch (error) {
      console.error('[Hosting Manager] 获取 episodes 失败:', error);
      throw error;
    }
  }

  async deleteEpisode(episodeId) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    console.log(`[Hosting Manager] 删除 episode: ${episodeId}`);
    
    try {
      await this.client.deleteEpisode(episodeId);
      
      console.log(`[Hosting Manager] Episode 已删除: ${episodeId}`);
      
      return {
        success: true,
        episodeId
      };
    } catch (error) {
      console.error('[Hosting Manager] 删除 episode 失败:', error);
      throw error;
    }
  }

  async updateEpisode(episodeId, updateData) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    console.log(`[Hosting Manager] 更新 episode: ${episodeId}`);
    
    try {
      const updatedEpisode = await this.client.updateEpisode(episodeId, {
        title: updateData.title,
        description: updateData.description,
        summary: updateData.summary,
        image_url: updateData.imageUrl
      });
      
      console.log(`[Hosting Manager] Episode 已更新: ${episodeId}`);
      
      return {
        success: true,
        episodeId,
        updatedAt: updatedEpisode.data.attributes.updated_at
      };
    } catch (error) {
      console.error('[Hosting Manager] 更新 episode 失败:', error);
      throw error;
    }
  }

  async getAnalytics(options = {}) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    try {
      const params = {};
      
      if (options.startDate) {
        params.start_date = options.startDate;
      }
      
      if (options.endDate) {
        params.end_date = options.endDate;
      }
      
      const analytics = await this.client.getAnalytics(this.showId, params);
      
      console.log(`[Hosting Manager] 获取分析数据`);
      
      return {
        success: true,
        analytics: analytics.data,
        showId: this.showId
      };
    } catch (error) {
      console.error('[Hosting Manager] 获取分析数据失败:', error);
      throw error;
    }
  }

  async getSubscribers(options = {}) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    try {
      const params = {};
      
      if (options.page) {
        params['pagination[page]'] = options.page;
      }
      
      if (options.perPage) {
        params['pagination[per]'] = options.perPage;
      }
      
      if (options.query) {
        params.query = options.query;
      }
      
      const subscribers = await this.client.getSubscribers(this.showId, params);
      
      console.log(`[Hosting Manager] 获取到 ${subscribers.data.length} 个 subscribers`);
      
      return {
        success: true,
        subscribers: subscribers.data,
        count: subscribers.data.length
      };
    } catch (error) {
      console.error('[Hosting Manager] 获取 subscribers 失败:', error);
      throw error;
    }
  }

  async addSubscriber(email) {
    if (!this.showId) {
      throw new Error('播客节目未初始化');
    }

    console.log(`[Hosting Manager] 添加 subscriber: ${email}`);
    
    try {
      const subscriber = await this.client.createSubscriber(this.showId, email);
      
      console.log(`[Hosting Manager] Subscriber 已添加: ${subscriber.data.id}`);
      
      return {
        success: true,
        subscriberId: subscriber.data.id,
        email: subscriber.data.attributes.email
      };
    } catch (error) {
      console.error('[Hosting Manager] 添加 subscriber 失败:', error);
      throw error;
    }
  }
}

export function createHostingManager(apiKey, siteUrl) {
  return new PodcastHostingManager(apiKey, siteUrl);
}