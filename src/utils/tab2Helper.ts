import { RecordRow } from '../types';
import { Screenshot } from '../hooks';

/**
 * AI识别相关辅助函数
 */

// 构建icon库
export function buildIconLibrary(recordList: RecordRow[]) {
  const tableIcons = recordList
    .map((row, idx) => ({
      rowIndex: idx,
      originalImage: row.originalImage,
      originalImageFileName: row.originalImageFileName,
      propName: row.propName,
      propType: row.propType,
      propCategory: row.propCategory,
      propRelated: row.propRelated
    }))
    .filter(item => item.originalImage !== null);

  const iconLibrary: Array<{
    id: string;
    name: string;
    base64: string;
    propName: string;
    propType: string;
    propCategory: string;
    propRelated: string;
    rowIndex: number;
  }> = [];

  for (const item of tableIcons) {
    try {
      const base64 = item.originalImage!.split(',')[1];
      if (base64) {
        iconLibrary.push({
          id: `row_${item.rowIndex}`,
          name: item.originalImageFileName || item.propName || `第${item.rowIndex + 1}行`,
          base64: base64,
          propName: item.propName || '未命名',
          propType: item.propType || '未知',
          propCategory: item.propCategory || '未知',
          propRelated: item.propRelated || '无',
          rowIndex: item.rowIndex
        });
      }
    } catch (e) {
      console.warn(`第 ${item.rowIndex + 1} 行的icon格式异常`);
    }
  }

  return iconLibrary;
}

// 验证API配置
export function validateApiConfig() {
  const apiEndpoint = localStorage.getItem('apiEndpoint');
  const apiKey = localStorage.getItem('apiKey');
  const selectedModel = localStorage.getItem('selectedModel');

  if (!apiEndpoint || !apiKey || !selectedModel) {
    return {
      valid: false,
      error: '请先在顶部导航栏的 API 配置中配置 API 并选择模型！'
    };
  }

  return {
    valid: true,
    config: { apiEndpoint, apiKey, selectedModel }
  };
}

/**
 * 导出相关辅助函数
 */

// 统计导出信息
export function getExportStats(recordList: RecordRow[]) {
  const totalRows = recordList.length;
  const rowsWithPreview = recordList.filter(row => row.previewWithBase).length;
  const rowsWithOutputName = recordList.filter(
    row => row.outputName && row.outputName.trim() !== ''
  ).length;
  const exportRows = recordList.filter(
    row => row.previewWithBase && row.outputName && row.outputName.trim() !== ''
  );

  return {
    totalRows,
    rowsWithPreview,
    rowsWithOutputName,
    exportRows
  };
}

// 生成唯一文件名
export function createUniqueFileNameGenerator() {
  const usedFileNames = new Set<string>();

  return (baseName: string): string => {
    let fileName = `${baseName}.png`;
    let counter = 1;

    while (usedFileNames.has(fileName)) {
      fileName = `${baseName}_${counter}.png`;
      counter++;
    }

    usedFileNames.add(fileName);
    return fileName;
  };
}

/**
 * 加底处理相关辅助函数
 */

// 合成底图和原图
export function compositeImageWithBasemap(
  originalImageUrl: string,
  basemapUrl: string,
  enableContainScale: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';

    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      ctx!.drawImage(baseImg, 0, 0);

      const propImg = new Image();
      propImg.onload = () => {
        if (enableContainScale) {
          // Contain 等比缩放模式
          const targetWidth = canvas.width;
          const targetHeight = canvas.height;
          const sourceWidth = propImg.width;
          const sourceHeight = propImg.height;

          const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
          const scaledWidth = sourceWidth * scale;
          const scaledHeight = sourceHeight * scale;
          const offsetX = (targetWidth - scaledWidth) / 2;
          const offsetY = (targetHeight - scaledHeight) / 2;

          ctx!.drawImage(propImg, offsetX, offsetY, scaledWidth, scaledHeight);
        } else {
          // 原始尺寸居中
          const targetWidth = canvas.width;
          const targetHeight = canvas.height;
          const sourceWidth = propImg.width;
          const sourceHeight = propImg.height;
          const offsetX = (targetWidth - sourceWidth) / 2;
          const offsetY = (targetHeight - sourceHeight) / 2;

          ctx!.drawImage(propImg, offsetX, offsetY, sourceWidth, sourceHeight);
        }

        const compositeDataUrl = canvas.toDataURL('image/png');
        resolve(compositeDataUrl);
      };

      propImg.onerror = () => reject(new Error('原图加载失败'));
      propImg.src = originalImageUrl;
    };

    baseImg.onerror = () => reject(new Error('底图加载失败'));
    baseImg.src = basemapUrl;
  });
}

// 获取可加底的行数量
export function getReadyRowsCount(recordList: RecordRow[]) {
  return recordList.filter(row => row.originalImage && row.propName).length;
}
