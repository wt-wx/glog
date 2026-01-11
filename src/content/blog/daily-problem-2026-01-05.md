---
title: '如何使用 Astro 搭建个人博客'
description: '记录今天在搭建博客过程中遇到的环境初始化问题及解决方案。'
pubDate: '2026-01-05'
heroImage: '../../assets/blog-placeholder-about.jpg'
---

今天开始搭建我的个人博客 `Glog`，主要用于记录每天遇到的技术问题。

### 遇到的问题
在 Windows 环境下使用 `npm create astro@latest` 初始化项目时，遇到网络波动导致依赖安装超时。

### 解决方案
1. 使用 `npx -y create-astro@latest . --template blog --install --no-git --yes` 进行初始化。
2. 如果自动安装失败，可以手动执行 `npm install --no-audit --no-fund --loglevel info` 来查看更详细的安装进度。
3. 建议配置 `registry` 镜像以加快下载速度。

### 下一步计划
- 集成 Tailwind CSS 进行 UI 优化。
- 配置黑夜模式，适应程序员的夜晚写作习惯。
- 探索如何与 Obsidian 同步。

---

> 沉淀知识，持续成长。
