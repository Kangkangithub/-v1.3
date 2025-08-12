# 神机图鉴 - 军事武器知识图谱系统

<div align="center">

![神机图鉴](favicon.svg)

**一个基于知识图谱的现代化军事武器信息管理与可视化系统**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [系统架构](#-系统架构) • [API文档](#-api文档) • [部署指南](#-部署指南)

</div>

---

## 📖 项目简介

神机图鉴是一个现代化的军事武器知识图谱系统，集成了武器信息管理、知识图谱可视化、多媒体展示等功能。系统采用前后端分离架构，提供直观的可视化界面和强大的数据管理能力，是军事爱好者、研究人员和教育工作者的理想工具。

### 🎯 核心价值

- **知识图谱可视化**：直观展示武器间的关系网络
- **多媒体支持**：图片、视频全方位展示武器信息
- **智能搜索**：快速定位目标武器和相关信息
- **数据完整性**：完善的武器分类和制造商信息
- **用户友好**：现代化UI设计，操作简单直观

---

## ✨ 功能特性

### 🗺️ 知识图谱可视化
- **交互式图谱**：基于D3.js的动态知识图谱展示
- **多维关系**：武器-制造商-国家-类型多层关系网络
- **实时筛选**：按制造商、武器类型、国家等维度筛选
- **节点详情**：点击节点查看详细武器信息
- **图谱分析**：统计分析和数据洞察功能

### 🔍 智能搜索系统
- **全文搜索**：支持武器名称、描述、规格搜索
- **高级筛选**：多条件组合筛选
- **搜索建议**：智能搜索提示和自动补全
- **结果排序**：按相关度、时间等多种方式排序

### 🖼️ 多媒体管理
- **图片管理**：武器图片上传、展示、管理
- **视频系统**：武器视频上传、播放、管理
- **缩略图生成**：自动生成图片缩略图
- **媒体预览**：支持图片灯箱和视频播放器

### 📊 数据管理
- **武器信息**：完整的武器规格、性能参数
- **制造商管理**：制造商信息和统计数据
- **分类体系**：武器类型、国家分类管理
- **批量操作**：支持数据批量导入导出

### 👤 用户系统
- **用户认证**：登录注册、权限管理
- **角色控制**：管理员和普通用户权限分离
- **操作日志**：完整的用户操作记录

### 📱 响应式设计
- **移动适配**：完美支持手机、平板设备
- **现代UI**：Material Design风格界面
- **主题切换**：支持明暗主题切换
- **国际化**：多语言支持框架

---

## 🚀 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- npm 6.0 或更高版本
- SQLite3 数据库

### 启动方式
```bash
# 进入后端目录
cd backend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

服务器将在 `http://localhost:3001` 启动，前端页面可通过浏览器访问。

## 👤 管理员账户

**用户名**: `JunkangShen`  
**密码**: `kk20050318`

管理员账户具有以下权限：
- 武器数据的增删改查
- 知识图谱数据管理
- 批量导入导出武器数据
- 制造商、武器类型、国家信息管理
- 武器图片及视频的上传与删除

6. **访问系统**
```
前端页面: http://localhost:5501
后端API: http://localhost:3001
健康检查: http://localhost:3001/health
```

### 快速验证

```bash
# 检查系统状态
curl http://localhost:3001/health

# 测试API
curl http://localhost:3001/api/weapons

# 运行部署检查
node backend/scripts/check-deployment.js
```

---

## 🏗️ 系统架构

### 技术栈

#### 前端技术
- **HTML5/CSS3**: 现代化网页标准
- **JavaScript ES6+**: 原生JavaScript开发
- **D3.js**: 数据可视化和图谱渲染
- **Chart.js**: 统计图表展示
- **Lightbox**: 图片灯箱效果
- **Responsive Design**: 响应式布局

#### 后端技术
- **Node.js**: 服务器运行环境
- **Express.js**: Web应用框架
- **SQLite**: 轻量级数据库
- **Multer**: 文件上传处理
- **Better-SQLite3**: 高性能SQLite驱动
- **CORS**: 跨域资源共享
- **Helmet**: 安全中间件

#### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Nodemon**: 开发热重载
- **PM2**: 生产环境进程管理

### 项目结构

```
神机图鉴/
├── 📁 backend/                    # 后端服务
│   ├── 📁 src/                    # 源代码（app-simple.js # 主应用入口）
│   │   ├── 📁 routes/             # API路由
│   │   ├── 📁 services/           # 业务逻辑
│   │   ├── 📁 middleware/         # 中间件
│   │   ├── 📁 config/             # 配置文件
│   │   └── 📁 utils/              # 工具函数
│   ├── 📁 data/                   # 数据文件
│   │   └── 📄 military-knowledge.db # SQLite数据库
│   ├── 📁 uploads/                # 上传文件
│   │   └── 📁 weapons/            # 武器媒体文件
│   ├── 📁 scripts/                # 脚本工具（含数据库相关工具）
│   └── 📁 logs/                   # 日志文件
├── 📁 scripts/                    # 前端脚本
│   ├── 📄 knowledge-graph.js      # 知识图谱核心
│   ├── 📄 weapon-data-management.js # 数据管理
│   ├── 📄 weapon-image-integration.js # 图片集成
│   └── 📄 weapon-video-integration.js # 视频集成
├── 📁 styles/                     # 样式文件
│   ├── 📄 knowledge-graph.css     # 图谱样式
│   ├── 📄 common.css              # 通用样式
│   └── 📄 responsive.css          # 响应式样式
├── 📁 test_pages/                 # 测试页面
├── 📁 function_description/       # 功能说明文档
├── 📄 knowledge-graph.html        # 知识图谱页面
├── 📄 login.html                  # 登录页面
├── 📄 README.md                   # 项目文档
├── 📄 index.html                  # 主页面
├── 📄 qa.html                     # 智能问答页面
├── 📄 recommendation.html         # 智能推荐页面
├── 📄 weapon-recognition.html     # 武器识别页面
├── 📄 register.html               # 注册页面
└── 📄 profile.html                # 个人中心页面
```

### 数据库设计

#### 核心数据表

```sql
-- 武器信息表
CREATE TABLE weapons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    type_id INTEGER,
    country_id INTEGER,
    manufacturer_id INTEGER,
    description TEXT,
    specifications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 制造商表
CREATE TABLE manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100),
    founded_year INTEGER,
    description TEXT
);

-- 武器图片表
CREATE TABLE weapon_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weapon_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 武器视频表
CREATE TABLE weapon_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weapon_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Header `x-admin-user: admin`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 武器管理 API

#### 获取武器列表
```http
GET /api/weapons
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "F-22猛禽战斗机",
      "type": "战斗机",
      "country": "美国",
      "manufacturer": "洛克希德·马丁",
      "description": "第五代隐身战斗机"
    }
  ],
  "total": 150
}
```

#### 创建武器
```http
POST /api/weapons
Content-Type: application/json

