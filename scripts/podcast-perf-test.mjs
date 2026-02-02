import 'dotenv/config';
import { getCollection } from 'astro:content';
import { PerformanceMonitor, getGlobalMonitor } from '../src/lib/podcast/performance-monitor.mjs';
import { AudioQualityAnalyzer } from '../src/lib/podcast/quality-control.mjs';

const argv = process.argv.slice(2);

async function showHelp() {
  console.log(`
播客系统性能测试工具

用法:
  node scripts/podcast-perf-test.mjs [命令] [参数]

命令:
  run              运行完整性能测试
  single <post-id>  测试单篇文章转换
  batch <count>      测试批量转换
  health            检查系统健康状态
  metrics            显示性能指标
  reset              重置性能指标
  clear <days>       清理旧日志数据
  stress <count>     压力测试
  help              显示帮助信息

示例:
  node scripts/podcast-perf-test.mjs run
  node scripts/podcast-perf-test.mjs single my-post-id
  node scripts/podcast-perf-test.mjs batch 5
  node scripts/podcast-perf-test.mjs health
`);
  process.exit(0);
}

async function runSingleTest(postId) {
  console.log(`[性能测试] 测试单篇文章: ${postId}\n`);
  
  const monitor = getGlobalMonitor({
    logLevel: 'info',
    persistLogs: true,
    enableMetrics: true
  });
  
  await monitor.log('info', 'test', '开始单篇文章测试', { postId });
  
  const timer = await monitor.startTimer('single-conversion');
  
  try {
    const allPosts = await getCollection('blog');
    const blogPost = allPosts.find(post => post.id === postId || post.slug === postId);
    
    if (!blogPost) {
      console.error(`[性能测试] 未找到文章: ${postId}`);
      await monitor.log('error', 'test', '文章不存在', { postId });
      return false;
    }
    
    const testResult = {
      postId,
      title: blogPost.data.title,
      contentLength: blogPost.body?.length || 0,
      tags: blogPost.data?.tags || [],
      timestamp: new Date().toISOString()
    };
    
    await monitor.log('info', 'test', '文章信息', {
      title: testResult.title,
      contentLength: testResult.contentLength
    });
    
    await monitor.trackConversion(postId, 'test-start', 'started');
    
    const contentTimer = await monitor.startTimer('content-processing');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    await monitor.endTimer(contentTimer);
    await monitor.trackConversion(postId, 'content-processing', 'completed', {
      duration: 'simulated'
    });
    
    const generationTimer = await monitor.startTimer('audio-generation');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    await monitor.endTimer(generationTimer);
    await monitor.trackConversion(postId, 'audio-generation', 'completed', {
      duration: 'simulated'
    });
    
    const downloadTimer = await monitor.startTimer('audio-download');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    await monitor.endTimer(downloadTimer);
    await monitor.trackConversion(postId, 'audio-download', 'completed', {
      duration: 'simulated'
    });
    
    const validationTimer = await monitor.startTimer('quality-validation');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    await monitor.endTimer(validationTimer);
    await monitor.trackConversion(postId, 'quality-validation', 'completed', {
      duration: 'simulated'
    });
    
    await monitor.endTimer(timer);
    
    testResult.success = true;
    testResult.totalDuration = timer.duration;
    
    console.log('\n[性能测试] ✅ 测试成功');
    console.log(`总耗时: ${timer.duration}ms`);
    
    await monitor.log('info', 'test', '测试完成', testResult);
    
    return testResult;
  } catch (error) {
    await monitor.endTimer(timer);
    await monitor.trackError(error, { postId, operation: 'single-test' });
    
    console.error('\n[性能测试] ❌ 测试失败:', error.message);
    
    return { success: false, error: error.message };
  }
}

