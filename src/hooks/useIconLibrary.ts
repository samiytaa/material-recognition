import { useState, useCallback } from 'react';

export interface IconLibraryItem {
  id: string;
  name: string;
  base64: string;
  file: File;
}

export function useIconLibrary(addLog: (msg: string) => void) {
  const [iconLibrary, setIconLibrary] = useState<IconLibraryItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // 批量上传icon
  const handleIconLibraryUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    let successCount = 0;
    let skipCount = 0;
    const skippedFiles: string[] = [];
    const newIcons: IconLibraryItem[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        addLog(`跳过非图片文件: ${file.name}`);
        continue;
      }

      const isDuplicate = iconLibrary.some(icon => icon.name === file.name);
      if (isDuplicate) {
        skippedFiles.push(file.name);
        skipCount++;
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(',')[1];

        const newIcon: IconLibraryItem = {
          id: `icon_${Date.now()}_${Math.random()}`,
          name: file.name,
          base64: base64,
          file: file
        };

        newIcons.push(newIcon);

        setIconLibrary(prev => {
          const updated = [...prev, newIcon];
          localStorage.setItem('tab5_icon_library', JSON.stringify(updated));
          return updated;
        });
        successCount++;
      };
      reader.readAsDataURL(file);
    }

    setTimeout(() => {
      if (successCount > 0) {
        addLog(`成功添加 ${successCount} 个透明icon到库中`);
      }
      if (skipCount > 0) {
        addLog(`跳过 ${skipCount} 个重复文件名: ${skippedFiles.slice(0, 3).join(', ')}${skipCount > 3 ? '...' : ''}`);
      }
    }, 100);
  }, [iconLibrary, addLog]);

  // 删除单个icon
  const deleteIcon = useCallback((iconId: string) => {
    setIconLibrary(prev => {
      const updated = prev.filter(i => i.id !== iconId);
      localStorage.setItem('tab5_icon_library', JSON.stringify(updated));
      return updated;
    });
    if (selectedIconId === iconId) {
      setSelectedIconId(null);
    }
  }, [selectedIconId]);

  // 清空icon库
  const clearIconLibrary = useCallback(() => {
    if (confirm('确定要清空所有icon吗？')) {
      setIconLibrary([]);
      setSelectedIconId(null);
      localStorage.removeItem('tab5_icon_library');
      addLog('icon库已清空');
    }
  }, [addLog]);

  // 从localStorage恢复
  const restoreFromStorage = useCallback(() => {
    const savedIconLibrary = localStorage.getItem('tab5_icon_library');
    if (savedIconLibrary) {
      try {
        const parsed = JSON.parse(savedIconLibrary);
        setIconLibrary(parsed);
        addLog(`已恢复 ${parsed.length} 个icon`);
      } catch (e) {
        console.error('恢复icon库失败', e);
      }
    }
  }, [addLog]);

  return {
    iconLibrary,
    selectedIconId,
    setSelectedIconId,
    handleIconLibraryUpload,
    deleteIcon,
    clearIconLibrary,
    restoreFromStorage
  };
}
