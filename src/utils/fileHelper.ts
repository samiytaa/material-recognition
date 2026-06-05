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
    return !existingNames.has(parseResult.originalName);
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
 * 读取图片文件为 Base64
 */
export function readFileAsDataURL(file: File): Promise<string> {
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