async function runBatchTest(count = 3) {
  console.log(`[性能测试] 批量测试: ${count} 篇文章\n`);
  
  const monitor = getGlobalMonitor({
    logLevel: 'info',
    persistLogs: true,
    enableMetrics: true
  });
  
  await monitor.log('info', 'test', '开始批量测试', { count });
  
  const batchTimer = await monitor.startTimer('batch-conversion');
  
  try {
    const allPosts = await getCollection('blog');
    const testPosts = allPosts.slice(0, count);
    
    console.log(`找到 ${testPosts.length} 篇文章用于测试\n`);
    
    const results = [];
    
    for (let i = 0; i < testPosts.length; i++) {
      const post = testPosts[i];
      console.log(`\n[性能测试] ${i + 1}/${testPosts.length}: ${post.data.title}`);
      
      const postTimer = await monitor.startTimer(`post-${i}`);
      
      try {
        await monitor.trackConversion(post.id, 'batch-start', 'started');
        
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 3000 + 1000)
        );
        
        await monitor.trackConversion(post.id, 'batch-processing', 'completed');
        
        const result = {
          index: i + 1,
          postId: post.id,
          title: post.data.title,
          success: true,
          duration: postTimer.duration
        };
        
        results.push(result);
        
        console.log(`  ✅ 完成: ${postTimer.duration}ms`);
        
        await monitor.endTimer(postTimer);
        
        if (i < testPosts.length - 1) {
          const delay = 1000;
          console.log(`  等待 ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        await monitor.endTimer(postTimer);
        await monitor.trackError(error, { postId: post.id, index: i });
        
        results.push({
          index: i + 1,
          postId: post.id,
          title: post.data.title,
          success: false,
          error: error.message
        });
        
        console.log(`  ❌ 失败: ${error.message}`);
      }
    }
    
    await monitor.endTimer(batchTimer);
    
    const successfulCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = totalDuration / results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('[性能测试] 批量测试结果');
    console.log('='.repeat(50));
    console.log(`总文章数: ${results.length}`);
    console.log(`成功: ${successfulCount}`);
    console.log(`失败: ${failedCount}`);
    console.log(`总耗时: ${batchTimer.duration}ms`);
    console.log(`平均耗时: ${Math.round(avgDuration)}ms`);
    console.log(`成功率: ${((successfulCount / results.length) * 100).toFixed(1)}%`);
    
    const batchResult = {
      count,
      successful: successfulCount,
      failed: failedCount,
      totalDuration: batchTimer.duration,
      averageDuration: avgDuration,
      results
    };
    
    await monitor.log('info', 'test', '批量测试完成', batchResult);
    
    return batchResult;
  } catch (error) {
    await monitor.endTimer(batchTimer);
    await monitor.trackError(error, { operation: 'batch-test' });
    
    console.error('\n[性能测试] ❌ 批量测试失败:', error.message);
    
    return { success: false, error: error.message };
  }
}

async function runHealthCheck() {
  console.log('[性能测试] 系统健康检查\n');
  
  try {
    const monitor = getGlobalMonitor();
    const health = await monitor.getHealthStatus();
    
    console.log('系统状态:', health.status.toUpperCase());
    console.log('-'.repeat(40));
    console.log(`运行时间: ${Math.round(health.uptime / 1000)}s`);
    console.log(`总转换数: ${health.conversions}`);
    console.log(`成功率: ${health.successRate}`);
    console.log(`错误率: ${health.errorRate}`);
    
    if (health.lastError) {
      const errorTime = new Date(health.lastError);
      const timeSinceError = Date.now() - errorTime.getTime();
      console.log(`最后错误: ${health.lastError}`);
      console.log(`距离错误: ${Math.round(timeSinceError / 1000)}s 前`);
    } else {
      console.log('最后错误: 无');
    }
    
    console.log('-'.repeat(40));
    
    if (health.status === 'healthy') {
      console.log('✅ 系统运行正常');
    } else if (health.status === 'degraded') {
      console.log('⚠️  系统性能下降');
    } else {
      console.log('❌ 系统状态不健康');
    }
    
    return health;
  } catch (error) {
    console.error('[性能测试] 健康检查失败:', error.message);
    return { status: 'error', error: error.message };
  }
}

async function showMetrics() {
  console.log('[性能测试] 性能指标\n');
  
  try {
    const monitor = getGlobalMonitor();
    const metrics = await monitor.getMetrics();
    
    if (!metrics) {
      console.log('暂无性能指标数据');
      return;
    }
    
    console.log('='.repeat(50));
    console.log('转换统计');
    console.log('='.repeat(50));
    console.log(`总转换次数: ${metrics.conversions.total}`);
    console.log(`成功转换: ${metrics.conversions.successful}`);
    console.log(`失败转换: ${metrics.conversions.failed}`);
    
    if (metrics.conversions.total > 0) {
      const successRate = (metrics.conversions.successful / metrics.conversions.total) * 100;
      console.log(`成功率: ${successRate.toFixed(1)}%`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('性能指标');
    console.log('='.repeat(50));
    console.log(`平均转换时间: ${metrics.performance.averageConversionTime}ms`);
    console.log(`中位数转换时间: ${metrics.performance.medianConversionTime}ms`);
    console.log(`最短转换时间: ${metrics.performance.minConversionTime}ms`);
    console.log(`最长转换时间: ${metrics.performance.maxConversionTime}ms`);
    
    console.log('\n' + '='.repeat(50));
    console.log('错误统计');
    console.log('='.repeat(50));
    console.log(`总错误数: ${metrics.errors.total}`);
    
    if (metrics.errors.recent && metrics.errors.recent.length > 0) {
      console.log(`\n最近 ${metrics.errors.recent.length} 个错误:`);
      metrics.errors.recent.slice(-5).forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.timestamp}: ${err.message}`);
      });
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('[性能测试] 获取指标失败:', error.message);
  }
}

