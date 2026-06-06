import { useEffect, useState } from 'react';

export function useTab2IconLibraryCount(addRecordLog: (msg: string) => void) {
  const [iconLibraryCount, setIconLibraryCount] = useState<number>(0);

  useEffect(() => {
    addRecordLog(`ℹ Tab2已初始化（图片数据不再从本地存储加载）`);

    const checkIconLibrary = () => {
      try {
        const savedPropsStr = localStorage.getItem('savedProps');
        if (savedPropsStr) {
          const savedProps = JSON.parse(savedPropsStr);
          const count = savedProps.filter((prop: any) => prop.image).length;
          setIconLibraryCount(count);
          addRecordLog(`ℹ 检测到Tab1的icon库: ${count} 个icon可用`);
        } else {
          setIconLibraryCount(0);
          addRecordLog(`⚠ 未检测到Tab1的icon库，请先在Tab1中上传icon`);
        }
      } catch (error) {
        setIconLibraryCount(0);
        addRecordLog(`⚠ 读取icon库失败`);
      }
    };

    checkIconLibrary();

    const interval = setInterval(checkIconLibrary, 5000);
    return () => clearInterval(interval);
  }, []);

  return iconLibraryCount;
}
