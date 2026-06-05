import React from 'react';
import { Trash2 } from 'lucide-react';
import { RecordRow } from '../../types';

interface RecordTableRowProps {
  row: RecordRow;
  rowIndex: number;
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
  onDeleteRow: (rowId: number) => void;
}

export default function RecordTableRow({
  row,
  rowIndex,
  onViewImage,
  onUploadImage,
  onUpdateRow,
  onDeleteRow,
}: RecordTableRowProps) {
  return (
    <tr className="hover:bg-[#FDFBF8]/80 group transition-all">
      {/* 删除按钮列 */}
      <td className="p-2 border border-[#F2ECE5] text-center w-[40px]">
        <button
          onClick={() => onDeleteRow(rowIndex)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center mx-auto"
          title="删除此行"
        >
          <Trash2 size={14} />
        </button>
      </td>

      {/* 道具原图 */}
      <td className="p-2 border border-[#F2ECE5] text-center">
        <div 
          onClick={() => {
            if (row.originalImage) {
              onViewImage(rowIndex, 'original');
            } else {
              onUploadImage(rowIndex, 'original');
            }
          }}
          className={`thumbnail-cell relative w-full h-16 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
            row.originalImage 
            ? 'border-gold-shiny/50 bg-transparent' 
            : 'border-dashed border-gold-medium/60 bg-[#FAF7F2] hover:bg-[#F2ECE4]'
          }`}
          style={row.originalImage ? {
            backgroundImage: `url(${row.originalImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : undefined}
        >
          {!row.originalImage && (
            <span className="text-[10px] font-bold text-gold-deep/60 tracking-wider">上传原图</span>
          )}
          
          {row.originalImage && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg text-white text-[9px] font-semibold transition-opacity">
              点击大图
            </div>
          )}
        </div>
      </td>

      {/* 游戏截图 */}
      <td className="p-2 border border-[#F2ECE5] text-center">
        <div 
          onClick={() => {
            if (row.screenshot) {
              onViewImage(rowIndex, 'screenshot');
            } else {
              onUploadImage(rowIndex, 'screenshot');
            }
          }}
          className={`thumbnail-cell relative w-full h-16 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
            row.screenshot 
            ? 'border-gold-shiny/50 bg-transparent' 
            : 'border-dashed border-gold-medium/60 bg-[#FAF7F2] hover:bg-[#F2ECE4]'
          }`}
          style={row.screenshot ? {
            backgroundImage: `url(${row.screenshot})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : undefined}
        >
          {!row.screenshot && (
            <span className="text-[10px] font-bold text-gold-deep/60 tracking-wider">上传截图</span>
          )}
          
          {row.screenshot && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg text-white text-[9px] font-semibold transition-opacity">
              点击大图
            </div>
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
              outputName: val ? `${val}_${row.baseColor}` : ''
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
              baseColor: val,
              outputName: row.propName ? `${row.propName}_${val}` : ''
            });
          }}
          className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
        >
          {['金', '紫', '蓝', '绿', '咖'].map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </td>

      {/* 分类 */}
      <td className="p-2 border border-[#F2ECE5]">
        <select
          value={row.category}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateRow(rowIndex, { category: val });
          }}
          className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
        >
          {['家具类', '其他类'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>

      {/* 加底预览 */}
      <td className="p-2 border border-[#F2ECE5]">
        <div 
          className={`preview-thumbnail w-full h-16 rounded-lg border flex items-center justify-center ${
            row.previewWithBase 
            ? 'border-gold-shiny/50' 
            : 'border-[#F2ECE5] bg-[#FDFBF9]'
          }`}
          style={row.previewWithBase ? {
            backgroundImage: `url(${row.previewWithBase})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : undefined}
        >
          {!row.previewWithBase && (
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
  );
}
