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

  React.useEffect(() => {
    setZoom(100);
  }, [imageUrl]);

  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!imageUrl) return;

    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom(currentZoom => Math.min(
      MAX_REVIEW_ZOOM,
      Math.max(MIN_REVIEW_ZOOM, currentZoom + direction * REVIEW_ZOOM_STEP)
    ));
  };

  const imageScale = zoom / 100;

  return (
    <div className="min-h-0 flex flex-col rounded-lg border border-[#E9DFDB] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#F2ECE5] px-3 py-2">
        <div className="text-xs font-bold text-[#674b2d]">{title}</div>
        <div className="flex items-center gap-2" title="在图片区域滚动鼠标滚轮缩放">
          <ZoomOut size={14} className="text-[#8B7355]" />
          <ZoomIn size={14} className="text-[#8B7355]" />
          <span className="w-10 text-right text-[10px] font-bold text-[#8B7355]">{zoom}%</span>
        </div>
      </div>

      <div
        className="flex min-h-[260px] flex-1 items-center justify-center overflow-auto bg-[#FAF8F4] p-4"
        onWheel={handleWheelZoom}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${imageScale})` }}
            className="max-h-[52vh] max-w-full origin-center rounded border border-[#E9DFDB]/60 object-contain shadow-sm"
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
        <div className="flex items-center justify-between gap-4 border-b border-[#DFD2BD]/70 bg-gradient-to-r from-[#7A4E3A] via-[#B9704D] to-[#7A4E3A] px-5 py-4 text-white">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-widest text-[#FFF2C5]">
              校对模式
            </div>
            <div className="mt-1 truncate text-xs text-white/80">
              {row?.propName || row?.screenshotOriginalName || row?.originalImageFileName || '未命名条目'}
            </div>
          </div>

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
            <button
              onClick={() => setShowReplacePanel(!showReplacePanel)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DFD2BD] bg-[#F2ECE4] px-4 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC]"
            >
              <ImageIcon size={14} />
              {showReplacePanel ? '关闭选择面板' : '从Tab1选择icon'}
            </button>
          </div>
        </div>

        <div className="border-t border-[#DFD2BD]/70 bg-[#FAF8F4] px-5 py-4">
          {/* 快速校对模式开关 */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={quickReviewMode}
                onChange={(e) => setQuickReviewMode(e.target.checked)}
                className="h-4 w-4 rounded border-[#DFD2BD] text-[#0F9F6E] focus:ring-2 focus:ring-[#0F9F6E]/30 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-[#674b2d]">
                快速校对模式
              </span>
              <span className="text-[10px] text-[#8B6F47]">
                （确认/退回后自动跳转到下一行）
              </span>
            </label>
          </div>

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
          onSelect={handleReplaceIconClick}
          onClose={() => setShowReplacePanel(false)}
        />
      </div>
    </div>
  );
}
