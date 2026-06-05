import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Layers, 
  RotateCcw, 
  Save, 
  Download, 
  UploadCloud, 
  Info, 
  HelpCircle,
  FileImage,
  Layers2,
  Bookmark,
  ChevronLeft,
  Trash2,
  X
} from 'lucide-react';
import { RecordRow } from '../types';
import LogSidebar from './LogSidebar';

interface Tab2RecordProps {
  recordList: RecordRow[];
  setRecordList: React.Dispatch<React.SetStateAction<RecordRow[]>>;
  recordLogs: string[];
  addRecordLog: (msg: string) => void;
  clearRecordLogs: () => void;
  showProgressBar: () => void;
  hideProgressBar: () => void;
  updateProgress: (current: number, total: number) => void;
  selectedPart: { rowId: number; type: 'original' | 'screenshot' } | null;
  setSelectedPart: (val: { rowId: number; type: 'original' | 'screenshot' } | null) => void;
}

export default function Tab2Record({
  recordList,
  setRecordList,
  recordLogs,
  addRecordLog,
  clearRecordLogs,
  showProgressBar,
  hideProgressBar,
  updateProgress,
  selectedPart,
  setSelectedPart
}: Tab2RecordProps) {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const uploadHintAreaRef = useRef<HTMLInputElement>(null);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);

  // Track target cells being modified by file uploads
  const targetCellRef = useRef<{ rowId: number; type: 'original' | 'screenshot' } | null>(null);

  // Large image viewing helper
  const viewRowImage = (rowId: number, type: 'original' | 'screenshot') => {
    setSelectedPart({ rowId, type });
    addRecordLog(`查看第 ${rowId + 1} 行的${type === 'original' ? '道具原图' : '游戏截图'}`);
  };

  const getPreviewImage = () => {
    if (!selectedPart) return null;
    const row = recordList[selectedPart.rowId];
    if (selectedPart.type === 'original') return row.originalImage;
    if (selectedPart.type === 'screenshot') return row.screenshot;
    return null;
  };

  // Multiple screenshot files uploading from side drop/click hint
  const handleBatchImageUpload = (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    addRecordLog(`开始上传 ${fileArray.length} 张游戏截图...`);
    showProgressBar();

    let uploadedCount = 0;
    const newRows: RecordRow[] = [];
    
    // Process each image file and create new rows with screenshot
    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        // Extract name without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

        newRows[index] = {
          id: Date.now() + index, // Use timestamp to ensure unique IDs
          originalImage: null,
          screenshot: dataUrl, // 放到游戏截图列
          propName: nameWithoutExt,
          baseColor: '金',
          category: '家具类',
          previewWithBase: null,
          outputName: `${nameWithoutExt}_金`
        };

        uploadedCount++;
        updateProgress(uploadedCount, fileArray.length);
        
        addRecordLog(`[${uploadedCount}/${fileArray.length}] 导入游戏截图: ${file.name}`);

        if (uploadedCount === fileArray.length) {
          // Add all new rows at once
          setRecordList(prev => [...prev, ...newRows]);
          hideProgressBar();
          addRecordLog(`✓ 游戏截图批量上传完成，创建了 ${uploadedCount} 个新条目`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Specific cell image uploading (Original or Screenshot)
  const handleCellImageUpload = (rowId: number, type: 'original' | 'screenshot') => {
    targetCellRef.current = { rowId, type };
    if (type === 'original') {
      fileInputRef1.current?.click();
    } else {
      fileInputRef2.current?.click();
    }
  };

  const onCellFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'screenshot') => {
    const file = e.target.files?.[0];
    if (file && targetCellRef.current) {
      const { rowId } = targetCellRef.current;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setRecordList(prev => {
          const updated = [...prev];
          updated[rowId] = {
            ...updated[rowId],
            [type === 'original' ? 'originalImage' : 'screenshot']: dataUrl
          };
          return updated;
        });
        addRecordLog(`已上传第 ${rowId + 1} 行的${type === 'original' ? '道具原图' : '游戏截图'}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete a single row
  const deleteRow = (rowId: number) => {
    const row = recordList[rowId];
    if (confirm(`确定要删除第 ${rowId + 1} 行（${row.propName || '未命名'}）吗？`)) {
      setRecordList(prev => prev.filter((_, idx) => idx !== rowId));
      addRecordLog(`已删除第 ${rowId + 1} 行（${row.propName || '未命名'}）`);
      
      // Clear preview if deleted row was selected
      if (selectedPart?.rowId === rowId) {
        setSelectedPart(null);
      }
    }
  };

  // Simulated AI match algorithm (exact replication)
  const runAiMatch = () => {
    if (recordList.length === 0) {
      alert('请先上传图片或从Tab1导入后再进行AI匹配');
      addRecordLog('AI匹配失败：没有条目');
      return;
    }

    const filledRowsCount = recordList.filter(row => row.originalImage !== null).length;
    if (filledRowsCount === 0) {
      alert('请先上传图片后再进行AI匹配');
      addRecordLog('AI匹配失败：未上传图片');
      return;
    }

    if (!confirm(`检测到 ${filledRowsCount} 行有图片\n确定执行AI匹配吗？`)) {
      return;
    }

    addRecordLog(`开始AI匹配，共 ${filledRowsCount} 条数据...`);
    showProgressBar();

    let processedCount = 0;
    const mockNames = ['寒潭桥', '米拱门', '莲心泉', '雕花屏风', '锦绣帷幔', '青瓷花瓶'];
    const mockColors = ['金', '紫', '蓝', '绿', '咖'];
    const mockCategories = ['家具类', '其他类'];

    // Create sequentially timed updates for rows that contain static images
    const intervalTime = 300;
    const processNext = () => {
      // Find the next item that has original image but no prop name
      let activeIdx = -1;
      let checkCount = 0;
      for (let i = 0; i < recordList.length; i++) {
        if (recordList[i].originalImage) {
          if (checkCount === processedCount) {
            activeIdx = i;
            break;
          }
          checkCount++;
        }
      }

      if (activeIdx === -1 || processedCount >= filledRowsCount) {
        hideProgressBar();
        addRecordLog(`✓ AI匹配完成！已处理 ${filledRowsCount} 条记录`);
        alert(`AI匹配完成！\n已自动填充道具名、底色、分类、输出名称`);
        return;
      }

      const selectedName = mockNames[Math.floor(Math.random() * mockNames.length)];
      const selectedColor = mockColors[Math.floor(Math.random() * mockColors.length)];
      const selectedCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];

      setRecordList(prev => {
        const updated = [...prev];
        updated[activeIdx] = {
          ...updated[activeIdx],
          propName: selectedName,
          baseColor: selectedColor,
          category: selectedCategory,
          outputName: `${selectedName}_${selectedColor}`
        };
        return updated;
      });

      processedCount++;
      updateProgress(processedCount, filledRowsCount);
      addRecordLog(`[${processedCount}/${filledRowsCount}] 匹配第 ${activeIdx + 1} 行：${selectedName} - ${selectedColor} - ${selectedCategory}`);

      setTimeout(processNext, intervalTime);
    };

    setTimeout(processNext, intervalTime);
  };

  // Custom watermark background addition (replicating exact action)
  const addWatermarkBase = () => {
    if (recordList.length === 0) {
      alert('请先上传图片或从Tab1导入后再加底');
      addRecordLog('加底失败：没有条目');
      return;
    }

    const readyRowsCount = recordList.filter(row => row.originalImage && row.propName).length;
    if (readyRowsCount === 0) {
      alert('请先上传图片并填写道具名后再加底');
      addRecordLog('加底失败：没有可处理的数据');
      return;
    }

    if (!confirm(`检测到 ${readyRowsCount} 行可加底\n确定执行加底处理吗？`)) {
      return;
    }

    addRecordLog(`开始加底处理，共 ${readyRowsCount} 条数据...`);
    showProgressBar();

    let processedCount = 0;
    const intervalTime = 200;

    const processNextBase = () => {
      let activeIdx = -1;
      for (let i = 0; i < recordList.length; i++) {
        if (recordList[i].originalImage && recordList[i].propName && !recordList[i].previewWithBase) {
          activeIdx = i;
          break;
        }
      }

      if (activeIdx === -1) {
        // If everything is already processed, check count
        hideProgressBar();
        addRecordLog(`✓ 加底处理完成！已处理 ${readyRowsCount} 条记录`);
        alert(`加底处理完成！\n已生成 ${readyRowsCount} 张预览图`);
        return;
      }

      setRecordList(prev => {
        const updated = [...prev];
        updated[activeIdx] = {
          ...updated[activeIdx],
          previewWithBase: updated[activeIdx].originalImage
        };
        return updated;
      });

      processedCount++;
      updateProgress(processedCount, readyRowsCount);
      addRecordLog(`[${processedCount}/${readyRowsCount}] 第 ${activeIdx + 1} 行加底完成`);

      setTimeout(processNextBase, intervalTime);
    };

    setTimeout(processNextBase, intervalTime);
  };

  // Undoing/recalling actions
  const onRecallMock = () => {
    alert('撤回功能开发中...\n将恢复上一步操作前的状态');
    addRecordLog('撤回功能开发中...');
  };

  // Write record data local storage commit
  const saveRecordsToLocal = () => {
    const validRows = recordList.filter(row => row.originalImage || row.propName.trim() !== '');
    if (validRows.length === 0) {
      alert('没有可保存的数据');
      addRecordLog('保存失败：没有有效数据');
      return;
    }

    const saveData = validRows.map(row => ({
      propName: row.propName,
      baseColor: row.baseColor,
      category: row.category,
      outputName: row.outputName,
      hasOriginalImage: !!row.originalImage,
      hasScreenshot: !!row.screenshot,
      hasPreview: !!row.previewWithBase
    }));

    localStorage.setItem('recordData', JSON.stringify(saveData));
    addRecordLog(`✓ 数据已保存到本地，共 ${validRows.length} 条记录`);
    alert(`已保存 ${validRows.length} 条追记数据到本地存储`);
  };

  // Export batch mock download
  const exportBatchFiles = () => {
    const exportRows = recordList.filter(row => row.previewWithBase && row.outputName.trim() !== '');
    if (exportRows.length === 0) {
      alert('没有可导出的数据\n请先完成AI匹配和加底处理');
      addRecordLog('导出失败：没有可导出的数据');
      return;
    }

    if (!confirm(`检测到 ${exportRows.length} 条可导出数据\n确定导出吗？`)) {
      return;
    }

    addRecordLog(`开始导出，共 ${exportRows.length} 条数据...`);
    showProgressBar();

    let exportedCount = 0;
    const intervalTime = 150;

    const processNextExport = () => {
      if (exportedCount >= exportRows.length) {
        hideProgressBar();
        addRecordLog(`✓ 导出完成！共 ${exportRows.length} 个文件`);
        alert(`导出完成！\n已导出 ${exportRows.length} 个文件\n（实际开发中会打开文件保存对话框）`);
        return;
      }

      exportedCount++;
      updateProgress(exportedCount, exportRows.length);
      addRecordLog(`[${exportedCount}/${exportRows.length}] 导出：${exportRows[exportedCount - 1].outputName}`);

      setTimeout(processNextExport, intervalTime);
    };

    setTimeout(processNextExport, intervalTime);
  };

  const handleManualUploadTrigger = () => {
    uploadHintAreaRef.current?.click();
  };

  const onBatchFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleBatchImageUpload(e.target.files);
    }
  };

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleBatchImageUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      {/* Target hidden cell uploaders */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef1} 
        onChange={(e) => onCellFileChange(e, 'original')} 
        className="hidden" 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef2} 
        onChange={(e) => onCellFileChange(e, 'screenshot')} 
        className="hidden" 
      />
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={uploadHintAreaRef} 
        onChange={onBatchFileSelected} 
        className="hidden" 
      />

      {/* Writeup Left Editable Spreadsheet Table */}
      <div className="flex-1 bg-white border border-[#DFD2BD]/60 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden decorative-corners shadow-sm">
        <div className="overflow-auto flex-1 border border-[#DFD2BD]/40 rounded-xl relative scrollbar-thin">
          <table className="record-table w-full border-collapse bg-white table-fixed relative">
            <thead className="sticky top-0 z-20 shadow-sm bg-[#FAF8F4]">
              <tr>
                <th className="w-[40px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">操作</th>
                <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">道具原图</th>
                <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">游戏截图</th>
                <th className="w-[140px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">道具名</th>
                <th className="w-[90px]  border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">底色</th>
                <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">分类</th>
                <th className="w-[100px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">加底预览</th>
                <th className="w-[140px] border border-[#E9DFDB] text-center p-3 text-xs font-bold text-[#674b2d]">输出名称</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE5]">
              {recordList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-gold-deep/40 flex items-center gap-2">
                        <FileImage size={24} />
                      </div>
                      <div className="text-sm font-bold text-[#A67020]">暂无追记条目</div>
                      <div className="text-xs text-[#C5B198]">请从 Tab1 导入图片，或使用右侧上传按钮添加图片</div>
                    </div>
                  </td>
                </tr>
              ) : (
                recordList.map((row, idx) => (
                <tr 
                  key={row.id}
                  className="hover:bg-[#FDFBF8]/80 group transition-all"
                >
                  {/* 删除按钮列 */}
                  <td className="p-2 border border-[#F2ECE5] text-center w-[40px]">
                    <button
                      onClick={() => deleteRow(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center mx-auto"
                      title="删除此行"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>

                  {/* Item Original Thumbnail */}
                  <td className="p-2 border border-[#F2ECE5] text-center">
                    <div 
                      onClick={() => {
                        if (row.originalImage) {
                          viewRowImage(idx, 'original');
                        } else {
                          handleCellImageUpload(idx, 'original');
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

                  {/* Screenshot Thumbnail */}
                  <td className="p-2 border border-[#F2ECE5] text-center">
                    <div 
                      onClick={() => {
                        if (row.screenshot) {
                          viewRowImage(idx, 'screenshot');
                        } else {
                          handleCellImageUpload(idx, 'screenshot');
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

                  {/* Edit Prop Name Input */}
                  <td className="p-2 border border-[#F2ECE5]">
                    <input
                      type="text"
                      value={row.propName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRecordList(prev => {
                          const updated = [...prev];
                          updated[idx] = {
                            ...updated[idx],
                            propName: val,
                            outputName: val ? `${val}_${updated[idx].baseColor}` : ''
                          };
                          return updated;
                        });
                      }}
                      placeholder="双击修改道具名"
                      className="w-full text-center text-xs px-2 py-1.5 bg-transparent border border-transparent hover:border-[#DFD2BD]/60 focus:border-gold-shiny focus:bg-[#FFFDF7] outline-none text-[#674b2d] font-semibold rounded transition-all"
                    />
                  </td>

                  {/* Color Selector Dropdown */}
                  <td className="p-2 border border-[#F2ECE5]">
                    <select
                      value={row.baseColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRecordList(prev => {
                          const updated = [...prev];
                          updated[idx] = {
                            ...updated[idx],
                            baseColor: val,
                            outputName: updated[idx].propName ? `${updated[idx].propName}_${val}` : ''
                          };
                          return updated;
                        });
                        addRecordLog(`第 ${idx + 1} 行底色变更为: ${val}`);
                      }}
                      className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
                    >
                      {['金', '紫', '蓝', '绿', '咖'].map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </td>

                  {/* Category Selector Dropdown */}
                  <td className="p-2 border border-[#F2ECE5]">
                    <select
                      value={row.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRecordList(prev => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], category: val };
                          return updated;
                        });
                        addRecordLog(`第 ${idx + 1} 行分类变更为: ${val}`);
                      }}
                      className="w-full text-center text-xs px-1 py-1.5 bg-transparent border border-[#E9DFDB]/60 rounded outline-none font-bold text-[#674b2d] focus:border-gold-shiny focus:bg-[#FFFDF7]"
                    >
                      {['家具类', '其他类'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>

                  {/* Bottom preview placeholder banner */}
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

                  {/* Output name readout */}
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
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Control Pillar Section */}
      <div className="w-full lg:w-80 flex flex-col gap-3 h-full overflow-hidden">
        
        {/* Scrollable Upper Control Panel content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          
          {/* Bulk uploader banner - 与 Tab1 样式一致 */}
          <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden flex-shrink-0">
            <div
              id="uploadHintArea"
              onDragOver={onDragOver}
              onDragLeave={onDragOver}
              onDrop={onDrop}
              onClick={handleManualUploadTrigger}
              className="drag-area group flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-all duration-200 hover:bg-gold-light"
            >
              <span className="text-sm font-bold text-[#674b2d] tracking-wide mb-1">
                支持拖入游戏截图
              </span>
              <span className="text-xs font-medium text-gold-deep/70">
                或点击窗口选择图片文件
              </span>
              {recordList.length > 0 && (
                <div className="mt-3 text-[10px] text-gold-deep/70 font-semibold bg-[#FAF8F4] py-1 px-3 rounded-lg border border-[#E9DFD0]">
                  当前共 {recordList.length} 个条目
                </div>
              )}
            </div>
          </div>

          {/* Large Image Showcase Drawer */}
          <div id="recordPreviewArea" className="preview-area-large bg-[#FAF4EA] border border-[#ECDDB9] rounded-2xl p-3 h-44 flex flex-col justify-center items-center font-bold text-center text-xs shadow-inner select-none overflow-hidden relative">
            {getPreviewImage() ? (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <img
                  src={getPreviewImage()!}
                  alt="大图细节"
                  className="max-h-36 max-w-full object-contain rounded border border-white shadow bg-white"
                />
                <span className="absolute bottom-1 bg-black/60 text-white px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono">
                  {selectedPart?.type === 'original' ? '原图' : '截图'} - R{selectedPart!.rowId + 1}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Layers2 size={18} className="text-gold-deep/40 mb-1.5 animate-pulse" />
                <span className="text-xs text-[#A67020]">点击左侧缩略图即可查看大图</span>
                <span className="text-[10px] font-medium text-[#C59F67] mt-0.5">(快来点点我吧)</span>
              </div>
            )}
          </div>

        </div>

        {/* Pinned bottom action region */}
        <div className="export-button-area border-t border-[#DFD2BD]/40 pt-3 bg-transparent flex-shrink-0 space-y-3">
          {/* Traditional functional quick selectors buttons - Pinned here */}
          <div className="action-buttons grid grid-cols-2 gap-2">
            <button
              onClick={runAiMatch}
              id="aiMatchBtn"
              className="action-btn px-3 py-2 bg-[#F5F0E8] hover:bg-[#F0EAE0] border border-[#D4C4AA] text-[#8B6F47] rounded-xl text-xs font-bold tracking-wider hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
            >
              AI匹配
            </button>
            
            <button
              onClick={addWatermarkBase}
              id="addBaseBtn"
              className="action-btn px-3 py-2 bg-[#FCF5EA] hover:bg-[#FAF0E0] border border-[#EFE2D0] text-[#B58A3E] rounded-xl text-xs font-bold tracking-wider hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
            >
              加底
            </button>

            <button
              onClick={onRecallMock}
              id="recallBtn"
              className="action-btn px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              撤回
            </button>

            <button
              onClick={saveRecordsToLocal}
              id="recordSaveBtn"
              className="action-btn px-3 py-2 bg-[#FAF5FE] hover:bg-[#F5EBFC] border border-[#F0DDF9] text-[#AA51CB] rounded-xl text-xs font-bold tracking-wider hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save size={12} />
              保存
            </button>
          </div>

          <button
            onClick={exportBatchFiles}
            id="exportBtn"
            className="action-btn primary w-full py-3 bg-gradient-to-r from-[#D86B6B] to-[#C95B5B] hover:from-[#C95B5B] hover:to-[#B34A4A] text-white rounded-xl text-xs font-bold tracking-widest hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Download size={14} />
            输出加底素材并导出
          </button>
        </div>

      </div>

      {/* Log Sidebar Component */}
      <LogSidebar
        isOpen={isLogPanelOpen}
        setIsOpen={setIsLogPanelOpen}
        logs={recordLogs}
        onClearLogs={clearRecordLogs}
      />
    </div>
  );
}
