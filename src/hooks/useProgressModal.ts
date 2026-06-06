import { useState, useCallback } from 'react';

export interface ProgressState {
  isOpen: boolean;
  current: number;
  total: number;
  successCount: number;
  failCount: number;
  currentProcessing: string;
  logs: string[];
}

export function useProgressModal() {
  const [progressState, setProgressState] = useState<ProgressState>({
    isOpen: false,
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
    currentProcessing: '',
    logs: []
  });

  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  const openProgress = useCallback((total: number) => {
    setProgressState({
      isOpen: true,
      current: 0,
      total,
      successCount: 0,
      failCount: 0,
      currentProcessing: '准备中...',
      logs: []
    });
    setProgressLogs([]);
  }, []);

  const updateProgress = useCallback((
    current: number,
    successCount: number,
    failCount: number,
    processing: string,
    log?: string
  ) => {
    if (log) {
      setProgressLogs(prev => {
        const updated = [...prev, log];
        return updated.length > 20 ? updated.slice(-20) : updated;
      });
    }

    setProgressState(prev => ({
      ...prev,
      current,
      successCount,
      failCount,
      currentProcessing: processing,
      logs: progressLogs
    }));
  }, [progressLogs]);

  const closeProgress = useCallback(() => {
    setProgressState(prev => ({ ...prev, isOpen: false }));
    setProgressLogs([]);
  }, []);

  return {
    progressState,
    openProgress,
    updateProgress,
    closeProgress
  };
}
