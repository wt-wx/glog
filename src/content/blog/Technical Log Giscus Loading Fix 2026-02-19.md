---
title: '技术日志：Giscus 评论加载失效的底层修复'
description: '解决 Astro View Transitions 开启后，Giscus 评论区在页面跳转时无法重新加载的“幽灵”问题。'
pubDate: '2026-02-19'
tags: ['Giscus', 'Astro', 'View Transitions', '前端修复', '加载优化']
author: "尹霈泽"
---

### 一、 问题背景

在 `Glog v1.9.8` 的迭代中，为了提升用户体验，我们引入了 Astro 的视图过渡（View Transitions）。然而，随之而来的副产品是评论系统的间阵性失效：

1.  **首屏加载正常**：直接访问文章页，Giscus 渲染正常。
2.  **跳转后“失踪”**：从首页点击进入新文章，或者在文章之间切换时，评论区显示为空白。

### 二、 原因分析

这并非网络连接问题，而是 **Astro 的 SPA 模式（路由劫持）与传统脚本加载机制的冲突**。

Astro 的 View Transitions 在跳转时只替换 `<body>` 内容而不刷新整个页面。Giscus 的 `client.js` 在第一个页面已经执行过，当浏览器跳转到第二个页面时，脚本由于已经加载完成，不会再次触发其初始化逻辑，而此时页面 DOM 已经更新，旧的初始化结果无法挂载到新的 `div.giscus` 上。

### 三、 解决方案：data-astro-rerun

我们利用 Astro 提供的脚本生命周期属性进行修复。

**核心操作：**
在 `src/components/Giscus.astro` 的脚本标签中注入 `data-astro-rerun` 属性。

```astro
<script 
    src="https://giscus.app/client.js"
    ...
    data-astro-rerun>
</script>
```

**原理：**
标记为 `data-astro-rerun` 的脚本会在 Astro 每次完成 DOM 更新（`astro:page-load` 之后）强制重新执行。这确保了无论访客如何跳转，评论系统的初始化逻辑都能精准捕捉当前页面的容器。

### 四、 沉淀与思考

这再次提醒我们，当架构从传统的 MPA（多页应用）转向混合型 SPA 时，**第三方脚本的生命周期管理** 是非常容易被忽略的隐形炸弹。

目前 `v1.9.8` 已正式应用此补丁。
