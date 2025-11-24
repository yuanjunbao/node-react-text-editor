const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = 9527;

// 文件存储目录
const MANAGED_FILES_DIR = path.join(__dirname, 'managed_files');

// 确保managed_files目录存在
if (!fs.existsSync(MANAGED_FILES_DIR)) {
  fs.mkdirSync(MANAGED_FILES_DIR);
}

// CORS配置 - 只允许Vercel域名和本地开发域名
const allowedOrigins = [
  'https://text-editor-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 解析JSON请求体
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 获取所有.txt文件列表
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(MANAGED_FILES_DIR)
      .filter(file => file.endsWith('.txt'))
      .map(file => ({
        name: file,
        size: fs.statSync(path.join(MANAGED_FILES_DIR, file)).size,
        modified: fs.statSync(path.join(MANAGED_FILES_DIR, file)).mtime
      }));
    res.status(200).json(files);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// 读取文件内容
app.get('/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // 安全检查：确保文件名有效且在managed_files目录内
    if (!filename.endsWith('.txt') || path.basename(filename) !== filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(MANAGED_FILES_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// 创建新文件
app.post('/files', (req, res) => {
  try {
    const { filename, content } = req.body;
    
    // 安全检查
    if (!filename || !filename.endsWith('.txt') || path.basename(filename) !== filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(MANAGED_FILES_DIR, filename);
    
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: 'File already exists' });
    }
    
    fs.writeFileSync(filePath, content || '', 'utf8');
    res.status(201).json({ message: 'File created successfully' });
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// 更新文件内容
app.put('/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const { content } = req.body;
    
    // 安全检查
    if (!filename.endsWith('.txt') || path.basename(filename) !== filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(MANAGED_FILES_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.writeFileSync(filePath, content || '', 'utf8');
    res.status(200).json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// 删除文件
app.delete('/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // 安全检查
    if (!filename.endsWith('.txt') || path.basename(filename) !== filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(MANAGED_FILES_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// 创建一个示例文件（如果managed_files目录为空）
const createSampleFile = () => {
  const sampleFilePath = path.join(MANAGED_FILES_DIR, 'example.txt');
  if (!fs.existsSync(sampleFilePath)) {
    fs.writeFileSync(sampleFilePath, '# 欢迎使用文本编辑器\n\n这是一个示例文件。您可以：\n- 创建新文件\n- 编辑现有文件\n- 删除文件\n- 浏览所有文本文件', 'utf8');
    console.log('Created sample file: example.txt');
  }
};

// 生成自签名证书的代码（开发环境使用）
const generateSelfSignedCert = () => {
  const certDir = path.join(__dirname, 'cert');
  const certPath = path.join(certDir, 'localhost.pem');
  const keyPath = path.join(certDir, 'localhost-key.pem');
  
  // 检查证书是否已存在
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { cert: certPath, key: keyPath };
  }
  
  console.warn('\n⚠️  SSL certificates not found. Please generate them using mkcert:\n');
  console.warn('1. Install mkcert: brew install mkcert');
  console.warn('2. Run: mkcert -install');
  console.warn('3. Run: cd', certDir);
  console.warn('4. Run: mkcert localhost 127.0.0.1 ::1');
  console.warn('\nFor now, using self-signed certificate. You may need to bypass browser security warnings.\n');
  
  // 尝试生成自签名证书（仅用于开发）
  try {
    const forge = require('node-forge');
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [
      { name: 'commonName', value: 'localhost' },
      { name: 'countryName', value: 'CN' },
      { name: 'stateOrProvinceName', value: 'Beijing' },
      { name: 'localityName', value: 'Beijing' },
      { name: 'organizationName', value: 'Text Editor App' },
      { name: 'organizationalUnitName', value: 'Development' }
    ];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    // 保存证书
    fs.writeFileSync(certPath, forge.pki.certificateToPem(cert));
    fs.writeFileSync(keyPath, forge.pki.privateKeyToPem(keys.privateKey));
    
    return { cert: certPath, key: keyPath };
  } catch (e) {
    console.error('Failed to generate self-signed certificate:', e);
    throw new Error('Please generate SSL certificates manually');
  }
};

// 启动服务器
const startServer = () => {
  try {
    // 尝试读取证书
    const certDir = path.join(__dirname, 'cert');
    let certOptions;
    
    try {
      certOptions = {
        key: fs.readFileSync(path.join(certDir, 'localhost-key.pem')),
        cert: fs.readFileSync(path.join(certDir, 'localhost.pem'))
      };
    } catch (certError) {
      console.error('Certificate not found. Please generate SSL certificates as instructed in README.');
      process.exit(1);
    }
    
    const server = https.createServer(certOptions, app);
    
    server.listen(PORT, () => {
      createSampleFile();
      console.log(`\n✅  HTTPS Server running on https://localhost:${PORT}`);
      console.log('✅  Health check: https://localhost:9527/health');
      console.log('\n📝  Available API endpoints:');
      console.log('   GET    /health           - Health check');
      console.log('   GET    /files            - List all files');
      console.log('   GET    /files/:filename  - Get file content');
      console.log('   POST   /files            - Create new file');
      console.log('   PUT    /files/:filename  - Update file content');
      console.log('   DELETE /files/:filename  - Delete file');
      console.log('\n🔒  CORS configured for:', allowedOrigins.join(', '));
    });
    
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EACCES') {
        console.error('Permission denied. Try running with sudo or choose a different port.');
      } else if (error.code === 'EADDRINUSE') {
        console.error('Port', PORT, 'is already in use.');
      }
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();