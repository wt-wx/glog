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
- **Benchmarks (智能书签库)**: 
  - 引入 `/bookmarks` 页面，支持 4700+ 浏览器书签的自动化同步与归类。
  - 构建 `parse-bookmarks` 脚本：智能提取 Favicon 并按 **域名 (Domain)** 物理分组，解决超大规模外部链接管理难题。
  - 集成**毫秒级客户端搜索**，支持全量 1800+ 域名下的实时内容检索。
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
│   ├── components/  # 可复用组件 (Search, ToC, CookieConsent等)
│   ├── content/     # 核心内容
│   │   ├── blog/    # 深度文章
│   │   └── xlog/    # 原生推文流
│   ├── layouts/    # 页面布局
│   ├── pages/      # 路由页面 (Tags, X-Log, Blog)
│   └── styles/     # Tailwind v4 全局样式
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
heroImage: '../../assets/blog-placeholder-about.jpg' # 封面图 (支持本地路径或 NAS 链接)
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

### 3. 同步到其他社交平台
Glog 生成的 `rss.xml` 已优化，你可以利用以下工具实现自动化：
- **WordPress**: 后台导入工具指向 `/rss.xml`。
- **Facebook/Blogger**: 使用 [IFTTT](https://ifttt.com) 的 RSS-to-Action 方案。

### 4. 评论系统配置 (Giscus)
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

## � 维护与保活 (Maintenance & Keep-Alive)

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

## �🛠 开发栈

- **Astro 5**: 现代前端最快的内容框架。
- **Tailwind v4**: 极致设计系统。
- **Bun**: 超快运行时。
- **Fuse.js**: 本地轻量级全文搜索引擎。

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

---

沉淀知识，持续成长。 **Glog v1.5.0 Ready for Deployment.**
