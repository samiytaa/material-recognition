import React from 'react';
import { Bot, CheckCircle, RotateCcw } from 'lucide-react';
import { PropItem } from '../../types';
import Button from '../common/Button';

interface PreviewPanelProps {
  prop: PropItem | null;
  onConfirmAiMatch?: () => void;
  onReturnAiMatch?: () => void;
  onCancelConfirm?: () => void;
}

export default function PreviewPanel({ prop, onConfirmAiMatch, onReturnAiMatch, onCancelConfirm }: PreviewPanelProps) {
  if (!prop || !prop.image) {
    return (
      <div className="bg-white/80 rounded-xl p-3 border border-[#ECDDB9] shadow-sm flex items-center justify-center min-h-[180px]">
        <span className="text-sm text-gray-400">点击左侧图片预览</span>
      </div>
    );
  }

  const tags = prop.tags || [];
  const hasAiMatch = tags.includes('AI匹配');
  const isConfirmed = tags.includes('已确认');

  return (
    <>
      {/* 图片卡片 */}
      <div className="bg-white/80 rounded-xl p-3 border border-[#ECDDB9] shadow-sm flex items-center justify-center min-h-[180px]">
        <img
          src={prop.image}
          alt="大图预览"
          className="max-w-full max-h-44 object-contain rounded transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* 信息卡片 */}
      <div className="bg-[#FAF4EA] border border-[#ECDDB9] rounded-xl p-3 shadow-sm">
        {/* 居中显示的展示名称 */}
        <div className="text-center mb-2">
          <span className="font-bold text-[#674b2d] text-base block leading-tight">
            {prop.displayName}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
            {hasAiMatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <Bot size={12} />
                AI匹配
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle size={12} />
                已确认
              </span>
            )}
          </div>
        )}

        {hasAiMatch && !isConfirmed && (
          <div className="mb-3 flex justify-center gap-2">
            <Button size="sm" variant="success" icon={CheckCircle} onClick={onConfirmAiMatch}>
              确认
            </Button>
            <Button size="sm" variant="warning" icon={RotateCcw} onClick={onReturnAiMatch}>
              退回
            </Button>
          </div>
        )}

        {isConfirmed && (
          <div className="mb-3 flex justify-center gap-2">
            <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onCancelConfirm}>
              取消确认
            </Button>
          </div>
        )}

        {/* 原文件名 */}
        <div className="flex items-center justify-center gap-1 mb-1.5">
          <span className="font-semibold text-[#8E8276] text-[11px]">原文件名:</span>
          <span className="text-[11px] text-gray-500 font-mono">{prop.name}</span>
        </div>

        {/* 分类信息 */}
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8276]">类型:</span>
            <span className="font-semibold text-[#674b2d]">
              {prop.type === 'furniture' ? '家具' : '其他道具'}
            </span>
          </div>
          
          {prop.category && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8276]">分类:</span>
              <span className="font-semibold text-[#674b2d]">{prop.category}</span>
            </div>
          )}
          
          {prop.ownership.name && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8276]">
                {prop.ownership.type === 'male_lead' ? '男主:' : '密探:'}
              </span>
              <span className="font-semibold text-[#9E4A4A]">{prop.ownership.name}</span>
            </div>
          )}
          
          {prop.isGrowthProp && (
            <div className="flex items-center justify-center mt-2">
              <span className="px-3 py-1 bg-[#D86B6B] text-white text-xs font-bold rounded-full">
                初见日道具
              </span>
            </div>
          )}
          
          {prop.isFloor && (
            <div className="flex items-center justify-center mt-2">
              <span className="px-3 py-1 bg-[#4F73C7] text-white text-xs font-bold rounded-full">
                地板道具
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
