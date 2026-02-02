const TRANSISTOR_API_BASE = 'https://api.transistor.fm/v1';

export class TransistorFMClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.rateLimit = 10;
    this.rateLimitReset = Date.now();
  }

  async authenticate() {
    return {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  async request(endpoint, options = {}) {
    await this.checkRateLimit();
    
    const config = {
      method: options.method || 'GET',
      headers: this.authenticate().headers,
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const url = `${TRANSISTOR_API_BASE}${endpoint}`;
      console.log(`[TransistorFM] ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TransistorFM API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[TransistorFM] 请求成功: ${endpoint}`);
      
      return data;
    } catch (error) {
      console.error('[TransistorFM] 请求失败:', error);
      throw error;
    }
  }

  async checkRateLimit() {
    const now = Date.now();
    const timeSinceReset = now - this.rateLimitReset;
    
    if (timeSinceReset >= 10000) {
      console.warn('[TransistorFM] 达到速率限制，等待重置...');
      const waitTime = 10000 - timeSinceReset;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      this.rateLimitReset = now;
    }
    
    this.rateLimit--;
    
    if (this.rateLimit <= 0) {
      console.warn('[TransistorFM] 速率限制，等待 10 秒...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      this.rateLimitReset = Date.now();
      this.rateLimit = 10;
    }
  }

  async getShows(options = {}) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('pagination[page]', options.page);
    if (options.perPage) params.append('pagination[per]', options.perPage);
    if (options.private !== undefined) params.append('private', options.private);
    
    return this.request(`/shows?${params.toString()}`, options);
  }

  async getShow(showId, options = {}) {
    const params = new URLSearchParams();
    
    const fields = options.fields || [];
    if (fields.length > 0) {
      fields.forEach(field => {
        params.append(`fields[show][]`, field);
      });
    }
    
    if (options.includeEpisodes) params.append('include[]=episodes');
    
    return this.request(`/shows/${showId}?${params.toString()}`, options);
  }

  async createShow(showData) {
    return this.request('/shows', {
      method: 'POST',
      body: {
        show: {
          title: showData.title,
          description: showData.description,
          author: showData.author,
          summary: showData.summary,
          category: showData.category,
          image_url: showData.imageUrl,
          keywords: showData.keywords,
          language: showData.language,
          explicit: showData.explicit || false
        }
      }
    });
  }

  async updateShow(showId, showData) {
    return this.request(`/shows/${showId}`, {
      method: 'PATCH',
      body: {
        show: {
          title: showData.title,
          description: showData.description,
          author: showData.author,
          summary: showData.summary,
          category: showData.category,
          image_url: showData.imageUrl,
          keywords: showData.keywords,
          language: showData.language,
          explicit: showData.explicit
        }
      }
    });
  }

  async createEpisode(showId, episodeData) {
    return this.request(`/episodes`, {
      method: 'POST',
      body: {
        episode: {
          show_id: showId,
          title: episodeData.title,
          description: episodeData.description,
          summary: episodeData.summary,
          number: episodeData.number,
          season: episodeData.season,
          type: episodeData.type || 'full',
          explicit: episodeData.explicit || false,
          audio_url: episodeData.audioUrl,
          keywords: episodeData.keywords || '',
          author: episodeData.author,
          published_at: episodeData.publishedAt || new Date().toISOString(),
          image_url: episodeData.imageUrl,
          transcript_text: episodeData.transcriptText,
          email_notifications: episodeData.emailNotifications
        }
      }
    });
  }

  async updateEpisode(episodeId, episodeData) {
    return this.request(`/episodes/${episodeId}`, {
      method: 'PATCH',
      body: {
        episode: {
          title: episodeData.title,
          description: episodeData.description,
          summary: episodeData.summary,
          number: episodeData.number,
          season: episodeData.season,
          type: episodeData.type,
          explicit: episodeData.explicit,
          audio_url: episodeData.audioUrl,
          keywords: episodeData.keywords,
          author: episodeData.author,
          image_url: episodeData.imageUrl,
          transcript_text: episodeData.transcriptText,
          email_notifications: episodeData.emailNotifications
        }
      }
    });
  }

  async publishEpisode(episodeId) {
    return this.request(`/episodes/${episodeId}/publish`, {
      method: 'PATCH'
    });
  }

  async deleteEpisode(episodeId) {
    return this.request(`/episodes/${episodeId}`, {
      method: 'DELETE'
    });
  }

  async getEpisodes(showId, options = {}) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('pagination[page]', options.page);
    if (options.perPage) params.append('pagination[per]', options.perPage);
    if (options.status) params.append('status', options.status);
    if (options.order) params.append('order', options.order);
    
    const fields = options.fields || [];
    if (fields.length > 0) {
      fields.forEach(field => {
        params.append(`fields[episode][]`, field);
      });
    }
    
    return this.request(`/episodes?${params.toString()}`, options);
  }

  async getAnalytics(showId, options = {}) {
    const endpoint = options.episodeId 
      ? `/analytics/${showId}/episodes/${options.episodeId}`
      : `/analytics/${showId}`;
    
    const params = new URLSearchParams();
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.includeShow) params.append('include[]=show');
    
    return this.request(`${endpoint}?${params.toString()}`, options);
  }

  async getSubscribers(showId, options = {}) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('pagination[page]', options.page);
    if (options.perPage) params.append('pagination[per]', options.perPage);
    if (options.query) params.append('query', options.query);
    
    const fields = options.fields || [];
    if (fields.length > 0) {
      fields.forEach(field => {
        params.append(`fields[subscriber][]`, field);
      });
    }
    
    return this.request(`/subscribers?${params.toString()}`, options);
  }

  async createSubscriber(showId, email, options = {}) {
    return this.request('/subscribers', {
      method: 'POST',
      body: {
        show_id: showId,
        email: email,
        skip_welcome_email: options.skipWelcomeEmail || false
      }
    });
  }

  async authorizeUpload(filename) {
    return this.request('/episodes/authorize_upload', {
      method: 'GET',
      queryParams: {
        filename
      }
    });
  }

  async uploadAudio(uploadUrl, filePath, contentType = 'audio/mpeg') {
    console.log(`[TransistorFM] 上传音频到: ${uploadUrl}`);
    
    const fileBuffer = await import('fs').then(fs => fs.promises.readFile(filePath));
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': contentType
      },
      body: fileBuffer
    });
    
    if (!response.ok) {
      throw new Error(`音频上传失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[TransistorFM] 音频上传完成');
    
    return data.data;
  }

  async getWebhooks(showId) {
    return this.request(`/webhooks?show_id=${showId}`, {
      method: 'GET'
    });
  }

  async createWebhook(showId, webhookData) {
    return this.request('/webhooks', {
      method: 'POST',
      body: {
        webhook: {
          show_id: showId,
          event_name: webhookData.eventName,
          url: webhookData.url
        }
      }
    });
  }

  async deleteWebhook(webhookId) {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'DELETE'
    });
  }

  async subscribeToWebhook(webhookId) {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'POST',
      body: {
        event_name: 'episode_created'
      }
    });
  }
}

export function createClient(apiKey) {
  return new TransistorFMClient(apiKey);
}

export async function getPodcastShowId(apiKey) {
  const client = createClient(apiKey);
  
  try {
    const shows = await client.getShows();
    
    if (shows.data && shows.data.length > 0) {
      console.log(`找到 ${shows.data.length} 个播客节目`);
      shows.data.forEach(show => {
        console.log(`  - ID: ${show.id}, 标题: ${show.attributes?.title}`);
      });
      
      return shows.data[0].id;
    }
    
    console.warn('未找到任何播客节目');
    return null;
  } catch (error) {
    console.error('获取播客节目失败:', error);
    throw error;
  }
}