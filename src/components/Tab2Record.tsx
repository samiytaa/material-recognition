import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Sparkles, Layers, Download, Trash2 } from 'lucide-react';
import { RecordRow } from '../types';
import LogSidebar from './LogSidebar';
import { RecordTable, ScreenshotList } from './tab2';
import { UploadZone, Button, Card } from './common';
import { readFileAsDataURL, getFileNameWithoutExtension } from '../utils/fileHelper';
import categoryConfigModule from '../categoryConfig.json';

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
  const [isScreenshotListExpanded, setIsScreenshotListExpanded] = useState(true);
  
  // 选中行管理
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  
  // 切换行选择状态
  const toggleRowSelection = (rowId: number) => {
    setSelectedRowIds(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedRowIds.length === recordList.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(recordList.map((_, idx) => idx));
    }
  };
  
  // 批量删除选中的行
  const deleteSelectedRows = () => {
    if (selectedRowIds.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedRowIds.length} 行吗？`)) return;
    
    setRecordList(prev => prev.filter((_, idx) => !selectedRowIds.includes(idx)));
    addRecordLog(`已批量删除 ${selectedRowIds.length} 行`);
    setSelectedRowIds([]);
  };
  
  // 底图组相关状态
  const [basemapGroups, setBasemapGroups] = useState<MapGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [availableColors, setAvailableColors] = useState<string[]>(['金', '紫', '蓝', '绿', '咖']);
  
  // 从 categoryConfig 中提取所有分类
  const availableCategories = useMemo(() => {
    const categories: string[] = [];
    
    // 使用导入的 categoryConfig
    const config = categoryConfigModule;
    
    // 除家具以外的道具
    const nonFurniture = config['除家具以外的道具'] || {};
    for (const items of Object.values(nonFurniture)) {
      if (Array.isArray(items)) {
        categories.push(...items);
      }
    }
    
    // 家具相关分类
    const furniture = config['家具'] || {};
    
    // 套装
    if (Array.isArray(furniture['套装'])) {
      categories.push(...furniture['套装']);
    }
    
    // 自由装修
    const free = furniture['自由装修'];
    if (free) {
      for (const items of Object.values(free)) {
        if (Array.isArray(items)) {
          categories.push(...items);
        } else if (typeof items === 'object') {
          for (const subitems of Object.values(items)) {
            if (Array.isArray(subitems)) {
              categories.push(...subitems);
            }
          }
        }
      }
    }
    
    return Array.from(new Set(categories)).sort();
  }, []);
  
  // 从localStorage加载底图组配置
  useEffect(() => {
    const saved = localStorage.getItem('tab3_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBasemapGroups(parsed);
        if (parsed.length > 0) {
          setSelectedGroupId(parsed[0].id);
        }
      } catch (e) {
        console.error('加载底图组配置失败:', e);
      }
    }
  }, []);
  
  // 当选择的底图组变化时，更新可用底色列表
  useEffect(() => {
    if (selectedGroupId) {
      const selectedGroup = basemapGroups.find(g => g.id === selectedGroupId);
      if (selectedGroup) {
        const colors = selectedGroup.thumbnails.map(item => item.color);
        setAvailableColors(colors.length > 0 ? colors : ['金', '紫', '蓝', '绿', '咖']);
        addRecordLog(`切换底图组：${selectedGroup.name}（${colors.length}个底色）`);
      }
    }
  }, [selectedGroupId, basemapGroups]);
  
  // 独立存储上传的截图，不直接加入表格
  const [uploadedScreenshots, setUploadedScreenshots] = useState<Array<{
    id: number;
    name: string;
    dataUrl: string;
  }>>([]);

  // Track target cells being modified by file uploads
  const targetCellRef = useRef<{ rowId: number; type: 'original' | 'screenshot' } | null>(null);

  // Large image viewing helper
  const viewRowImage = (rowId: number, type: 'original' | 'screenshot') => {
    setSelectedPart({ rowId, type });
    addRecordLog(`查看第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}`);
  };

  const getPreviewImage = () => {
    if (!selectedPart) return null;
    const row = recordList[selectedPart.rowId];
    if (selectedPart.type === 'original') return row.originalImage;
    if (selectedPart.type === 'screenshot') return row.screenshot;
    return null;
  };

  const handleBatchImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const existingNames = new Set(uploadedScreenshots.map(s => s.name));
    const filesToUpload = fileArray.filter(file => {
      const nameWithoutExt = getFileNameWithoutExtension(file.name);
      return !existingNames.has(nameWithoutExt);
    });

    const duplicateCount = fileArray.length - filesToUpload.length;
    if (duplicateCount > 0) {
      addRecordLog(`⚠ 跳过 ${duplicateCount} 个重复文件名的截图`);
    }

    if (filesToUpload.length === 0) {
      addRecordLog('所有截图均已存在，未上传新文件');
      return;
    }

    addRecordLog(`开始上传 ${filesToUpload.length} 张游戏截图...`);
    showProgressBar();

    const newScreenshots: Array<{id: number; name: string; dataUrl: string}> = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const dataUrl = await readFileAsDataURL(file);
      const nameWithoutExt = getFileNameWithoutExtension(file.name);

      newScreenshots.push({
        id: Date.now() + i,
        name: nameWithoutExt,
        dataUrl: dataUrl
      });

      updateProgress(i + 1, filesToUpload.length);
      addRecordLog(`[${i + 1}/${filesToUpload.length}] 导入游戏截图: ${file.name}`);
    }

    setUploadedScreenshots(prev => [...prev, ...newScreenshots]);
    hideProgressBar();
    addRecordLog(`✓ 游戏截图批量上传完成，已添加 ${newScreenshots.length} 张截图`);
  };

  const handleCellImageUpload = (rowId: number, type: 'original' | 'screenshot') => {
    targetCellRef.current = { rowId, type };
    if (type === 'original') {
      fileInputRef1.current?.click();
    } else {
      fileInputRef2.current?.click();
    }
  };

  const onCellFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'screenshot') => {
    const file = e.target.files?.[0];
    if (file && targetCellRef.current) {
      const { rowId } = targetCellRef.current;
      const dataUrl = await readFileAsDataURL(file);
      setRecordList(prev => {
        const updated = [...prev];
        updated[rowId] = {
          ...updated[rowId],
          [type === 'original' ? 'originalImage' : 'screenshot']: dataUrl
        };
        return updated;
      });
      addRecordLog(`已上传第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}`);
    }
  };

  // Delete a single screenshot from uploaded list
  const deleteScreenshot = (id: number) => {
    const screenshot = uploadedScreenshots.find(s => s.id === id);
    if (screenshot && confirm(`确定要删除截图"${screenshot.name}"吗？`)) {
      setUploadedScreenshots(prev => prev.filter(s => s.id !== id));
      addRecordLog(`已删除截图：${screenshot.name}`);
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

  // Simulated AI match algorithm - now processes uploaded screenshots
  const runAiMatch = () => {
    // 优先处理上传的截图
    if (uploadedScreenshots.length > 0) {
      if (!confirm(`检测到 ${uploadedScreenshots.length} 张待处理截图\n确定执行AI匹配吗？`)) {
        return;
      }

      addRecordLog(`开始AI匹配，共 ${uploadedScreenshots.length} 张截图...`);
      showProgressBar();

      let processedCount = 0;
      const mockNames = ['寒潭桥', '米拱门', '莲心泉', '雕花屏风', '锦绣帷幔', '青瓷花瓶'];
      const mockColors = availableColors.length > 0 ? availableColors : ['金', '紫', '蓝', '绿', '咖'];
      const mockCategories = availableCategories.length > 0 ? availableCategories : ['起居', '置物', '装饰', '挂件', '男主元素', '密探礼物'];

      const intervalTime = 300;
      const newRows: RecordRow[] = [];

      const processNext = () => {
        if (processedCount >= uploadedScreenshots.length) {
          // 将新行添加到表格
          setRecordList(prev => [...prev, ...newRows]);
          // 清空已处理的截图
          setUploadedScreenshots([]);
          hideProgressBar();
          addRecordLog(`✓ AI匹配完成！已处理 ${uploadedScreenshots.length} 张截图并加入表格`);
          alert(`AI匹配完成！\n已将 ${uploadedScreenshots.length} 张截图加入表格`);
          return;
        }

        const screenshot = uploadedScreenshots[processedCount];
        const selectedName = mockNames[Math.floor(Math.random() * mockNames.length)];
        const selectedColor = mockColors[Math.floor(Math.random() * mockColors.length)];
        const selectedCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];

        newRows[processedCount] = {
          id: screenshot.id,
          originalImage: null,
          screenshot: screenshot.dataUrl,
          propName: screenshot.name,
          baseColor: selectedColor,
          category: selectedCategory,
          previewWithBase: null,
          outputName: `${screenshot.name}_${selectedColor}`
        };

        processedCount++;
        updateProgress(processedCount, uploadedScreenshots.length);
        addRecordLog(`[${processedCount}/${uploadedScreenshots.length}] 匹配截图：${screenshot.name} - ${selectedColor} - ${selectedCategory}`);

        setTimeout(processNext, intervalTime);
      };

      setTimeout(processNext, intervalTime);
      return;
    }

    // 如果没有待处理截图，则处理表格中已有的数据
    if (recordList.length === 0) {
      alert('请先上传截图再进行AI匹配');
      addRecordLog('AI匹配失败：没有待处理的截图');
      return;
    }

    const filledRowsCount = recordList.filter(row => row.originalImage !== null).length;
    if (filledRowsCount === 0) {
      alert('表格中没有可匹配的图片');
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
    const mockColors = availableColors.length > 0 ? availableColors : ['金', '紫', '蓝', '绿', '咖'];
    const mockCategories = availableCategories.length > 0 ? availableCategories : ['起居', '置物', '装饰', '挂件', '男主元素', '密探礼物'];

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

  // Custom watermark background addition - now saves the preview to previewWithBase
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

    if (!selectedGroupId) {
      alert('请先选择底图组');
      addRecordLog('加底失败：未选择底图组');
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
        hideProgressBar();
        addRecordLog(`✓ 加底处理完成！已处理 ${readyRowsCount} 条记录`);
        alert(`加底处理完成！\n已生成 ${readyRowsCount} 张预览图`);
        return;
      }

      const currentRow = recordList[activeIdx];
      const selectedGroup = basemapGroups.find(g => g.id === selectedGroupId);
      const basemapItem = selectedGroup?.thumbnails.find(item => item.color === currentRow.baseColor);

      if (!basemapItem) {
        addRecordLog(`⚠ 第 ${activeIdx + 1} 行：未找到底色"${currentRow.baseColor}"的底图，跳过加底`);
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
        setTimeout(processNextBase, intervalTime);
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
        
        ctx!.drawImage(baseImg, 0, 0);
        
        const propImg = new Image();
        propImg.onload = () => {
          const scale = Math.min(canvas.width / propImg.width, canvas.height / propImg.height) * 0.8;
          const scaledWidth = propImg.width * scale;
          const scaledHeight = propImg.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          ctx!.drawImage(propImg, x, y, scaledWidth, scaledHeight);
          
          const compositeDataUrl = canvas.toDataURL('image/png');
          
          setRecordList(prev => {
            const updated = [...prev];
            updated[activeIdx] = {
              ...updated[activeIdx],
              previewWithBase: compositeDataUrl
            };
            return updated;
          });

          processedCount++;
          updateProgress(processedCount, readyRowsCount);
          addRecordLog(`[${processedCount}/${readyRowsCount}] 第 ${activeIdx + 1} 行加底完成（${currentRow.baseColor}）`);

          setTimeout(processNextBase, intervalTime);
        };
        propImg.onerror = () => {
          addRecordLog(`⚠ 第 ${activeIdx + 1} 行：原图加载失败，使用原图`);
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
          setTimeout(processNextBase, intervalTime);
        };
        propImg.src = currentRow.originalImage!;
      };
      baseImg.onerror = () => {
        addRecordLog(`⚠ 第 ${activeIdx + 1} 行：底图加载失败，使用原图`);
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
        setTimeout(processNextBase, intervalTime);
      };
      baseImg.src = basemapItem.image;
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



  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      <input type="file" accept="image/*" ref={fileInputRef1} onChange={(e) => onCellFileChange(e, 'original')} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputRef2} onChange={(e) => onCellFileChange(e, 'screenshot')} className="hidden" />

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden decorative-corners" padding="md">
        {/* 底图组选择器和批量删除按钮 */}
        <div className="mb-3 flex items-center gap-2">
          {/* 批量删除按钮 */}
          {selectedRowIds.length > 0 && (
            <button
              onClick={deleteSelectedRows}
              className="px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-md transition-colors flex items-center gap-1 shadow-sm"
              title={`删除选中的 ${selectedRowIds.length} 行`}
            >
              <Trash2 size={14} />
              ({selectedRowIds.length})
            </button>
          )}
          
          {basemapGroups.length > 0 && (
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-semibold text-[#674b2d] whitespace-nowrap">
                选择底图组：
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 bg-white border border-[#DFD2BD] rounded-md outline-none font-medium text-[#674b2d] hover:border-[#8B6F47] focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47] transition-colors"
              >
                {basemapGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.thumbnails.length}个底色)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="overflow-auto flex-1 border border-[#DFD2BD]/40 rounded-xl relative scrollbar-thin">
          <RecordTable
            records={recordList}
            availableColors={availableColors}
            availableCategories={availableCategories}
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            selectedRowIds={selectedRowIds}
            onToggleRowSelection={toggleRowSelection}
            onToggleSelectAll={toggleSelectAll}
            onViewImage={viewRowImage}
            onUploadImage={handleCellImageUpload}
            onUpdateRow={(rowId, updates) => {
              setRecordList(prev => {
                const updated = [...prev];
                updated[rowId] = { ...updated[rowId], ...updates };
                return updated;
              });
              if (updates.baseColor) {
                addRecordLog(`第 ${rowId + 1} 行底色变更为: ${updates.baseColor}`);
              }
              if (updates.category) {
                addRecordLog(`第 ${rowId + 1} 行分类变更为: ${updates.category}`);
              }
            }}
          />
        </div>
      </Card>

      <div className="w-full lg:w-80 flex flex-col gap-3 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <Card className="overflow-hidden" padding="none">
            <UploadZone
              onFilesSelected={handleBatchImageUpload}
              text="支持拖入游戏截图"
              subText={uploadedScreenshots.length > 0 ? `已上传 ${uploadedScreenshots.length} 张截图` : '或点击窗口选择图片文件'}
            />
          </Card>

          <ScreenshotList
            screenshots={uploadedScreenshots}
            isExpanded={isScreenshotListExpanded}
            onToggleExpand={() => setIsScreenshotListExpanded(!isScreenshotListExpanded)}
            onDelete={deleteScreenshot}
          />

          {selectedPart && getPreviewImage() && (
            <div className="bg-white border border-[#DFD2BD]/60 rounded-xl shadow-sm overflow-hidden">
              <div className="p-3 bg-[#FAF8F4] border-b border-[#E9DFDB]">
                <h3 className="text-xs font-bold text-[#674b2d]">
                  大图预览 - 第 {selectedPart.rowId + 1} 行 {selectedPart.type === 'original' ? '道具icon' : '游戏截图'}
                </h3>
              </div>
              <div className="p-4 flex items-center justify-center bg-white max-h-[300px]">
                <img
                  src={getPreviewImage()!}
                  alt="预览"
                  className="max-w-full max-h-64 object-contain rounded"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={runAiMatch} icon={Sparkles} variant="primary" className="w-full">AI自动匹配</Button>
            <Button onClick={addWatermarkBase} icon={Layers} variant="success" className="w-full">一键加底</Button>
            <Button onClick={exportBatchFiles} icon={Download} variant="warning" className="w-full">导出文件</Button>
          </div>
        </div>
      </div>

      <LogSidebar
        isOpen={isLogPanelOpen}
        setIsOpen={setIsLogPanelOpen}
        logs={recordLogs}
        onClearLogs={clearRecordLogs}
      />
    </div>
  );
}
