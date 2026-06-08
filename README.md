# 家庭私人点菜系统

纯前端家庭点菜应用，基于 Vue3 + Vite + sql.js + Pinia + Element Plus 开发，数据本地 SQLite 持久化，无需后端服务器。

## 功能特性

- 多用户注册登录，三种角色权限（管理员 / 普通用户 / 只读用户）
- 早/中/晚三餐分类点餐
- 全员可见的透明点餐记录
- 菜品详情查看（食材、做法、图片）
- 管理员菜品管理（增删改、上下架）
- 历史点餐记录查询

## 快速开始

```bash
# 安装依赖
npm install

# 初始化 SQLite 数据库文件（首次必须执行）
npm run init-db

# 校验数据库
npm run verify-db

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 数据库说明

| 项目 | 说明 |
|------|------|
| 初始文件 | `public/private_chef.db` |
| 运行时持久化 | IndexedDB（浏览器内自动保存变更） |
| 核心表 | `users` / `foods` / `orders` |
| 会话表 | `session`（登录状态） |

**数据加载顺序：**
1. IndexedDB 中已有的运行时数据库
2. 若无，加载 `public/private_chef.db` 初始文件
3. 首次使用自动建表并写入默认管理员

**重建数据库（会清空所有数据）：**
```bash
npm run init-db -- --force
```

## 默认账号

- 管理员：`admin` / `admin123`

初始数据库包含 9 道示例菜品（早/中/晚各 3 道）。

## 技术栈

- Vue 3 + Vite
- Pinia 状态管理
- Element Plus UI
- sql.js（前端 SQLite）

## 路由

| 路径 | 说明 |
|------|------|
| `/login` | 登录页 |
| `/register` | 注册页 |
| `/` | 点餐主页 |
| `/records` | 历史点餐记录 |
| `/admin/foods` | 菜品管理（仅管理员） |
| `/profile` | 个人中心 |
