# Google Plugin Store

## 📖 为什么做这个项目？

做这个项目的动机其实很现实：**现有的插件分发方式不够好用**。

### 现有方案有什么问题？

一句话：**三种主流方式都不够顺手**。

- **Chrome / Edge 商店** —— 个人插件难上架，国内经常访问不了，有些功能还不让发。
- **GitHub release 直接发** —— 用户要会 GitHub、浏览器还会拦截 `.crx` 安装，没列表没详情。
- **自己写网页发链接** —— `.crx` 打包麻烦，插件更新了要手动重传，没统一浏览体验。

### 这个项目怎么解决的？

| 痛点 | 解法 |
|---|---|
| GitHub release 下載繁琐 | 后台配置仓库，自动同步、自动打包成 `.crx` / `.xpi` |
| 插件更新靠人记 | 有“同步”按钮，点一下就是最新版 |
| 没统一的浏览体验 | 内置插件商店页面，有列表、搜索、详情页、安装引导 |
| 手动打包 `.crx` 麻烦 | 后台帮你打，你只管上传 / 配置 GitHub 地址 |
| 部署复杂 | 一个 Docker 镜像，`docker compose up -d` 起服务 |
| 隐私 / 数据控制 | 完全自托管，数据都在你自己服务器上，不依赖任何第三方 |

说白了就是：**你只负责选插件，剩下打包、分发、更新、详情页全部交给这个项目。**

---

## 👍 优点

- **零门槛使用** — 打开网页 → 点插件 → 装上，就像应用商店
- **跨浏览器** — 同时输出 Chrome (`crx`) 和 Firefox (`xpi`) 安装包
- **完全可控** — 数据在自己服务器，不用担心被下架、被封
- **可定制** — 前端代码全在你手里，改 UI 加字段随便
- **轻量** — 不需要数据库，插件元数据存 JSON 文件，备份就是复制一个文件
- **适合内网** — 公司 / 家庭内网部署，不开外网也能用
- **免费** — MIT 协议，随便改、随便用

---

## 👎 缺点（诚实说）

- **不是官方商店** — 不能像 Chrome 商店那样有评论 / 评分 / 下载量统计
- **插件更新有延迟** — 需要手动点同步或者跑定时任务，不会实时拉取
- **不能强制安装** — Chrome 默认还是会问“你确定要装吗”，需要用户手动确认（这是浏览器安全机制，绕不开）
- **适合中小规模** — 插件多到几千个、上万级需要重新考虑架构（现在用 JSON 文件存）
- **需要自己运维** — 服务器宕了没人帮你修
- **没有付费 / 授权机制** — 只是个展示 + 分发工具，不负责鉴权
- **不是插件开发框架** — 它只负责“分发”，插件本身的功能 / 代码质量还是要开发者自己保证

### 适合谁用？

✅ **适合：** 个人 / 小团队 / 公司内部分发插件 / 不想被 Chrome 商店审核束缚的开发者 / 教学场景
❌ **不适合：** 想做面向公众的插件商店（应该用正规 Chrome 商店）/ 需要严格审计的金融 / 政企场景

---

## 🤔 这是什么？

一个**你自己运营的浏览器插件商店** —— 把你喜欢的 Chrome / Firefox 插件集中收集到一个网页上，团队 / 家人 / 朋友只要打开这个网页，就能看到列表、点一下安装，不用再到处找下载链接。

### 它解决了什么问题？

你有没有遇到过这些场景：

- 💼 公司要求统一装几个安全 / 办公插件，每个新人入职都要发一遍下载链接
- 👨‍👩‍👧 爸妈电脑慢，想帮他们装广告拦截、密码管理器，但他们不会去 Chrome 应用商店搜
- 🔒 有些插件只在 GitHub 发布、没上 Chrome 商店，手动下载 `.crx` 又麻烦又会被浏览器拦截
- 🌍 团队多人多设备，每次换电脑都要重新装一遍

这个项目就是为这些场景做的：**你部署一次，所有人打开同一个网址就能装**。

### 它怎么工作？（简单版）

```
GitHub 上开源插件           你这台服务器                 访客的浏览器
┌─────────────┐    同步     ┌──────────────────┐    访问    ┌──────────┐
│ extension.zip │ ─────────▶ │ 转换 + 打包成     │ ────────▶ │ 插件列表 │
│ release page │             │ .crx / .xpi       │           │ 一键安装 │
└─────────────┘             └──────────────────┘            └──────────┘
                                      ▲
                                      │ 你也可以手动上传 .zip
```

一句话：**把分散在 GitHub 上的插件收拢到你的网站上，变成一个个人 / 团队的插件商店。**

---

## ✨ 它能做什么？

- 🔌 **一个页面浏览所有插件** — 像应用商店一样有列表、搜索、详情页
- 📦 **自动从 GitHub 同步** — 你告诉它哪些仓库，它自动抓最新版 release，打包成可安装文件
- ⬆️ **支持手动上传** — 没有 GitHub 仓库？直接拖一个 `.zip` 上去也行
- 🎨 **友好的界面** — 详情页有图标、说明、安装指南，还会显示开发者信息
- 🐳 **一键部署** — 只要装了 Docker，一行命令跑起来，不需要懂后端

---

## 🧱 技术栈（不感兴趣可跳过）

| 层 | 技术 | 干嘛的 |
|---|---|---|
| 前端 | React 18 · Vite · TailwindCSS | 你看到的网页界面 |
| 后端 | Express.js · Node.js 20 | 处理 API、同步、打包 |
| 数据 | JSON 文件 | 存插件列表（不需要数据库） |
| 打包 | Docker | 把所有环境装进一个“盒子”，在哪都能跑 |

---

## 🚀 快速开始

### 方式一：用 `docker-compose.yml` 直接部署（推荐）

1. **创建项目目录**

```bash
mkdir google-plugin-store && cd google-plugin-store
```

2. **下载 compose 文件**

```bash
curl -O https://raw.githubusercontent.com/youpingfang/google-plugin-store/main/docker-compose.yml
```

> 或者手动新建 `docker-compose.yml`，内容如下：

```yaml
services:
  google-plugin-store:
    image: youpingfang/google-plugin-store:latest
    ports:
      - "3005:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: always
```

3. **启动服务**

```bash
docker compose up -d
```

4. **访问**

打开浏览器：http://localhost:3005

5. **查看日志 / 停止 / 重启**

```bash
docker compose logs -f          # 实时日志
docker compose stop             # 停止
docker compose restart          # 重启
docker compose down             # 停止并删除容器（数据保留在 ./data）
```

### 方式二：手动 docker run

```bash
docker pull youpingfang/google-plugin-store:latest
docker run -d \
  --name google-plugin-store \
  -p 3005:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart always \
  youpingfang/google-plugin-store:latest
```

### 数据持久化

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
docker build -t youpingfang/google-plugin-store:latest .
docker push youpingfang/google-plugin-store:latest
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