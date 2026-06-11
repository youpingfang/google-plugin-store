# Google Plugin Store

一个自托管的浏览器插件商店 —— 抓取 GitHub 上的开源扩展，转换为 `.crx` / `.xpi`，集中展示并提供一键安装。

> 镜像：`youpingfang/google-plugin-store` ｜ 版本：`1.5.19`

---

## ✨ 特性

- 🔌 **统一目录** — 一个页面浏览 / 搜索多个浏览器扩展
- 📦 **GitHub 同步** — 配置一次，自动从 GitHub release 拉取 zip 并转换为安装包
- ⬆️ **手动上传** — 支持本地 `.zip` 上传，自动生成图标和详情
- 🎨 **现代 UI** — React 18 + Vite + TailwindCSS，详情页 / 安装引导 / 开发者面板
- 🐳 **一键部署** — 单容器镜像，`docker compose up -d` 即开即用

---

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite · TailwindCSS |
| 后端 | Express.js · Node.js 20 |
| 数据 | JSON 文件 (`plugins.json`) |
| 容器化 | Docker (multi-stage build) |

---

## 🚀 快速开始

### 1. 拉取镜像

```bash
docker pull youpingfang/google-plugin-store:1.5.19
```

### 2. 启动

```bash
docker compose up -d
```

服务监听 `http://localhost:3005`。

### 3. 数据持久化

compose 中数据卷映射：

```yaml
volumes:
  - ./data:/app/data
```

`./data` 目录下保存：

```
data/
├── plugins.json            # 插件元数据
└── packages/
    └── <plugin-slug>/
        ├── extension.zip    # 原始 zip
        ├── extension.crx    # Chrome 安装包
        ├── extension.xpi    # Firefox 安装包
        └── icon.svg         # 插件图标
```

> **生产建议：** 在生产服务器上建议改为绝对路径，例如 `/root/dockerdata/google-plugin-store/data:/app/data`，避免依赖 compose 文件所在目录。

---

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `NODE_ENV` | `production` | Node 运行环境 |
| `PORT` | `3000` | 容器内监听端口（通过 `3005:3000` 映射到宿主机） |

> GitHub 同步速率限制较高时，可在 `docker-compose.yml` 的 `environment` 段加回 `GITHUB_TOKEN`，或写入宿主机环境变量。

---

## 🛠️ 开发

```bash
# 后端（端口 3005）
cd backend && npm install && npm start

# 前端（端口 5173，dev server）
cd web && npm install && npm run dev
```

前端通过 Vite dev server 启动，会代理 `/api` 到后端。

### 构建镜像

```bash
docker build -t youpingfang/google-plugin-store:1.5.19 .
docker push youpingfang/google-plugin-store:1.5.19
docker push youpingfang/google-plugin-store:latest
```

---

## 📁 项目结构

```
google-plugin-store/
├── backend/                # Express 后端
│   ├── routes/             # API 路由
│   ├── services/           # 业务逻辑（github sync / auth / ...）
│   └── server.js
├── web/                    # React + Vite 前端
│   └── src/
│       ├── components/
│       └── pages/
├── data/                   # 运行时数据（卷挂载）
├── public/                 # 前端构建产物（运行时由后端提供）
├── docker-compose.yml
├── Dockerfile
├── SPEC.md                 # 设计规范
└── CHANGELOG.md
```

---

## 📜 许可

MIT