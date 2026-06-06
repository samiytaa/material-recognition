import { PropItem, parseFileName } from '../types';

/**
 * 处理文件上传，过滤图片并解析
 */
export function processImageFiles(
  files: FileList | File[],
  existingNames: Set<string>
): Promise<Array<{ file: File; parseResult: ReturnType<typeof parseFileName> }>> {
  const fileArray = Array.from(files);
  const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

  // 过滤掉重复的文件
  const uniqueFiles = imageFiles.filter(file => {
    const parseResult = parseFileName(file.name);
    return !existingNames.has(parseResult.name);
  });

  // 解析文件信息
  return Promise.resolve(
    uniqueFiles.map(file => ({
      file,
      parseResult: parseFileName(file.name),
    }))
  );
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param maxWidth 最大宽度（默认1200px）
 * @param quality 压缩质量（0-1，默认0.8）
 */
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        // 计算压缩后的尺寸
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 读取图片文件为 Base64（带自动压缩）
 * @param file 图片文件
 * @param compress 是否压缩（默认 true）
 */
export function readFileAsDataURL(file: File, compress: boolean = true): Promise<string> {
  // 如果需要压缩且文件大于 500KB，则进行压缩
  if (compress && file.size > 500 * 1024) {
    return compressImage(file);
  }
  
  // 小文件直接读取
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve(dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 批量读取文件为 Base64
 */
export async function readFilesAsDataURL(files: File[]): Promise<Array<{ dataUrl: string; fileName: string }>> {
  const results = await Promise.all(
    files.map(async (file) => {
      const dataUrl = await readFileAsDataURL(file);
      return { dataUrl, fileName: file.name };
    })
  );
  return results;
}

/**
 * 从文件名中提取不带扩展名的名称
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * 检查文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 过滤并获取图片文件
 */
export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(isImageFile);
}
