import { useState, useCallback } from 'react';
import { readFileAsDataURL, getFileNameWithoutExtension } from '../utils/fileHelper';

export interface Screenshot {
  id: number;
  name: string;
  dataUrl: string;
}

export function useScreenshotUpload(addLog: (msg: string) => void) {
  const [uploadedScreenshots, setUploadedScreenshots] = useState<Screenshot[]>([]);

  // 批量上传截图
  const handleBatchImageUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const existingNames = new Set(uploadedScreenshots.map(s => s.name));
    const filesToUpload = fileArray.filter(file => {
      const nameWithoutExt = getFileNameWithoutExtension(file.name);
      return !existingNames.has(nameWithoutExt);
    });

    const duplicateCount = fileArray.length - filesToUpload.length;
    if (duplicateCount > 0) {
      addLog(`⚠ 跳过 ${duplicateCount} 个重复文件名的截图`);
    }

    if (filesToUpload.length === 0) {
      addLog('所有截图均已存在，未上传新文件');
      return;
    }

    // 检查是否超过推荐数量
    const totalAfterUpload = uploadedScreenshots.length + filesToUpload.length;
    if (totalAfterUpload > 20) {
      const shouldContinue = confirm(
        `注意：您即将上传 ${filesToUpload.length} 张图片，加上现有的 ${uploadedScreenshots.length} 张，总共 ${totalAfterUpload} 张\n\n` +
        `为避免内存不足，建议：\n` +
        `1. 分批上传（每次不超过20张）\n` +
        `2. 及时完成识别后清空待处理区\n\n` +
        `图片会自动压缩以节省空间\n\n` +
        `是否继续上传？`
      );

      if (!shouldContinue) {
        addLog('用户取消上传');
        return;
      }
    }

    addLog(`开始上传 ${filesToUpload.length} 张游戏截图（自动压缩中...）`);

    const newScreenshots: Screenshot[] = [];
    let compressedCount = 0;
    let originalSize = 0;
    let compressedSize = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      originalSize += file.size;

      // 自动压缩图片（超过500KB会压缩）
      const dataUrl = await readFileAsDataURL(file, true);
      const nameWithoutExt = getFileNameWithoutExtension(file.name);

      // 计算压缩后大小
      const compressedSizeBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
      compressedSize += compressedSizeBytes;

      if (file.size > 500 * 1024) {
        compressedCount++;
      }

      newScreenshots.push({
        id: Date.now() + i,
        name: nameWithoutExt,
        dataUrl: dataUrl
      });

      addLog(`[${i + 1}/${filesToUpload.length}] 导入游戏截图: ${file.name}${file.size > 500 * 1024 ? ' (已压缩)' : ''}`);
    }

    setUploadedScreenshots(prev => [...prev, ...newScreenshots]);

    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    addLog(`✓ 游戏截图批量上传完成，已添加 ${newScreenshots.length} 张截图`);
    if (compressedCount > 0) {
      addLog(`  压缩统计: ${compressedCount} 张图片已压缩，节省 ${compressionRatio}% 空间`);
      addLog(`  原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB → 压缩后: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }, [uploadedScreenshots, addLog]);

  // 删除单个截图
  const deleteScreenshot = useCallback((id: number) => {
    const screenshot = uploadedScreenshots.find(s => s.id === id);
    if (screenshot && confirm(`确定要删除截图"${screenshot.name}"吗？`)) {
      setUploadedScreenshots(prev => prev.filter(s => s.id !== id));
      addLog(`已删除截图：${screenshot.name}`);
    }
  }, [uploadedScreenshots, addLog]);

  // 清空所有截图
  const clearAllScreenshots = useCallback(() => {
    const count = uploadedScreenshots.length;
    setUploadedScreenshots([]);
    addLog(`✓ 已清空所有待处理截图（共 ${count} 张）`);
  }, [uploadedScreenshots, addLog]);

  // 添加截图（从表格退回）
  const addScreenshot = useCallback((screenshot: Screenshot) => {
    setUploadedScreenshots(prev => [...prev, screenshot]);
  }, []);

  // 移除多个截图（识别成功后）
  const removeScreenshots = useCallback((ids: number[]) => {
    setUploadedScreenshots(prev => prev.filter(s => !ids.includes(s.id)));
  }, []);

  return {
    uploadedScreenshots,
    handleBatchImageUpload,
    deleteScreenshot,
    clearAllScreenshots,
    addScreenshot,
    removeScreenshots
  };
}
