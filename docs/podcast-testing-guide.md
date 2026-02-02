# 博客转播客系统测试指南

本文档提供详细的测试步骤，帮助您验证博客转播客系统的各项功能。

## 测试环境准备

### 1. 确认环境变量

确保 `.env` 文件中已设置：

```env
WONDERCRAFT_API_KEY=your_actual_api_key
SITE_URL=https://glog.geniux.net
```

### 2. 检查项目结构

确认以下目录和文件已创建：

- `src/lib/podcast/` 目录及其下的所有文件
- `src/components/PodcastStatus.astro`
- `src/pages/api/webhook/podcast.js`
- `scripts/convert-to-podcast.mjs`
- `public/podcasts/` 目录

## 测试步骤

### 测试 1: 命令行工具 - 查看帮助

```bash
npm run podcast:convert help
```

**预期结果**：显示帮助信息，列出所有可用命令和参数

### 测试 2: 列出所有博客文章

```bash
node scripts/convert-to-podcast.mjs id non-existent-post
```

**预期结果**：
- 显示错误消息：未找到博客文章
- 列出所有可用的博客文章（ID 和 slug）

### 测试 3: 转换单篇博客文章

#### 3.1 选择一篇博客文章

先查看可用的文章：

```bash
node scripts/convert-to-podcast.mjs id non-existent-post
```

从输出中选择一个实际的 post-id 或 slug。

#### 3.2 执行转换

```bash
npm run podcast:convert id <your-post-id>
```

**预期结果**：
1. 显示博客文章信息（标题、发布日期、标签）
2. 开始转换过程
3. 显示每个阶段的进度：
   - 步骤 1/4: 处理博客内容...
   - 步骤 2/4: 生成播客音频...
   - 步骤 3/4: 验证音频质量...
   - 步骤 4/4: 完成转换...
4. 显示成功信息：
   - 播客 ID
   - 音频链接
   - 时长
   - 文件大小

**可能遇到的问题**：

如果 Wondercraft API 未正确配置，会看到：
```
错误: Wondercraft API 密钥无效，请检查环境变量 WONDERCRAFT_API_KEY
```

**解决方案**：
- 检查 `.env` 文件中的 `WONDERCRAFT_API_KEY`
- 确认 API Key 是否有效且未过期

### 测试 4: 查看转换状态

#### 4.1 通过命令行查看

转换完成后，检查状态文件：

```bash
cat src/data/podcast-status.json
```

**预期结果**：显示转换状态数据，包含：
- 转换状态（completed）
- 进度（100%）
- 各阶段信息
- 音频文件路径
- 时间戳

#### 4.2 通过 API 查看

```bash
curl "http://localhost:4321/api/webhook/podcast?postId=<your-post-id>"
```

**预期结果**：返回 JSON 格式的状态信息

### 测试 5: 测试 Webhook API

#### 5.1 触发转换（POST 请求）

```bash
curl -X POST http://localhost:4321/api/webhook/podcast \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "<your-post-id>",
    "action": "published",
    "options": {
      "voiceStyle": "professional_conversational"
    }
  }'
```

**预期结果**：
```json
{
  "success": true,
  "message": "播客转换已启动，正在后台处理",
  "postId": "your-post-id"
}
```

#### 5.2 查询所有转换状态（GET 请求）

```bash
curl http://localhost:4321/api/webhook/podcast
```

**预期结果**：返回所有转换状态的列表

### 测试 6: 验证音频文件

检查生成的音频文件：

```bash
ls -lh public/podcasts/
```

**预期结果**：显示生成的 `.mp3` 文件，包含文件大小

测试播放音频文件：

```bash
# 在命令行中播放（如果系统支持）
afplay public/podcasts/podcast-<id>-<timestamp>.mp3
```

或在浏览器中访问：
```
https://glog.geniux.net/podcasts/podcast-<id>-<timestamp>.mp3
```

