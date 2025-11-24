# 在线文本编辑器

## 项目简介

这是一个功能齐全的在线文本编辑器应用，提供直观的文件管理和编辑功能。应用采用前后端分离架构，前端基于React和TypeScript开发，后端使用Node.js和Express提供文件管理API，支持本地开发和Vercel部署。

### 公网链接

本项目部署在Vercel平台：**[https://www.newbox.asia/](https://text-editor-app.vercel.app)**

## 本地环境启动指南

### 1. 安装后端依赖

```bash
cd local-server
pnpm install
```

### 2. 生成并信任本地SSL证书

由于浏览器安全策略要求，本地开发环境需要配置有效的SSL证书以避免混合内容警告。我们推荐使用mkcert工具生成自签名证书。

#### 步骤：

1. **安装mkcert**
   - macOS：
     ```bash
     brew install mkcert
     ```
   - Windows：下载 [https://github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases) 并运行
   - Linux：
     ```bash
     sudo apt install mkcert  # Debian/Ubuntu
     ```

2. **安装本地CA根证书**
   ```bash
   mkcert -install
   ```
   这一步会在系统信任存储中安装mkcert的根证书，可能需要管理员权限。

3. **生成SSL证书**
   在local-server/cert目录中执行：
   ```bash
   cd cert
   mkcert localhost 127.0.0.1 ::1
   ```

4. **重命名证书文件**
   ```bash
   mv localhost+2.pem localhost.pem
   mv localhost+2-key.pem localhost-key.pem
   ```

5. **信任CA证书（关键步骤）**
   - **macOS**：
     1. 打开"钥匙串访问"应用
     2. 找到"mkcert root"证书
     3. 双击它，选择"始终信任"在"信任"下拉菜单中
     4. 重启浏览器
   
   - **Windows**：
     1. 双击生成的localhost.pem文件
     2. 点击"安装证书"
     3. 选择"本地计算机"
     4. 选择"将所有证书放入以下存储" → "受信任的根证书颁发机构"
     5. 点击"完成"
     6. 重启浏览器
   
   - **Linux**：
     ```bash
     sudo cp localhost.pem /usr/local/share/ca-certificates/
     sudo update-ca-certificates
     ```

### 3. 启动本地服务器

```bash
# 在local-server目录下执行
pnpm run start:server
```

服务器将在 https://localhost:9527 启动。

### 4. 启动前端应用

```bash
cd ../client
pnpm install
pnpm run dev
```

前端应用将在 http://localhost:5173 启动。

## 技术方案说明

### 为什么选择HTTPS？

1. **安全性**：HTTPS通过加密保护数据传输，防止中间人攻击和数据窃听
2. **混合内容问题**：现代浏览器会阻止从HTTPS页面加载HTTP资源，使用HTTPS可以避免这个问题
3. **API访问限制**：许多浏览器扩展和API要求使用HTTPS，特别是涉及到敏感操作时
4. **与Vercel部署环境一致**：Vercel自动为部署的应用提供HTTPS，保持开发和生产环境一致

### 核心问题解决方案

#### 1. Mixed Content 问题

**问题**：当一个HTTPS页面尝试加载HTTP资源时，浏览器会阻止这些请求以保护用户安全。

**解决方案**：
- 本地服务器配置为使用HTTPS
- 前端API请求配置为连接到HTTPS端点
- 确保所有资源加载路径都使用相对路径或HTTPS URL

#### 2. CORS (跨域资源共享) 问题

**问题**：浏览器的同源策略会阻止从一个域名请求另一个域名的资源。

**解决方案**：
- 在Express服务器中配置CORS中间件：
  ```javascript
  app.use(cors({
    origin: ['https://text-editor-app.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
  ```
- 这允许来自Vercel部署域名和本地开发域名的跨域请求

#### 3. SSL 证书信任问题

**问题**：自签名SSL证书默认不会被浏览器信任，导致安全警告。

**解决方案**：
- 使用mkcert工具生成在本地受信任的SSL证书
- 通过安装mkcert的CA根证书到系统信任存储中
- 确保生成的证书包含localhost和127.0.0.1等常用本地主机名
- 提供详细的证书安装和信任指南

## 项目结构

```
text-editor/
├── client/             # React前端应用
│   ├── src/            # 源代码
│   ├── public/         # 静态资源
│   └── ...
├── local-server/       # Node.js后端服务
│   ├── cert/           # SSL证书目录
│   ├── managed_files/  # 管理的文件目录
│   └── server.js       # 服务器主文件
└── README.md           # 项目说明文档
```

## API端点

- `GET /health` - 健康检查
- `GET /files` - 获取所有文件列表
- `GET /files/:filename` - 获取指定文件内容
- `POST /files` - 创建新文件
- `PUT /files/:filename` - 更新文件内容
- `DELETE /files/:filename` - 删除文件

## 注意事项

- 请勿将SSL证书文件提交到版本控制系统
- 确保在开发前正确配置和信任SSL证书
- 生产环境中应使用正式的SSL证书
- 本地服务器的数据存储在managed_files目录中