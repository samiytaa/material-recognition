import React from 'react';
import { Search } from 'lucide-react';
import { PropItem } from '../../types';

interface IconSelectorPanelProps {
  isOpen: boolean;
  tab1PropsList: PropItem[];
  onSelect: (prop: PropItem) => void;
  onClose: () => void;
}

export default function IconSelectorPanel({
  isOpen,
  tab1PropsList,
  onSelect,
  onClose
}: IconSelectorPanelProps) {
  const [searchKeyword, setSearchKeyword] = React.useState('');

  // 筛选图标列表
  const filteredIcons = tab1PropsList.filter(prop => {
    if (!prop.image) return false;
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return prop.name.toLowerCase().includes(keyword) || 
           prop.displayName.toLowerCase().includes(keyword);
  });

  // 关闭时重置搜索
  React.useEffect(() => {
    if (!isOpen) {
      setSearchKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/20 z-10"
        onClick={onClose}
      />
      
      {/* 右侧面板 */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l-2 border-[#DFD2BD] shadow-xl z-20 flex flex-col">
        {/* 标题栏 */}
        <div className="flex-none border-b border-[#E9DFDB] bg-gradient-to-r from-[#7A4E3A] to-[#B9704D] px-4 py-3">
          <div className="text-xs font-bold text-[#FFF2C5] tracking-wide">
            选择 Icon
          </div>
        </div>

        {/* 搜索框 */}
        <div className="flex-none p-3 border-b border-[#E9DFDB] bg-[#FAF8F4]">
          <div className="relative">
            <Search 
              size={14} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]"
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索 icon 名称..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E9DFDB] rounded-lg outline-none font-semibold text-[#674b2d] placeholder:text-[#C5B198] focus:border-[#B9704D] transition"
            />
          </div>
        </div>

        {/* 图标列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredIcons.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-[#C5B198] px-4 text-center">
              {searchKeyword ? '未找到匹配的 icon' : 'Tab1 中没有可用的 icon'}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredIcons.map((prop, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(prop);
                    onClose();
                  }}
                  className="w-full p-3 rounded-lg border-2 border-[#E9DFDB] hover:border-[#B9704D] hover:bg-[#FAF8F4] transition group"
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
    </>
  );
}
