import React, { useEffect, useState } from 'react';
import { Undo2, ZoomIn, X, Trash2 } from 'lucide-react';
import { RecordRow } from '../../types';
import categoryConfig from '../../categoryConfig.json';

// 从分类名提取一级分类
function getPrimaryCategory(categoryName: string): string {
  const config = categoryConfig as any;
  const nonFurniture = config['除家具以外的道具'];
  
  if (nonFurniture) {
    // 遍历一级分类（男主类、密探类、头像类、活动类、其他类）
    for (const [primaryCat, items] of Object.entries(nonFurniture)) {
      if (Array.isArray(items) && items.includes(categoryName)) {
        return primaryCat;
      }
    }
  }
  
  // 家具类统一返回"家具"
  const furniture = config['家具'];
  if (furniture) {
    // 检查套装
    if (Array.isArray(furniture['套装']) && furniture['套装'].includes(categoryName)) {
      return '家具';
    }
    // 检查自由装修
    const free = furniture['自由装修'];
    if (free) {
      if (categoryName === '衬景') return '家具';
      for (const [subCat, items] of Object.entries(free)) {
        if (Array.isArray(items) && items.includes(categoryName)) {
          return '家具';
        }
      }
    }
  }
  
  // 兜底返回原分类名
  return categoryName;
}

interface RecordTableRowProps {
  row: RecordRow;
  rowIndex: number;
  availableColors: string[];
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  enableContainScale: boolean; // 加底等比缩放开关
  isSelected: boolean;
  onToggleSelection: (rowId: number, event?: React.MouseEvent) => void;
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
  onReturnScreenshot?: (rowId: number) => void;
  onDeleteScreenshot?: (rowId: number) => void;
}

interface BasemapItem {
  id: string;
  image: string;
  color: string;
}

interface MapGroup {
  id: string;
  name: string;
  thumbnails: BasemapItem[];
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

export default function RecordTableRow({
  row,
  rowIndex,
  availableColors,
  basemapGroups,
  selectedGroupId,
  enableContainScale, // 加底等比缩放开关
  isSelected,
  onToggleSelection,
  onViewImage,
  onUploadImage,
  onUpdateRow,
  onReturnScreenshot,
  onDeleteScreenshot,
}: RecordTableRowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null);

