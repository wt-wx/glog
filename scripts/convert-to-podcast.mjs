import 'dotenv/config';
import { getCollection } from 'astro:content';
import { convertBlogToPodcast } from '../src/lib/podcast/index.mjs';

const argv = process.argv.slice(2);

async function showHelp() {
  console.log(`
博客转播客转换工具

用法:
  node scripts/convert-to-podcast.mjs [命令] [参数]

命令:
  all                     转换所有博客文章
  recent <count>          转换最近的 <count> 篇博客
  id <post-id>            转换指定 ID 的博客
  help                    显示帮助信息

参数:
  --voice-style <style>   语音风格 (默认: professional_conversational)
  --no-intro              不包含开头
  --no-outro              不包含结尾
  --background <music>    背景音乐 (默认: subtle_tech)
  --delay <ms>            批量转换时的延迟 (毫秒)

示例:
  node scripts/convert-to-podcast.mjs id my-post-id
  node scripts/convert-to-podcast.mjs recent 5 --voice-style conversational
  node scripts/convert-to-podcast.mjs all --delay 5000

环境变量:
  WONDERCRAFT_API_KEY     Wondercraft API 密钥 (必需)
  SITE_URL                网站 URL (用于生成完整音频链接)
`);
  process.exit(0);
}

async function convertAllPosts(options = {}) {
  console.log('获取所有博客文章...');
  const allPosts = await getCollection('blog');
  
  console.log(`找到 ${allPosts.length} 篇博客文章`);
  
  if (allPosts.length === 0) {
    console.log('没有找到博客文章');
    return;
  }
  
  const { batchConvertBlogPosts } = await import('../src/lib/podcast/index.mjs');
  const results = await batchConvertBlogPosts(allPosts, options);
  
  console.log('\n=== 批量转换结果 ===');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`${index + 1}. ✅ ${result.post.data.title}`);
      console.log(`   播客链接: ${result.result.audioUrl}`);
    } else {
      console.log(`${index + 1}. ❌ ${result.post.data.title}`);
      console.log(`   错误: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n总计: ${successCount}/${allPosts.length} 成功`);
}

async function convertRecentPosts(count, options = {}) {
  console.log(`获取最近的 ${count} 篇博客文章...`);
  const allPosts = await getCollection('blog');
  
  const sortedPosts = allPosts
    .sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
    .slice(0, count);
  
  console.log(`找到 ${sortedPosts.length} 篇最近的博客文章`);
  
  if (sortedPosts.length === 0) {
    console.log('没有找到博客文章');
    return;
  }
  
  const { batchConvertBlogPosts } = await import('../src/lib/podcast/index.mjs');
  const results = await batchConvertBlogPosts(sortedPosts, options);
  
  console.log('\n=== 批量转换结果 ===');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`${index + 1}. ✅ ${result.post.data.title}`);
      console.log(`   播客链接: ${result.result.audioUrl}`);
    } else {
      console.log(`${index + 1}. ❌ ${result.post.data.title}`);
      console.log(`   错误: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n总计: ${successCount}/${sortedPosts.length} 成功`);
}

async function convertPostById(postId, options = {}) {
  console.log(`查找博客文章: ${postId}`);
  const allPosts = await getCollection('blog');
  
  const blogPost = allPosts.find(post => post.id === postId || post.slug === postId);
  
  if (!blogPost) {
    console.error(`未找到博客文章: ${postId}`);
    console.log('\n可用的博客文章:');
    allPosts.forEach(post => {
      console.log(`  - ${post.id} (${post.slug})`);
    });
    process.exit(1);
  }
  
  console.log(`找到博客: ${blogPost.data.title}`);
  console.log(`发布日期: ${blogPost.data.pubDate}`);
  console.log(`标签: ${blogPost.data.tags?.join(', ') || '无'}`);
  
  try {
    const result = await convertBlogToPodcast(blogPost, options);
    
    console.log('\n=== 转换成功 ===');
    console.log(`播客 ID: ${result.podcastId}`);
    console.log(`音频链接: ${result.audioUrl}`);
    console.log(`时长: ${result.duration.minutes} 分钟 ${result.duration.seconds} 秒`);
    console.log(`文件大小: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('\n=== 转换失败 ===');
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
}

function parseOptions() {
  const options = {};
  let i = 2;
  
  while (i < argv.length) {
    const arg = argv[i];
    
    if (arg === '--voice-style' && argv[i + 1]) {
      options.voiceStyle = argv[i + 1];
      i += 2;
    } else if (arg === '--no-intro') {
      options.includeIntro = false;
      i += 1;
    } else if (arg === '--no-outro') {
      options.includeOutro = false;
      i += 1;
    } else if (arg === '--background' && argv[i + 1]) {
      options.backgroundMusic = argv[i + 1];
      i += 2;
    } else if (arg === '--delay' && argv[i + 1]) {
      options.delayBetweenConversions = parseInt(argv[i + 1]);
      i += 2;
    } else {
      i += 1;
    }
  }
  
  return options;
}

async function main() {
  if (!process.env.WONDERCRAFT_API_KEY) {
    console.error('错误: 未设置 WONDERCRAFT_API_KEY 环境变量');
    console.error('请在 .env 文件中设置 WONDERCRAFT_API_KEY');
    process.exit(1);
  }
  
  const command = argv[0];
  const options = parseOptions();
  
  console.log('=== 博客转播客转换工具 ===\n');
  
  switch (command) {
    case 'all':
      await convertAllPosts(options);
      break;
      
    case 'recent':
      const count = parseInt(argv[1]) || 5;
      await convertRecentPosts(count, options);
      break;
      
    case 'id':
      const postId = argv[1];
      if (!postId) {
        console.error('错误: 缺少 post-id 参数');
        showHelp();
      }
      await convertPostById(postId, options);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
      
    default:
      console.error('错误: 未知命令', command);
      await showHelp();
  }
}

main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});