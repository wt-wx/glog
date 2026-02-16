# Glog - 每日AI对话

基于 Astro 5.0 + Tailwind CSS v4 + Bun 构建的极致性能个人博客。

## 🚀 快速开始

所有的命令都在项目根目录下执行：

| 命令 | 描述 |
| :--- | :--- |
| `bun install` | 安装依赖 |
| `bun run dev` | 启动本地开发服务器 `localhost:4321` |
| `bun run sync-x` | **从 X (Twitter) 同步推文到本地 X-Log** |
| `bun run push-x [slug]` | **一键发布指定博文到 X** |
| `bun run build` | 构建生产版本到 `./dist/` 目录 |
| `bun run preview` | 在本地预览构建后的项目 |

---

## 🏗 功能版本迭代 (Version History)

### v2.0.0 - Genius OS: 个人云端大脑进化 (Cloud Brain Evolution)
- **Google Assistant Ecosystem (Phase 1)**:
  - **Unified OAuth**: 深度集成 Google OAuth 2.0，获得 Calendar (日程) 与 Tasks (待办) 的原生读写权限。
  - **Token Management**: 基于 Supabase 实现加密 Token 的持久化存储与全自动刷新机制。
  - **Admin Command Center**: 全新的管理后台 (`/admin/dashboard`)，实时监控同步状态与系统心跳。
- **Telegram Connectivity (Phase 2)**:
  - **Daily Briefing**: 自动化简报引擎，每天准时通过 Telegram 推送今日日程与待办清单。
  - **Interactive Bot**: 部署 Telegram Webhook 架构，支持通过 `/today`、`/tasks` 等指令实时调取大脑数据。
  - **Hybrid Notification**: 结合 Google API 与 Telegram Bot API，构建“大脑 -> 手机”的即时触达链路。
- **Cognitive Core (Phase 3) [Planned]**:
  - **AI Agent Integration**: 预集成 Gemini 1.5 Pro / Claude 3.5 认知核心，实现自然语言意图识别。
  - **Semantic Ideas**: 引入语义备忘录，通过 Telegram 随手记录的想法将由 AI 自动打标、分类并存入 Supabase 灵感库。

### v1.9.4 - 线性交互与响应式架构 (Linear UX & Responsive Architecture)
- **Intro Layout Overhaul**: 重构 `/intro` 页面为单列线性纵向布局，提升移动端与 PC 端的内容聚焦感。
  - **Fluid Typography**: 引入 `clamp` 流体字号技术，确保 "Hi, I'm Geniux" 核心标题在各分辨率下始终保持单行且不溢出。
  - **Adaptive Header**: 重新设计头像与标题的并排逻辑，实现大屏横向展开与小屏响应式堆叠的完美平衡。
  - **Precision Alignment**: 实施“非对称平衡”布局：物理坐标 (Location) 靠右对齐，核心行动按钮 (CTA) 全站居中对齐。
- **Mobile UX Optimization**: 
  - **Button Refactor**: 在移动端强制实施横向双按钮展示，通过文案精简与 `flex-1` 动态弹性宽度实现极致紧凑感。
  - **PC Compactness**: 统一 PC 端按钮最小宽度，保持视觉克制与专业感。

### v1.9.3 - 系统集成与“奔跑者”叙事 (Systems Schematic & Running Man)
- **Persona Refinement**: 重构 `/intro` 介绍页为专业的英文叙事，确立 **"S'ALL Running Man"** 品牌身份，深耕“万载演化中的奔跑者”哲学内核。
- **Iconography Evolution**: 同步更新“黑洞 / 事件视界 (Event Horizon)”视觉 Badge，象征从古代信史到未来秩序的极致信息密度。
- **Projects Schematic Refactor**: 彻底重构 `/projects` 页面为“技术蓝图 (Schematic)”风格网格。
  - **Modular UI**: 采用极细线条网格与模块化单元格设计，对齐高分辨率工程美学。
  - **Intelligence Status**: 引入动态“呼吸灯”状态监测（Live Status），实时反馈项目活跃度。
  - **Interactive Titles**: 将外链集成至项目标题，配合滑入式箭头动效，大幅提升交互直觉性。
- **Technical Aesthetics**: 全面采用等宽字体元数据与代码风格标签（`// Tag`），强化“元系统架构师”的技术严谨感。

