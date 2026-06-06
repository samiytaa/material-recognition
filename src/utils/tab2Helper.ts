import { RecordRow } from '../types';
import categoryConfig from '../categoryConfig.json';
import type { ScreenshotPrimaryCategory } from '../types';

/**
 * AI识别相关辅助函数
 */

export const DEFAULT_SCREENSHOT_CATEGORY: ScreenshotPrimaryCategory = '无分类';

export const SCREENSHOT_CATEGORY_OPTIONS: ScreenshotPrimaryCategory[] = [
  DEFAULT_SCREENSHOT_CATEGORY,
  '家具',
  '男主',
  '密探',
  '头像',
  '活动',
  '其他'
];

const PRIMARY_CATEGORY_LABEL_MAP: Record<string, ScreenshotPrimaryCategory> = {
  '男主类': '男主',
  '密探类': '密探',
  '头像类': '头像',
  '活动类': '活动',
  '其他类': '其他',
  '家具': '家具'
};

// 从Tab1解析出的细分类映射到截图上传时只需要判断的一级分类。
export function getIconPrimaryCategory(categoryName: string, propType?: string): ScreenshotPrimaryCategory {
  if (propType === 'furniture' || propType === '家具') return '家具';

  const config = categoryConfig as any;
  const nonFurniture = config['除家具以外的道具'];

  if (nonFurniture) {
    for (const [primaryCat, items] of Object.entries(nonFurniture)) {
      if (Array.isArray(items) && items.includes(categoryName)) {
        return PRIMARY_CATEGORY_LABEL_MAP[primaryCat] || '其他';
      }
    }
  }

  const furniture = config['家具'];
  if (furniture) {
    if (Array.isArray(furniture['套装']) && furniture['套装'].includes(categoryName)) {
      return '家具';
    }

    const free = furniture['自由装修'];
    if (free) {
      if (categoryName === '衬景') return '家具';
      for (const items of Object.values(free)) {
        if (Array.isArray(items) && items.includes(categoryName)) {
          return '家具';
        }
      }
    }
  }

  return '其他';
}

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
