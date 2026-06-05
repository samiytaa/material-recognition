import { useState } from 'react';

interface UploadOptions {
  onSuccess?: (dataUrl: string, fileName: string) => void;
  onError?: (error: Error) => void;
}

export function useImageUpload(options?: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return Promise.resolve([]);
    }

    setIsUploading(true);
    setProgress(0);

    const uploadPromises = imageFiles.map((file, index) => {
      return new Promise<{ dataUrl: string; fileName: string }>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setProgress(((index + 1) / imageFiles.length) * 100);
          options?.onSuccess?.(dataUrl, file.name);
          resolve({ dataUrl, fileName: file.name });
        };
        
        reader.onerror = (error) => {
          const err = new Error(`文件读取失败: ${file.name}`);
          options?.onError?.(err);
          reject(err);
        };
        
        reader.readAsDataURL(file);
      });
    });

    return Promise.all(uploadPromises).finally(() => {
      setIsUploading(false);
      setProgress(0);
    });
  };

  return {
    uploadFiles,
    isUploading,
    progress,
  };
}
