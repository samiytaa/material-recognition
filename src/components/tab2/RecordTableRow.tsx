import React, { useEffect, useState } from 'react';
import { RecordRow } from '../../types';

interface RecordTableRowProps {
  row: RecordRow;
  rowIndex: number;
  availableColors: string[];
  availableCategories: string[];
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  isSelected: boolean;
  onToggleSelection: (rowId: number) => void;
  onViewImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUploadImage: (rowId: number, type: 'original' | 'screenshot') => void;
  onUpdateRow: (rowId: number, updates: Partial<RecordRow>) => void;
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

export default function RecordTableRow({
  row,
  rowIndex,
  availableColors,
  availableCategories,
  basemapGroups,
  selectedGroupId,
  isSelected,
  onToggleSelection,
  onViewImage,
  onUploadImage,
  onUpdateRow,
}: RecordTableRowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 当原图、底色或底图组改变时，自动生成预览
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

    // 合成底图和原图
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
        // 将原图居中绘制在底图上
        const scale = Math.min(canvas.width / propImg.width, canvas.height / propImg.height) * 0.8;
        const scaledWidth = propImg.width * scale;
        const scaledHeight = propImg.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        ctx!.drawImage(propImg, x, y, scaledWidth, scaledHeight);

        // 导出合成结果
        const compositeDataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(compositeDataUrl);
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
  }, [row.originalImage, row.baseColor, selectedGroupId, basemapGroups]);

  return (
    <tr className="hover:bg-[#FDFBF8]/80 group transition-all">
      {/* 选择框列 */}
      <td className="p-2 border border-[#F2ECE5] text-center w-[40px]">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(rowIndex)}
          className="w-4 h-4 cursor-pointer accent-[#8B6F47]"
        />
      </td>

      {/* 道具icon */}
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
          {availableColors.map(color => (
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
          {availableCategories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
  );
}
