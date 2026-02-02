const VOICE_STYLES = {
  professional_conversational: {
    name: '专业对话风格',
    description: '适合播客、教程等正式内容',
    voiceSettings: {
      stability: 0.8,
      similarity_boost: 0.8,
      style: 0,
      use_speaker_boost: true
    },
    pacing: 1.0,
    emotion: 'neutral'
  },
  
  conversational: {
    name: '对话风格',
    description: '适合轻松的博客文章、生活分享',
    voiceSettings: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.2,
      use_speaker_boost: true
    },
    pacing: 1.1,
    emotion: 'friendly'
  },
  
  dramatic: {
    name: '戏剧风格',
    description: '适合故事、小说等需要情感表达的内容',
    voiceSettings: {
      stability: 0.4,
      similarity_boost: 0.7,
      style: 0.5,
      use_speaker_boost: true
    },
    pacing: 0.9,
    emotion: 'dramatic'
  },
  
  calm: {
    name: '平静风格',
    description: '适合冥想、指导、教学等需要安静氛围的内容',
    voiceSettings: {
      stability: 0.9,
      similarity_boost: 0.85,
      style: 0,
      use_speaker_boost: false
    },
    pacing: 0.95,
    emotion: 'calm'
  },
  
  energetic: {
    name: '活力风格',
    description: '适合新闻、科技、游戏等需要活力的内容',
    voiceSettings: {
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.4,
      use_speaker_boost: true
    },
    pacing: 1.15,
    emotion: 'energetic'
  },
  
  broadcast: {
    name: '广播风格',
    description: '适合新闻、公告等正式广播内容',
    voiceSettings: {
      stability: 0.85,
      similarity_boost: 0.85,
      style: 0,
      use_speaker_boost: true
    },
    pacing: 1.0,
    emotion: 'neutral'
  },
  
  storytelling: {
    name: '讲故事风格',
    description: '适合故事、小说、案例分享等内容',
    voiceSettings: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true
    },
    pacing: 0.95,
    emotion: 'engaging'
  },
  
  educational: {
    name: '教育风格',
    description: '适合教程、教学、解释类内容',
    voiceSettings: {
      stability: 0.75,
      similarity_boost: 0.8,
      style: 0.1,
      use_speaker_boost: true
    },
    pacing: 0.9,
    emotion: 'instructional'
  }
};

const CONTENT_CATEGORIES = {
  technology: {
    preferredStyles: ['professional_conversational', 'energetic', 'educational'],
    description: '技术类内容'
  },
  
  lifestyle: {
    preferredStyles: ['conversational', 'calm', 'storytelling'],
    description: '生活方式类内容'
  },
  
  business: {
    preferredStyles: ['professional_conversational', 'broadcast'],
    description: '商业类内容'
  },
  
  creative: {
    preferredStyles: ['dramatic', 'storytelling'],
    description: '创意类内容'
  },
  
  education: {
    preferredStyles: ['educational', 'calm', 'broadcast'],
    description: '教育类内容'
  },
  
  news: {
    preferredStyles: ['broadcast', 'energetic', 'professional_conversational'],
    description: '新闻类内容'
  },
  
  personal: {
    preferredStyles: ['conversational', 'storytelling', 'calm'],
    description: '个人分享类内容'
  }
};

export function getVoiceStyle(styleName) {
  return VOICE_STYLES[styleName] || VOICE_STYLES.professional_conversational;
}

export function getAllVoiceStyles() {
  return Object.entries(VOICE_STYLES).map(([key, value]) => ({
    key,
    ...value
  }));
}

export function categorizeContent(content, tags = []) {
  const lowerContent = content.toLowerCase();
  const lowerTags = tags.map(t => t.toLowerCase());
  
  const categoryScores = {};
  
  for (const [category, config] of Object.entries(CONTENT_CATEGORIES)) {
    let score = 0;
    
    for (const preferredStyle of config.preferredStyles) {
      if (VOICE_STYLES[preferredStyle]) {
        const styleName = VOICE_STYLES[preferredStyle].name.toLowerCase();
        if (lowerContent.includes(styleName) || lowerTags.includes(styleName)) {
          score += 2;
        }
      }
    }
    
    const keywords = getCategoryKeywords(category);
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score += 1;
      }
    }
    
    categoryScores[category] = score;
  }
  
  const topCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])[0];
  
  return topCategory ? topCategory[0] : 'personal';
}

