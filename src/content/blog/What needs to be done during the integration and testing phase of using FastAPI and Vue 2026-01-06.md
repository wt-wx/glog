---
title: '使用 FastAPI and Vue 进行物联网项目开发'
description: '物联网项目开发中的联调阶段'
pubDate: '2026-01-06'
series: '物联网项目开发' 
tags: ['物联网项目开发', 'FastAPI', 'Vue']
heroImage: '../../assets/blog-placeholder-about.jpg'
---


你已经完成了后端 API（FastAPI + PostgreSQL）和前端（Vue + Element Plus）的开发，现在进入了**联调阶段**，也就是将后端服务与前端页面连接起来、共同运行、并调试数据交互的过程。

这是物联网项目开发中非常关键的一步，以下是**系统性操作流程和建议**，帮助你顺利完成联调。

---

## 🔧 一、准备工作

### 1. 确保后端 API 正常运行

* 启动 FastAPI 服务（通常使用 `uvicorn`）：

  ```bash
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```
* 检查数据库连接是否正常（PostgreSQL）。
* 访问 [http://localhost:8000/docs](http://localhost:8000/docs) 确认接口是否都正常工作（Swagger 自动文档）。

### 2. 启动前端开发环境

* 通常使用 `vite` 或 `webpack` 启动 Vue 项目：

  ```bash
  npm run dev
  ```
* 确保配置了后端接口地址（见下方跨域配置）。

---

## 🔁 二、配置跨域（CORS）

FastAPI 默认启用了严格的跨域策略。你需要在后端允许前端访问。

在 FastAPI 的 main.py 中添加：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vue 本地开发地址，或用 ["*"] 测试用
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 三、API 接口联调流程

### 1. 确定 API 文档

* 利用 FastAPI 自动生成的 `/docs` 文档，确定每个接口的：

  * 请求方式（GET、POST 等）
  * URL 路径
  * 请求参数（body、query、path、header）
  * 响应数据结构

### 2. 前端 axios 封装

在 Vue 项目中使用 `axios` 与后端交互：

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000
})

// 示例：获取设备列表
export function getDeviceList() {
  return api.get('/devices')
}
```

### 3. 前端组件调用 API

在 Vue 组件中调用：

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { getDeviceList } from '@/api/device'

const deviceList = ref([])

onMounted(async () => {
  const response = await getDeviceList()
  deviceList.value = response.data
})
</script>
```

### 4. 接口调试和错误处理

* 打开浏览器的开发者工具（F12）→ Network 观察请求是否成功
* 查看请求路径、参数是否正确
* 后端 log 打印请求信息，定位参数解析或数据库问题

---

## ✅ 四、联调建议和工具

### 建议做法

| 步骤 | 操作                                 |
| -- | ---------------------------------- |
| 1. | 优先联调最核心的业务接口（如设备注册、数据上传、状态查询）      |
| 2. | 前后端接口文档可以共用 FastAPI 的 Swagger 作为参考 |
| 3. | 确保前端和后端对于字段名、数据类型、响应结构理解一致         |
| 4. | 使用 Postman 或 curl 模拟请求，先确认后端接口再给前端 |
| 5. | 前端可用 mock 数据先搭好 UI，逐步替换为真实 API 调用  |

### 推荐工具

* **Postman / Insomnia**：调试 API 非常方便
* **FastAPI Swagger 文档**：快速查看所有接口
* **Vue DevTools + Chrome DevTools**：调试前端状态和接口请求
* **pgAdmin / DBeaver**：查看和调试 PostgreSQL 数据

---

## 📌 五、部署前联调注意事项

| 检查点         | 说明                               |
| ----------- | -------------------------------- |
| 接口是否统一返回格式？ | 比如统一返回 `{ code, message, data }` |
| 错误码是否标准化？   | 例如 401 未登录、403 权限不足、500 服务错误     |
| 身份验证方案？     | 使用 JWT、Session 等，需要联调登录状态        |
| 数据分页是否正常？   | 确保分页接口支持参数如 `page`, `limit`      |
| 时间格式处理？     | 后端时间字段格式是否统一为 ISO 格式或指定格式？       |

---

## 🧠 如果你遇到具体问题，例如：

* 前端调用接口报错
* 某个参数传不进去
* 数据显示异常
* 登录态问题（JWT token）

你可以告诉我具体接口、请求内容、报错信息，我可以帮你精准定位。

---

要我帮你做一个完整的 **联调 checklist 模板** 或 **接口封装模板** 也可以，随时告诉我。
