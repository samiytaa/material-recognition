import React, { useRef, useState, useEffect, useMemo } from 'react';
import { PropItem, RecordRow, ScreenshotPrimaryCategory } from '../types';
import { readFileAsDataURL, getFileNameWithoutExtension } from '../utils/fileHelper';
import {
  useBasemapGroups,
  useRowSelection,
  useProgressModal,
  useTab2IconLibraryCount,
  useTab2RecordPersistence
} from '../hooks';
import {
  validateApiConfig,
  getExportStats,
  createUniqueFileNameGenerator,
  compositeImageWithBasemap,
  getReadyRowsCount,
  DEFAULT_SCREENSHOT_CATEGORY,
  SCREENSHOT_CATEGORY_OPTIONS,
  getIconPrimaryCategory
} from '../utils/tab2Helper';
import {
  deleteTab2Screenshot,
  saveTab2Screenshot
} from '../utils/tab2ScreenshotStorage';

export interface Tab2RecordControllerProps {
  recordList: RecordRow[];
  setRecordList: React.Dispatch<React.SetStateAction<RecordRow[]>>;
  propsList: PropItem[];
  setPropsList: React.Dispatch<React.SetStateAction<PropItem[]>>;
  recordLogs: string[];
  addRecordLog: (msg: string) => void;
  clearRecordLogs: () => void;
  showProgressBar: () => void;
  hideProgressBar: () => void;
  updateProgress: (current: number, total: number) => void;
  selectedPart: { rowId: number; type: 'original' | 'screenshot' } | null;
  setSelectedPart: (val: { rowId: number; type: 'original' | 'screenshot' } | null) => void;
}

function normalizeUploadFileName(fileName: string): string {
  return getFileNameWithoutExtension(fileName).trim().toLowerCase();
}

function getRowMatchedName(row: RecordRow): string | undefined {
  return row.matchedPropFileName || row.originalImageFileName;
}

const MAX_TAB2_RECORDS = 20;