function getCategoryKeywords(category) {
  const keywords = {
    technology: ['技术', '编程', '开发', '代码', 'ai', '人工智能', 'api', '数据库', '算法', '软件', '硬件', 'tech', 'code', 'development', 'ai', 'artificial intelligence'],
    lifestyle: ['生活', '日常', '分享', '经验', '建议', '技巧', '生活', '个人', 'life', 'daily', 'personal', 'tips'],
    business: ['商业', '公司', '团队', '管理', '策略', '市场', '销售', '增长', 'business', 'company', 'team', 'strategy', 'market'],
    creative: ['创意', '设计', '艺术', '摄影', '视频', '音乐', '写作', 'creative', 'design', 'art', 'photography'],
    education: ['教学', '教程', '学习', '知识', '解释', '指导', 'education', 'tutorial', 'learn', 'knowledge', 'guide'],
    news: ['新闻', '报道', '消息', '公告', '更新', 'news', 'report', 'announcement', 'update']
  };
  
  return keywords[category] || [];
}

export function recommendVoiceStyle(content, tags = [], length = 0) {
  const category = categorizeContent(content, tags);
  const categoryConfig = CONTENT_CATEGORIES[category];
  
  const availableStyles = categoryConfig.preferredStyles.map(style => getVoiceStyle(style));
  
  let recommendedStyle = availableStyles[0];
  
  if (length < 500) {
    recommendedStyle = getVoiceStyle('energetic');
  } else if (length < 2000) {
    recommendedStyle = availableStyles[0];
  } else {
    recommendedStyle = getVoiceStyle('calm');
  }
  
  return {
    recommendedStyle: recommendedStyle.key,
    styleName: recommendedStyle.name,
    styleDescription: recommendedStyle.description,
    voiceSettings: recommendedStyle.voiceSettings,
    category,
    reasoning: `基于内容分类（${categoryConfig.description}）和长度（${length}字符）推荐`
  };
}

export function adaptContentForStyle(content, style) {
  const styleConfig = getVoiceStyle(style);
  
  let adaptedContent = content;
  
  if (styleConfig.emotion === 'dramatic' || styleConfig.emotion === 'engaging') {
    adaptedContent = addNarrativeElements(adaptedContent);
  }
  
  if (styleConfig.emotion === 'instructional' || styleConfig.emotion === 'educational') {
    adaptedContent = addInstructionalElements(adaptedContent);
  }
  
  if (styleConfig.emotion === 'friendly' || styleConfig.emotion === 'conversational') {
    adaptedContent = addConversationalElements(adaptedContent);
  }
  
  return adaptedContent;
}

function addNarrativeElements(content) {
  let adapted = content;
  
  if (!adapted.includes('今天，我们来讲一个故事')) {
    adapted = '今天，我们来讲一个故事。\n\n' + adapted;
  }
  
  return adapted;
}

function addInstructionalElements(content) {
  let adapted = content;
  
  if (!adapted.startsWith('让我们来了解')) {
    adapted = '让我们来了解' + adapted.slice(0, 50) + '...\n\n' + adapted;
  }
  
  return adapted;
}

function addConversationalElements(content) {
  let adapted = content;
  
  if (!adapted.includes('大家好')) {
    adapted = '大家好，欢迎收听本期内容。\n\n' + adapted;
  }
  
  return adapted;
}

export function createStyleOptions(blogPost, customStyle = null) {
  const content = blogPost.body || '';
  const tags = blogPost.data?.tags || [];
  const wordCount = content.split(/\s+/).length;
  
  if (customStyle && VOICE_STYLES[customStyle]) {
    return {
      styleKey: customStyle,
      style: getVoiceStyle(customStyle),
      reason: '用户指定'
    };
  }
  
  const recommendation = recommendVoiceStyle(content, tags, wordCount);
  
  return {
    styleKey: recommendation.recommendedStyle,
    style: getVoiceStyle(recommendation.recommendedStyle),
    reason: recommendation.reasoning,
    category: recommendation.category
  };
}

export function validateVoiceSettings(settings) {
  const errors = [];
  
  if (settings.stability < 0 || settings.stability > 1) {
    errors.push('stability 必须在 0-1 之间');
  }
  
  if (settings.similarity_boost < 0 || settings.similarity_boost > 1) {
    errors.push('similarity_boost 必须在 0-1 之间');
  }
  
  if (settings.style < 0 || settings.style > 1) {
    errors.push('style 必须在 0-1 之间');
  }
  
  if (typeof settings.use_speaker_boost !== 'boolean') {
    errors.push('use_speaker_boost 必须是布尔值');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}