  // 当原图、底色、底图组或缩放模式改变时，自动生成预览并更新到row.previewWithBase
  useEffect(() => {
    if (!row.originalImage || !row.baseColor || !selectedGroupId) {
      setPreviewUrl(null);
      return;
    }

    const selectedGroup = basemapGroups.find(g => g.id === selectedGroupId);
    const basemapItem = selectedGroup?.thumbnails.find(item => item.color === row.baseColor);

    if (!basemapItem) {
      setPreviewUrl(row.originalImage); // 如果找不到底图，显示原图
      return;
    }

    // 合成底图和原图（与Tab5和Tab2加底按钮逻辑完全一致）
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // 绘制底图
      ctx!.drawImage(baseImg, 0, 0);

      // 加载并绘制原图
      const propImg = new Image();
      propImg.onload = () => {
        if (enableContainScale) {
          // Contain 等比缩放模式：画布边界等比适配居中算法（与Tab5一致）
          const targetWidth = canvas.width;
          const targetHeight = canvas.height;
          const sourceWidth = propImg.width;
          const sourceHeight = propImg.height;
          
          // 计算缩放系数：min(目标宽/源宽, 目标高/源高)
          const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
          
          // 缩放后的尺寸
          const scaledWidth = sourceWidth * scale;
          const scaledHeight = sourceHeight * scale;
          
          // 中心锚点居中定位
          const x = (targetWidth - scaledWidth) / 2;
          const y = (targetHeight - scaledHeight) / 2;

          ctx!.drawImage(propImg, x, y, scaledWidth, scaledHeight);
        } else {
          // 禁用缩放模式：原图原始尺寸居中渲染，超出画布区域裁切（与Tab5一致）
          const targetWidth = canvas.width;
          const targetHeight = canvas.height;
          const sourceWidth = propImg.width;
          const sourceHeight = propImg.height;
          
          // 中心锚点居中定位
          const offsetX = (targetWidth - sourceWidth) / 2;
          const offsetY = (targetHeight - sourceHeight) / 2;
          
          // 直接绘制原尺寸 icon（Canvas 会自动裁切超出部分）
          ctx!.drawImage(propImg, offsetX, offsetY, sourceWidth, sourceHeight);
        }

        // 导出合成结果
        const compositeDataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(compositeDataUrl);
        
        // 同步更新到row.previewWithBase，确保导出时使用的是当前预览效果
        if (onUpdateRow) {
          onUpdateRow(rowIndex, { previewWithBase: compositeDataUrl });
        }
      };
      propImg.onerror = () => {
        setPreviewUrl(row.originalImage); // 加载失败，使用原图
      };
      propImg.src = row.originalImage;
    };
    baseImg.onerror = () => {
      setPreviewUrl(row.originalImage); // 加载失败，使用原图
    };
    baseImg.src = basemapItem.image;
  }, [row.originalImage, row.baseColor, selectedGroupId, basemapGroups, enableContainScale, rowIndex, onUpdateRow]);

  return (
    <>
      <tr className="hover:bg-[#FDFBF8]/80 group transition-all">
        {/* 选择框列 */}
        <td 
          className="p-2 border border-[#F2ECE5] text-center w-[40px] cursor-pointer"
          onClick={(e) => onToggleSelection(rowIndex, e)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer accent-[#8B6F47] pointer-events-none"
          />
        </td>

        {/* 道具icon */}
        <td className="p-2 border border-[#F2ECE5] text-center">
          <div 
            className={`thumbnail-cell relative w-full h-16 rounded-lg border flex items-center justify-center transition-all ${
              row.originalImage 
              ? 'border-gold-shiny/50 bg-transparent group/icon' 
              : 'border-dashed border-gold-medium/60 bg-[#FAF7F2] hover:bg-[#F2ECE4] cursor-pointer'
            }`}
            style={row.originalImage ? {
              backgroundImage: `url(${row.originalImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : undefined}
            onClick={() => {
              if (!row.originalImage) {
                onUploadImage(rowIndex, 'original');
              }
            }}
          >
            {!row.originalImage && (
              <span className="text-[10px] font-bold text-gold-deep/60 tracking-wider">上传原图</span>
            )}
            
            {row.originalImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImage({ url: row.originalImage!, name: `${row.propName || '未命名'} - 道具icon` });
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-blue-500/90 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                title="放大查看"
              >
                <ZoomIn size={12} />
              </button>
            )}
          </div>
        </td>

        {/* 游戏截图 */}
        <td className="p-2 border border-[#F2ECE5] text-center">
          <div 
            className={`thumbnail-cell relative w-full h-16 rounded-lg border flex items-center justify-center transition-all ${
              row.screenshot 
              ? 'border-gold-shiny/50 bg-transparent group/screenshot' 
              : 'border-dashed border-gold-medium/60 bg-[#FAF7F2] hover:bg-[#F2ECE4] cursor-pointer'
            }`}
            style={row.screenshot ? {
              backgroundImage: `url(${row.screenshot})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : undefined}
            onClick={() => {
              if (!row.screenshot) {
                onUploadImage(rowIndex, 'screenshot');
              }
            }}
          >
            {!row.screenshot && (
              <span className="text-[10px] font-bold text-gold-deep/60 tracking-wider">上传截图</span>
            )}
            
            {row.screenshot && (
              <>
                {/* 放大按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImage({ url: row.screenshot!, name: `${row.propName || '未命名'} - 游戏截图` });
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-blue-500/90 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                  title="放大查看"
                >
                  <ZoomIn size={12} />
                </button>
                
                {/* 退回按钮 */}
                {onReturnScreenshot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要将此截图退回到待处理列表吗？')) {
                        onReturnScreenshot(rowIndex);
                      }
                    }}
                    className="absolute top-1 left-1 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-md opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                    title="退回到截图列表"
                  >
                    <Undo2 size={12} />
                  </button>
                )}
                
                {/* 删除截图按钮 */}
                {onDeleteScreenshot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScreenshot(rowIndex);
                    }}
                    className="absolute bottom-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                    title="删除截图"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </>
            )}
          </div>
        </td>

        {/* 道具名 */}
        <td className="p-2 border border-[#F2ECE5]">
          <input
            type="text"
            value={row.propName}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateRow(rowIndex, {
                propName: val,
                outputName: val
              });
            }}
            placeholder="双击修改道具名"
            className="w-full text-center text-xs px-2 py-1.5 bg-transparent border border-transparent hover:border-[#DFD2BD]/60 focus:border-gold-shiny focus:bg-[#FFFDF7] outline-none text-[#674b2d] font-semibold rounded transition-all"
          />
        </td>

        {/* 底色 */}
        <td className="p-2 border border-[#F2ECE5]">
          <select
            value={row.baseColor}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateRow(rowIndex, {
                baseColor: val
              });
            }}
            className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
          >
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </td>

        {/* 分类（从Tab1同步，不可修改，只显示一级分类） */}
        <td className="p-2 border border-[#F2ECE5]">
          <div className="w-full text-center text-xs px-2 py-1.5 bg-[#F9F6F2] border border-[#E9DFDB]/40 rounded font-bold text-[#8B6F47] cursor-not-allowed">
            {getPrimaryCategory(row.propCategory || '未知')}
          </div>
        </td>

        {/* 加底预览 */}
        <td className="p-2 border border-[#F2ECE5]">
          <div 
            className={`preview-thumbnail w-full h-16 rounded-lg border flex items-center justify-center ${
              previewUrl 
              ? 'border-gold-shiny/50' 
              : 'border-[#F2ECE5] bg-[#FDFBF9]'
            }`}
            style={previewUrl ? {
              backgroundImage: `url(${previewUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : undefined}
          >
            {!previewUrl && (
              <span className="text-[9px] font-bold text-[#C5B198]">待加底</span>
            )}
          </div>
        </td>

        {/* 输出名称 */}
        <td className="p-2 border border-[#F2ECE5]">
          <input
            type="text"
            value={row.outputName}
            disabled
            placeholder="输出名称"
            className="w-full text-center text-xs font-mono font-bold text-gold-deep bg-[#FAF7F2] p-1.5 rounded cursor-not-allowed border border-[#F2ECE5]"
          />
        </td>
      </tr>
      
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
