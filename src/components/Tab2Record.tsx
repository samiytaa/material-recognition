import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Sparkles, Download } from 'lucide-react';
import { RecordRow } from '../types';
import LogSidebar from './LogSidebar';
import { RecordTable, ScreenshotList } from './tab2';
import { UploadZone, Button, Card, RecognitionProgressModal, BasemapGroupSelector } from './common';
import { readFileAsDataURL, getFileNameWithoutExtension } from '../utils/fileHelper';
import { useBasemapGroups, type MapGroup } from '../hooks';

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
  
  // 自动保存recordList到localStorage
  useEffect(() => {
    if (recordList.length > 0) {
      try {
        localStorage.setItem('tab2_recordList', JSON.stringify(recordList));
      } catch (error) {
        console.error('保存recordList失败:', error);
      }
    }
  }, [recordList]);
  
  // 识别进度弹窗状态
  const [recognitionProgress, setRecognitionProgress] = useState({
    isOpen: false,
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
    currentProcessing: '',
    logs: [] as string[]
  });
  
  // 选中行管理（使用 row.id 而不是索引）
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  
  // 用于 Shift 连选的锚点
  const [lastSelectedRowId, setLastSelectedRowId] = useState<number | null>(null);
  
  // 截图筛选状态：'all' | 'matched' | 'unmatched'
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  
  // 根据筛选条件过滤记录
  const filteredRecordList = useMemo(() => {
    if (screenshotFilter === 'all') {
      return recordList;
    } else if (screenshotFilter === 'matched') {
      return recordList.filter(row => row.screenshot !== null);
    } else {
      return recordList.filter(row => row.screenshot === null);
    }
  }, [recordList, screenshotFilter]);
  
  // 切换行选择状态（支持 Ctrl 和 Shift 多选）
  const toggleRowSelection = (rowId: number, event?: React.MouseEvent) => {
    const row = filteredRecordList.find(r => r.id === rowId);
    if (!row) return;
    
    // Shift 连选
    if (event?.shiftKey && lastSelectedRowId !== null) {
      const lastIndex = filteredRecordList.findIndex(r => r.id === lastSelectedRowId);
      const currentIndex = filteredRecordList.findIndex(r => r.id === rowId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredRecordList.slice(start, end + 1).map(r => r.id);
        
        setSelectedRowIds(prev => [...new Set([...prev, ...rangeIds])]);
        return;
      }
    }
    
    // Ctrl 离散多选 / 普通 toggle
    setSelectedRowIds(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
    
    // 更新锚点
    setLastSelectedRowId(rowId);
  };
  
  // 全选/取消全选（基于过滤后的列表）
  const toggleSelectAll = () => {
    // 获取过滤后列表中每一行的 id
    const filteredIds = filteredRecordList.map(row => row.id);
    
    // 检查是否所有过滤后的行都已选中
    const allFilteredSelected = filteredIds.every(id => selectedRowIds.includes(id));
    
    if (allFilteredSelected) {
      // 取消选中所有过滤后的行
      setSelectedRowIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // 选中所有过滤后的行
      setSelectedRowIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };
  
  // 批量删除选中的行
  const deleteSelectedRows = () => {
    if (selectedRowIds.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedRowIds.length} 行吗？`)) return;
    
    setRecordList(prev => prev.filter(row => !selectedRowIds.includes(row.id)));
    addRecordLog(`已批量删除 ${selectedRowIds.length} 行`);
    setSelectedRowIds([]);
    setLastSelectedRowId(null);
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
  
  // 使用统一的底图组管理 Hook
  const { groups: basemapGroups } = useBasemapGroups(addRecordLog);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return basemapGroups.length > 0 ? basemapGroups[0].id : '';
  });
  const [availableColors, setAvailableColors] = useState<string[]>(['金', '紫', '蓝', '绿', '咖']);
  
  // 加底逻辑：Contain 等比缩放模式（与Tab5一致）
  const [enableContainScale, setEnableContainScale] = useState<boolean>(() => {
    const saved = localStorage.getItem('tab2_enableContainScale');
    return saved !== null ? saved === 'true' : true; // 默认启用
  });
  
  // 初始化选中的底图组
  useEffect(() => {
    if (basemapGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(basemapGroups[0].id);
    }
  }, [basemapGroups, selectedGroupId]);
  
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
  }>>(() => {
    try {
      const savedScreenshots = localStorage.getItem('tab2_uploadedScreenshots');
      if (savedScreenshots) {
        return JSON.parse(savedScreenshots);
      }
    } catch (error) {
      console.error('加载上传截图列表失败:', error);
    }
    return [];
  });
  
  // 自动保存上传的截图到localStorage（始终保存，包括空数组）
  useEffect(() => {
    try {
      const dataToSave = JSON.stringify(uploadedScreenshots);
      // 检查数据大小（localStorage通常限制5-10MB）
      const sizeInMB = new Blob([dataToSave]).size / (1024 * 1024);
      
      if (sizeInMB > 5) {
        console.warn(`截图数据过大 (${sizeInMB.toFixed(2)}MB)，可能超出localStorage限制`);
        addRecordLog(`⚠ 截图数据过大 (${sizeInMB.toFixed(2)}MB)，保存可能失败`);
        
        // 超出限制时，只保留最近的截图
        if (uploadedScreenshots.length > 10) {
          const recentScreenshots = uploadedScreenshots.slice(-10);
          localStorage.setItem('tab2_uploadedScreenshots', JSON.stringify(recentScreenshots));
          addRecordLog(`⚠ 已自动清理，仅保留最近 10 张截图`);
          setUploadedScreenshots(recentScreenshots);
          return;
        }
      }
      
      localStorage.setItem('tab2_uploadedScreenshots', dataToSave);
      console.log(`✓ 已保存 ${uploadedScreenshots.length} 张截图到localStorage (${sizeInMB.toFixed(2)}MB)`);
    } catch (error) {
      console.error('保存截图列表失败:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        addRecordLog('❌ 存储空间不足，无法保存截图。已自动清理部分数据');
        
        // 存储失败时，只保留最近的 5 张截图
        const recentScreenshots = uploadedScreenshots.slice(-5);
        try {
          localStorage.setItem('tab2_uploadedScreenshots', JSON.stringify(recentScreenshots));
          addRecordLog(`✓ 已保留最近 5 张截图`);
          setUploadedScreenshots(recentScreenshots);
        } catch (retryError) {
          // 如果还是失败，清空所有截图缓存
          localStorage.removeItem('tab2_uploadedScreenshots');
          addRecordLog('❌ 已清空所有截图缓存，请重新上传');
          setUploadedScreenshots([]);
        }
        
        alert('存储空间不足！\n已自动压缩并清理部分数据。\n建议：\n1. 图片已自动压缩\n2. 分批上传（每次不超过10张）\n3. 及时完成识别操作后清空待处理区');
      } else {
        addRecordLog(`❌ 保存截图失败: ${error}`);
      }
    }
  }, [uploadedScreenshots]);

  // 组件初始化时记录加载状态
  useEffect(() => {
    const savedRecordList = localStorage.getItem('tab2_recordList');
    const savedScreenshots = localStorage.getItem('tab2_uploadedScreenshots');
    
    if (savedRecordList) {
      try {
        const parsed = JSON.parse(savedRecordList);
        if (parsed.length > 0) {
          addRecordLog(`✓ 已从本地存储加载 ${parsed.length} 条记录`);
        }
      } catch (error) {
        console.error('解析记录列表失败:', error);
      }
    }
    
    if (savedScreenshots) {
      try {
        const parsed = JSON.parse(savedScreenshots);
        if (parsed.length > 0) {
          addRecordLog(`✓ 已从本地存储加载 ${parsed.length} 张待处理截图`);
        }
      } catch (error) {
        console.error('解析截图列表失败:', error);
      }
    }
  }, []);

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

    // 检查是否超过推荐数量
    const totalAfterUpload = uploadedScreenshots.length + filesToUpload.length;
    if (totalAfterUpload > 20) {
      const shouldContinue = confirm(
        `注意：您即将上传 ${filesToUpload.length} 张图片，加上现有的 ${uploadedScreenshots.length} 张，总共 ${totalAfterUpload} 张\n\n` +
        `为避免内存不足，建议：\n` +
        `1. 分批上传（每次不超过20张）\n` +
        `2. 及时完成识别后清空待处理区\n\n` +
        `图片会自动压缩以节省空间\n\n` +
        `是否继续上传？`
      );
      
      if (!shouldContinue) {
        addRecordLog('用户取消上传');
        return;
      }
    }

    addRecordLog(`开始上传 ${filesToUpload.length} 张游戏截图（自动压缩中...）`);

    const newScreenshots: Array<{id: number; name: string; dataUrl: string}> = [];
    let compressedCount = 0;
    let originalSize = 0;
    let compressedSize = 0;
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      originalSize += file.size;
      
      // 自动压缩图片（超过500KB会压缩）
      const dataUrl = await readFileAsDataURL(file, true);
      const nameWithoutExt = getFileNameWithoutExtension(file.name);
      
      // 计算压缩后大小
      const compressedSizeBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
      compressedSize += compressedSizeBytes;
      
      if (file.size > 500 * 1024) {
        compressedCount++;
      }

      newScreenshots.push({
        id: Date.now() + i,
        name: nameWithoutExt,
        dataUrl: dataUrl
      });

      addRecordLog(`[${i + 1}/${filesToUpload.length}] 导入游戏截图: ${file.name}${file.size > 500 * 1024 ? ' (已压缩)' : ''}`);
    }

    setUploadedScreenshots(prev => [...prev, ...newScreenshots]);
    
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    addRecordLog(`✓ 游戏截图批量上传完成，已添加 ${newScreenshots.length} 张截图`);
    if (compressedCount > 0) {
      addRecordLog(`  压缩统计: ${compressedCount} 张图片已压缩，节省 ${compressionRatio}% 空间`);
      addRecordLog(`  原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB → 压缩后: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
    }
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
      const fileName = getFileNameWithoutExtension(file.name);
      
      setRecordList(prev => {
        const updated = [...prev];
        if (type === 'screenshot') {
          updated[rowId] = {
            ...updated[rowId],
            screenshot: dataUrl,
            screenshotOriginalName: fileName // 保存原始文件名
          };
        } else {
          updated[rowId] = {
            ...updated[rowId],
            originalImage: dataUrl,
            originalImageFileName: file.name // 保存原始icon文件名（用于AI识别）
          };
        }
        return updated;
      });
      addRecordLog(`已上传第 ${rowId + 1} 行的${type === 'original' ? '道具icon' : '游戏截图'}（${fileName}）`);
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

  // Return screenshot from table back to uploaded screenshots list
  const returnScreenshot = (rowId: number) => {
    const row = recordList[rowId];
    
    if (!row.screenshot) {
      addRecordLog(`⚠ 第 ${rowId + 1} 行没有截图可退回`);
      return;
    }

    // 使用保存的原始文件名，如果没有则使用道具名或默认名称
    const screenshotName = row.screenshotOriginalName || row.propName || `截图_${Date.now()}`;
    
    // 添加到待处理截图列表
    const newScreenshot = {
      id: Date.now(),
      name: screenshotName,
      dataUrl: row.screenshot
    };
    
    setUploadedScreenshots(prev => [...prev, newScreenshot]);
    
    // 清除表格行中的截图和原始文件名
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
  
  // 删除某行的游戏截图（不退回到待处理列表）
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

  // Clear all uploaded screenshots
  const clearAllScreenshots = () => {
    const count = uploadedScreenshots.length;
    setUploadedScreenshots([]);
    addRecordLog(`✓ 已清空所有待处理截图（共 ${count} 张）`);
  };

  // AI match algorithm - now processes uploaded screenshots using real vision API
  const runAiMatch = async () => {
    // 优先处理上传的截图
    if (uploadedScreenshots.length > 0) {
      // 检查API配置
      const apiEndpoint = localStorage.getItem('apiEndpoint');
      const apiKey = localStorage.getItem('apiKey');
      const selectedModel = localStorage.getItem('selectedModel');

      if (!apiEndpoint || !apiKey || !selectedModel) {
        alert('请先在顶部导航栏的 API 配置中配置 API 并选择模型！');
        addRecordLog('[错误] 请先配置API端点、Key并选择模型');
        return;
      }

      // 从表格中提取已有的icon作为候选库
      const tableIcons = recordList
        .map((row, idx) => ({
          rowIndex: idx,
          originalImage: row.originalImage,
          originalImageFileName: row.originalImageFileName, // 获取原始文件名
          propName: row.propName,
          propType: row.propType,
          propCategory: row.propCategory,
          propRelated: row.propRelated
        }))
        .filter(item => item.originalImage !== null);

      if (tableIcons.length === 0) {
        alert('表格中没有可用的道具icon！\n请先上传或添加道具icon到表格中。');
        addRecordLog('[错误] 表格中没有道具icon');
        return;
      }

      // 构建icon库：从表格的originalImage中提取
      const iconLibrary: Array<{id: string; name: string; base64: string; propName: string; propType: string; propCategory: string; propRelated: string; rowIndex: number}> = [];
      for (const item of tableIcons) {
        try {
          // 提取base64（去掉data:image/xxx;base64,前缀）
          const base64 = item.originalImage!.split(',')[1];
          if (base64) {
            iconLibrary.push({
              id: `row_${item.rowIndex}`,
              // 优先使用原始文件名（与Tab5一致），fallback到propName
              name: item.originalImageFileName || item.propName || `第${item.rowIndex + 1}行`,
              base64: base64,
              propName: item.propName || '未命名',
              propType: item.propType || '未知',
              propCategory: item.propCategory || '未知',
              propRelated: item.propRelated || '无',
              rowIndex: item.rowIndex
            });
          }
        } catch (e) {
          addRecordLog(`[警告] 第 ${item.rowIndex + 1} 行的icon格式异常，已跳过`);
        }
      }

      if (iconLibrary.length === 0) {
        alert('无法解析表格中的icon数据！');
        addRecordLog('[错误] 无法解析表格icon数据');
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
      
      // 打开进度弹窗
      setRecognitionProgress({
        isOpen: true,
        current: 0,
        total: uploadedScreenshots.length,
        successCount: 0,
        failCount: 0,
        currentProcessing: '准备中...',
        logs: []
      });

      // 导入识别函数（与Tab5共用同一识别逻辑和提示词）
      const { runDirectVisionMatching } = await import('../utils/visionApiHelper');
      
      const matchedScreenshots: Array<{screenshotIndex: number; rowIndex: number; name: string; color: string}> = [];
      const failedList: string[] = [];
      const usedRowIndices = new Set<number>(); // 记录已使用的表格行索引
      
      let successCount = 0;
      let failCount = 0;

      // 进度日志（最多保留最近20条）
      const progressLogs: string[] = [];
      const addProgressLog = (msg: string) => {
        progressLogs.push(msg);
        if (progressLogs.length > 20) {
          progressLogs.shift();
        }
      };

      // 更新进度的辅助函数
      const updateRecognitionProgress = (current: number, success: number, fail: number, processing: string, log?: string) => {
        if (log) {
          addProgressLog(log);
        }
        setRecognitionProgress({
          isOpen: true,
          current,
          total: uploadedScreenshots.length,
          successCount: success,
          failCount: fail,
          currentProcessing: processing,
          logs: [...progressLogs]
        });
        updateProgress(current, uploadedScreenshots.length);
      };

      // 串行处理每个截图（避免并发导致的匹配冲突）
      for (let index = 0; index < uploadedScreenshots.length; index++) {
        const screenshot = uploadedScreenshots[index];
        
        // 开始处理时进度还是之前的值
        updateRecognitionProgress(index, successCount, failCount, `正在处理: ${screenshot.name}`, `[${index + 1}/${uploadedScreenshots.length}] 开始处理 ${screenshot.name}`);
        addRecordLog(`[处理] 开始处理截图 ${index + 1}/${uploadedScreenshots.length}: ${screenshot.name}`);

        try {
          // 过滤掉已使用的icon（已匹配的表格行）
          const availableIconLibrary = iconLibrary
            .filter(icon => !usedRowIndices.has(icon.rowIndex));

          if (availableIconLibrary.length === 0) {
            addRecordLog(`[处理] ✗ ${screenshot.name}: 所有icon已被使用`);
            failedList.push(`${screenshot.name} (原因: 无可用icon)`);
            failCount++;
            updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: 无可用icon`);
            continue;
          }

          addRecordLog(`[处理] 可用icon数: ${availableIconLibrary.length}/${iconLibrary.length}`);

          // 提取base64（去掉data:image/xxx;base64,前缀）
          const base64 = screenshot.dataUrl.split(',')[1];

          // 调用识别API
          const result = await runDirectVisionMatching(
            {
              endpoint: apiEndpoint,
              apiKey: apiKey,
              model: selectedModel
            },
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
            5 // 批次大小：5个icon（与Tab5默认值一致）
          );

          if (result.success && result.color && result.iconIndex !== undefined && result.name) {
            // 验证iconIndex的有效性
            if (result.iconIndex < 0 || result.iconIndex >= availableIconLibrary.length) {
              addRecordLog(`[处理] ✗ ${screenshot.name}: API返回的索引越界 (${result.iconIndex}/${availableIconLibrary.length})`);
              failedList.push(`${screenshot.name} (原因: API返回索引无效)`);
              failCount++;
              updateRecognitionProgress(index + 1, successCount, failCount, `已完成: ${screenshot.name}`, `✗ ${screenshot.name}: 索引无效`);
              continue;
            }
            
            // 获取匹配到的表格行
            const matchedIcon = availableIconLibrary[result.iconIndex];
            const matchedRowIndex = matchedIcon.rowIndex;
            
            // 标记该行已使用（串行处理，无竞态条件）
            usedRowIndices.add(matchedRowIndex);

            // 记录匹配结果（不再判断分类，因为分类已从Tab1同步）
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
            // 识别失败
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

      // 保存原始截图数组的引用（避免闭包问题）
      const originalScreenshots = [...uploadedScreenshots];

      // 更新表格：将截图填入匹配的行
      if (matchedScreenshots.length > 0) {
        setRecordList(prev => {
          const updated = [...prev];
          for (const match of matchedScreenshots) {
            const screenshot = originalScreenshots[match.screenshotIndex];
            if (screenshot) {
              updated[match.rowIndex] = {
                ...updated[match.rowIndex],
                screenshot: screenshot.dataUrl,
                screenshotOriginalName: screenshot.name, // 保存原始文件名
                propName: match.name,
                baseColor: match.color,
                // 保持原有的类型、分类、相关字段不变（从Tab1导入）
                outputName: match.name
              };
            }
          }
          return updated;
        });
        
        // 逐个移除成功识别的截图
        const successfulScreenshotIds = matchedScreenshots.map(m => originalScreenshots[m.screenshotIndex].id);
        setUploadedScreenshots(prev => prev.filter(s => !successfulScreenshotIds.includes(s.id)));
      }
      
      // 关闭进度弹窗
      setRecognitionProgress({
        isOpen: false,
        current: 0,
        total: 0,
        successCount: 0,
        failCount: 0,
        currentProcessing: '',
        logs: []
      });
      
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
      
      return;
    }

    // 如果没有待处理截图，则提示用户
    alert('请先上传游戏截图再进行AI匹配');
    addRecordLog('AI匹配失败：没有待处理的截图');
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
          if (enableContainScale) {
            // Contain 等比缩放模式：画布边界等比适配居中算法
            const targetWidth = canvas.width;
            const targetHeight = canvas.height;
            const sourceWidth = propImg.width;
            const sourceHeight = propImg.height;
            
            // 计算缩放系数：min(目标宽/源宽, 目标高/源高)
            const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
            
            // 缩放后的尺寸
            const scaledWidth = sourceWidth * scale;
            const scaledHeight = sourceHeight * scale;
            
            // 中心锚点居中定位
            const offsetX = (targetWidth - scaledWidth) / 2;
            const offsetY = (targetHeight - scaledHeight) / 2;
            
            // 绘制等比缩放后居中的 icon
            ctx!.drawImage(propImg, offsetX, offsetY, scaledWidth, scaledHeight);
          } else {
            // 禁用缩放模式：原图原始尺寸居中渲染，超出画布区域裁切
            const targetWidth = canvas.width;
            const targetHeight = canvas.height;
            const sourceWidth = propImg.width;
            const sourceHeight = propImg.height;
            
            // 中心锚点居中定位
            const offsetX = (targetWidth - sourceWidth) / 2;
            const offsetY = (targetHeight - sourceHeight) / 2;
            
            // 直接绘制原尺寸 icon（Canvas 会自动裁切超出部分）
            ctx!.drawImage(propImg, offsetX, offsetY, sourceWidth, sourceHeight);
          }
          
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
          const scaleMode = enableContainScale ? 'Contain等比' : '原始尺寸';
          addRecordLog(`[${processedCount}/${readyRowsCount}] 第 ${activeIdx + 1} 行加底完成（${currentRow.baseColor}/${scaleMode}）`);

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
      propType: row.propType,
      propCategory: row.propCategory,
      propRelated: row.propRelated,
      outputName: row.outputName,
      hasOriginalImage: !!row.originalImage,
      hasScreenshot: !!row.screenshot,
      hasPreview: !!row.previewWithBase
    }));

    localStorage.setItem('recordData', JSON.stringify(saveData));
    addRecordLog(`✓ 数据已保存到本地，共 ${validRows.length} 条记录`);
    alert(`已保存 ${validRows.length} 条追记数据到本地存储`);
  };

  // Export batch files as ZIP
  const exportBatchFiles = async () => {
    // 详细统计
    const totalRows = recordList.length;
    const rowsWithPreview = recordList.filter(row => row.previewWithBase).length;
    const rowsWithOutputName = recordList.filter(row => row.outputName && row.outputName.trim() !== '').length;
    const exportRows = recordList.filter(row => row.previewWithBase && row.outputName && row.outputName.trim() !== '');
    
    addRecordLog(`========== 导出检查 ==========`);
    addRecordLog(`总记录数：${totalRows}`);
    addRecordLog(`有加底预览图的：${rowsWithPreview}`);
    addRecordLog(`有输出名称的：${rowsWithOutputName}`);
    addRecordLog(`可导出的（同时满足两个条件）：${exportRows.length}`);
    
    if (exportRows.length === 0) {
      let reason = '';
      if (rowsWithPreview === 0) {
        reason = '所有记录都没有加底预览图，请先点击【加底】按钮';
      } else if (rowsWithOutputName === 0) {
        reason = '所有记录的输出名称都为空';
      } else {
        reason = '没有同时具备加底预览图和输出名称的记录';
      }
      alert(`没有可导出的数据\n\n原因：${reason}\n\n统计信息：\n- 总记录数：${totalRows}\n- 有加底预览图：${rowsWithPreview}\n- 有输出名称：${rowsWithOutputName}`);
      addRecordLog(`导出失败：${reason}`);
      return;
    }

    if (!confirm(`检测到 ${exportRows.length} 条可导出数据\n\n统计信息：\n- 总记录数：${totalRows}\n- 有加底预览图：${rowsWithPreview}\n- 有输出名称：${rowsWithOutputName}\n\n确定导出为ZIP文件吗？`)) {
      addRecordLog('用户取消导出');
      return;
    }

    addRecordLog(`开始导出，共 ${exportRows.length} 条数据...`);
    showProgressBar();

    try {
      // 动态导入 exportHelper
      const { exportRecordsToZip } = await import('../utils/exportHelper');
      
      // 调用导出函数，传入进度回调
      await exportRecordsToZip(recordList, (current, total) => {
        updateProgress(current, total);
        addRecordLog(`[${current}/${total}] 正在打包：${exportRows[current - 1]?.outputName || ''}`);
      });

      hideProgressBar();
      addRecordLog(`✓ 导出完成！共 ${exportRows.length} 个文件已打包为ZIP`);
      alert(`导出完成！\n已导出 ${exportRows.length} 个加底图片\n文件已保存为ZIP压缩包`);
    } catch (error) {
      hideProgressBar();
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addRecordLog(`✗ 导出失败：${errorMsg}`);
      alert(`导出失败：${errorMsg}`);
    }
  };



  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      <input type="file" accept="image/*" ref={fileInputRef1} onChange={(e) => onCellFileChange(e, 'original')} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputRef2} onChange={(e) => onCellFileChange(e, 'screenshot')} className="hidden" />

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

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden decorative-corners" padding="md">
        {/* 筛选器和操作栏 */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          {/* 截图筛选器 */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#674b2d] whitespace-nowrap">
              截图筛选
            </label>
            <div className="flex items-center gap-1 bg-[#FAF8F4] border border-[#DFD2BD] rounded-md p-0.5">
              <button
                onClick={() => setScreenshotFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  screenshotFilter === 'all'
                    ? 'bg-[#8B6F47] text-white shadow-sm'
                    : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
                }`}
              >
                全部 ({recordList.length})
              </button>
              <button
                onClick={() => setScreenshotFilter('matched')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  screenshotFilter === 'matched'
                    ? 'bg-[#8B6F47] text-white shadow-sm'
                    : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
                }`}
              >
                已匹配 ({recordList.filter(r => r.screenshot !== null).length})
              </button>
              <button
                onClick={() => setScreenshotFilter('unmatched')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  screenshotFilter === 'unmatched'
                    ? 'bg-[#8B6F47] text-white shadow-sm'
                    : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
                }`}
              >
                未匹配 ({recordList.filter(r => r.screenshot === null).length})
              </button>
            </div>
          </div>
          
          {/* 底图组选择器 + 加底等比缩放开关 */}
          {basemapGroups.length > 0 && (
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              {/* 底图组选择器 */}
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-semibold text-[#674b2d] whitespace-nowrap">
                  底图组
                </label>
                <BasemapGroupSelector
                  groups={basemapGroups}
                  selectedGroupId={selectedGroupId}
                  onGroupChange={setSelectedGroupId}
                  className="flex-1"
                />
              </div>
              
              {/* 加底等比缩放开关 - 带独特样式 */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FFF8E7] to-[#FFF4DC] border border-[#E8D4A8] rounded-md shadow-sm">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enableContainScale}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setEnableContainScale(newValue);
                      localStorage.setItem('tab2_enableContainScale', newValue.toString());
                      addRecordLog(`[设置] ${newValue ? '启用' : '禁用'} 加底等比缩放模式`);
                    }}
                    className="w-3.5 h-3.5 rounded border-[#D4A944] text-[#D4A944] focus:ring-1 focus:ring-[#D4A944] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#8B6F47] whitespace-nowrap group-hover:text-[#A67C00] transition-colors">
                    加底等比缩放
                  </span>
                </label>
              </div>
            </div>
          )}
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
              // 通过过滤后的索引获取 row.id
              const rowId = filteredRecordList[filteredRowIndex].id;
              toggleRowSelection(rowId, event);
            }}
            onToggleSelectAll={toggleSelectAll}
            onViewImage={(filteredRowIndex, type) => {
              // 将过滤后的索引映射到原始列表索引
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              viewRowImage(originalRowIndex, type);
            }}
            onUploadImage={(filteredRowIndex, type) => {
              // 将过滤后的索引映射到原始列表索引
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              handleCellImageUpload(originalRowIndex, type);
            }}
            onUpdateRow={(filteredRowIndex, updates) => {
              // 将过滤后的索引映射到原始列表索引
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
              // 将过滤后的索引映射到原始列表索引
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              returnScreenshot(originalRowIndex);
            }}
            onDeleteScreenshot={(filteredRowIndex) => {
              // 将过滤后的索引映射到原始列表索引
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
          <Card className="overflow-hidden flex-shrink-0" padding="none">
            <UploadZone
              onFilesSelected={handleBatchImageUpload}
              text="支持拖入游戏截图"
              subText={uploadedScreenshots.length > 0 ? `已上传 ${uploadedScreenshots.length} 张截图` : '或点击窗口选择图片文件'}
            />
          </Card>

          <ScreenshotList
            screenshots={uploadedScreenshots}
            onDelete={deleteScreenshot}
            onClearAll={clearAllScreenshots}
          />
        </div>

        {/* Locked bottom action buttons */}
        <div className="save-button-area border-t border-gold-medium/30 pt-3 bg-transparent flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={runAiMatch}
              disabled={uploadedScreenshots.length === 0}
              id="runAiMatchButton"
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
                uploadedScreenshots.length > 0 
                  ? 'bg-gradient-to-r from-[#7B68EE] to-[#6A5ACD] hover:to-[#5B4BBD] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
              }`}
            >
              <Sparkles size={16} />
              一键识别
            </button>
            <button
              onClick={exportBatchFiles}
              disabled={recordList.filter(row => row.previewWithBase && row.outputName.trim() !== '').length === 0}
              id="exportButton"
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
                recordList.filter(row => row.previewWithBase && row.outputName.trim() !== '').length > 0
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:to-[#B45309] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
              }`}
            >
              <Download size={16} />
              导出
            </button>
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
