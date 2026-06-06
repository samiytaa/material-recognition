import React, { useRef, useState, useEffect, useMemo } from 'react';
import { RecordRow } from '../types';
import LogSidebar from './LogSidebar';
import {
  RecordTable,
  ScreenshotList,
  BatchOperationsBar,
  BasemapSettings,
  ActionButtons
} from './tab2';
import { Card, RecognitionProgressModal } from './common';
import { readFileAsDataURL, getFileNameWithoutExtension } from '../utils/fileHelper';
import {
  useBasemapGroups,
  useRowSelection,
  useScreenshotUpload,
  useProgressModal,
  type MapGroup
} from '../hooks';
import {
  buildIconLibrary,
  validateApiConfig,
  getExportStats,
  createUniqueFileNameGenerator,
  compositeImageWithBasemap,
  getReadyRowsCount
} from '../utils/tab2Helper';

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
  const targetCellRef = useRef<{ rowId: number; type: 'original' | 'screenshot' } | null>(null);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);

  // 截图上传管理
  const {
    uploadedScreenshots,
    handleBatchImageUpload,
    deleteScreenshot,
    clearAllScreenshots,
    addScreenshot,
    removeScreenshots
  } = useScreenshotUpload(addRecordLog);

  // 进度弹窗管理
  const {
    progressState: recognitionProgress,
    openProgress: openRecognitionProgress,
    updateProgress: updateRecognitionProgress,
    closeProgress: closeRecognitionProgress
  } = useProgressModal();

  const {
    progressState: exportProgress,
    openProgress: openExportProgress,
    updateProgress: updateExportProgress,
    closeProgress: closeExportProgress
  } = useProgressModal();

  // 筛选状态
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'matched' | 'unmatched'>('all');

  // 根据筛选条件过滤记录
  const filteredRecordList = useMemo(() => {
    if (screenshotFilter === 'all') return recordList;
    if (screenshotFilter === 'matched') return recordList.filter(row => row.screenshot !== null);
    return recordList.filter(row => row.screenshot === null);
  }, [recordList, screenshotFilter]);

  // 行选择管理
  const {
    selectedRowIds,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection
  } = useRowSelection(filteredRecordList);

  // 底图组管理
  const { groups: basemapGroups } = useBasemapGroups(addRecordLog);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [availableColors, setAvailableColors] = useState<string[]>(['金', '紫', '蓝', '绿', '咖']);
  const [enableContainScale, setEnableContainScale] = useState<boolean>(() => {
    const saved = localStorage.getItem('tab2_enableContainScale');
    return saved !== null ? saved === 'true' : true;
  });

  // 初始化底图组
  useEffect(() => {
    if (basemapGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(basemapGroups[0].id);
    }
  }, [basemapGroups, selectedGroupId]);

  // 更新可用底色
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

  // 自动保存到localStorage
  useEffect(() => {
    if (recordList.length > 0) {
      try {
        const compressedData = recordList.map(row => ({
          id: row.id,
          propName: row.propName,
          baseColor: row.baseColor,
          propType: row.propType,
          propCategory: row.propCategory,
          propRelated: row.propRelated,
          outputName: row.outputName,
          hasOriginalImage: row.originalImage !== null,
          hasScreenshot: row.screenshot !== null,
          hasPreview: row.previewWithBase !== null,
          originalImageFileName: row.originalImageFileName,
          screenshotOriginalName: row.screenshotOriginalName
        }));

        localStorage.setItem('tab2_recordList_compressed', JSON.stringify(compressedData));
      } catch (error) {
        console.error('保存失败:', error);
      }
    } else {
      localStorage.removeItem('tab2_recordList_compressed');
    }
  }, [recordList]);

  // 初始化日志
  useEffect(() => {
    addRecordLog(`ℹ Tab2已初始化（图片数据不再从本地存储加载，请从Tab1重新导入）`);
  }, []);

  // 批量删除选中的行
  const deleteSelectedRows = () => {
    if (selectedRowIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedRowIds.length} 行吗？`)) return;

    setRecordList(prev => prev.filter(row => !selectedRowIds.includes(row.id)));
    addRecordLog(`已批量删除 ${selectedRowIds.length} 行`);
    clearSelection();
  };

  // 批量删除选中行的游戏截图
  const deleteSelectedScreenshots = () => {
    if (selectedRowIds.length === 0) return;

    const rowsWithScreenshots = recordList.filter(
      row => selectedRowIds.includes(row.id) && row.screenshot !== null
    );

    if (rowsWithScreenshots.length === 0) {
      alert('选中的行中没有游戏截图');
      return;
    }

    if (!confirm(`确定要删除 ${rowsWithScreenshots.length} 张游戏截图吗？\n（不会删除行，只删除截图）`)) return;

    setRecordList(prev => {
      const updated = [...prev];
      selectedRowIds.forEach(selectedId => {
        const idx = updated.findIndex(r => r.id === selectedId);
        if (idx !== -1 && updated[idx].screenshot) {
          updated[idx] = {
            ...updated[idx],
            screenshot: null,
            screenshotOriginalName: undefined
          };
        }
      });
      return updated;
    });

    addRecordLog(`已批量删除 ${rowsWithScreenshots.length} 张游戏截图`);
  };

  // 单元格图片上传
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
      const fileName = getFileNameWithoutExtension(file.name);

      setRecordList(prev => {
        const updated = [...prev];
        if (type === 'screenshot') {
          updated[rowId] = {
            ...updated[rowId],
            screenshot: dataUrl,
            screenshotOriginalName: fileName
          };
        } else {
          updated[rowId] = {
            ...updated[rowId],
            originalImage: dataUrl,
            originalImageFileName: file.name
          };
        }
        return updated;
      });
      addRecordLog(`已上传第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}（${fileName}）`);
    }
  };

  // 退回截图
  const returnScreenshot = (rowId: number) => {
    const row = recordList[rowId];
    if (!row.screenshot) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有截图可退回`);
      return;
    }

    const screenshotName = row.screenshotOriginalName || row.propName || `截图_${Date.now()}`;
    addScreenshot({
      id: Date.now(),
      name: screenshotName,
      dataUrl: row.screenshot
    });

    setRecordList(prev => {
      const updated = [...prev];
      updated[rowId] = {
        ...updated[rowId],
        screenshot: null,
        screenshotOriginalName: undefined
      };
      return updated;
    });

    addRecordLog(`✓ 已将第 ${rowId + 1} 行的截图退回到待处理列表（${screenshotName}）`);
  };

  // 删除行的截图
  const deleteScreenshotFromRow = (rowId: number) => {
    const row = recordList[rowId];
    if (!row.screenshot) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有截图可删除`);
      return;
    }
    if (!confirm(`确定要删除第 ${rowId + 1} 行的游戏截图吗？`)) return;

    setRecordList(prev => {
      const updated = [...prev];
      updated[rowId] = {
        ...updated[rowId],
        screenshot: null,
        screenshotOriginalName: undefined
      };
      return updated;
    });

    addRecordLog(`✓ 已删除第 ${rowId + 1} 行的游戏截图`);
  };

  // 查看图片
  const viewRowImage = (rowId: number, type: 'original' | 'screenshot') => {
    setSelectedPart({ rowId, type });
    addRecordLog(`查看第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}`);
  };

  // AI识别
  const runAiMatch = async () => {
    if (uploadedScreenshots.length === 0) {
      alert('请先上传游戏截图再进行AI匹配');
      addRecordLog('AI匹配失败：没有待处理的截图');
      return;
    }

    // 验证API配置
    const apiValidation = validateApiConfig();
    if (!apiValidation.valid) {
      alert(apiValidation.error);
      addRecordLog('[错误] 请先配置API端点、Key并选择模型');
      return;
    }

    const { apiEndpoint, apiKey, selectedModel } = apiValidation.config!;

    // 构建icon库
    const iconLibrary = buildIconLibrary(recordList);
    if (iconLibrary.length === 0) {
      alert('表格中没有可用的道具icon！\n请先上传或添加道具icon到表格中。');
      addRecordLog('[错误] 表格中没有道具icon');
      return;
    }

    if (!confirm(`检测到 ${uploadedScreenshots.length} 张待处理截图\n将使用AI视觉识别匹配表格中的 ${iconLibrary.length} 个icon\n确定执行吗？`)) {
      return;
    }

    addRecordLog(`========================================`);
    addRecordLog(`[开始] 一键识别 ${uploadedScreenshots.length} 张截图`);
    addRecordLog(`[配置] icon库: 表格中的 ${iconLibrary.length} 个候选`);
    addRecordLog(`[配置] 批次大小: 最多5个icon/批次`);
    addRecordLog(`[配置] 串行处理: 避免匹配冲突`);

    openRecognitionProgress(uploadedScreenshots.length);

    const { runDirectVisionMatching } = await import('../utils/visionApiHelper');
    const matchedScreenshots: Array<{screenshotIndex: number; rowIndex: number; name: string; color: string}> = [];
    const failedList: string[] = [];
    const usedRowIndices = new Set<number>();
    let successCount = 0;
    let failCount = 0;

    // 串行处理每个截图
    for (let index = 0; index < uploadedScreenshots.length; index++) {
      const screenshot = uploadedScreenshots[index];
      updateRecognitionProgress(index, successCount, failCount, `正在处理: ${screenshot.name}`, `[${index + 1}/${uploadedScreenshots.length}] 开始处理 ${screenshot.name}`);
      addRecordLog(`[处理] 开始处理截图 ${index + 1}/${uploadedScreenshots.length}: ${screenshot.name}`);

      try {
        const availableIconLibrary = iconLibrary.filter(icon => !usedRowIndices.has(icon.rowIndex));

        if (availableIconLibrary.length === 0) {
          addRecordLog(`[处理] ✗ ${screenshot.name}: 所有icon已被使用`);
          failedList.push(`${screenshot.name} (原因: 无可用icon)`);
          failCount++;
          updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: 无可用icon`);
          continue;
        }

        addRecordLog(`[处理] 可用icon数: ${availableIconLibrary.length}/${iconLibrary.length}`);

        const base64 = screenshot.dataUrl.split(',')[1];
        const result = await runDirectVisionMatching(
          { endpoint: apiEndpoint, apiKey: apiKey, model: selectedModel },
          base64,
          availableIconLibrary.map(icon => ({
            id: icon.id,
            name: icon.name,
            base64: icon.base64,
            propName: icon.propName,
            propType: icon.propType,
            propCategory: icon.propCategory,
            propRelated: icon.propRelated
          })),
          (msg) => addRecordLog(`[处理] ${msg}`),
          5
        );

        if (result.success && result.color && result.iconIndex !== undefined && result.name) {
          if (result.iconIndex < 0 || result.iconIndex >= availableIconLibrary.length) {
            addRecordLog(`[处理] ✗ ${screenshot.name}: API返回的索引越界`);
            failedList.push(`${screenshot.name} (原因: API返回索引无效)`);
            failCount++;
            updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: 索引无效`);
            continue;
          }

          const matchedIcon = availableIconLibrary[result.iconIndex];
          const matchedRowIndex = matchedIcon.rowIndex;
          usedRowIndices.add(matchedRowIndex);

          matchedScreenshots.push({
            screenshotIndex: index,
            rowIndex: matchedRowIndex,
            name: result.name,
            color: result.color
          });

          successCount++;
          addRecordLog(`[处理] ✓ ${screenshot.name}: 匹配到第${matchedRowIndex + 1}行 (${matchedIcon.propName}) - ${result.name} - ${result.color}`);
          updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✓ ${screenshot.name} → ${result.name} (${result.color})`);
        } else {
          failedList.push(`${screenshot.name} (原因: ${result.error || '未知错误'})`);
          failCount++;
          addRecordLog(`[处理] ✗ ${screenshot.name}: ${result.error || '识别失败'}`);
          updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: ${result.error || '识别失败'}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        failedList.push(`${screenshot.name} (原因: ${errorMsg})`);
        failCount++;
        addRecordLog(`[处理] ✗ ${screenshot.name}: 异常 - ${errorMsg}`);
        updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: 异常`);
      }
    }

    // 更新表格
    const originalScreenshots = [...uploadedScreenshots];
    if (matchedScreenshots.length > 0) {
      setRecordList(prev => {
        const updated = [...prev];
        for (const match of matchedScreenshots) {
          const screenshot = originalScreenshots[match.screenshotIndex];
          if (screenshot) {
            updated[match.rowIndex] = {
              ...updated[match.rowIndex],
              screenshot: screenshot.dataUrl,
              screenshotOriginalName: screenshot.name,
              propName: match.name,
              baseColor: match.color,
              outputName: match.name
            };
          }
        }
        return updated;
      });

      const successfulScreenshotIds = matchedScreenshots.map(m => originalScreenshots[m.screenshotIndex].id);
      removeScreenshots(successfulScreenshotIds);
    }

    closeRecognitionProgress();
    hideProgressBar();

    addRecordLog(`========================================`);
    addRecordLog(`[完成] 识别结束`);
    addRecordLog(`[统计] 成功: ${successCount}，失败: ${failCount}，总计: ${uploadedScreenshots.length}`);

    if (successCount > 0) {
      addRecordLog(`[已移除] ${successCount} 张成功识别的截图已从待处理区域移除并填入表格`);
    }
    if (failCount > 0) {
      addRecordLog(`[保留] ${failCount} 张失败的截图保留在待处理区域`);
    }

    if (failedList.length > 0) {
      addRecordLog(`[失败列表]:`);
      failedList.forEach(item => addRecordLog(`  - ${item}`));
    }

    let alertMsg = `识别完成！\n成功: ${successCount} 张（已填入表格并移除）\n失败: ${failCount} 张（保留在待处理区域）`;
    if (matchedScreenshots.length > 0) {
      alertMsg += `\n\n成功的截图已自动移除，失败的截图保留可继续处理`;
    }
    if (failedList.length > 0) {
      alertMsg += `\n\n失败列表:\n${failedList.slice(0, 5).join('\n')}`;
      if (failedList.length > 5) {
        alertMsg += `\n...还有 ${failedList.length - 5} 个失败项`;
      }
    }
    alert(alertMsg);
  };

  // 加底处理
  const addWatermarkBase = () => {
    if (recordList.length === 0) {
      alert('请先上传图片或从Tab1导入后再加底');
      addRecordLog('加底失败：没有条目');
      return;
    }

    const readyRowsCount = getReadyRowsCount(recordList);
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
    const selectedGroup = basemapGroups.find(g => g.id === selectedGroupId);

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

      compositeImageWithBasemap(currentRow.originalImage!, basemapItem.image, enableContainScale)
        .then(compositeDataUrl => {
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
          const scaleMode = enableContainScale ? 'Contain等比' : '原始尺寸';
          addRecordLog(`[${processedCount}/${readyRowsCount}] 第 ${activeIdx + 1} 行加底完成（${currentRow.baseColor}/${scaleMode}）`);
          setTimeout(processNextBase, intervalTime);
        })
        .catch(() => {
          addRecordLog(`⚠ 第 ${activeIdx + 1} 行：加底失败，使用原图`);
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
        });
    };

    setTimeout(processNextBase, intervalTime);
  };

  // 导出批量文件
  const exportBatchFiles = async () => {
    const stats = getExportStats(recordList);
    addRecordLog(`========== 导出检查 ==========`);
    addRecordLog(`总记录数：${stats.totalRows}`);
    addRecordLog(`有加底预览图的：${stats.rowsWithPreview}`);
    addRecordLog(`有输出名称的：${stats.rowsWithOutputName}`);
    addRecordLog(`可导出的（同时满足两个条件）：${stats.exportRows.length}`);

    if (stats.exportRows.length === 0) {
      let reason = '';
      if (stats.rowsWithPreview === 0) {
        reason = '所有记录都没有加底预览图，请先点击【加底】按钮';
      } else if (stats.rowsWithOutputName === 0) {
        reason = '所有记录的输出名称都为空';
      } else {
        reason = '没有同时具备加底预览图和输出名称的记录';
      }
      alert(`没有可导出的数据\n\n原因：${reason}\n\n统计信息：\n- 总记录数：${stats.totalRows}\n- 有加底预览图：${stats.rowsWithPreview}\n- 有输出名称：${stats.rowsWithOutputName}`);
      addRecordLog(`导出失败：${reason}`);
      return;
    }

    if (!confirm(`检测到 ${stats.exportRows.length} 条可导出数据\n\n统计信息：\n- 总记录数：${stats.totalRows}\n- 有加底预览图：${stats.rowsWithPreview}\n- 有输出名称：${stats.rowsWithOutputName}\n\n确定导出为ZIP文件吗？`)) {
      addRecordLog('用户取消导出');
      return;
    }

    addRecordLog(`开始导出，共 ${stats.exportRows.length} 条数据...`);
    openExportProgress(stats.exportRows.length);

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const folder = zip.folder('加底图片');
      const getUniqueFileName = createUniqueFileNameGenerator();

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < stats.exportRows.length; i++) {
        const row = stats.exportRows[i];
        const fileName = row.outputName;

        updateExportProgress(
          i + 1,
          successCount,
          failCount,
          `正在处理: ${fileName}`,
          `[${i + 1}/${stats.exportRows.length}] ${fileName}`
        );

        try {
          if (row.previewWithBase) {
            const base64Data = row.previewWithBase.split(',')[1];
            const uniqueFileName = getUniqueFileName(fileName);
            folder?.file(uniqueFileName, base64Data, { base64: true });

            successCount++;
            addRecordLog(`[${i + 1}/${stats.exportRows.length}] 正在打包：${fileName}`);
          }
        } catch (error) {
          failCount++;
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          addRecordLog(`✗ ${fileName}: ${errorMsg}`);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `加底图片导出_${timestamp}.zip`;
      saveAs(blob, fileName);

      addRecordLog(`✓ 导出完成！共 ${successCount} 个文件已打包为ZIP`);

      setTimeout(() => {
        closeExportProgress();
        alert(`导出完成！\n\n成功: ${successCount}\n失败: ${failCount}\n\n文件已保存为: ${fileName}`);
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addRecordLog(`✗ 导出失败：${errorMsg}`);
      closeExportProgress();
      alert(`导出失败：${errorMsg}`);
    }
  };

  // 统计信息
  const exportReadyCount = recordList.filter(
    row => row.previewWithBase && row.outputName.trim() !== ''
  ).length;

  const matchedCount = recordList.filter(r => r.screenshot !== null).length;
  const unMatchedCount = recordList.length - matchedCount;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
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

      {/* 识别进度弹窗 */}
      <RecognitionProgressModal
        isOpen={recognitionProgress.isOpen}
        current={recognitionProgress.current}
        total={recognitionProgress.total}
        successCount={recognitionProgress.successCount}
        failCount={recognitionProgress.failCount}
        currentProcessing={recognitionProgress.currentProcessing}
        logs={recognitionProgress.logs}
      />

      {/* 导出进度弹窗 */}
      <RecognitionProgressModal
        isOpen={exportProgress.isOpen}
        current={exportProgress.current}
        total={exportProgress.total}
        successCount={exportProgress.successCount}
        failCount={exportProgress.failCount}
        currentProcessing={exportProgress.currentProcessing}
        logs={exportProgress.logs}
        title="正在导出中..."
      />

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden decorative-corners" padding="md">
        {/* 筛选器和操作栏 */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <BatchOperationsBar
            selectedCount={selectedRowIds.length}
            screenshotFilter={screenshotFilter}
            totalRecords={recordList.length}
            matchedCount={matchedCount}
            unMatchedCount={unMatchedCount}
            onScreenshotFilterChange={setScreenshotFilter}
            onDeleteSelectedRows={deleteSelectedRows}
            onDeleteSelectedScreenshots={deleteSelectedScreenshots}
          />

          <BasemapSettings
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
            enableContainScale={enableContainScale}
            onContainScaleChange={setEnableContainScale}
            addLog={addRecordLog}
          />
        </div>

        <div className="overflow-auto flex-1 border border-[#DFD2BD]/40 rounded-xl relative scrollbar-thin">
          <RecordTable
            records={filteredRecordList}
            availableColors={availableColors}
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            enableContainScale={enableContainScale}
            selectedRowIds={selectedRowIds}
            onToggleRowSelection={(filteredRowIndex, event) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              toggleRowSelection(rowId, event);
            }}
            onToggleSelectAll={toggleSelectAll}
            onViewImage={(filteredRowIndex, type) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              viewRowImage(originalRowIndex, type);
            }}
            onUploadImage={(filteredRowIndex, type) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              handleCellImageUpload(originalRowIndex, type);
            }}
            onUpdateRow={(filteredRowIndex, updates) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              setRecordList(prev => {
                const updated = [...prev];
                updated[originalRowIndex] = { ...updated[originalRowIndex], ...updates };
                return updated;
              });
              if (updates.baseColor) {
                addRecordLog(`第 ${originalRowIndex + 1} 行底色变更为: ${updates.baseColor}`);
              }
            }}
            onReturnScreenshot={(filteredRowIndex) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              returnScreenshot(originalRowIndex);
            }}
            onDeleteScreenshot={(filteredRowIndex) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              deleteScreenshotFromRow(originalRowIndex);
            }}
            onDeleteSelectedRows={deleteSelectedRows}
            onDeleteSelectedScreenshots={deleteSelectedScreenshots}
          />
        </div>
      </Card>

      <div className="w-full lg:w-80 flex flex-col gap-4 relative min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          <ScreenshotList
            screenshots={uploadedScreenshots}
            onDelete={deleteScreenshot}
            onClearAll={clearAllScreenshots}
          />
        </div>

        <ActionButtons
          uploadedScreenshotsCount={uploadedScreenshots.length}
          exportReadyCount={exportReadyCount}
          onRunAiMatch={runAiMatch}
          onExport={exportBatchFiles}
        />
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
