import { useState, useCallback } from 'react';

export function useLogger(initialMessage: string = '系统初始化完成') {
  const [logs, setLogs] = useState<string[]>([initialMessage]);

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([initialMessage]);
  }, [initialMessage]);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
