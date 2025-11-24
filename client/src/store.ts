import { create } from 'zustand';

export interface FileItem {
  name: string;
  size: number;
  modified: string;
}

interface EditorState {
  // 文件相关
  files: FileItem[];
  currentFile: string;
  content: string;
  
  // 状态相关
  isConnected: boolean;
  isLoading: boolean;
  error: string;
  
  // Actions
  setFiles: (files: FileItem[]) => void;
  setCurrentFile: (filename: string) => void;
  setContent: (content: string) => void;
  setIsConnected: (connected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useStore = create<EditorState>((set) => ({
  // 初始状态
  files: [],
  currentFile: '',
  content: '',
  isConnected: false,
  isLoading: false,
  error: '',
  
  // Actions
  setFiles: (files) => set({ files }),
  setCurrentFile: (currentFile) => set({ currentFile }),
  setContent: (content) => set({ content }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));