### v1.9.2 - 极致减法与元系统重构 (Minimalist UX & Meta-System Refactor)
- **Minimalist UX Refactoring**: 实施“极致减法”设计，将原有的 Prev/Next 系列导航块合并至推荐列表，通过高亮标签实现语义引导，大幅降低视觉摩擦。
- **Deep Intro Refactoring**: 彻底重构 `/intro` 介绍页面，摒弃浅层的标签罗列，转向“元系统架构师”与“文明解码者”的深刻哲学叙事，同步更新“系统核心”视觉 Badge。
- **Content Saturation**: 自动化导入覆盖浏览器战争、大厂并购与技术历史的 5 篇深度长文。
- **Remote Image Support**: 建立 Unsplash 远程图源授权体系。

### v1.9.1 - 视觉微调与 UI 修复 (UI Polishing & Bug Fixes)
- **Gallery UX Fix**: 修复 `/gallery` 页面访问申请按钮在暗色模式下的颜色冲突问题，统一品牌视觉。
- **UI Consistency**: 统一“相关内容”模块的文章标题展示长度，确保在不同屏幕尺寸下的布局对齐。
- **Astro Core Update**: 完成 Astro 5.17.2 核心升级，提升构建性能与稳定性。

### v1.9.0 - 语义关联与阅读导航闭环 (Semantic Association & UX Loop)
- **Related Content Engine**: 
  - 引入智能关联算法：优先匹配 `series` (系列) 导向的强关联，其次根据 `tags` (标签) 权重实现语义推荐。
  - 架构升级：在博文底部构建“语义上下文”模块，提升站内内容留存率与 SEO 权重。
- **Minimalist Navigation (Scheme B+C)**:
  - 采用强关联导航逻辑：清晰指引系列文章的 Prev/Next 流向，支持跨文章深度阅读。
  - 极致视觉呈现：采用极简文本流设计，支持 `heroImage` 缩略图自适应展示，兼顾无图博文的排版美感。

### v1.8.0 - 视觉重构与内容权重系统 (Visual Revamp & Content Priority)
- **Blog List Revamp**: 
  - 博文列表页全面进化为“图文流”模式，原生支持 `heroImage` 封面图展示。
  - 优化响应式布局，在移动端与桌面端均提供极致的视觉平衡。
- **Sticky Post (博文置顶)**:
  - 引入 `sticky` 权重系统，支持在 Frontmatter 中一键置顶重要内容。
  - 视觉增强：置顶博文原生配备 **Pinned** 徽章标识。
  - 排序引擎升级：置顶文章始终优先排列，其次按发布日期回溯。

### v1.7.0 - 国际化全栈增强与内容感知 (i18n & Metadata DX)
- **Project i18n & Revamp**: 
  - 完整重构并翻译 `/projects` 页面，对齐国际化叙事逻辑。
  - 优化项目展示架构，增强跨平台展示的适配性。
- **Blog UX Enhancement**:
  - 内容页深度增强：在博文底部集成 Tags 标签云与 Author (Written By) 动态落款。
  - 优化移动端阅读体验，调整元数据模块的视觉层级与呼吸感。
- **Content Engine**:
  - 更新组件 Schema 校验，原生支持 `author` 等多维元数据字段。
  - 优化 `BlogPost` 布局逻辑，提升内容承载的标准化程度。

### v1.6.0 - 博客转播客 (AI Hybrid Cloud) [Partially Implemented]
- **AI Podcast Generator (混合云架构)**:
  - 推出 **Blog-to-Podcast** 自动化管线：利用 AI 将 Markdown 博客一键转为专业播客节目。 ✅ (Implemented in `src/lib/podcast`)
  - **Hybrid Architecture (SaaS + VPS)**:
    - **Deep Dive Mode**: 利用已有的 **VPS (4C4G)** 部署私有 `NotebookLM-Bridge` 服务，运行 Playwright 模拟用户操作，生成高质量双人深度对话音频。 ❌ (Pending: Bridge service & Playwright logic not in current repo)
    - **News Mode**: 集成 **Wondercraft / ElevenLabs API**，为短快讯提供稳定、可控的专业播音级 TTS 服务。 ✅ (Implemented)
  - **Quality Control**: 引入自动音频质量分析与长度校验，确保输出内容达标。 ✅ (Implemented via FFmpeg/FFprobe)
  - **Podcast Hosting**: 深度集成 **Transistor.fm** API，实现音频上传、Episode 创建与 RSS Feed 推送的全流程自动化。 ✅ (Implemented)

