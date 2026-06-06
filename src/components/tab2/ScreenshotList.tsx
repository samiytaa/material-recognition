import React, { useState } from 'react';
import { X, Trash2, ZoomIn } from 'lucide-react';
import { Card, UploadZone } from '../common';

interface Screenshot {
  id: number;
  name: string;
  dataUrl: string;
}

interface ScreenshotListProps {
  screenshots: Screenshot[];
  onDelete: (id: number) => void;
  onClearAll?: () => void;
  onUpload?: (files: FileList) => void;
}

// 放大预览弹窗组件
function ImageZoomModal({ imageUrl, imageName, onClose }: { imageUrl: string; imageName: string; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="px-4 py-3 bg-[#FAF8F4] border-b border-[#E9DFDB] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#674b2d]">{imageName}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* 图片内容 */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
          <img 
            src={imageUrl}
            alt={imageName}
            className="max-w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function ScreenshotList({
  screenshots,
  onDelete,
  onClearAll,
  onUpload,
}: ScreenshotListProps) {
  const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null);

  const handleClearAll = () => {
    if (confirm(`确定要清空所有 ${screenshots.length} 张待处理截图吗？`)) {
      onClearAll?.();
    }
  };

  return (
    <>
      {/* 上传区域 */}
      {onUpload && (
        <Card className="overflow-hidden flex-shrink-0" padding="none">
          <UploadZone
            onFilesSelected={onUpload}
            text="支持拖入游戏截图"
            subText={screenshots.length > 0 ? `已上传 ${screenshots.length} 张截图` : '或点击窗口选择图片文件'}
          />
        </Card>
      )}

      {/* 截图列表 */}
      {screenshots.length > 0 && (
      <div className="bg-white border border-[#DFD2BD]/60 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 bg-[#FAF8F4] border-b border-[#E9DFDB] flex items-center justify-between flex-shrink-0">
          <h3 className="text-xs font-bold text-[#674b2d]">
            待处理截图 ({screenshots.length})
          </h3>
          {onClearAll && screenshots.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
              title="清空所有截图"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin min-h-0">
          <div className="flex flex-col gap-3">
            {screenshots.map((screenshot) => (
              <div 
                key={screenshot.id}
                className="relative group"
              >
                {/* 图片容器 - 限制最大高度并保持完整显示 */}
                <div className="relative w-full bg-[#FDFBF8] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={screenshot.dataUrl}
                    alt={screenshot.name}
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                  
                  {/* 按钮组 - 悬浮在图片右上角 */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 放大按钮 */}
                    <button
                      onClick={() => setZoomImage({ url: screenshot.dataUrl, name: screenshot.name })}
                      className="w-7 h-7 flex items-center justify-center bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
                      title="放大查看"
                    >
                      <ZoomIn size={14} />
                    </button>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={() => onDelete(screenshot.id)}
                      className="w-7 h-7 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                      title="删除截图"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                
                {/* 文件名 - 图片下方小字 */}
                <div className="mt-1.5 px-1">
                  <p className="text-[10px] font-medium text-[#8B6F47] truncate leading-tight" title={screenshot.name}>
                    {screenshot.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
      
      {/* 放大预览弹窗 */}
      {zoomImage && (
        <ImageZoomModal
          imageUrl={zoomImage.url}
          imageName={zoomImage.name}
          onClose={() => setZoomImage(null)}
        />
      )}
    </>
  );
}
