import React from 'react';
import { Modal } from '../common';

interface ExportModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (mode: 'all' | 'confirmed') => void;
}

export default function ExportModeModal({ isOpen, onClose, onExport }: ExportModeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="选择导出范围"
      maxWidth="sm"
    >
      <div className="space-y-3">
        <button
          onClick={() => onExport('all')}
          className="w-full rounded-xl border border-[#DFD2BD] bg-white px-4 py-3 text-left transition hover:border-gold-shiny hover:bg-[#FFFDF7]"
        >
          <div className="text-sm font-bold text-[#674b2d]">全部下载</div>
          <div className="mt-1 text-xs text-[#8B7355]">导出当前条目中所有对应图片。</div>
        </button>
        <button
          onClick={() => onExport('confirmed')}
          className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <div className="text-sm font-bold text-emerald-700">仅下载已确认</div>
          <div className="mt-1 text-xs text-emerald-700/80">只导出当前条目中带有「已确认」标签的图片。</div>
        </button>
      </div>
    </Modal>
  );
}
