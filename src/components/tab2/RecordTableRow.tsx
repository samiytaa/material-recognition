import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle, RotateCcw, ZoomIn, Trash2 } from 'lucide-react';
import { RecordRow, ScreenshotPrimaryCategory } from '../../types';
import { SCREENSHOT_CATEGORY_OPTIONS, getIconPrimaryCategory } from '../../utils/tab2Helper';
import { MapGroup } from '../../hooks';

interface RecordTableRowProps {
  row: RecordRow;
  rowIndex: number;
  availableColors: string[];
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  enableContainScale: boolean; // 加底等比缩放开关
  isSelected: boolean;
  isFocused: boolean;
  onToggleSelection: (rowId: number, event?: React.MouseEvent) => void;
  onFocusRow: () => void;
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
  iconStatus: 'none' | 'ai' | 'confirmed';
  onConfirmIcon: (rowId: number) => void;
  onReturnIcon: (rowId: number) => void;
  onDeleteScreenshot?: (rowId: number) => void;
}

export default function RecordTableRow({
  row,
  rowIndex,
  availableColors,
  basemapGroups,
  selectedGroupId,
  enableContainScale, // 加底等比缩放开关
  isSelected,
  isFocused,
  onToggleSelection,
  onFocusRow,
  onViewImage,
  onUploadImage,
  onUpdateRow,
  iconStatus,
  onConfirmIcon,
  onReturnIcon,
  onDeleteScreenshot,
}: RecordTableRowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 双击计时器
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = React.useRef(0);

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

  // 整行点击处理：单击选中，双击进入校对
  const handleRowClick = (e: React.MouseEvent) => {
    // 如果点击的是输入框、选择框、按钮等交互元素，不处理行点击
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' || 
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('input[type="checkbox"]')
    ) {
      return;
    }

    clickCountRef.current++;
    
    if (clickCountRef.current === 1) {
      // 第一次点击：设置定时器，延迟判断是单击还是双击
      clickTimerRef.current = setTimeout(() => {
        // 单击：选中/取消选中当前行
        onToggleSelection(rowIndex, e);
        onFocusRow();
        clickCountRef.current = 0;
      }, 250);
    } else if (clickCountRef.current === 2) {
      // 第二次点击：清除定时器，执行双击操作
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      // 双击：进入校对
      onViewImage(rowIndex, 'screenshot');
      clickCountRef.current = 0;
    }
  };

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <tr 
        className={`group transition-all cursor-pointer ${
          isFocused 
            ? 'bg-blue-50/60 ring-2 ring-blue-300 ring-inset' 
            : isSelected
            ? 'bg-amber-50/40'
            : 'hover:bg-[#FDFBF8]/80'
        }`}
        onClick={handleRowClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 选择框列 */}
        <td 
          className="p-2 border border-[#F2ECE5] text-center w-[40px]"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(rowIndex, e);
            onFocusRow();
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer accent-[#8B6F47] pointer-events-none"
          />
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
            onClick={(e) => {
              e.stopPropagation();
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage(rowIndex, 'screenshot');
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-blue-500/90 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                  title="进入校对"
                >
                  <ZoomIn size={12} />
                </button>
                
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
            onClick={(e) => {
              e.stopPropagation();
              if (!row.originalImage) {
                // 没有 icon 时，点击打开校对弹窗
                onViewImage(rowIndex, 'original');
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
                  onViewImage(rowIndex, 'original');
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-blue-500/90 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center shadow-md z-10"
                title="进入校对"
              >
                <ZoomIn size={12} />
              </button>
            )}
          </div>
        </td>

        {/* 确认状态 */}
        <td className="p-2 border border-[#F2ECE5]">
          <div className="flex items-center justify-center">
            {iconStatus === 'confirmed' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle size={11} />
                已确认
              </span>
            ) : iconStatus === 'ai' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                <Bot size={11} />
                AI匹配
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#C5B198]">未匹配</span>
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
            onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => e.stopPropagation()}
            className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
          >
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </td>

        {/* 分类：待识别截图可选一级分类，识别后显示Tab1同步分类 */}
        <td className="p-2 border border-[#F2ECE5]">
          {!row.originalImage && row.screenshot ? (
            <select
              value={row.screenshotCategory || '其他'}
              onChange={(e) => {
                onUpdateRow(rowIndex, {
                  screenshotCategory: e.target.value as ScreenshotPrimaryCategory
                });
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-center text-xs px-1 py-1.5 bg-white border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
              title="选择截图一级分类，AI识别时只在该分类Icon池中匹配"
            >
              {SCREENSHOT_CATEGORY_OPTIONS.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          ) : (
            <div className="w-full text-center text-xs px-2 py-1.5 bg-[#F9F6F2] border border-[#E9DFDB]/40 rounded font-bold text-[#8B6F47] cursor-not-allowed">
              {getIconPrimaryCategory(row.propCategory || row.screenshotCategory || '其他', row.propType)}
            </div>
          )}
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
    </>
  );
}
