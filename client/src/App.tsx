import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import { checkHealth, getFiles, getFileContent, createFile, updateFile, deleteFile } from './utils/api';

const App: React.FC = () => {
  const {
    files,
    currentFile,
    content,
    isConnected,
    isLoading,
    error,
    setFiles,
    setCurrentFile,
    setContent,
    setIsConnected,
    setIsLoading,
    setError
  } = useStore();

  const [newFileName, setNewFileName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 检查服务健康状态
  const checkServerHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await checkHealth();
      setIsConnected(true);
      setError('');
      return response;
    } catch (err) {
      setIsConnected(false);
      setError('无法连接到本地服务，请确保服务已启动并配置了正确的SSL证书');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setIsConnected, setError]);

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const fileList = await getFiles();
      setFiles(fileList);
      setError('');
    } catch (err) {
      setError('加载文件列表失败');
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, setFiles, setError]);

  // 加载文件内容
  const loadFileContent = useCallback(async (filename: string) => {
    setIsLoading(true);
    try {
      const data:any = await getFileContent(filename);
      setCurrentFile(filename);
      setContent(data.content);
      setError('');
    } catch (err) {
      setError('加载文件内容失败');
      console.error('Failed to load file content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentFile, setContent, setError]);

  // 保存文件内容
  const handleSave = useCallback(async () => {
    if (!currentFile) return;
    
    setIsLoading(true);
    try {
      await updateFile(currentFile, content);
      setError('');
      // 刷新文件列表以更新修改时间
      loadFiles();
    } catch (err) {
      setError('保存文件失败');
      console.error('Failed to save file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, content, setIsLoading, setError, loadFiles]);

  // 创建新文件
  const handleCreateFile = useCallback(async () => {
    if (!newFileName.trim()) {
      setError('文件名不能为空');
      return;
    }

    // 确保文件名以.txt结尾
    let filename = newFileName.trim();
    if (!filename.endsWith('.txt')) {
      filename += '.txt';
    }

    setIsLoading(true);
    try {
      await createFile(filename, '');
      setShowCreateModal(false);
      setNewFileName('');
      setError('');
      
      // 重新加载文件列表并打开新文件
      await loadFiles();
      loadFileContent(filename);
    } catch (err) {
      setError('创建文件失败，文件可能已存在');
      console.error('Failed to create file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [newFileName, setIsLoading, setShowCreateModal, setNewFileName, setError, loadFiles, loadFileContent]);

  // 删除文件
  const handleDeleteFile = useCallback(async (filename: string) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) return;
    
    setIsLoading(true);
    try {
      await deleteFile(filename);
      
      // 如果删除的是当前打开的文件，清除当前文件
      if (filename === currentFile) {
        setCurrentFile('');
        setContent('');
      }
      
      setError('');
      loadFiles();
    } catch (err) {
      setError('删除文件失败');
      console.error('Failed to delete file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, setIsLoading, setCurrentFile, setContent, setError, loadFiles]);

  // 初始化：检查健康状态并加载文件
  useEffect(() => {
    const init = async () => {
      await checkServerHealth();
      await loadFiles();
    };
    init();
  }, [checkServerHealth, loadFiles]);

  return (
    <div className="app">
      <header className="header">
        <h1>文本编辑器</h1>
        <div className="status-indicator">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '已连接到本地服务' : '未连接到本地服务'}
          </span>
          <button 
            onClick={checkServerHealth}
            className="reconnect-btn"
            disabled={isLoading}
          >
            重新连接
          </button>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>文件列表</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="create-btn"
              disabled={!isConnected}
            >
              新建文件
            </button>
          </div>
          
          <div className="file-list">
            {isLoading && files.length === 0 ? (
              <p className="loading-text">加载中...</p>
            ) : files.length === 0 ? (
              <p className="empty-text">没有找到文件</p>
            ) : (
              files.map((file) => (
                <div 
                  key={file.name} 
                  className={`file-item ${currentFile === file.name ? 'active' : ''}`}
                >
                  <div 
                    className="file-name" 
                    onClick={() => loadFileContent(file.name)}
                    title={file.name}
                  >
                    {file.name}
                  </div>
                  <div className="file-actions">
                    <button 
                      onClick={() => handleDeleteFile(file.name)}
                      className="delete-btn"
                      title="删除文件"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="editor-container">
          {!currentFile ? (
            <div className="empty-editor">
              <p>选择或创建一个文件开始编辑</p>
            </div>
          ) : (
            <>
              <div className="editor-header">
                <h2 className="current-filename">{currentFile}</h2>
                <button 
                  onClick={handleSave}
                  className="save-btn"
                  disabled={!isConnected || isLoading}
                >
                  {isLoading ? '保存中...' : '保存文件'}
                </button>
              </div>
              <textarea
                className="text-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此输入文本内容..."
                disabled={!isConnected}
                spellCheck={false}
              />
            </>
          )}
        </main>
      </div>

      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>创建新文件</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="输入文件名（.txt）"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>取消</button>
              <button 
                onClick={handleCreateFile}
                disabled={!newFileName.trim() || isLoading}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;