### v1.5.0 - 隐私保护与社交深度集成
- **Privacy Lock (Supabase)**: 
  - 集成 Supabase Auth & X Login。
  - 为博文引入“访问暗号”机制，支持对特定敏感内容的权限锁定。
- **Interactive Sync (X Replies)**: 
  - 引入 `sync-replies` 脚本，自动抓取推特评论并落成本地数据。
  - 博文下方新增互动区，实时展示来自 X 的讨论。
- **NAS Gallery**: 
  - 启用 `/gallery` 页面，支持私有 NAS 图片库的外部链接集成。
- **Cloudflare Hybrid Worker**: 
  - 统一 `geniux.net` 与 `glog.geniux.net` 的路由逻辑，实现单 Worker 全站加速。

### v1.4.0 - 知识图谱与海量导航
- **Bookmarks (智能书签库)**: 
  - 引入 `/bookmarks` 页面，支持 4700+ 浏览器书签的自动化同步与归类.
  - 构建 `parse-bookmarks` 脚本：智能提取 Favicon 并按 **域名 (Domain)** 物理分组，解决超大规模外部链接管理难题.
  - 集成**毫秒级客户端搜索**，支持全量 1800+ 域名下的实时内容检索.
- **Pagination (内容分级承载)**: 
  - 为首页与博文归档引入全自动翻页系统，规避海量静态资源下的一次性加载卡顿。
- **Personal Branding (极致名片)**: 
  - 打造 `/intro` 高端交互介绍页，集成渐进式徽章动画与 Grayscale-to-Color 交互 avatar。
- **Design System Fixes**: 
  - 全站链接样式逻辑重构，移除全局侵入式透明度，显著提升有色按钮与辅助文本的视觉对比度。

### v1.3.0 - 社交自动化与全站出海
- **Social Integration**: 
  - 引入 **X-Log (Native Micro-blog)** 模式，摆脱第三方脚本依赖。
  - 构建 `sync-x` 脚本：自动抓取个人 X 动态并落成静态内容，解决加载慢与政策限制问题。
  - 构建 `push-x` 脚本：一键将 Glog 博文推送到 X 账号，实现“一处编写，全网同步”。
- **Localization**: 全站 Cookie Consent 等隐私控件全英文国际化。
- **RSS 2.0+**: 增强 RSS 协议，支持 Full-Content 广播，可用于 IFTTT 自动同步至 WordPress/Blogger/Facebook。

### v1.2.0 - 自动内容发现系统
- **Tagging Engine**: 
  - 自动从 Frontmatter 提取标签并聚合。
  - 引入 `/tags` 标签云与动态分类路由。
- **Navigation UX**: 
  - **Back to Top (Smart)**：不仅会悬浮，还能感应 Footer 自动弹起，解决遮挡底部文字的物理冲突。
  - **Table of Contents (Sliding)**：优化了侧边栏动画，隐藏移动端 ToC，保持阅读纯粹性。

### v1.1.0 - 极致 UI/UX 体验
- **Glassmorphism**: 基于 Tailwind v4 的磨砂玻璃质感设计系统。
- **Search Engine**: 
  - 集成 **Fuse.js** 全文搜索，毫秒级响应。
  - 全局 `Ctrl + K` 呼出搜索对话框。
  - 全站 **View Transitions** 顺滑过渡。
- **Accessibility**: 增加了进度条指示器、智能返回按钮。

### v1.0.0 - 核心博客启动
- Astro 5.0 核心部署。
- Markdown 内容引擎支持系列文章 (`series`)、标签 (`tags`) 与自动归档。
- 部署多核跨云平台负载均衡（Cloudflare / Vercel）。

---

## 📁 项目结构

```text
├── scripts/        # 自动化同步脚本 (Python/Node)
├── src/
│	├── components/  # 可复用组件 (Search, ToC, CookieConsent等)
│	├── content/     # 核心内容
│	│	├── blog/    # 深度文章
│	│	└── xlog/    # 原生推文流
│	├── layouts/    # 页面布局
│	├── pages/      # 路由页面 (Tags, X-Log, Blog)
│	└── styles/     # Tailwind v4 全局样式
├── astro.config.mjs # 核心配置
└── .env             # 隐私凭证 (X API)
```

