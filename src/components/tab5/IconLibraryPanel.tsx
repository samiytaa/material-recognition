import React from 'react';
import { UploadZone } from '../common';
import { IconLibraryItem } from '../../hooks/useIconLibrary';

interface IconLibraryPanelProps {
  iconLibrary: IconLibraryItem[];
  selectedIconId: string | null;
  onIconSelect: (iconId: string) => void;
  onIconUpload: (files: FileList) => void;
  onIconDelete: (iconId: string) => void;
  onClearAll: () => void;
  addLog: (msg: string) => void;
}

export default function IconLibraryPanel({
  iconLibrary,
  selectedIconId,
  onIconSelect,
  onIconUpload,
  onIconDelete,
  onClearAll,
  addLog
}: IconLibraryPanelProps) {
  return (
    <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
      <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3">
        透明 icon
      </h3>

      {iconLibrary.length === 0 ? (
        <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden">
          <UploadZone
            onFilesSelected={onIconUpload}
            accept="image/png,image/webp,image/jpeg"
            multiple={true}
            text="支持拖入透明icon"
            subText="或点击窗口批量选择透明背景图标文件"
          />
        </div>
      ) : (
        <>
          <div className="bg-[#F9FBFD] rounded-xl p-1 min-h-[120px] max-h-[220px] overflow-y-auto mb-3">
            <div className="grid grid-cols-6 gap-1">
              {iconLibrary.map(icon => (
                <div
                  key={icon.id}
                  onClick={() => onIconSelect(icon.id)}
                  className={`bg-white rounded-lg p-1 border cursor-pointer transition-all relative group ${
                    selectedIconId === icon.id
                      ? 'border-2 border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dce5ec] hover:border-[#8B6F47]'
                  } text-center aspect-square flex flex-col items-center justify-center`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIconDelete(icon.id);
                      addLog(`删除icon: ${icon.name}`);
                    }}
                    className="absolute top-0 right-0 bg-[#9E4A4A] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="删除"
                  >
                    ×
                  </button>
                  <div className="w-full aspect-square bg-white rounded flex items-center justify-center mb-0.5">
                    <img
                      src={`data:image/png;base64,${icon.base64}`}
                      alt={icon.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-[8px] truncate w-full px-0.5">{icon.name}</div>
                </div>
              ))}

              {/* 追加图片虚线格子 */}
              <label className="bg-white rounded-lg p-1 border-2 border-dashed border-[#8B6F47]/40 hover:border-[#8B6F47] hover:bg-[#8B6F47]/5 cursor-pointer transition-all text-center aspect-square flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      onIconUpload(e.target.files);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="w-full aspect-square bg-white rounded flex items-center justify-center mb-0.5">
                  <div className="text-2xl font-light text-[#8B6F47]">+</div>
                </div>
                <div className="text-[8px] truncate w-full px-0.5 text-[#8B6F47]">追加</div>
              </label>
            </div>
          </div>

          <button
            onClick={onClearAll}
            className="w-full px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
          >
            清空全部
          </button>
        </>
      )}
    </div>
  );
}
