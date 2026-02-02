export async function processBlogContent(blogPost) {
  const content = extractMainContent(blogPost.body);
  const summary = generateSummary(blogPost.description || blogPost.data.title);

  const podcastScript = await optimizeForAudio(content, {
    addConversationalElements: true,
    includeTimestamps: true,
    optimizeForListening: true
  });

  return {
    title: blogPost.data.title,
    description: summary,
    script: podcastScript,
    duration: estimateDuration(podcastScript),
    tags: blogPost.data.tags || []
  };
}

function extractMainContent(body) {
  if (!body) return '';
  
  let cleanedContent = body;
  
  cleanedContent = cleanedContent.replace(/```[\s\S]*?```/g, '');
  cleanedContent = cleanedContent.replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '');
  cleanedContent = cleanedContent.replace(/!\[.*?\]\(.*?\)/g, '');
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleanedContent = cleanedContent.replace(/#{1,6}\s+/g, '');
  
  const paragraphs = cleanedContent.split('\n\n').filter(p => p.trim().length > 50);
  
  return paragraphs.join('\n\n');
}

function generateSummary(description) {
  if (description) {
    return description.length > 200 ? description.substring(0, 200) + '...' : description;
  }
  return '本期播客内容来自博客文章的深度解读，欢迎收听。';
}

async function optimizeForAudio(content, options = {}) {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  let optimizedScript = '';
  
  if (options.addConversationalElements) {
    optimizedScript += '欢迎收听本期播客。\\n\\n';
  }
  
  paragraphs.forEach((paragraph, index) => {
    const cleanedParagraph = paragraph
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .trim();
    
    if (cleanedParagraph.length > 10) {
      optimizedScript += cleanedParagraph + '\\n\\n';
    }
  });
  
  if (options.optimizeForListening) {
    optimizedScript = addPausesAndEmphasis(optimizedScript);
  }
  
  return optimizedScript;
}

function addPausesAndEmphasis(script) {
  let enhanced = script;
  
  enhanced = enhanced.replace(/([。！？])/g, '$1 [pause:0.5s]');
  enhanced = enhanced.replace(/([,，])/g, '$1 [pause:0.2s]');
  
  return enhanced;
}

function estimateDuration(script) {
  const wordsPerMinute = 150;
  const wordCount = script.split(/[\s\n]+/).length;
  const estimatedMinutes = wordCount / wordsPerMinute;
  
  return {
    minutes: Math.ceil(estimatedMinutes),
    seconds: Math.ceil(estimatedMinutes * 60)
  };
}

export async function validateContent(content) {
  if (!content || content.trim().length < 100) {
    throw new Error('内容过短，无法生成播客');
  }
  
  return true;
}