import React from 'react';
import { PropItem, RecordRow } from '../../types';

interface IconSelectorPanelProps {
  isOpen: boolean;
  tab1PropsList: PropItem[];
  currentRows: RecordRow[]; // 所有行数据，用于过滤已匹配的icon
  onSelect: (prop: PropItem) => void;
  onClose: () => void;
}

export default function IconSelectorPanel({
  isOpen,
  tab1PropsList,
  currentRows,
  onSelect,
  onClose
}: IconSelectorPanelProps) {
  // 收集所有已经匹配的icon文件名（包括AI匹配和已确认的）
  const matchedIconFileNames = React.useMemo(() => {
    const names = new Set<string>();
    currentRows.forEach(row => {
      // 如果有originalImageFileName，说明这个icon已经被使用
      if (row.originalImageFileName) {
        names.add(row.originalImageFileName);
      }
      // 如果有matchedPropFileName（AI匹配的），也过滤掉
      if (row.matchedPropFileName) {
        names.add(row.matchedPropFileName);
      }
    });
    return names;
  }, [currentRows]);

  // 过滤出未被匹配的图标
  const availableIcons = React.useMemo(() => {
    return tab1PropsList.filter(prop => {
      if (!prop.image) return false;
      // 排除已被匹配的icon
      if (matchedIconFileNames.has(prop.name)) return false;
      return true;
    });
  }, [tab1PropsList, matchedIconFileNames]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white border-l-2 border-[#DFD2BD] shadow-xl z-20 flex flex-col">
      {/* 标题栏 */}
      <div className="flex-none border-b border-[#E9DFDB] bg-gradient-to-r from-[#7A4E3A] to-[#B9704D] px-4 py-3 flex items-center justify-between">
        <div className="text-xs font-bold text-[#FFF2C5] tracking-wide">
          选择 Icon ({availableIcons.length} 个可用)
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-xs font-bold transition"
        >
          关闭
        </button>
      </div>

      {/* 图标列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {availableIcons.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#C5B198] text-center">
            Tab1 中没有可用的 icon
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {availableIcons.map((prop, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(prop);
                  onClose();
                }}
                className="p-3 rounded-lg border-2 border-[#E9DFDB] hover:border-[#B9704D] hover:bg-[#FAF8F4] transition group"
                title={prop.displayName}
              >
                {/* 图标 */}
                <div className="w-full aspect-square rounded overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={prop.image || ''}
                    alt={prop.displayName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
