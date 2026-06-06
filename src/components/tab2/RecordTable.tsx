import React from 'react';
import { FileImage, Trash2 } from 'lucide-react';
import { RecordRow } from '../../types';
import RecordTableRow from './RecordTableRow';

interface RecordTableProps {
  records: RecordRow[];
  availableColors: string[];
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  enableContainScale: boolean; // 加底等比缩放开关
  selectedRowIds: number[];
  onToggleRowSelection: (rowId: number, event?: React.MouseEvent) => void;
  onToggleSelectAll: () => void;
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
  onReturnScreenshot?: (rowId: number) => void;
  onDeleteScreenshot?: (rowId: number) => void;
  onDeleteSelectedRows?: () => void;
  onDeleteSelectedScreenshots?: () => void;
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

export default function RecordTable({
  records,
  availableColors,
  basemapGroups,
  selectedGroupId,
  enableContainScale, // 加底等比缩放开关
  selectedRowIds,
  onToggleRowSelection,
  onToggleSelectAll,
  onViewImage,
  onUploadImage,
  onUpdateRow,
  onReturnScreenshot,
  onDeleteScreenshot,
  onDeleteSelectedRows,
  onDeleteSelectedScreenshots,
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
            <input
              type="checkbox"
              checked={selectedRowIds.length === records.length && records.length > 0}
              onChange={onToggleSelectAll}
              className="w-4 h-4 cursor-pointer accent-[#8B6F47]"
              title="全选/取消全选"
            />
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            <div className="flex flex-col items-center gap-1.5">
              <span>道具icon</span>
              {selectedRowIds.length > 0 && onDeleteSelectedRows && (
                <button
                  onClick={onDeleteSelectedRows}
                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-[10px] rounded transition-colors flex items-center gap-1 shadow-sm"
                  title={`删除选中的 ${selectedRowIds.length} 行`}
                >
                  <Trash2 size={12} />
                  删行({selectedRowIds.length})
                </button>
              )}
            </div>
          </th>
          <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">
            <div className="flex flex-col items-center gap-1.5">
              <span>游戏截图</span>
              {selectedRowIds.length > 0 && onDeleteSelectedScreenshots && (
                <button
                  onClick={onDeleteSelectedScreenshots}
                  className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[10px] rounded transition-colors flex items-center gap-1 shadow-sm"
                  title={`删除选中行的游戏截图 (${selectedRowIds.length} 行)`}
                >
                  <Trash2 size={12} />
                  删截图({selectedRowIds.length})
                </button>
              )}
            </div>
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
            availableColors={availableColors}
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            enableContainScale={enableContainScale}
            isSelected={selectedRowIds.includes(row.id)}
            onToggleSelection={(rowId, event) => onToggleRowSelection(rowId, event)}
            onViewImage={onViewImage}
            onUploadImage={onUploadImage}
            onUpdateRow={onUpdateRow}
            onReturnScreenshot={onReturnScreenshot}
            onDeleteScreenshot={onDeleteScreenshot}
          />
        ))}
      </tbody>
    </table>
  );
}