## ✍️ 内容分发指南

### 1. 撰写博文
在 `src/content/blog/` 下新建 `.md`。

```markdown
---
title: '示例标题'
description: '简短描述'
pubDate: '2026-01-18 12:08:00'  # 发布时间 (建议格式: YYYY-MM-DD HH:mm:ss)
# updatedDate: '2026-01-18'   # 更新日期 (可选)
series: '示例系列'             # 系列名称 (可选)
tags: ['标签1', '标签2']       # 标签数组
heroImage: "/path/to/image.jpg"  # 封面图 (支持本地路径或 NAS 链接)
sticky: true  # 开启置顶
# 可选：内容保护 (设置后将强制 X Login + 访问案号)
# password: '2026'
# 可选：预发布/草稿 (设为 true 则仅在本地开发可见，构建不发布)
# draft: true
# 自动生成：发布到 X 后由脚本填入
# tweetId: '1234567890' 
---
```

### 2. 发布到 X
```bash
bun run push-x [your-post-filename]
```
### 3. 其他社交链接

 - linktr.ee/geniux
 - about.me/geniux
 - geniux.wordpress.com
 - blogger.geniux.net

### 4. 同步到其他社交平台
Glog 生成的 `rss.xml` 已优化，你可以利用以下工具实现自动化：
- **WordPress**: 后台导入工具指向 `/rss.xml`。
- **Facebook/Blogger**: 使用 [IFTTT](https://ifttt.com) 的 RSS-to-Action 方案。

### 5. 评论系统配置 (Giscus)
Glog 集成了基于 GitHub Discussions 的 Giscus 评论系统。
1. 在你的 GitHub 仓库设置中开启 **Discussions**。
2. 访问 [giscus.app](https://giscus.app) 输入你的仓库名。
3. 获取 `data-repo-id` 和 `data-category-id`。
4. 修改 `src/components/Giscus.astro` 中的对应参数。

## 🚢 部署与分发 (Deployment & Distribution)

Glog 采用多云容灾与全球加速架构，确保在任何网络环境下都能快速访问：

### 1. 负载均衡 (Load Balancer)
使用 **Cloudflare Worker** 作为全球流量入口 (`glog.geniux.net`)，实现智能路由与负载均衡：
- **分发策略**：基于地理位置 (Geo-Routing) 与权重 (Weighted Selecting) 自动分发。
- **目标终端**：
    - 🇨🇳 **Vercel**: `glog.vercel.geniux.net` (中国大陆及美洲主节点)
    - 🌏 **Netlify**: `glog.netlify.geniux.net` (全球备选与回源节点)
    - ⚡ **EdgeOne (QCloud)**: `glog.qcloud.geniux.net` (亚太地区加速节点)
- **核心逻辑**：参见 [`cloudflare.worker.js`](./cloudflare.worker.js)。

### 2. 代码托管
代码统一托管于 GitHub：[wt-wx/glog](https://github.com/wt-wx/glog.git)

### 3. 页面呈现
后端部署于以下平台，实现全静态、无服务器化的页面呈现：
- **Vercel**: 提供 Edge Runtime 支持。
- **Netlify**: 作为多云备份。
- **EdgeOne (Tencent Cloud)**: 针对亚太网络环境深度优化。

---

## 🛠 维护与保活 (Maintenance & Keep-Alive)

针对 Supabase 免费版在长期无活动（通常为 7 天）后会自动关停（Pause）的问题，Glog 设计了一套 **“全自动心跳保活” (Keep-Alive)** 策略，确保你的数据库始终处于活跃状态。

### 实现方案
项目已集成以下保活配置：

1.  **心跳脚本 (`scripts/supabase-keep-alive.mjs`)**：
    该脚本会利用现有的 Supabase 配置，定期向数据库发送一个微小的查询请求。这在 Supabase 的规则中会被计为“有效活动”。
2.  **便捷命令**：
    在 `package.json` 中配置了 `bun run supabase-keep-alive` 命令，可随时在本地手动测试。
3.  **自动化流水线 (`.github/workflows/supabase-keep-alive.yml`)**：
    核心组件。通过 GitHub Action 实现自动化监控：
    - **执行频率**：每周二和周五的凌晨 0 点自动运行（一周两次，远超 7 天期限）。
    - **运行环境**：基于 `bun` 运行时。

### 操作建议
为了使保活系统生效，请确保执行以下操作：
1.  将代码推送到 GitHub。
2.  在 GitHub 仓库的 **Settings -> Secrets and variables -> Actions** 中，添加以下两个密钥：
    - `PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL。
    - `PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase API Key。

---

## 🛠 开发栈

- **Astro 5**: 现代前端最快的内容框架。
- **Tailwind v4**: 极致设计系统。
- **Bun**: 超快运行时。
- **Fuse.js**: 本地轻量级全文搜索引擎。
- **Playwright (Python)**: 用于 VPS 端自动化生成 NotebookLM 音频。

---

## 📅 未来路线图与技术债 (Roadmap & Tech Debt)

### 1. 内容安全与隐私保护
- [x] **多重认证锁定**：集成 Supabase Auth / X Login。实现“身份验证 + 访问暗号”的双重锁机制，保护特定隐私博文。
- [ ] **静态加密方案**：研究基于 AES-GCM 的 Markdown 内容构建时加密 (暂缓实现)。

### 2. 生态集成强化 (NAS/Obsidian)
- [x] **NAS 图床集成**：利用 NAS 的“共享链接”功能，将 `heroImage` 或文中图片替换为 NAS 节点的 HTTP 直连地址，实现私有化图床管理。
- [x] **Obsidian 手动同步**：参考 `docs/obsidian-sync.md`，通过 NAS 挂载或 Git 插件将笔记库一键推送到 `src/content/blog/`。
- [ ] **自动化管线**：未来计划实现基于 GitHub Actions 的自动触发。

### 3. X API 高级应用
- [x] **多向交互同步**：利用已配置的 X API，实现推特评论自动抓取并同步回博文下方。
- [ ] **自动化分发**：进一步细化 `push-x` 脚本，支持自动上传博文配图至 X 媒体库。

### 4. 播客自动化 (Podcast Automation)
- [x] **混合架构设计**: 完成 SaaS (Wondercraft) + VPS (NotebookLM) 的技术选型与路由设计。
- [x] **核心逻辑实现**: `src/lib/podcast` 已完成 News Mode、质量控制与 Transistor 托管集成。
- [ ] **VPS 服务开发**: 独立开发 `NotebookLM-Bridge` (Playwright + Python) 并部署至 4C4G VPS。
- [ ] **UI/API 联动**: 补齐 `podcast-manager.astro` 依赖的 `/api/podcast/*` 后端接口（Publish, Edit, Analytics）。

## ⚠️ 技术债务清单 (Technical Debt)

### 1. 架构稳定性
- **环境依赖风险**: `quality-control.mjs` 强依赖系统级 `ffmpeg` 和 `ffprobe`。在 serverless 环境下部署需配置特定的 Layer 或切换为 WASM 版本。
- **混合云异步同步**: 尚未实现针对 VPS 生成失败时的自动 fallback 到 SaaS 引擎的逻辑。

### 2. 接口完整性
- **播客管理 API**: `src/pages/podcast-manager.astro` 调用的多个管理接口（如 `/api/podcast/publish`）尚未实现或仅有 Mock。
- **Webhook 安全**: `/api/webhook/podcast.js` 缺乏请求签名校验 (HMAC)，存在被恶意触发生成任务的风险。

### 3. 数据持久化
- **状态丢失**: 转换进度目前存储在本地内存或临时文件，重启后正在进行的任务状态会丢失。需迁移至 Supabase 或 Redis。
- **RSS 自动刷新**: 需打通 `convertBlogToPodcast` 完成后的本地 `rss-feed-generator.mjs` 自动触发逻辑。

### 4. 开发规范
- **环境变量缺失**: 缺乏 `.env.example` 对 `WONDERCRAFT_API_KEY`, `ELEVENLABS_API_KEY`, `TRANSISTOR_API_KEY` 等关键变量的统一定义与校验。
- **错误重试机制**: `TransistorFMClient` 的速率限制处理过于简单，缺乏指数退避策略。

---

沉淀知识，持续成长。 **Glog v1.9.4 Development in Progress.**
