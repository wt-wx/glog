# 博客转播客自动化系统

博客转播客自动化系统，基于 Wondercraft AI API 实现，可以将 Astro 博客文章自动转换为高质量播客音频。

## 功能特性

- ✅ 自动内容提取与优化
- ✅ Wondercraft AI API 集成
- ✅ 播客转换状态跟踪
- ✅ Webhook 触发机制
- ✅ 命令行工具
- ✅ 博客文章页面状态显示

## 架构组件

### 核心模块

- **content-processor.mjs** - 博客内容提取与音频格式优化
- **podcast-generator.mjs** - Wondercraft AI API 集成与音频生成
- **status-manager.mjs** - 转换状态跟踪管理
- **index.mjs** - 主流程控制器

### API 端点

- **POST /api/webhook/podcast** - 触发播客转换
- **GET /api/webhook/podcast** - 获取转换状态
- **GET /api/webhook/podcast?postId=xxx** - 获取指定文章的转换状态

### UI 组件

- **PodcastStatus.astro** - 播客转换状态显示组件

## 快速开始

### 1. 配置环境变量

在 `.env` 文件中设置以下变量：

```env
# Podcast Generation
WONDERCRAFT_API_KEY=your_wondercraft_api_key_here

# Podcast Quality Control
PODCAST_QUALITY_THRESHOLD=0.8
MAX_RETRY_ATTEMPTS=3

# Podcast Feature Flags
AUTO_PUBLISH_ENABLED=false
SOCIAL_MEDIA_SYNC_ENABLED=false
QUALITY_CHECK_ENABLED=true

# Website URL
SITE_URL=https://glog.geniux.net
```

### 2. 获取 Wondercraft API Key

