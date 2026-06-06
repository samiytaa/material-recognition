import React from 'react';
import { PropItem } from '../../types';

interface PreviewPanelProps {
  prop: PropItem | null;
}

export default function PreviewPanel({ prop }: PreviewPanelProps) {
  if (!prop || !prop.image) {
    return (
      <div className="bg-white/80 rounded-xl p-3 border border-[#ECDDB9] shadow-sm flex items-center justify-center min-h-[180px]">
        <span className="text-sm text-gray-400">点击左侧图片预览</span>
      </div>
    );
  }

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
