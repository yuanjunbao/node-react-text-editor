import axios from 'axios';
import { FileItem } from '../store';

// API基础URL
const API_BASE_URL = 'https://localhost:9527';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // 允许携带凭证（cookies等）
  withCredentials: true,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 统一错误处理
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到服务器');
    } else if (error.response) {
      // 服务器返回错误状态码
      const message = error.response.data?.error || `请求失败: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      throw new Error('没有收到服务器响应');
    } else {
      // 请求配置出错
      throw new Error('请求配置错误');
    }
  }
);

// 健康检查
export const checkHealth = async () => {
  return apiClient.get('/health');
};

// 获取文件列表
export const getFiles = async (): Promise<FileItem[]> => {
  return apiClient.get('/files');
};

// 获取文件内容
export const getFileContent = async (filename: string) => {
  return apiClient.get(`/files/${filename}`);
};

// 创建新文件
export const createFile = async (filename: string, content: string) => {
  return apiClient.post('/files', { filename, content });
};

// 更新文件内容
export const updateFile = async (filename: string, content: string) => {
  return apiClient.put(`/files/${filename}`, { content });
};

// 删除文件
export const deleteFile = async (filename: string) => {
  return apiClient.delete(`/files/${filename}`);
};