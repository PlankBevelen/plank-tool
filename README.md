# Plank Tool

一个专为开发者打造的极客工具箱。告别繁杂的在线工具网站和满屏的广告，Plank Tool 将你日常开发中最常碰到的痛点（图片处理、JSON 转换、编码解码、时间调试）全部集中在一个干净、现代化的工作台中

前端基于 React 19 + Vite 8 + Tailwind CSS v4，后端基于 Express + MongoDB 构建

## 核心功能 (Features)

- 图片加工站 (Image Tools)
  - 智能压缩与转换：支持 JPG/PNG/WebP，批量处理、自由调节压缩质量与最大宽高限制，并支持格式强转（如统一转为更小巧的 WebP）
  - 图片格式转换：提供图片格式转换方法，比如png转webp、avif等
  - **隐私与元数据：** 图片 Exif 信息一键查看与清除
  - 二维码生成：链接生成二维码
- JSON 工具
  - JSON 格式化与校验
  - JSON 转 XML、JSON 转 JS Object
  - **类型推导（Type Generator）：** 一键将 JSON 结构转换为 **TypeScript Interface** 或 **Go Struct**，无缝对接前后端接口联调
- JWT
  - 深度解析
- 文本
  - 文本 Diff 对比： 双屏对比两段代码、长文本或环境变量文件的差异，精准定位修改点。
- 编码
  - 开发者编码/解码器： 纯本地运行的 Base64（支持图片互转）、URL Encode/Decode、Unicode 转换
  - 哈希与正则台： 提供 MD5、SHA-1/256 计算、批量 UUID(v4) 生成，以及自带常用速查表的正则表达式实时测试台
- 用户与偏好
  - 登录/注册、收藏工具（基于 JWT 与 Zustand 存储）

## 技术栈

- 前端：React 19、TypeScript、Vite 8、Tailwind CSS v4、Zustand、Monaco Editor、React Router
- 后端：Node.js、Express、Mongoose（MongoDB）、JWT、Sharp（图片处理）、Archiver（ZIP）

## 快速开始

### 环境要求

- Node.js ≥ 18（推荐 LTS）
- 本地或可访问的 MongoDB 实例

### 安装依赖

- 根目录（前端）

```bash
cd plank-tool
npm install
```

- 后端

```bash
cd server
npm install
```

### 配置环境变量（后端）

在 `server/.env` 创建环境变量文件（请勿在仓库中提交敏感信息）：

```
PORT=8686
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/plank_tool_db
JWT_SECRET=你的JWT密钥
JWT_EXPIRES_IN=7d
```

说明：前端开发时通过 Vite 代理将 `/api` 请求转发到后端；后端默认监听 8686 端口。你也可以在前端根目录创建 `.env` 设置 `VITE_API_TARGET` 来覆盖代理目标。

```bash
# 可选：在前端根目录 .env
VITE_API_TARGET=http://localhost:8686
```

### 启动项目（开发）

- 启动后端（默认端口 8686）：

```bash
cd server
npm run dev
```

- 启动前端（默认端口由 Vite 分配）：

```bash
cd ../
npm run dev
```

访问地址：`http://localhost:5173`（以控制台实际输出为准），前端会将 `/api/*` 请求代理到后端。

## 常用脚本

- 前端根目录
  - 开发：`npm run dev`
  - 构建：`npm run build`（产物位于 `dist/`）
  - 预览：`npm run preview`
  - Lint：`npm run lint`
- 后端 `server/`
  - 开发：`npm run dev`（基于 nodemon）
  - 启动：`npm start`
  - 测试：`npm test`
  - Lint：`npm run lint`

## API 概览（后端）

基准路径：`/api`

- 图片压缩
  - POST `/api/images/compress`
  - 表单字段：`image`（文件），可选 `quality`（10–100），`maxWidth`（100–8192），`maxHeight`（100–8192）
  - 返回：压缩后的基本信息与可公开访问的 `url`
  - 参考：[image.routes.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/routes/image.routes.js#L29-L39)、[image.controller.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/controllers/image.controller.js#L8-L38)

示例（cURL）：

```bash
curl -X POST http://localhost:8686/api/images/compress \
  -F "image=@/path/to/your.jpg" \
  -F "quality=80" \
  -F "maxWidth=1920"
```

- 批量打包下载 ZIP
  - POST `/api/images/zip`
  - 请求体：`{ "files": [{ "filename": "compressed-xxx.jpg", "originalName": "原图名.jpg" }, ...] }`
  - 返回：ZIP 文件的 `url`、`filename`、`size`
  - 参考：[image.routes.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/routes/image.routes.js#L41-L50)、[image.service.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/services/image.service.js#L86-L122)
- 鉴权与用户
  - POST `/api/auth/register`，POST `/api/auth/login`
  - GET `/api/users/profile`（需 `Authorization: Bearer <token>`）
  - 参考：[auth.routes.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/routes/auth.routes.js)、[user.routes.js](file:///c:/Users/PlankBevelen/Desktop/plankbevelen/plank-tool/server/src/routes/user.routes.js)

## 前端用法提示

- 图片压缩：进入“图片工具”页，选择或拖拽图片，调整“压缩质量/最大宽度”后点击“开始压缩”；支持逐个下载或“下载全部（ZIP）”。
- JSON 工具：
  - “JSON 格式化”支持实时校验与格式化、复制结果
  - “JSON 转换”支持转 XML 或 JS Object，并可复制/下载结果

## 构建与部署

- 前端：
  - 执行 `npm run build` 产出 `dist/`，可部署到任意静态资源服务器（如 Nginx）
  - 开发代理通过 `vite.config.ts` 中的 `/api` 配置到后端
- 后端：
  - 确保提供正确的 `MONGO_URI`、`JWT_SECRET` 等环境变量
  - 生产环境建议通过反向代理（Nginx）统一转发前端与 `/api` 到对应服务

## 注意事项

- 请勿在版本库中提交真实的密钥与连接串。将示例变量放入 `.env` 并在部署环境中注入真实值。
- 图片上传与打包接口会在 `server/uploads/` 下生成文件，请根据生产环境规划清理策略与存储位置（如对象存储）。
- `server/package.json` 中可能包含用于初始化数据库的脚本占位；如需数据初始化，请根据实际需要补充实现后再使用。

## 许可

当前仓库未指定许可证。如需开源或商用，请添加并遵循相应的 LICENSE。
