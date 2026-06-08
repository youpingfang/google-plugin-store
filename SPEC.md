# Plugin Store 规范

## 1. 概述

自托管浏览器插件商店，收集 GitHub 开源插件，支持手动上传和 GitHub 自动拉取，转换为 .crx/.xpi 后供用户安装。

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite + TailwindCSS |
| 后端 | Express.js + Node.js |
| 数据 | JSON 文件 (`plugins.json`) |
| 容器 | Docker + docker-compose |

## 3. 设计规范

### 配色
- Primary: `#1a73e8`
- Primary Hover: `#1557b0`
- Background: `#ffffff`
- Surface: `#f8f9fa`
- Border: `#dadce0`
- Text Primary: `#202124`
- Text Secondary: `#5f6368`
- Success: `#34a853`
- Danger: `#ea4335`
- Star: `#fbbc04`

### 字体
- 主字体: Inter, Noto Sans SC, -apple-system, sans-serif
- 等宽: JetBrains Mono, Fira Code, monospace

### 间距
- 基准: 4px
- 递进: 8, 12, 16, 24, 32, 48, 64px

### 圆角
- 卡片: 8px
- 按钮/输入框: 4px
- 图标/头像: 50%

## 4. 页面结构

### 4.1 首页 (`/`)
- 顶栏: Logo + 搜索框 + 开发者后台入口 + 提交插件按钮
- 分类 Tab: 全部 / 工具类 / 娱乐类 / 开发者工具 / 主题
- 区块: 推荐 / 近期更新 / 评分最高（各 4 列网格）
- 卡片: 图标 + 名称 + 评分 + 安装数

### 4.2 详情页 (`/plugin/:id`)
- 返回导航
- 插件信息: 图标 + 名称 + 作者 + 分类 + 版本 + 评分 + 安装数
- 截图轮播
- 安装按钮
- 详细信息（版本/大小/语言/更新时间）
- 权限说明
- 版本历史
- 相似插件

### 4.3 开发者后台 (`/developer`)
- 侧边栏: 概览 / 我的插件 / 添加插件 / GitHub 同步
- 主内容区: 仪表盘统计 + 插件列表 + GitHub 导入表单

### 4.4 添加插件弹窗
- 字段: 名称 / 作者 / 分类 / 描述 / 图标 / 截图 / ZIP包
- GitHub 方式: 输入仓库 URL → 检测 → 导入

## 5. API 设计

### 插件管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plugins` | 列表（支持分页/搜索/分类） |
| GET | `/api/plugins/:id` | 详情 |
| POST | `/api/plugins` | 添加插件 |
| PUT | `/api/plugins/:id` | 编辑插件 |
| DELETE | `/api/plugins/:id` | 删除 |
| POST | `/api/plugins/:id/install` | 记录安装 |

### GitHub
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/github/detect` | 检测仓库 manifest |
| POST | `/api/github/import` | 导入插件 |

### 文件上传
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/icon` | 上传图标 |
| POST | `/api/upload/screenshot` | 上传截图 |
| POST | `/api/upload/package` | 上传 ZIP 包 |

## 6. 数据模型

```json
{
  "id": "plugin-unique-id",
  "name": "插件名称",
  "author": "作者名",
  "authorUrl": "https://github.com/author",
  "version": "1.2.3",
  "category": "tools",
  "shortDescription": "简短描述，80字内",
  "description": "完整描述",
  "icon": "/packages/plugin-id/icon.png",
  "screenshots": ["/packages/plugin-id/screenshots/1.png"],
  "crxUrl": "/packages/plugin-id/extension.crx",
  "xpiUrl": "/packages/plugin-id/extension.xpi",
  "zipUrl": "/packages/plugin-id/extension.zip",
  "zipPath": "/data/packages/plugin-id/extension.zip",
  "size": 2457600,
  "rating": 4.2,
  "ratingCount": 1234,
  "installCount": 12345,
  "languages": ["zh-CN", "en"],
  "manifest": {
    "permissions": ["storage", "tabs"],
    "host_permissions": ["https://*.example.com/*"]
  },
  "githubRepo": "https://github.com/author/repo",
  "tags": ["工具", "效率"],
  "status": "published",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z",
  "versions": [
    { "version": "1.2.3", "date": "2024-01-15", "note": "修复 bug" }
  ]
}
```

## 7. 安装流程

用户点击"安装到 Chrome" → 下载 .crx → Chrome 弹确认框 → 用户确认 → 安装完成

## 8. GitHub 同步流程

输入仓库 URL → 检测 manifest.json → 预览插件信息 → 确认导入 → 下载转换 → 上架

## 9. 目录结构

```
/plugin-store
├── SPEC.md
├── Dockerfile
├── docker-compose.yml
├── /backend
│   ├── package.json
│   ├── server.js
│   ├── /routes
│   │   ├── plugins.js
│   │   ├── github.js
│   │   └── upload.js
│   ├── /services
│   │   ├── converter.js
│   │   ├── github.js
│   │   └── storage.js
│   └── /data
│       └── plugins.json
├── /web (React/Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── /src
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── /pages
│   │   │   ├── Home.jsx
│   │   │   ├── PluginDetail.jsx
│   │   │   └── Developer.jsx
│   │   ├── /components
│   │   │   ├── Header.jsx
│   │   │   ├── PluginCard.jsx
│   │   │   ├── CategoryTabs.jsx
│   │   │   ├── PluginGrid.jsx
│   │   │   ├── ScreenshotCarousel.jsx
│   │   │   ├── InstallButton.jsx
│   │   │   └── AddPluginModal.jsx
│   │   └── /api
│   │       └── index.js
│   └── /public
└── /data
    └── /packages
```