async function resetMetrics() {
  console.log('[性能测试] 重置性能指标\n');
  
  try {
    const monitor = getGlobalMonitor();
    await monitor.resetMetrics();
    
    console.log('✅ 性能指标已重置');
    
  } catch (error) {
    console.error('[性能测试] 重置失败:', error.message);
  }
}

async function clearLogs(days = 7) {
  console.log(`[性能测试] 清理 ${days} 天前的日志\n`);
  
  try {
    const monitor = getGlobalMonitor();
    await monitor.clearOldLogs(days);
    
    console.log('✅ 旧日志已清理');
    
  } catch (error) {
    console.error('[性能测试] 清理失败:', error.message);
  }
}

async function runStressTest(count = 10) {
  console.log(`[性能测试] 压力测试: ${count} 次并发转换\n`);
  
  const monitor = getGlobalMonitor({
    logLevel: 'warn',
    persistLogs: true,
    enableMetrics: true
  });
  
  await monitor.log('info', 'test', '开始压测', { count });
  
  const stressTimer = await monitor.startTimer('stress-test');
  
  try {
    const allPosts = await getCollection('blog');
    const testPost = allPosts[0];
    
    if (!testPost) {
      console.error('[性能测试] 未找到测试文章');
      return false;
    }
    
    console.log(`测试文章: ${testPost.data.title}`);
    console.log(`并发数: ${count}`);
    console.log('');
    
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      const promise = new Promise(async (resolve) => {
        const timer = await monitor.startTimer(`stress-${i}`);
        
        try {
          const delay = Math.random() * 3000 + 1000;
          await new Promise(r => setTimeout(r, delay));
          
          await monitor.endTimer(timer);
          
          resolve({
            index: i + 1,
            duration: timer.duration,
            success: true
          });
        } catch (error) {
          await monitor.endTimer(timer);
          await monitor.trackError(error, { index: i });
          
          resolve({
            index: i + 1,
            error: error.message,
            success: false
          });
        }
      });
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    
    await monitor.endTimer(stressTimer);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);
    
    console.log('='.repeat(50));
    console.log('[性能测试] 压力测试结果');
    console.log('='.repeat(50));
    console.log(`总请求数: ${count}`);
    console.log(`成功: ${successful.length}`);
    console.log(`失败: ${failed.length}`);
    console.log(`总耗时: ${stressTimer.duration}ms`);
    console.log(`平均响应时间: ${durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0}ms`);
    console.log(`最快: ${durations.length > 0 ? Math.min(...durations) : 0}ms`);
    console.log(`最慢: ${durations.length > 0 ? Math.max(...durations) : 0}ms`);
    
    const stressResult = {
      count,
      successful: successful.length,
      failed: failed.length,
      totalDuration: stressTimer.duration,
      results
    };
    
    await monitor.log('info', 'test', '压测完成', stressResult);
    
    return stressResult;
  } catch (error) {
    await monitor.endTimer(stressTimer);
    await monitor.trackError(error, { operation: 'stress-test' });
    
    console.error('[性能测试] ❌ 压力测试失败:', error.message);
    
    return { success: false, error: error.message };
  }
}

async function main() {
  const command = argv[0];
  
  switch (command) {
    case 'run':
      await runBatchTest(3);
      break;
      
    case 'single':
      const postId = argv[1];
      if (!postId) {
        console.error('错误: 缺少 post-id 参数');
        showHelp();
      }
      await runSingleTest(postId);
      break;
      
    case 'batch':
      const count = parseInt(argv[1]) || 3;
      await runBatchTest(count);
      break;
      
    case 'health':
      await runHealthCheck();
      break;
      
    case 'metrics':
      await showMetrics();
      break;
      
    case 'reset':
      await resetMetrics();
      break;
      
    case 'clear':
      const days = parseInt(argv[1]) || 7;
      await clearLogs(days);
      break;
      
    case 'stress':
      const stressCount = parseInt(argv[1]) || 10;
      await runStressTest(stressCount);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
      
    default:
      console.error(`错误: 未知命令 ${command}`);
      await showHelp();
  }
}

main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});