### 测试 7: 博客页面状态显示

1. 启动开发服务器：
```bash
npm run dev
```

2. 在浏览器中访问刚才转换的博客文章页面

**预期结果**：
- 在博客文章下方看到播客状态组件
- 显示 "✅ 播客已发布"
- 显示 "🎧 收听播客" 链接
- 点击链接可以播放播客

### 测试 8: 批量转换（可选）

**警告**：批量转换会消耗大量 API 配额，请谨慎使用！

```bash
npm run podcast:convert recent 2 --delay 5000
```

**预期结果**：
- 转换最近的 2 篇文章
- 每篇文章之间有 5 秒延迟
- 显示每篇文章的转换结果

### 测试 9: 错误处理

#### 9.1 测试无效的 post-id

```bash
npm run podcast:convert id invalid-post-id
```

**预期结果**：
- 显示错误消息
- 列出可用的博客文章

#### 9.2 测试未设置 API Key

临时移除 `.env` 中的 `WONDERCRAFT_API_KEY`：

```bash
npm run podcast:convert id <valid-post-id>
```

**预期结果**：
```
错误: 未设置 WONDERCRAFT_API_KEY 环境变量
请在 .env 文件中设置 WONDERCRAFT_API_KEY
```

### 测试 10: 音频质量验证

检查音频文件大小：

```bash
stat public/podcasts/podcast-<id>-<timestamp>.mp3
```

**预期结果**：
- 文件大小应该合理（通常 5-50 MB）
- 如果文件过小（< 0.1 MB）或过大（> 100 MB），质量检查会失败

## 性能测试

### 测试转换速度

记录转换开始和结束时间：

```bash
time npm run podcast:convert id <your-post-id>
```

**预期结果**：
- 转换时间通常在 2-5 分钟
- 取决于文章长度和网络速度

## 集成测试

### 测试博客发布触发

模拟博客发布流程（需要实际的发布系统）：

```bash
# 假设你的发布系统有 webhook 配置
curl -X POST http://localhost:4321/api/webhook/podcast \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "<new-post-id>",
    "action": "published"
  }'
```

**预期结果**：
- 播客转换自动触发
- 无需手动干预

## 常见问题排查

### 问题 1: API 请求超时

**症状**：转换过程中长时间无响应

**解决方案**：
- 检查网络连接
- 检查 Wondercraft API 服务状态
- 增加请求超时时间（需要修改代码）

### 问题 2: 音频文件未生成

**症状**：转换成功但找不到音频文件

**检查步骤**：
```bash
# 1. 检查状态文件
cat src/data/podcast-status.json

# 2. 检查目录
ls -la public/podcasts/

# 3. 检查权限
ls -ld public/podcasts/
```

### 问题 3: 状态组件不显示

**症状**：博客页面看不到播客状态

**检查步骤**：
1. 确认已转换完成
2. 检查 blogPostId 是否正确
3. 打开浏览器开发者工具，查看控制台错误

### 问题 4: 音频无法播放

**症状**：点击播放链接无法播放

**检查步骤**：
1. 检查音频文件是否完整
2. 检查文件权限
3. 尝试直接在浏览器中访问音频 URL
4. 检查文件格式（应为 MP3）

## 清理测试数据

清理测试生成的文件和数据：

```bash
# 删除音频文件
rm -f public/podcasts/*.mp3

# 重置状态数据
echo '{}' > src/data/podcast-status.json
```

## 下一步

测试通过后，您可以：

1. 将系统部署到生产环境
2. 配置自动 webhook 触发
3. 设置定期批量转换任务
4. 集成 Phase 2 的音频增强功能

## 需要帮助？

如果在测试过程中遇到问题：

1. 检查控制台输出的错误信息
2. 查看 `src/data/podcast-status.json` 了解详细状态
3. 参考 [Podcast System Documentation](./podcast-system.md)
4. 查阅 Wondercraft AI API 文档