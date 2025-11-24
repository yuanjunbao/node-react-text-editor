# SSL证书生成指南

请按照以下步骤生成和配置SSL证书，这是让本地服务正常运行的关键步骤。

## 步骤

1. **安装mkcert**
   - macOS: `brew install mkcert`
   - Windows: 下载 `https://github.com/FiloSottile/mkcert/releases` 并运行
   - Linux: `sudo apt install mkcert` (Debian/Ubuntu)

2. **安装本地CA**
   ```bash
   mkcert -install
   ```

3. **在此目录中生成本地证书**
   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

4. **信任CA证书**
   - **macOS**:
     1. 打开"Keychain Access"应用
     2. 找到"mkcert root"证书
     3. 双击它，选择"Always Trust"在"Trust"下拉菜单
     4. 重启浏览器
   
   - **Windows**:
     1. 双击localhost.pem文件
     2. 点击"Install Certificate"
     3. 选择"Local Machine"
     4. 选择"Place all certificates in the following store" → "Trusted Root Certification Authorities"
     5. 点击"Finish"
     6. 重启浏览器
   
   - **Linux**:
     ```bash
     sudo cp localhost.pem /usr/local/share/ca-certificates/
     sudo update-ca-certificates
     ```

5. **启动服务器**
   ```bash
   cd ..
   npm run start:server
   ```

## 注意事项

- 生成的证书文件应该是：`localhost.pem` 和 `localhost-key.pem`
- 不要将这些证书文件提交到版本控制系统
- 确保浏览器信任了mkcert生成的CA证书，否则会显示安全警告
- 如果遇到证书问题，请重新执行上述步骤

如果需要临时测试，可以使用自签名证书，但在生产环境中请使用正式的SSL证书。