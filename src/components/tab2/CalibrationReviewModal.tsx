import React from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { RecordRow } from '../../types';

interface CalibrationReviewModalProps {
  isOpen: boolean;
  rows: RecordRow[];
  currentIndex: number;
  iconStatus: 'none' | 'ai' | 'confirmed';
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onConfirm: () => void;
  onReturn: () => void;
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

  const imageScale = zoom / 100;

  return (
    <div className="min-h-0 flex flex-col rounded-lg border border-[#E9DFDB] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#F2ECE5] px-3 py-2">
        <div className="text-xs font-bold text-[#674b2d]">{title}</div>
        <div className="flex items-center gap-2">
          <ZoomOut size={14} className="text-[#8B7355]" />
          <input
            type="range"
            min="50"
            max="250"
            step="10"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-24 accent-[#8B6F47]"
            title={`${title}缩放`}
          />
          <ZoomIn size={14} className="text-[#8B7355]" />
          <span className="w-10 text-right text-[10px] font-bold text-[#8B7355]">{zoom}%</span>
        </div>
      </div>

      <div className="flex min-h-[260px] flex-1 items-center justify-center overflow-auto bg-[#FAF8F4] p-4">
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
  onReturn
}: CalibrationReviewModalProps) {
  if (!isOpen) return null;

  const row = rows[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < rows.length - 1;
  const canReviewIcon = Boolean(row?.originalImage);
  const statusLabel = iconStatus === 'confirmed' ? '已确认' : iconStatus === 'ai' ? 'AI匹配' : '未匹配';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3C353B]/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-2 border-[#DFD2BD] bg-[#FAF7F2] shadow-2xl decorative-corners">
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
          <ImageReviewPane
            title="道具icon"
            imageUrl={row?.originalImage || null}
            emptyText="当前行没有道具icon"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#DFD2BD]/70 bg-[#FAF8F4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={!hasPrevious}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DFD0] bg-[#F2ECE4] px-3 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC] disabled:cursor-not-allowed disabled:opacity-50"
              title="上一行"
            >
              <ChevronLeft size={15} />
              上一行
            </button>
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DFD0] bg-[#F2ECE4] px-3 py-2 text-xs font-bold text-[#674b2d] transition hover:bg-[#EADBCC] disabled:cursor-not-allowed disabled:opacity-50"
              title="下一行"
            >
              下一行
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onReturn}
              disabled={!canReviewIcon}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F3C16E] bg-[#FFF8E1] px-4 py-2 text-xs font-bold text-[#A45E00] transition hover:bg-[#FFECB3] disabled:cursor-not-allowed disabled:opacity-50"
              title="退回当前行icon"
            >
              <RotateCcw size={15} />
              退回
            </button>
            <button
              onClick={onConfirm}
              disabled={!canReviewIcon}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F8F5F] bg-[#0F9F6E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B8159] disabled:cursor-not-allowed disabled:opacity-50"
              title="确认当前行icon"
            >
              <CheckCircle size={15} />
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