export function useTab2RecordController({
  recordList,
  setRecordList,
  propsList,
  setPropsList,
  recordLogs,
  addRecordLog,
  clearRecordLogs,
  showProgressBar,
  hideProgressBar,
  updateProgress,
  selectedPart,
  setSelectedPart
}: Tab2RecordControllerProps) {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const targetCellRef = useRef<{ rowId: number; type: 'original' | 'screenshot' } | null>(null);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [selectedScreenshotCategory, setSelectedScreenshotCategory] = useState<ScreenshotPrimaryCategory>(DEFAULT_SCREENSHOT_CATEGORY);
  const [exportModeModalOpen, setExportModeModalOpen] = useState(false);

  const savePropsToLocal = (props: PropItem[]) => {
    localStorage.setItem('savedProps', JSON.stringify(props.filter(prop => prop.image !== null)));
  };

  const findMatchedProp = (row: RecordRow) => {
    const matchedName = getRowMatchedName(row);
    if (!matchedName) return null;
    return propsList.find(prop => prop.name === matchedName || prop.name === getFileNameWithoutExtension(matchedName)) || null;
  };

  const getIconStatus = (row: RecordRow): 'none' | 'ai' | 'confirmed' => {
    const prop = findMatchedProp(row);
    if (!prop) return row.originalImage ? 'ai' : 'none';
    const tags = prop.tags || [];
    if (tags.includes('已确认')) return 'confirmed';
    if (tags.includes('AI匹配')) return 'ai';
    return row.originalImage ? 'ai' : 'none';
  };

  const updateMatchedPropTags = (
    row: RecordRow,
    updater: (tags: PropItem['tags']) => PropItem['tags']
  ): boolean => {
    const matchedName = getRowMatchedName(row);
    if (!matchedName) {
      addRecordLog(`[调试-标签更新] 失败: matchedName为空`);
      return false;
    }

    addRecordLog(`[调试-标签更新] 查找matchedName: "${matchedName}"`);

    const hasMatch = propsList.some(
      prop => prop.name === matchedName || prop.name === getFileNameWithoutExtension(matchedName)
    );
    
    if (!hasMatch) {
      addRecordLog(`[调试-标签更新] 失败: 在propsList中未找到匹配`);
      addRecordLog(`[调试-标签更新] propsList中的前5个名称: ${propsList.slice(0, 5).map(p => p.name).join(', ')}`);
      return false;
    }

    setPropsList(prev => {
      const updatedProps = prev.map(prop => {
        if (prop.name !== matchedName && prop.name !== getFileNameWithoutExtension(matchedName)) return prop;
        addRecordLog(`[调试-标签更新] 成功匹配prop.name="${prop.name}"`);
        return {
          ...prop,
          tags: updater(prop.tags || [])
        };
      });
      savePropsToLocal(updatedProps);
      return updatedProps;
    });
    return true;
  };

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

  // 批量上传截图 - 直接生成表格条目
  const handleBatchScreenshotUpload = async (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      addRecordLog('没有检测到有效的图片文件');
      return;
    }

    const remainingRecordSlots = Math.max(MAX_TAB2_RECORDS - recordList.length, 0);
    if (remainingRecordSlots === 0) {
      addRecordLog(`⚠ Tab2 条目已达上限 ${MAX_TAB2_RECORDS} 个，本次未导入截图`);
      alert(`Tab2 最多只能保留 ${MAX_TAB2_RECORDS} 个条目。\n\n当前已有 ${recordList.length} 个条目，无法继续上传截图。请先删除或导出部分条目后再追加。`);
      return;
    }

    const existingScreenshotNames = new Set(
      recordList
        .filter(row => row.screenshot && row.screenshotOriginalName)
        .map(row => normalizeUploadFileName(row.screenshotOriginalName!))
    );
    const acceptedFiles: File[] = [];
    const batchNames = new Set<string>();
    const skippedDuplicateFiles: string[] = [];

    for (const file of fileArray) {
      const normalizedName = normalizeUploadFileName(file.name);
      if (existingScreenshotNames.has(normalizedName) || batchNames.has(normalizedName)) {
        skippedDuplicateFiles.push(file.name);
        continue;
      }

      batchNames.add(normalizedName);
      acceptedFiles.push(file);
    }

    const overLimitCount = Math.max(acceptedFiles.length - remainingRecordSlots, 0);
    const filesWithinLimit = acceptedFiles.slice(0, remainingRecordSlots);

    if (skippedDuplicateFiles.length > 0) {
      addRecordLog(`⚠ 检测到 ${skippedDuplicateFiles.length} 张重复截图，已自动跳过：${skippedDuplicateFiles.slice(0, 5).join('、')}${skippedDuplicateFiles.length > 5 ? '...' : ''}`);
    }

    if (overLimitCount > 0) {
      addRecordLog(`⚠ Tab2 最多 ${MAX_TAB2_RECORDS} 个条目，当前已有 ${recordList.length} 个；本次仅导入前 ${filesWithinLimit.length} 张，跳过 ${overLimitCount} 张超出上限的截图`);
    }

    if (filesWithinLimit.length === 0) {
      addRecordLog('所有截图均为重复文件，未上传任何图片');
      alert(`所有截图均为重复文件，未上传任何图片。\n\n重复文件：\n${skippedDuplicateFiles.slice(0, 8).join('\n')}`);
      return;
    }

    addRecordLog(`开始上传 ${filesWithinLimit.length} 张游戏截图${skippedDuplicateFiles.length > 0 ? `（跳过 ${skippedDuplicateFiles.length} 张重复）` : ''}${overLimitCount > 0 ? `（跳过 ${overLimitCount} 张超出上限）` : ''}...`);

    const newRecords: RecordRow[] = [];
    let nextId = recordList.length > 0 ? Math.max(...recordList.map(r => r.id)) + 1 : 0;

    for (let i = 0; i < filesWithinLimit.length; i++) {
      const file = filesWithinLimit[i];
      const dataUrl = await readFileAsDataURL(file);
      const fileName = getFileNameWithoutExtension(file.name);
      const rowId = nextId++;

      const newRecord: RecordRow = {
        id: rowId,
        originalImage: null,
        originalImageFileName: undefined,
        screenshot: dataUrl,
        screenshotOriginalName: fileName,
        screenshotCategory: selectedScreenshotCategory,
        propName: '',
        baseColor: '金',
        propType: '',
        propCategory: '',
        propRelated: '',
        previewWithBase: null,
        outputName: ''
      };

      newRecords.push(newRecord);
      saveTab2Screenshot(rowId, dataUrl).catch(error => {
        addRecordLog(`⚠ 第 ${rowId + 1} 行截图记忆保存失败: ${error}`);
      });
      addRecordLog(`[${i + 1}/${filesWithinLimit.length}] 导入游戏截图: ${file.name}`);
    }

    setRecordList(prev => [...prev, ...newRecords]);
    addRecordLog(`✓ 成功添加 ${newRecords.length} 个${selectedScreenshotCategory}条目到表格（待识别）`);
    alert(`成功上传 ${newRecords.length} 张截图！${skippedDuplicateFiles.length > 0 ? `\n已跳过重复：${skippedDuplicateFiles.length} 张` : ''}${overLimitCount > 0 ? `\n因条目上限 ${MAX_TAB2_RECORDS} 个，已跳过超出部分：${overLimitCount} 张` : ''}\n分类：${selectedScreenshotCategory}\n\n已生成 ${newRecords.length} 个新条目，请点击【一键识别】进行AI识别和icon匹配。`);
  };

  // 筛选状态
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'matched' | 'unmatched'>('all');

  // 根据筛选条件过滤记录
  const filteredRecordList = useMemo(() => {
    if (screenshotFilter === 'all') return recordList;
    if (screenshotFilter === 'matched') return recordList.filter(row => row.originalImage !== null);
    return recordList.filter(row => row.originalImage === null);
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

  useTab2RecordPersistence({
    recordList,
    setRecordList,
    propsList,
    addRecordLog
  });

  const iconLibraryCount = useTab2IconLibraryCount(addRecordLog);

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
      const fileName = getFileNameWithoutExtension(file.name);

      if (type === 'screenshot') {
        const normalizedName = normalizeUploadFileName(file.name);
        const duplicatedRowIndex = recordList.findIndex((row, index) =>
          index !== rowId &&
          row.screenshot &&
          row.screenshotOriginalName &&
          normalizeUploadFileName(row.screenshotOriginalName) === normalizedName
        );

        if (duplicatedRowIndex !== -1) {
          addRecordLog(`⚠ 第 ${rowId + 1} 行截图上传已跳过：${file.name} 与第 ${duplicatedRowIndex + 1} 行重复`);
          alert(`截图文件名重复，已跳过上传。\n\n重复文件：${file.name}\n已存在于第 ${duplicatedRowIndex + 1} 行。`);
          e.target.value = '';
          return;
        }
      }

      const dataUrl = await readFileAsDataURL(file);

      setRecordList(prev => {
        const updated = [...prev];
        if (type === 'screenshot') {
          updated[rowId] = {
            ...updated[rowId],
            screenshot: dataUrl,
            screenshotOriginalName: fileName,
            screenshotCategory: updated[rowId].screenshotCategory || selectedScreenshotCategory
          };
        } else {
          const matchedProp = propsList.find(prop =>
            prop.name === file.name ||
            prop.name === fileName ||
            getFileNameWithoutExtension(prop.name) === fileName
          );

          updated[rowId] = {
            ...updated[rowId],
            originalImage: dataUrl,
            originalImageFileName: file.name,
            matchedPropFileName: matchedProp?.name,
            propName: updated[rowId].propName || matchedProp?.displayName || '',
            propType: updated[rowId].propType || (matchedProp ? (matchedProp.type === 'furniture' ? '家具' : '其他道具') : ''),
            propCategory: updated[rowId].propCategory || matchedProp?.category || '',
            propRelated: updated[rowId].propRelated || (matchedProp?.ownership?.type === 'male_lead' && matchedProp.ownership.name
              ? `男主-${matchedProp.ownership.name}`
              : matchedProp?.ownership?.type === 'spy' && matchedProp.ownership.name
              ? `密探-${matchedProp.ownership.name}`
              : ''),
            outputName: updated[rowId].outputName || matchedProp?.displayName || ''
          };
        }
        return updated;
      });
      if (type === 'screenshot') {
        saveTab2Screenshot(recordList[rowId].id, dataUrl).catch(error => {
          addRecordLog(`⚠ 第 ${rowId + 1} 行截图记忆保存失败: ${error}`);
        });
      }
      addRecordLog(`已上传第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}（${fileName}）`);
      e.target.value = '';
    }
  };

  // 删除单个游戏截图时移除整条条目
  const deleteScreenshotFromRow = (rowId: number) => {
    const row = recordList[rowId];
    if (!row.screenshot) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有截图可删除`);
      return;
    }
    if (!confirm(`确定要删除第 ${rowId + 1} 行的游戏截图吗？\n\n此操作会移除整条条目，无法撤销。`)) return;

    setRecordList(prev => prev.filter(item => item.id !== row.id));

    deleteTab2Screenshot(row.id).catch(error => {
      addRecordLog(`⚠ 第 ${rowId + 1} 行截图记忆删除失败: ${error}`);
    });

    if (selectedPart && recordList[selectedPart.rowId]?.id === row.id) {
      setSelectedPart(null);
    }

    clearSelection();
    addRecordLog(`✓ 已删除第 ${rowId + 1} 行游戏截图及整条条目`);
  };

  // 查看图片
  const viewRowImage = (rowId: number, type: 'original' | 'screenshot') => {
    setSelectedPart({ rowId, type });
    addRecordLog(`查看第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}`);
  };

  const confirmRowIcon = (rowId: number) => {
    const row = recordList[rowId];
    if (!row?.originalImage) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有可确认的icon`);
      return;
    }

    addRecordLog(`[调试-确认] 第 ${rowId + 1} 行信息:`);
    addRecordLog(`[调试-确认]   - originalImageFileName: ${row.originalImageFileName}`);
    addRecordLog(`[调试-确认]   - matchedPropFileName: ${row.matchedPropFileName}`);
    addRecordLog(`[调试-确认]   - propName: ${row.propName}`);

    const updated = updateMatchedPropTags(
      row,
      (tags = []) => Array.from(new Set([...tags, 'AI匹配' as const, '已确认' as const]))
    );

    if (!updated) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行未找到对应Tab1 icon，无法写入确认标签`);
      addRecordLog(`[调试-确认] 查找失败，matchedPropFileName = ${row.matchedPropFileName || row.originalImageFileName}`);
      return;
    }

    addRecordLog(`✓ 第 ${rowId + 1} 行icon已确认：${row.propName || row.originalImageFileName || '未命名'}`);
  };

  const returnRowIcon = (rowId: number) => {
    const row = recordList[rowId];
    if (!row?.originalImage) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有可退回的icon`);
      return;
    }

    addRecordLog(`[调试-退回] 第 ${rowId + 1} 行信息:`);
    addRecordLog(`[调试-退回]   - originalImageFileName: ${row.originalImageFileName}`);
    addRecordLog(`[调试-退回]   - matchedPropFileName: ${row.matchedPropFileName}`);

    const updated = updateMatchedPropTags(
      row,
      (tags = []) => tags.filter(tag => tag !== 'AI匹配' && tag !== '已确认')
    );

    setRecordList(prev => {
      const updatedRows = [...prev];
      updatedRows[rowId] = {
        ...updatedRows[rowId],
        originalImage: null,
        originalImageFileName: undefined,
        matchedPropFileName: undefined,
        propName: '',
        propType: '',
        propCategory: '',
        propRelated: '',
        previewWithBase: null,
        outputName: ''
      };
      return updatedRows;
    });

    addRecordLog(
      updated
        ? `↩ 第 ${rowId + 1} 行icon已退回，已移除Tab1标签并恢复为待识别`
        : `↩ 第 ${rowId + 1} 行icon已退回，未找到对应Tab1标签记录`
    );
  };

  const getSelectedRowsWithIndex = () =>
    recordList
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => selectedRowIds.includes(row.id));

  const handleBatchConfirmSelected = () => {
    const selectedRows = getSelectedRowsWithIndex();
    if (selectedRows.length === 0) return;

    const confirmableRows = selectedRows.filter(({ row }) => row.originalImage);
    const matchedNames = new Set(
      confirmableRows
        .map(({ row }) => getRowMatchedName(row))
        .filter((name): name is string => Boolean(name))
    );

    const matchedRows = confirmableRows.filter(({ row }) => {
      const matchedName = getRowMatchedName(row);
      if (!matchedName) return false;
      return propsList.some(prop => prop.name === matchedName || prop.name === getFileNameWithoutExtension(matchedName));
    });

    if (matchedRows.length === 0) {
      alert('选中条目中没有可确认的icon。');
      addRecordLog('批量确认失败：选中条目中没有可确认的icon');
      return;
    }

    setPropsList(prev => {
      const updatedProps = prev.map(prop => {
        const matched = Array.from(matchedNames).some(
          name => prop.name === name || prop.name === getFileNameWithoutExtension(name)
        );
        if (!matched) return prop;
        return {
          ...prop,
          tags: Array.from(new Set([...(prop.tags || []), 'AI匹配' as const, '已确认' as const]))
        };
      });
      savePropsToLocal(updatedProps);
      return updatedProps;
    });

    clearSelection();
    addRecordLog(`✓ 已批量确认 ${matchedRows.length} 个条目${confirmableRows.length > matchedRows.length ? `（${confirmableRows.length - matchedRows.length} 个未找到Tab1 icon）` : ''}`);
  };

  const handleBatchReturnSelected = () => {
    const selectedRows = getSelectedRowsWithIndex();
    if (selectedRows.length === 0) return;

    const returnableRows = selectedRows.filter(({ row }) => row.originalImage);
    if (returnableRows.length === 0) {
      alert('选中条目中没有可退回的icon。');
      addRecordLog('批量退回失败：选中条目中没有可退回的icon');
      return;
    }

    const matchedNames = new Set(
      returnableRows
        .map(({ row }) => getRowMatchedName(row))
        .filter((name): name is string => Boolean(name))
    );

    setPropsList(prev => {
      const updatedProps = prev.map(prop => {
        const matched = Array.from(matchedNames).some(
          name => prop.name === name || prop.name === getFileNameWithoutExtension(name)
        );
        if (!matched) return prop;
        return {
          ...prop,
          tags: (prop.tags || []).filter(tag => tag !== 'AI匹配' && tag !== '已确认')
        };
      });
      savePropsToLocal(updatedProps);
      return updatedProps;
    });

    const returnableIds = new Set(returnableRows.map(({ row }) => row.id));
    setRecordList(prev => prev.map(row => {
      if (!returnableIds.has(row.id)) return row;
      return {
        ...row,
        originalImage: null,
        originalImageFileName: undefined,
        matchedPropFileName: undefined,
        propName: '',
        propType: '',
        propCategory: '',
        propRelated: '',
        previewWithBase: null,
        outputName: ''
      };
    }));

    clearSelection();
    addRecordLog(`↩ 已批量退回 ${returnableRows.length} 个条目，已恢复为待识别`);
  };

  const handleBatchDeleteSelected = () => {
    const selectedRows = getSelectedRowsWithIndex();
    if (selectedRows.length === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedRows.length} 个条目吗？\n\n此操作会删除整行条目，无法撤销。`)) {
      return;
    }

    const selectedIds = new Set(selectedRows.map(({ row }) => row.id));
    setRecordList(prev => prev.filter(row => !selectedIds.has(row.id)));

    selectedRows
      .filter(({ row }) => row.screenshot)
      .forEach(({ row, index }) => {
        deleteTab2Screenshot(row.id).catch(error => {
          addRecordLog(`⚠ 第 ${index + 1} 行截图记忆删除失败: ${error}`);
        });
      });

    if (selectedPart && selectedIds.has(recordList[selectedPart.rowId]?.id)) {
      setSelectedPart(null);
    }

    clearSelection();
    addRecordLog(`✓ 已删除 ${selectedRows.length} 个选中条目`);
  };

  // AI识别（新逻辑：识别已上传的截图，从icon库匹配并填充）
  const runAiMatch = async () => {
    // 找出所有有截图但没有icon的条目
    const unprocessedRecords = recordList
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => record.screenshot && !record.originalImage);

    if (unprocessedRecords.length === 0) {
      alert('没有待识别的截图！\n请先上传截图或所有截图已识别完成。');
      addRecordLog('AI识别失败：没有待识别的截图');
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

    // ✓ 直接使用propsList（当前React state），确保数据同步
    if (propsList.length === 0) {
      alert('未找到icon库！\n请先在Tab1中上传icon图片。');
      addRecordLog('[错误] Tab1的icon库为空');
      return;
    }

    let iconLibrary: Array<{
      id: string;
      name: string;
      base64: string;
      propName: string;
      propCategory: string;
      propType: string;
      propRelated: string;
      primaryCategory: ScreenshotPrimaryCategory;
      sourcePropName: string;
    }> = [];

    try {
      // ✓ 使用propsList而不是localStorage，确保与Tab1数据完全同步
      iconLibrary = propsList
        .filter((prop: PropItem) => prop.image && !(prop.tags || []).includes('已确认'))
        .map((prop: PropItem, index: number) => {
          const rawCategory = prop.category || prop.classification?.category || '其他';
          const rawType = prop.type || prop.classification?.type || 'other';
          const propType = rawType === 'furniture' ? '家具' : '其他道具';

          return {
            id: `icon_${index}`,
            name: prop.name,
            base64: prop.image!.split(',')[1],
            propName: prop.displayName,
            propCategory: rawCategory,
            propType,
            propRelated: prop.ownership?.type === 'male_lead' && prop.ownership?.name
              ? `男主-${prop.ownership.name}`
              : prop.ownership?.type === 'spy' && prop.ownership?.name
              ? `密探-${prop.ownership.name}`
              : '无',
            primaryCategory: getIconPrimaryCategory(rawCategory, rawType),
            sourcePropName: prop.name
          };
        });
      
      addRecordLog(`[配置] 使用propsList构建icon库: 共 ${propsList.length} 个icon，过滤后 ${iconLibrary.length} 个候选`);
    } catch (error) {
      alert('读取icon库失败！\n请检查Tab1的数据是否正常。');
      addRecordLog(`[错误] 解析icon库失败: ${error}`);
      return;
    }

    if (iconLibrary.length === 0) {
      alert('icon库为空！\n请先在Tab1中上传icon图片。');
      addRecordLog('[错误] icon库为空');
      return;
    }

    const categoryStats = SCREENSHOT_CATEGORY_OPTIONS
      .map(category => {
        const rowCount = unprocessedRecords.filter(({ record }) => (record.screenshotCategory || DEFAULT_SCREENSHOT_CATEGORY) === category).length;
        if (rowCount === 0) return null;
        const iconCount = category === DEFAULT_SCREENSHOT_CATEGORY
          ? iconLibrary.length
          : iconLibrary.filter(icon => icon.primaryCategory === category).length;
        return `${category}: ${rowCount}条/${iconCount}个候选`;
      })
      .filter(Boolean)
      .join('\n');

    if (!confirm(`检测到 ${unprocessedRecords.length} 个待识别条目\n无分类将使用全部Icon候选，其余条目按截图一级分类限定Icon池：\n${categoryStats}\n\n确定执行吗？`)) {
      return;
    }

    addRecordLog(`========================================`);
    addRecordLog(`[开始] AI识别 ${unprocessedRecords.length} 个待识别条目`);
    const confirmedIconCount = propsList.filter(prop => prop.image && (prop.tags || []).includes('已确认')).length;
    addRecordLog(`[配置] icon库: Tab1中的 ${iconLibrary.length} 个候选；无分类使用全部候选，其余按截图一级分类筛选（已跳过 ${confirmedIconCount} 个已确认icon）`);
    addRecordLog(`[配置] 批次大小: 最多5个icon/批次`);
    addRecordLog(`[流程] 识别截图 → 匹配icon → 填充信息`);

    openRecognitionProgress(unprocessedRecords.length);

    const { runDirectVisionMatching } = await import('../utils/visionApiHelper');
    const failedList: string[] = [];
    let successCount = 0;
    let failCount = 0;

    // 串行处理每个待识别条目
    for (let i = 0; i < unprocessedRecords.length; i++) {
      const { record, index: recordIndex } = unprocessedRecords[i];
      const screenshotName = record.screenshotOriginalName || `截图_${recordIndex}`;
      
      updateRecognitionProgress(i, successCount, failCount, `正在处理: ${screenshotName}`, `[${i + 1}/${unprocessedRecords.length}] 开始处理 ${screenshotName}`);
      addRecordLog(`[处理] 开始处理第 ${recordIndex + 1} 行: ${screenshotName}`);

      try {
        const targetCategory = record.screenshotCategory || DEFAULT_SCREENSHOT_CATEGORY;
        const categoryIconLibrary = targetCategory === DEFAULT_SCREENSHOT_CATEGORY
          ? iconLibrary
          : iconLibrary.filter(icon => icon.primaryCategory === targetCategory);

        if (categoryIconLibrary.length === 0) {
          const emptyReason = targetCategory === DEFAULT_SCREENSHOT_CATEGORY
            ? '没有可用icon'
            : `${targetCategory}分类没有可用icon`;
          failedList.push(`第 ${recordIndex + 1} 行 (原因: ${emptyReason})`);
          failCount++;
          addRecordLog(`[处理] ✗ 第 ${recordIndex + 1} 行: ${emptyReason}`);
          updateRecognitionProgress(i + 1, successCount, failCount, `已完成: ${screenshotName}`, `✗ ${screenshotName}: ${emptyReason}`);
          continue;
        }

        addRecordLog(`[处理] 第 ${recordIndex + 1} 行分类: ${targetCategory}，候选icon: ${categoryIconLibrary.length}/${iconLibrary.length}`);

        const base64 = record.screenshot!.split(',')[1];
        const result = await runDirectVisionMatching(
          { endpoint: apiEndpoint, apiKey: apiKey, model: selectedModel },
          base64,
          categoryIconLibrary.map(icon => ({
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
          if (result.iconIndex < 0 || result.iconIndex >= categoryIconLibrary.length) {
            addRecordLog(`[处理] ✗ 第 ${recordIndex + 1} 行: API返回的索引越界`);
            addRecordLog(`[调试] 返回索引: ${result.iconIndex}, 分类库大小: ${categoryIconLibrary.length}`);
            failedList.push(`第 ${recordIndex + 1} 行 (原因: API返回索引无效)`);
            failCount++;
            updateRecognitionProgress(i + 1, successCount, failCount, `已完成: ${screenshotName}`, `✗ ${screenshotName}: 索引无效`);
            continue;
          }

          const matchedIcon = categoryIconLibrary[result.iconIndex];
          const recognizedName = result.name;
          const recognizedColor = result.color;
          
          // 添加调试日志
          addRecordLog(`[调试] 返回索引: ${result.iconIndex}, 匹配icon名称: ${matchedIcon.name}, sourcePropName: ${matchedIcon.sourcePropName}`);
          addRecordLog(`[调试] 分类库大小: ${categoryIconLibrary.length}, 完整库大小: ${iconLibrary.length}`);
          
          // 更新条目信息
          setRecordList(prev => {
            const updated = [...prev];
            updated[recordIndex] = {
              ...updated[recordIndex],
              originalImage: `data:image/png;base64,${matchedIcon.base64}`,
              originalImageFileName: matchedIcon.name,
              matchedPropFileName: matchedIcon.sourcePropName,
              propName: recognizedName,
              baseColor: recognizedColor,
              propType: matchedIcon.propType,
              propCategory: matchedIcon.propCategory,
              propRelated: matchedIcon.propRelated,
              screenshotCategory: matchedIcon.primaryCategory,
              outputName: recognizedName
            };
            return updated;
          });

          setPropsList(prev => {
            const updatedProps = prev.map(prop => {
              if (prop.name !== matchedIcon.sourcePropName) return prop;
              addRecordLog(`[调试] 找到Tab1匹配项: prop.name=${prop.name}, 添加AI匹配标签`);
              return {
                ...prop,
                tags: Array.from(new Set([...(prop.tags || []), 'AI匹配' as const]))
              };
            });
            
            // 验证是否真的找到了匹配项
            const foundMatch = updatedProps.some(prop => prop.name === matchedIcon.sourcePropName);
            if (!foundMatch) {
              addRecordLog(`[警告] ⚠ 未在Tab1中找到名称为 "${matchedIcon.sourcePropName}" 的icon`);
            }
            
            localStorage.setItem('savedProps', JSON.stringify(updatedProps.filter(prop => prop.image !== null)));
            return updatedProps;
          });

          successCount++;
          addRecordLog(`[处理] ✓ 第 ${recordIndex + 1} 行: 识别为"${result.name}"，底色${result.color}，匹配icon"${matchedIcon.propName}"`);
          updateRecognitionProgress(i + 1, successCount, failCount, `已完成: ${screenshotName}`, `✓ ${screenshotName} → ${result.name} (${result.color})`);
        } else {
          failedList.push(`第 ${recordIndex + 1} 行 (原因: ${result.error || '未知错误'})`);
          failCount++;
          addRecordLog(`[处理] ✗ 第 ${recordIndex + 1} 行: ${result.error || '识别失败'}`);
          updateRecognitionProgress(i + 1, successCount, failCount, `已完成: ${screenshotName}`, `✗ ${screenshotName}: ${result.error || '识别失败'}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        failedList.push(`第 ${recordIndex + 1} 行 (原因: ${errorMsg})`);
        failCount++;
        addRecordLog(`[处理] ✗ 第 ${recordIndex + 1} 行: 异常 - ${errorMsg}`);
        updateRecognitionProgress(i + 1, successCount, failCount, `已完成: ${screenshotName}`, `✗ ${screenshotName}: 异常`);
      }
    }

    closeRecognitionProgress();
    hideProgressBar();

    addRecordLog(`========================================`);
    addRecordLog(`[完成] 识别结束`);
    addRecordLog(`[统计] 成功: ${successCount}，失败: ${failCount}，总计: ${unprocessedRecords.length}`);

    if (successCount > 0) {
      addRecordLog(`[已完成] ${successCount} 个条目已识别并填充icon`);
    }
    if (failCount > 0) {
      addRecordLog(`[失败] ${failCount} 个条目识别失败`);
    }

    if (failedList.length > 0) {
      addRecordLog(`[失败列表]:`);
      failedList.forEach(item => addRecordLog(`  - ${item}`));
    }

    let alertMsg = `识别完成！\n成功: ${successCount} 个（已填充icon和信息）\n失败: ${failCount} 个`;
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
  const exportBatchFiles = async (mode: 'all' | 'confirmed') => {
    const stats = getExportStats(recordList);
    const exportRows = mode === 'confirmed' ? getConfirmedExportRows() : stats.exportRows;
    const modeLabel = mode === 'confirmed' ? '仅下载已确认' : '全部下载';

    addRecordLog(`========== 导出检查 ==========`);
    addRecordLog(`导出模式：${modeLabel}`);
    addRecordLog(`总记录数：${stats.totalRows}`);
    addRecordLog(`有加底预览图的：${stats.rowsWithPreview}`);
    addRecordLog(`有输出名称的：${stats.rowsWithOutputName}`);
    addRecordLog(`可导出的（同时满足两个条件）：${stats.exportRows.length}`);
    if (mode === 'confirmed') {
      addRecordLog(`已确认可导出的：${exportRows.length}`);
    }

    if (exportRows.length === 0) {
      let reason = '';
      if (stats.rowsWithPreview === 0) {
        reason = '所有记录都没有加底预览图，请先点击【加底】按钮';
      } else if (stats.rowsWithOutputName === 0) {
        reason = '所有记录的输出名称都为空';
      } else if (mode === 'confirmed') {
        reason = '当前条目中没有带有「已确认」标签的可导出图片';
      } else {
        reason = '没有同时具备加底预览图和输出名称的记录';
      }
      alert(`没有可导出的数据\n\n原因：${reason}\n\n统计信息：\n- 总记录数：${stats.totalRows}\n- 有加底预览图：${stats.rowsWithPreview}\n- 有输出名称：${stats.rowsWithOutputName}`);
      addRecordLog(`导出失败：${reason}`);
      return;
    }

    setExportModeModalOpen(false);

    if (!confirm(`导出模式：${modeLabel}\n检测到 ${exportRows.length} 条可导出数据\n\n统计信息：\n- 总记录数：${stats.totalRows}\n- 有加底预览图：${stats.rowsWithPreview}\n- 有输出名称：${stats.rowsWithOutputName}\n\n确定导出为ZIP文件吗？`)) {
      addRecordLog('用户取消导出');
      return;
    }

    addRecordLog(`开始导出，共 ${exportRows.length} 条数据...`);
    const result = await downloadExportRows(exportRows, '加底图片导出');

    if (result.success) {
      setTimeout(() => {
        closeExportProgress();
        alert(`导出完成！\n\n成功: ${result.successCount}\n失败: ${result.failCount}\n\n文件已保存为: ${result.fileName}`);
      }, 1000);
    }
  };

  const getConfirmedExportRows = () => {
    const confirmedPropNames = new Set(
      propsList
        .filter(prop => prop.image && (prop.tags || []).includes('已确认'))
        .map(prop => prop.name)
    );

    return getExportStats(recordList).exportRows.filter(row => {
      const matchedName = row.matchedPropFileName || row.originalImageFileName;
      return matchedName ? confirmedPropNames.has(matchedName) : false;
    });
  };

  const downloadExportRows = async (
    exportRows: RecordRow[],
    filePrefix: string
  ): Promise<{ success: boolean; successCount: number; failCount: number; fileName?: string }> => {
    openExportProgress(exportRows.length);

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const folder = zip.folder('加底图片');
      const getUniqueFileName = createUniqueFileNameGenerator();

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < exportRows.length; i++) {
        const row = exportRows[i];
        const fileName = row.outputName;

        updateExportProgress(
          i + 1,
          successCount,
          failCount,
          `正在处理: ${fileName}`,
          `[${i + 1}/${exportRows.length}] ${fileName}`
        );

        try {
          if (row.previewWithBase) {
            const base64Data = row.previewWithBase.split(',')[1];
            const uniqueFileName = getUniqueFileName(fileName);
            folder?.file(uniqueFileName, base64Data, { base64: true });

            successCount++;
            addRecordLog(`[${i + 1}/${exportRows.length}] 正在打包：${fileName}`);
          }
        } catch (error) {
          failCount++;
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          addRecordLog(`✗ ${fileName}: ${errorMsg}`);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${filePrefix}_${timestamp}.zip`;
      saveAs(blob, fileName);

      addRecordLog(`✓ 导出完成！共 ${successCount} 个文件已打包为ZIP`);
      return { success: true, successCount, failCount, fileName };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addRecordLog(`✗ 导出失败：${errorMsg}`);
      closeExportProgress();
      alert(`导出失败：${errorMsg}`);
      return { success: false, successCount: 0, failCount: exportRows.length };
    }
  };

  const exportConfirmedAndRemoveRows = async () => {
    const exportRows = getConfirmedExportRows();

    if (exportRows.length === 0) {
      alert('当前没有可下载并移除的已确认合成图片。\n\n请确认条目已标记为「已确认」，且已有加底预览图和输出名称。');
      addRecordLog('下载并移除失败：没有可处理的已确认合成图片');
      return;
    }

    addRecordLog(`开始下载并移除已确认条目，共 ${exportRows.length} 条...`);
    const result = await downloadExportRows(exportRows, '已确认合成图片');
    if (!result.success) return;

    const exportedIds = new Set(exportRows.map(row => row.id));
    setRecordList(prev => prev.filter(row => !exportedIds.has(row.id)));

    exportRows
      .filter(row => row.screenshot)
      .forEach(row => {
        deleteTab2Screenshot(row.id).catch(error => {
          addRecordLog(`⚠ 条目 ${row.outputName || row.propName || row.id} 截图记忆删除失败: ${error}`);
        });
      });

    if (selectedPart && exportedIds.has(recordList[selectedPart.rowId]?.id)) {
      setSelectedPart(null);
    }

    clearSelection();
    closeExportProgress();
    addRecordLog(`✓ 已下载并移除 ${exportRows.length} 个已确认条目`);
    alert(`处理完成！\n\n已下载: ${result.successCount}\n打包失败: ${result.failCount}\n已移除条目: ${exportRows.length}\n\n文件已保存为: ${result.fileName}`);
  };

  // 统计信息
  const exportReadyCount = recordList.filter(
    row => row.previewWithBase && row.outputName && row.outputName.trim() !== ''
  ).length;
  const confirmedExportReadyCount = getConfirmedExportRows().length;

  const matchedCount = recordList.filter(r => r.originalImage !== null).length;
  const unMatchedCount = recordList.length - matchedCount;
  
  // 统计待识别的截图数量
  const pendingRecognitionCount = recordList.filter(r => r.screenshot && !r.originalImage).length;

  return {
    fileInputRef1,
    fileInputRef2,
    isLogPanelOpen,
    setIsLogPanelOpen,
    selectedScreenshotCategory,
    setSelectedScreenshotCategory,
    exportModeModalOpen,
    setExportModeModalOpen,
    recognitionProgress,
    exportProgress,
    screenshotFilter,
    setScreenshotFilter,
    filteredRecordList,
    selectedRowIds,
    toggleRowSelection,
    toggleSelectAll,
    basemapGroups,
    selectedGroupId,
    setSelectedGroupId,
    availableColors,
    enableContainScale,
    setEnableContainScale,
    iconLibraryCount,
    handleBatchScreenshotUpload,
    onCellFileChange,
    viewRowImage,
    deleteScreenshotFromRow,
    confirmRowIcon,
    returnRowIcon,
    handleCellImageUpload,
    handleBatchDeleteSelected,
    handleBatchReturnSelected,
    handleBatchConfirmSelected,
    runAiMatch,
    exportBatchFiles,
    exportConfirmedAndRemoveRows,
    exportReadyCount,
    confirmedExportReadyCount,
    matchedCount,
    unMatchedCount,
    pendingRecognitionCount,
    getIconStatus
  };
}
