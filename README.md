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
pubDate: '2026-01-06'
series: '示例系列' 
tags: ['示例标签1', '示例标签2', '示例标签3']
heroImage: '../../assets/blog-placeholder-about.jpg'
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

---

---

## 🛠 开发栈

- **Astro 5**: 现代前端最快的内容框架。
- **Tailwind v4**: 极致设计系统。
- **Bun**: 超快运行时。
- **Fuse.js**: 本地轻量级全文搜索引擎。

---

## 📅 未来路线图与技术债 (Roadmap & Tech Debt)

### 1. 内容安全与隐私保护 (待实现)
- [ ] **多重认证锁定**：集成 Supabase Auth / X Login。实现“身份验证 + 访问暗号”的双重锁机制，保护特定隐私博文。
- [ ] **静态加密方案**：研究基于 AES-GCM 的 Markdown 内容构建时加密，确保在私有库和托管端的绝对安全性。

### 2. 生态集成强化
- [ ] **Obsidian 自动化管线**：目前支持手动同步，未来计划实现基于 GitHub Actions 的 Obsidian 笔记库自动触发构建，实现“写毕即发”。
- [ ] **图床集成 (Gallery)**：完善已预留的 `/gallery` 入口，集成 Lsky Pro 或类似自建图床 API，实现博文图片的统一管理。

### 3. X API 高级应用
- [ ] **多向交互同步**：利用已配置的 X API，实现推特评论自动抓取并同步回博文下方。
- [ ] **自动化分发**：进一步细化 `push-x` 脚本，支持自动上传博文配图至 X 媒体库。

---

沉淀知识，持续成长。 **Glog v1.4.0 Ready for Deployment.**