1. 访问 [Wondercraft.ai](https://wondercraft.ai)
2. 注册账号并获取 API Key
3. 将 API Key 设置到 `.env` 文件中

### 3. 使用命令行工具

#### 转换单篇文章

```bash
npm run podcast:convert id <post-id>
```

#### 转换最近的 N 篇文章

```bash
npm run podcast:convert recent 5
```

#### 转换所有文章

```bash
npm run podcast:convert all
```

#### 高级选项

```bash
npm run podcast:convert recent 3 --voice-style conversational --background subtle_tech --delay 5000
```

可用选项：
- `--voice-style <style>` - 语音风格 (professional_conversational, conversational, 等)
- `--no-intro` - 不包含开头
- `--no-outro` - 不包含结尾
- `--background <music>` - 背景音乐
- `--delay <ms>` - 批量转换时的延迟（毫秒）

### 4. 使用 Webhook API

#### 触发转换

```bash
curl -X POST http://localhost:4321/api/webhook/podcast \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "your-post-id",
    "action": "published",
    "options": {
      "voiceStyle": "professional_conversational"
    }
  }'
```

#### 查询状态

```bash
curl "http://localhost:4321/api/webhook/podcast?postId=your-post-id"
```

## 工作流程

```
博客文章 → 内容处理 → 音频生成 → 下载音频 → 质量验证 → 完成
   ↓          ↓          ↓          ↓          ↓        ↓
提取内容    优化格式   API生成    保存本地    验证大小   发布
```

### 转换阶段

1. **内容处理** (Content Processing)
   - 提取主要内容
   - 移除代码块和图片
   - 优化为音频格式

2. **音频生成** (Audio Generation)
   - 调用 Wondercraft AI API
   - 生成专业品质音频

3. **音频下载** (Audio Download)
   - 下载生成的音频文件
   - 保存到 `public/podcasts/` 目录

4. **质量验证** (Validation)
   - 验证音频文件大小
   - 检查音频完整性

## 文件结构

```
glog/
├── src/
│   ├── lib/podcast/
│   │   ├── content-processor.mjs      # 内容处理
│   │   ├── podcast-generator.mjs       # 音频生成
│   │   ├── status-manager.mjs          # 状态管理
│   │   └── index.mjs                   # 主控制器
│   ├── components/
│   │   └── PodcastStatus.astro         # 状态组件
│   └── pages/api/webhook/
│       └── podcast.js                  # Webhook 端点
├── public/podcasts/                    # 播客音频存储
├── src/data/
│   └── podcast-status.json             # 状态数据
└── scripts/
    └── convert-to-podcast.mjs          # CLI 工具
```

## 播客状态说明

- **pending** - 等待转换
- **processing** - 转换中
- **completed** - 转换完成
- **failed** - 转换失败

## 错误处理

### 常见错误

1. **API 密钥无效**
   ```
   错误: Wondercraft API 密钥无效，请检查环境变量 WONDERCRAFT_API_KEY
   解决: 检查 .env 文件中的 WONDERCRAFT_API_KEY 是否正确
   ```

2. **API 配额不足**
   ```
   错误: Wondercraft API 配额已用完或无权限
   解决: 检查 Wondercraft 账户的 API 使用配额
   ```

3. **内容过短**
   ```
   错误: 内容过短，无法生成播客
   解决: 确保博客文章内容足够长（至少100字符）
   ```

4. **音频下载失败**
   ```
   错误: 下载音频失败
   解决: 检查网络连接和 Wondercraft API 服务状态
   ```

## 监控与调试

### 查看转换日志

转换过程中会输出详细的日志信息，包括：

- 每个阶段的开始和完成
- 进度百分比
- 音频文件信息
- 错误信息（如果有）

### 查看状态数据

状态数据保存在 `src/data/podcast-status.json` 文件中，包含：

- 转换状态
- 各阶段的详细信息
- 错误信息
- 完成时间等

## 集成到博客发布流程

### 方法 1: Webhook 自动触发

在博客发布系统中配置 Webhook，当文章发布时自动调用 `/api/webhook/podcast` 端点。

### 方法 2: 手动触发

使用命令行工具手动转换指定的文章：

```bash
npm run podcast:convert id your-post-id
```

### 方法 3: 批量转换

定期批量转换新发布的文章：

```bash
npm run podcast:convert recent 10
```

## 性能优化

### 批量转换延迟

在批量转换时，添加延迟以避免 API 限制：

```bash
npm run podcast:convert all --delay 5000
```

### 音频文件管理

- 生成的音频文件保存在 `public/podcasts/` 目录
- 文件命名格式: `podcast-{postId}-{timestamp}.mp3`
- 可以定期清理旧的音频文件

## 成本估算

Wondercraft AI API 定价（参考）：

- 基础版: $29/月（有限次数）
- 专业版: $50/月（无限制）

根据博客发布频率和内容长度，成本会有所不同。

## 未来扩展

### Phase 2: 音频质量优化
- ElevenLabs 音频增强
- 更高级的质量控制系统

### Phase 3: 播客托管与发布
- Transistor.fm 集成
- 自动发布到 Apple Podcasts, Spotify
- RSS feed 生成

### Phase 4: 监控与分析
- 转换统计仪表板
- 性能分析
- 用户反馈收集

## 常见问题 (FAQ)

**Q: 播客音频需要多长时间生成？**
A: 通常需要 2-5 分钟，取决于文章长度和 API 响应速度。

**Q: 支持哪些语音风格？**
A: Wondercraft AI 支持多种语音风格，如 professional_conversational, conversational, broadcast 等。具体请参考 Wondercraft 文档。

**Q: 可以自定义背景音乐吗？**
A: 可以通过 `--background` 参数选择不同的背景音乐风格，如 subtle_tech, calm, energetic 等。

**Q: 播客文件会占用多少空间？**
A: 通常 1 分钟的音频约占用 1-2 MB 空间，一篇 5 分钟的播客约占用 5-10 MB。

## 技术支持

如有问题或建议，请：
1. 检查本文档的常见问题部分
2. 查看 Wondercraft AI API 文档
3. 检查项目 GitHub Issues

## 许可证

本项目采用 MIT 许可证。