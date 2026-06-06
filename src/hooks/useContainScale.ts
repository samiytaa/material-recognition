import { useState, useEffect } from 'react';

/**
 * 管理 Contain 等比缩放模式的状态
 * @param storageKey - localStorage 中的存储键名
 * @param defaultValue - 默认值（默认启用）
 */
export function useContainScale(storageKey: string, defaultValue: boolean = true) {
  const [enableContainScale, setEnableContainScale] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === 'true' : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, enableContainScale.toString());
  }, [enableContainScale, storageKey]);

  return { enableContainScale, setEnableContainScale };
}
