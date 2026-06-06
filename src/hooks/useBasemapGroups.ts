import { useState, useEffect } from 'react';

// 导入底图图片
import propGold from '/basemaps/prop-gold.png';
import propPurple from '/basemaps/prop-purple.png';
import propBlue from '/basemaps/prop-blue.png';
import propGreen from '/basemaps/prop-green.png';
import propBrown from '/basemaps/prop-brown.png';

export interface BasemapItem {
  id: string;
  image: string;
  color: string;
}

export interface MapGroup {
  id: string;
  name: string;
  thumbnails: BasemapItem[];
}

// 默认底图配置
export const DEFAULT_BASEMAP_GROUPS: MapGroup[] = [
  {
    id: 'group_default',
    name: '道具底图',
    thumbnails: [
      { id: 'basemap_1', image: propBrown, color: '咖' },
      { id: 'basemap_2', image: propPurple, color: '紫' },
      { id: 'basemap_3', image: propGreen, color: '绿' },
      { id: 'basemap_4', image: propBlue, color: '蓝' },
      { id: 'basemap_5', image: propGold, color: '金' }
    ]
  }
];

// 迁移旧的底图路径到新的导入变量
export const migrateBasemapImage = (image: string): string => {
  if (image.includes('金') || image.includes('gold')) {
    return propGold;
  }
  if (image.includes('紫') || image.includes('purple')) {
    return propPurple;
  }
  if (image.includes('蓝') || image.includes('blue')) {
    return propBlue;
  }
  if (image.includes('绿') || image.includes('green')) {
    return propGreen;
  }
  if (image.includes('咖') || image.includes('brown')) {
    return propBrown;
  }
  return image;
};

export const isLegacyBasemapPath = (image: string): boolean => (
  image.includes('道具-') ||
  image.startsWith('basemaps/prop-') ||
  image.startsWith('./basemaps/prop-') ||
  image.startsWith('../basemaps/prop-')
);

// 自定义 Hook：管理底图组数据
export function useBasemapGroups(onUpdate?: (msg: string) => void) {
  const [groups, setGroups] = useState<MapGroup[]>(() => {
    const saved = localStorage.getItem('tab3_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 如果是旧版本的数据（string[] 或 SVG），则使用新的默认配置
        if (parsed.length > 0 && parsed[0].thumbnails) {
          const firstThumb = parsed[0].thumbnails[0];
          if (typeof firstThumb === 'string' || firstThumb?.image?.startsWith('data:image/svg+xml')) {
            return DEFAULT_BASEMAP_GROUPS;
          }
          
          // 迁移旧的中文文件名和相对路径到新的导入变量
          const migrated = parsed.map((group: MapGroup) => ({
            ...group,
            thumbnails: group.thumbnails.map((item: BasemapItem) => {
              const newImage = isLegacyBasemapPath(item.image)
                ? migrateBasemapImage(item.image)
                : item.image;
              return { ...item, image: newImage };
            })
          }));
          
          return migrated;
        }
        return parsed;
      } catch (e) {
        console.error('加载底图组配置失败:', e);
      }
    }
    return DEFAULT_BASEMAP_GROUPS;
  });

  // 监听 Tab3 的配置变化并自动同步
  useEffect(() => {
    const loadBasemapGroups = () => {
      const saved = localStorage.getItem('tab3_groups');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const currentStr = JSON.stringify(groups);
          const newStr = JSON.stringify(parsed);
          if (currentStr !== newStr) {
            setGroups(parsed);
            onUpdate?.('✓ 检测到底图配置更新，已重新加载');
          }
        } catch (e) {
          console.error('同步底图组失败:', e);
        }
      }
    };

    // 监听 storage 事件（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tab3_groups') {
        loadBasemapGroups();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 定期检查配置变化（用于同一标签页内的更新）
    const intervalId = setInterval(loadBasemapGroups, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [groups, onUpdate]);

  // 保存底图组到 localStorage（由 Tab3 调用）
  const saveGroups = (newGroups: MapGroup[]) => {
    setGroups(newGroups);
    localStorage.setItem('tab3_groups', JSON.stringify(newGroups));
  };

  return { groups, saveGroups };
}