{
  "name": "武器名称",
  "type_id": 1,
  "country_id": 1,
  "manufacturer_id": 1,
  "description": "武器描述",
  "specifications": "技术规格"
}
```

#### 更新武器
```http
PUT /api/weapons/:id
Content-Type: application/json

{
  "name": "更新后的武器名称",
  "description": "更新后的描述"
}
```

#### 删除武器
```http
DELETE /api/weapons/:id
```

### 知识图谱 API

#### 获取图谱数据
```http
GET /api/knowledge/graph-data
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "weapon_1",
        "name": "F-22猛禽",
        "type": "weapon",
        "category": "战斗机"
      }
    ],
    "links": [
      {
        "source": "weapon_1",
        "target": "manufacturer_1",
        "type": "manufactured_by"
      }
    ]
  }
}
```

### 多媒体 API

#### 上传武器图片
```http
POST /api/weapon-images/weapon/:weaponId/upload
Content-Type: multipart/form-data

file: [图片文件]
description: "图片描述"
```

#### 上传武器视频
```http
POST /api/weapon-videos/weapon/:weaponId/upload
Content-Type: multipart/form-data

video: [视频文件]
description: "视频描述"
```

### 统计分析 API

#### 制造商统计
```http
GET /api/manufacturer-statistics
```

#### 武器类型统计
```http
GET /api/weapons/statistics
```

---

## 🎨 界面展示

### 知识图谱主界面
- 交互式节点图谱
- 实时筛选控制面板
- 节点详情侧边栏
- 统计信息仪表板

### 武器详情页面
- 武器基本信息展示
- 图片轮播和视频播放
- 技术规格表格
- 相关武器推荐

### 管理后台
- 数据管理界面
- 批量操作工具
- 用户权限管理
- 系统监控面板

---

## 📦 部署指南

### 开发环境部署

1. **本地开发**
```bash
# 启动开发服务器
npm run dev

# 启动文件监听
npm run watch
```

2. **调试模式**
```bash
# 启动调试模式
npm run debug

# 查看日志
tail -f backend/logs/app.log
```

### 生产环境部署

1. **使用PM2部署**
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

2. **Docker部署**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "start-simple-server.js"]
```

3. **Nginx反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /uploads/ {
        alias /path/to/uploads/;
        expires 1y;
    }
}
```

### 跨平台部署

系统支持Windows、Linux、macOS跨平台部署：

```bash
# 运行部署检查
node backend/scripts/check-deployment.js

# 自动修复常见问题
node backend/scripts/check-deployment.js fix

# 迁移数据路径（如需要）
node backend/scripts/migrate-video-paths.js
```

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 🗺️ 路线图

### v1.4 (计划中)
- [ ] 移动端App开发
- [ ] 实时协作功能
- [ ] 高级数据分析
- [ ] 机器学习推荐

### v1.5 (未来)
- [ ] 3D武器模型展示
- [ ] VR/AR支持
- [ ] 多语言国际化
- [ ] 云端部署方案

### 长期规划
- [ ] 人工智能辅助分析
- [ ] 区块链数据验证
- [ ] 物联网设备集成
- [ ] 大数据可视化

---

## 📊 项目统计

- **代码行数**: 50,000+
- **功能模块**: 15+
- **API接口**: 30+
- **数据表**: 12+
- **测试用例**: 100+
- **文档页面**: 20+

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！⭐**

[⬆ 回到顶部](#神机图鉴---军事武器知识图谱系统)

</div>