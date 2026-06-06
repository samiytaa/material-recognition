import React from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { RecordRow, PropItem } from '../../types';
import IconSelectorPanel from './IconSelectorPanel';

const MIN_REVIEW_ZOOM = 50;
const MAX_REVIEW_ZOOM = 250;
const REVIEW_ZOOM_STEP = 10;

interface CalibrationReviewModalProps {
  isOpen: boolean;
  rows: RecordRow[];
  currentIndex: number;
  iconStatus: 'none' | 'ai' | 'confirmed';
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onConfirm: () => void;
  onReturn: () => void;
  tab1PropsList?: PropItem[]; // Tab1 的 icon 列表
  onReplaceIcon?: (rowIndex: number, selectedProp: PropItem) => void; // 替换 icon 回调
}

function ImageReviewPane({
  title,
  imageUrl,
  emptyText
}: {
  title: string;
  imageUrl: string | null;
  emptyText: string;
}) {
  const [zoom, setZoom] = React.useState(100);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const imagePaneRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  React.useEffect(() => {
    const imagePane = imagePaneRef.current;
    if (!imagePane) return;

    const handleWheelZoom = (event: WheelEvent) => {
      if (!imageUrl) return;

      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      setZoom(currentZoom => Math.min(
        MAX_REVIEW_ZOOM,
        Math.max(MIN_REVIEW_ZOOM, currentZoom + direction * REVIEW_ZOOM_STEP)
      ));
    };

    imagePane.addEventListener('wheel', handleWheelZoom, { passive: false });

    return () => {
      imagePane.removeEventListener('wheel', handleWheelZoom);
    };
  }, [imageUrl]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || zoom <= 100) return;
    event.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    setPosition({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const imageScale = zoom / 100;

  return (
    <div className="min-h-0 flex flex-col rounded-lg border border-[#E9DFDB] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#F2ECE5] px-3 py-2">
        <div className="text-xs font-bold text-[#674b2d]">{title}</div>
        <div className="flex items-center gap-2" title="滚动鼠标滚轮缩放 / 缩放后可拖拽图片">
          <ZoomOut size={14} className="text-[#8B7355]" />
          <ZoomIn size={14} className="text-[#8B7355]" />
          <span className="w-10 text-right text-[10px] font-bold text-[#8B7355]">{zoom}%</span>
        </div>
      </div>

      <div
        ref={imagePaneRef}
        className="flex min-h-[260px] flex-1 items-center justify-center overflow-auto bg-[#FAF8F4] p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: imageUrl && zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none'
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{ 
              transform: `scale(${imageScale}) translate(${position.x / imageScale}px, ${position.y / imageScale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="max-h-[52vh] max-w-full origin-center rounded border border-[#E9DFDB]/60 object-contain shadow-sm pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="text-xs font-bold text-[#C5B198]">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

export default function CalibrationReviewModal({
  isOpen,
  rows,
  currentIndex,
  iconStatus,
  onClose,
  onNavigate,
  onConfirm,
  onReturn,
  tab1PropsList = [],
  onReplaceIcon
}: CalibrationReviewModalProps) {
  const [showReplacePanel, setShowReplacePanel] = React.useState(false);
  const [quickReviewMode, setQuickReviewMode] = React.useState(false);
  const [showLastRowTip, setShowLastRowTip] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果替换面板打开，不响应快捷键
      if (showReplacePanel) return;

      const row = rows[currentIndex];
      const hasPrevious = currentIndex > 0;
      const hasNext = currentIndex < rows.length - 1;
      const canReviewIcon = Boolean(row?.originalImage);

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          // 上一行
          if (hasPrevious) {
            e.preventDefault();
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          // 下一行
          if (hasNext) {
            e.preventDefault();
            onNavigate(currentIndex + 1);
          }
          break;
        case 'Enter':
          // 确认（已确认状态下禁用）
          if (canReviewIcon && iconStatus !== 'confirmed') {
            e.preventDefault();
            handleConfirmWithAutoNext();
          }
          break;
        case 'Backspace':
        case 'r':
        case 'R':
          // 退回
          if (canReviewIcon) {
            e.preventDefault();
            handleReturnWithAutoNext();
          }
          break;
        case 'Escape':
          // 关闭
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, rows, iconStatus, showReplacePanel, onNavigate, onConfirm, onReturn, onClose]);

  // 关闭时重置状态
  React.useEffect(() => {
    if (!isOpen) {
      setShowReplacePanel(false);
      setShowLastRowTip(false);
    }
  }, [isOpen]);

  // 已确认状态时自动关闭选择面板
  React.useEffect(() => {
    if (iconStatus === 'confirmed' && showReplacePanel) {
      setShowReplacePanel(false);
    }
  }, [iconStatus, showReplacePanel]);

  // 自动隐藏"最后一行"提示
  React.useEffect(() => {
    if (showLastRowTip) {
      const timer = setTimeout(() => setShowLastRowTip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showLastRowTip]);

  if (!isOpen) return null;

  const row = rows[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < rows.length - 1;
  const canReviewIcon = Boolean(row?.originalImage);
  const statusLabel = iconStatus === 'confirmed' ? '已确认' : iconStatus === 'ai' ? 'AI匹配' : '未匹配';

  const handleReplaceIconClick = (prop: PropItem) => {
    if (onReplaceIcon) {
      onReplaceIcon(currentIndex, prop);
    }
  };

  // 快速校对模式：执行操作后自动跳转到下一行
  const handleConfirmWithAutoNext = () => {
    onConfirm();
    
    if (quickReviewMode) {
      const hasNext = currentIndex < rows.length - 1;
      if (hasNext) {
        // 延迟跳转，确保确认操作完成
        setTimeout(() => {
          onNavigate(currentIndex + 1);
        }, 100);
      } else {
        // 最后一行，显示提示
        setShowLastRowTip(true);
      }
    }
  };

  const handleReturnWithAutoNext = () => {
    onReturn();
    
    if (quickReviewMode) {
      const hasNext = currentIndex < rows.length - 1;
      if (hasNext) {
        // 延迟跳转，确保退回操作完成
        setTimeout(() => {
          onNavigate(currentIndex + 1);
        }, 100);
      } else {
        // 最后一行，显示提示
        setShowLastRowTip(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3C353B]/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-2 border-[#DFD2BD] bg-[#FAF7F2] shadow-2xl decorative-corners relative">
        <div className="border-b border-[#DFD2BD]/70 bg-gradient-to-r from-[#7A4E3A] via-[#B9704D] to-[#7A4E3A] px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧：校对模式标题 + 快速校对开关 */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold tracking-widest text-[#FFF2C5]">
                校对模式
              </div>

              {/* 快速校对模式开关 - 精致设计 */}
              <div className="border-l border-white/20 pl-4 hidden sm:block">
                <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg border border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={quickReviewMode}
                      onChange={(e) => setQuickReviewMode(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-4 rounded border-2 border-white/50 bg-white/10 transition-all peer-checked:border-[#FFF2C5] peer-checked:bg-[#FFF2C5] group-hover:border-white/70 shadow-sm"></div>
                    <CheckCircle 
                      size={10} 
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#7A4E3A] opacity-0 transition-opacity peer-checked:opacity-100" 
                      strokeWidth={3}
                    />
                  </div>
                  <span className="text-xs text-white/90 group-hover:text-white transition-colors select-none whitespace-nowrap font-medium">
                    快速校对
                  </span>
                </label>
              </div>
            </div>

            {/* 中间：文件名 */}
            <div className="absolute left-1/2 -translate-x-1/2 max-w-md">
              <div className="truncate text-base font-bold text-white text-center">
                {row?.propName || row?.screenshotOriginalName || row?.originalImageFileName || '未命名条目'}
              </div>
            </div>

            {/* 右侧：状态标签 */}
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-[#FFF2C5]">
                {rows.length > 0 ? `${currentIndex + 1} / ${rows.length}` : '0 / 0'}
              </span>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                {statusLabel}
              </span>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-2">
          <ImageReviewPane
            title="游戏截图"
            imageUrl={row?.screenshot || null}
            emptyText="当前行没有游戏截图"
          />
          <div className="flex flex-col gap-4 min-h-0">
            <ImageReviewPane
              title="道具icon"
              imageUrl={row?.originalImage || null}
              emptyText="当前行没有道具icon"
            />
            
            {/* 从 Tab1 选择 icon 按钮 */}
            <div className="space-y-2">
              <button
                onClick={() => setShowReplacePanel(!showReplacePanel)}
                disabled={iconStatus === 'confirmed'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#DFD2BD] bg-[#F2ECE4] px-4 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#F2ECE4]"
                title={iconStatus === 'confirmed' ? '请先退回再选择icon' : ''}
              >
                <ImageIcon size={14} />
                {showReplacePanel ? '关闭选择面板' : '从Tab1选择icon'}
              </button>
              
              {/* 已确认状态提示 */}
              {iconStatus === 'confirmed' && (
                <div className="text-[10px] text-[#A45E00] text-center bg-[#FFF8E1] border border-[#F3C16E] rounded px-2 py-1">
                  已确认的icon需先退回才能重新选择
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#DFD2BD]/70 bg-[#FAF8F4] px-5 py-4">
          {/* 最后一行提示 */}
          {showLastRowTip && (
            <div className="mb-3 flex items-center justify-center">
              <div className="rounded-lg border border-[#F3C16E] bg-[#FFF8E1] px-4 py-2 text-xs font-bold text-[#A45E00] shadow-sm animate-pulse">
                已是最后一条
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={!hasPrevious}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DFD0] bg-[#F2ECE4] px-3 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC] disabled:cursor-not-allowed disabled:opacity-50"
              title="上一行 (← / ↑)"
            >
              <ChevronLeft size={15} />
              上一行
            </button>
            <button
              onClick={handleReturnWithAutoNext}
              disabled={!canReviewIcon}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F3C16E] bg-[#FFF8E1] px-4 py-2 text-xs font-bold text-[#A45E00] transition hover:bg-[#FFECB3] disabled:cursor-not-allowed disabled:opacity-50"
              title="退回当前行icon (Backspace / R)"
            >
              <RotateCcw size={15} />
              退回
            </button>
            <button
              onClick={handleConfirmWithAutoNext}
              disabled={!canReviewIcon || iconStatus === 'confirmed'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F8F5F] bg-[#0F9F6E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B8159] disabled:cursor-not-allowed disabled:opacity-50"
              title={iconStatus === 'confirmed' ? '已确认 (Enter)' : '确认当前行icon (Enter)'}
            >
              <CheckCircle size={15} />
              确认
            </button>
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DFD0] bg-[#F2ECE4] px-3 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC] disabled:cursor-not-allowed disabled:opacity-50"
              title="下一行 (→ / ↓)"
            >
              下一行
              <ChevronRight size={15} />
            </button>
          </div>
          
          {/* 快捷键提示 */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-[#8B6F47]">
            <span className="font-semibold">快捷键：</span>
            <span>←/↑ 上一行</span>
            <span>→/↓ 下一行</span>
            <span>Enter 确认</span>
            <span>Backspace/R 退回</span>
            <span>Esc 关闭</span>
          </div>
        </div>

        {/* Icon 选择侧边面板 */}
        <IconSelectorPanel
          isOpen={showReplacePanel}
          tab1PropsList={tab1PropsList}
          currentRows={rows}
          onSelect={handleReplaceIconClick}
          onClose={() => setShowReplacePanel(false)}
        />
      </div>
    </div>
  );
}
