import React from 'react';
import { Trash2, FileImage } from 'lucide-react';
import { RecordRow } from '../../types';
import RecordTableRow from './RecordTableRow';

interface RecordTableProps {
  records: RecordRow[];
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
  onDeleteRow: (rowId: number) => void;
}

export default function RecordTable({
  records,
  onViewImage,
  onUploadImage,
  onUpdateRow,
  onDeleteRow,
}: RecordTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="text-gold-deep/40 flex items-center gap-2">
            <FileImage size={24} />
          </div>
          <div className="text-sm font-bold text-[#A67020]">暂无追记条目</div>
          <div className="text-xs text-[#C5B198]">
            请从 Tab1 导入图片，或使用右侧上传按钮添加图片
          </div>
        </div>
      </div>
    );
  }

  return (
    <table className="record-table w-full border-collapse bg-white table-fixed relative">
      <thead className="sticky top-0 z-20 shadow-sm bg-[#FAF8F4]">
        <tr>
          <th className="w-[40px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            操作
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            道具原图
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            游戏截图
          </th>
          <th className="w-[140px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            道具名
          </th>
          <th className="w-[90px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            底色
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            分类
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            加底预览
          </th>
          <th className="w-[140px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            输出名称
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#F2ECE5]">
        {records.map((row, idx) => (
          <RecordTableRow
            key={row.id}
            row={row}
            rowIndex={idx}
            onViewImage={onViewImage}
            onUploadImage={onUploadImage}
            onUpdateRow={onUpdateRow}
            onDeleteRow={onDeleteRow}
          />
        ))}
      </tbody>
    </table>
  );
}
