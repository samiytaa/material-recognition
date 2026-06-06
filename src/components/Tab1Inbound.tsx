import React, { useState, useMemo } from 'react';
import { RefreshCw, FileText, Download, Send } from 'lucide-react';
import { PropItem, parseFileName, reloadRules, OwnershipType, RecordRow } from '../types';
import LogSidebar from './LogSidebar';
import { StatsBar, CategoryFilter, PropGrid, PreviewPanel, OwnershipFilter } from './tab1';
import { SearchInput, UploadZone, Button } from './common';
import { getDefaultCategoryTree, matchesFilter } from '../utils/categoryHelper';
import { exportParseRecordToJson } from '../utils/exportHelper';
import { processImageFiles, readFileAsDataURL } from '../utils/fileHelper';

interface Tab1InboundProps {
  propsList: PropItem[];
  setPropsList: React.Dispatch<React.SetStateAction<PropItem[]>>;
  currentFilter: { level1: string; level2: string | null };
  setCurrentFilter: (f: { level1: string; level2: string | null }) => void;
  searchKeyword: string;
  setSearchKeyword: (k: string) => void;
  previewIndex: number | null;
  setPreviewIndex: (idx: number | null) => void;
  logs: string[];
  addLog: (msg: string) => void;
  clearLogs: () => void;
  clearAllProps: () => void;
  recordList?: RecordRow[];
  setRecordList?: React.Dispatch<React.SetStateAction<RecordRow[]>>;
  addRecordLog?: (msg: string) => void;
}

export default function Tab1Inbound({
  propsList,
  setPropsList,
  currentFilter,
  setCurrentFilter,
  searchKeyword,
  setSearchKeyword,
  previewIndex,
  setPreviewIndex,
  logs,
  addLog,
  clearLogs,
  clearAllProps,
  recordList = [],
  setRecordList,
  addRecordLog
}: Tab1InboundProps) {
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [expandedL1, setExpandedL1] = useState<string | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<{ type: OwnershipType | 'all'; name: string | null }>({
    type: 'all',
    name: null
  });
  const [selectedPropIndices, setSelectedPropIndices] = useState<number[]>([]);
  
  const categoryTree = getDefaultCategoryTree();

  // 提取所有男主和密探名称
  const { maleLeads, spies } = useMemo(() => {
    const maleLeadSet = new Set<string>();
    const spySet = new Set<string>();
    
    propsList.forEach(prop => {
      if (prop.ownership.type === 'male_lead' && prop.ownership.name) {
        maleLeadSet.add(prop.ownership.name);
      } else if (prop.ownership.type === 'spy' && prop.ownership.name) {
        spySet.add(prop.ownership.name);
      }
    });
    
    return {
      maleLeads: Array.from(maleLeadSet).sort(),
      spies: Array.from(spySet).sort()
    };
  }, [propsList]);

  const filteredProps = propsList.map((prop, idx) => ({ prop, idx })).filter(({ prop }) => {
    const showByFilter = matchesFilter(prop, currentFilter, categoryTree);
    const showBySearch = !searchKeyword.trim() || 
      prop.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      prop.displayName.toLowerCase().includes(searchKeyword.toLowerCase());
    
    // 归属筛选
    let showByOwnership = true;
    if (ownershipFilter.type !== 'all') {
      if (ownershipFilter.type === 'none') {
        showByOwnership = prop.ownership.type === 'none';
      } else {
        showByOwnership = prop.ownership.type === ownershipFilter.type;
        if (ownershipFilter.name) {
          showByOwnership = showByOwnership && prop.ownership.name === ownershipFilter.name;
        }
      }
    }
    
    return showByFilter && showBySearch && showByOwnership;
  });

  // Count helper stats
  const furnitureCount = propsList.filter(p => p.type === 'furniture' && p.image !== null).length;
  const otherCount = propsList.filter(p => p.type === 'other' && p.image !== null).length;
  const totalCount = propsList.filter(p => p.image !== null).length;

  const handleFiles = async (files: FileList) => {
    const existingNames = new Set(propsList.map(p => p.name));
    const processed = await processImageFiles(files, existingNames);
    
    const duplicateCount = Array.from(files).filter(f => f.type.startsWith('image/')).length - processed.length;
    
    if (duplicateCount > 0) {
      addLog(`⚠ 检测到 ${duplicateCount} 个重复文件，已自动跳过`);
    }
    
    if (processed.length === 0) {
      addLog(duplicateCount > 0 ? '所有文件均为重复，未上传任何图片' : '未检测到有效的图片文件');
      return;
    }

    addLog(`成功拖入 / 上传 ${processed.length} 个图片文件（跳过 ${duplicateCount} 个重复）`);

    const newProps: PropItem[] = [];
    for (let i = 0; i < processed.length; i++) {
      const { file, parseResult } = processed[i];
      const dataUrl = await readFileAsDataURL(file);
      
      newProps.push({
        ...parseResult,
        image: dataUrl
      });

      let logMsg = `【分配至槽位 ${i + 1}】 ${file.name}`;
      if (parseResult.type === 'furniture') {
        logMsg += ` → [分类: ${parseResult.category}]`;
        if (parseResult.ownership.name && parseResult.ownership.type === 'male_lead') {
          logMsg += `（归属: ${parseResult.ownership.name}）`;
        }
        if (parseResult.classification.furnitureDetails?.isGrowthProp) {
          logMsg += ` [初见日]`;
        }
      }
      addLog(logMsg);
    }

    setPropsList(prev => {
      const existingProps = prev.filter(p => p.image !== null);
      const updatedProps = [...existingProps, ...newProps];
      setTimeout(() => autoSavePropsToLocal(updatedProps), 100);
      return updatedProps;
    });
  };

  // 自动保存函数（保存完整数据含图片base64）
  const autoSavePropsToLocal = (props: PropItem[]) => {
    const validProps = props.filter(p => p.image !== null);
    if (validProps.length > 0) {
      // 保存完整的道具数据，包括图片 base64
      localStorage.setItem('savedProps', JSON.stringify(validProps));
      addLog(`✓ 自动保存：已保存 ${validProps.length} 个道具至本地库（含图片）`);
    }
  };

  // 删除单个图片
  const deleteSingleProp = (index: number) => {
    const prop = propsList[index];
    setPropsList(prev => {
      const updatedProps = prev.filter((_, idx) => idx !== index);
      setTimeout(() => autoSavePropsToLocal(updatedProps), 100);
      return updatedProps;
    });
    addLog(`删除图片：${prop.displayName}`);
  };

  const previewProp = previewIndex !== null ? propsList[previewIndex] : null;

  const handleExportJson = () => {
    try {
      exportParseRecordToJson(propsList);
      addLog(`✓ 成功导出解析记录`);
    } catch (error) {
      addLog(`✗ 导出失败: ${error}`);
      alert(error instanceof Error ? error.message : '导出失败');
    }
  };
  
  const reparseAllImages = () => {
    const validProps = propsList.filter(p => p.image !== null);
    if (validProps.length === 0) {
      alert('请先导入图片后再重新解析');
      return;
    }

    reloadRules();
    addLog(`开始重新解析 ${validProps.length} 个图片（已加载最新规则）...`);
    
    const updatedProps = validProps.map((prop, index) => {
      const parseResult = parseFileName(prop.name);
      if (prop.displayName !== parseResult.displayName || 
          prop.category !== parseResult.category ||
          prop.type !== parseResult.type) {
        addLog(`[${index + 1}/${validProps.length}] 更新: ${prop.name} → ${parseResult.displayName} [${parseResult.category}]`);
      }
      return {
        ...parseResult,
        image: prop.image
      };
    });

    setPropsList(updatedProps);
    setTimeout(() => autoSavePropsToLocal(updatedProps), 100);
    addLog(`✓ 重新解析完成！共处理 ${validProps.length} 个图片`);
    alert(`重新解析完成！\n\n共处理 ${validProps.length} 个图片`);
  };

  // 切换道具选择状态
  const togglePropSelection = (index: number) => {
    setSelectedPropIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const currentPageIndices = filteredProps.map(({ idx }) => idx);
    if (selectedPropIndices.length === currentPageIndices.length && currentPageIndices.every(i => selectedPropIndices.includes(i))) {
      setSelectedPropIndices([]);
    } else {
      setSelectedPropIndices(currentPageIndices);
    }
  };

  // 手动导入选中的道具到Tab2
  const importToTab2 = () => {
    if (!setRecordList || !addRecordLog) {
      alert('导入功能不可用');
      return;
    }

    if (selectedPropIndices.length === 0) {
      alert('请先选择要导入的道具');
      addLog('未选择任何道具');
      return;
    }

    // 获取Tab2中已存在的道具名称集合
    const existingPropNames = new Set(recordList.map(row => row.propName));
    
    // 筛选出未重复的道具
    const selectedProps = selectedPropIndices.map(idx => propsList[idx]).filter(p => p.image !== null);
    const newProps = selectedProps.filter(prop => !existingPropNames.has(prop.displayName));
    const duplicateCount = selectedProps.length - newProps.length;

    if (newProps.length === 0) {
      alert('所选道具已全部存在于Tab2中，未导入任何道具');
      addLog(`导入失败：所选 ${selectedProps.length} 个道具均已存在于Tab2`);
      addRecordLog(`导入失败：所选 ${selectedProps.length} 个道具均已存在`);
      return;
    }

    // 创建新的记录行
    const newRows: RecordRow[] = newProps.map(prop => ({
      id: Date.now() + Math.random(),
      originalImage: prop.image,
      screenshot: null,
      propName: prop.displayName,
      baseColor: '金',
      category: prop.category || '家具类',
      previewWithBase: null,
      outputName: `${prop.displayName}_金`
    }));

    setRecordList(prev => [...prev, ...newRows]);
    
    const logMessage = duplicateCount > 0 
      ? `✓ 手动导入完成：已导入 ${newRows.length} 个道具到Tab2（跳过 ${duplicateCount} 个重复）`
      : `✓ 手动导入完成：已导入 ${newRows.length} 个道具到Tab2`;
    
    addLog(logMessage);
    addRecordLog(logMessage);
    
    // 清空选择
    setSelectedPropIndices([]);
    
    alert(`导入完成！\n\n已导入 ${newRows.length} 个道具${duplicateCount > 0 ? `\n跳过 ${duplicateCount} 个重复道具` : ''}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex flex-wrap gap-2 items-start justify-between mb-4 bg-white/40 p-2 rounded-xl china-border">
          <CategoryFilter
            categoryTree={categoryTree}
            currentFilter={currentFilter}
            onFilterChange={(filter) => {
              setCurrentFilter(filter);
              setIsLogPanelOpen(false);
              addLog(`筛选变更为: ${filter.level1}${filter.level2 ? ` > ${filter.level2}` : ''}`);
            }}
            expandedL1={expandedL1}
            onExpand={setExpandedL1}
          />

          <div className="flex gap-2 flex-shrink-0 items-start pt-0.5">
            {selectedPropIndices.length > 0 && (
              <Button 
                onClick={importToTab2} 
                icon={Send} 
                variant="primary" 
                title={`导入选中的 ${selectedPropIndices.length} 个道具到Tab2`}
              >
                导入到Tab2 ({selectedPropIndices.length})
              </Button>
            )}
            <Button onClick={reparseAllImages} disabled={totalCount === 0} icon={RefreshCw} variant="secondary" title="重新解析所有图片的文件名">
              重新解析
            </Button>
            <Button onClick={handleExportJson} disabled={totalCount === 0} icon={FileText} variant="warning" title="导出解析记录为JSON文件">
              导出JSON
            </Button>
            <Button onClick={clearAllProps} icon={Download} variant="danger">
              清空图片
            </Button>
          </div>
        </div>

        {/* 归属筛选器和搜索框 */}
        <div className="mb-4 bg-white/40 p-3 rounded-xl china-border">
          <OwnershipFilter
            currentOwnership={ownershipFilter}
            onOwnershipChange={(ownership) => {
              setOwnershipFilter(ownership);
              addLog(`归属筛选变更为: ${ownership.type === 'all' ? '全部' : ownership.type === 'male_lead' ? '男主' : ownership.type === 'spy' ? '密探' : '无归属'}${ownership.name ? ` (${ownership.name})` : ''}`);
            }}
            maleLeads={maleLeads}
            spies={spies}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            onSearchClear={() => addLog('已清空搜索内容')}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <PropGrid
            props={filteredProps}
            previewIndex={previewIndex}
            onSelect={setPreviewIndex}
            onDelete={deleteSingleProp}
            selectedIndices={selectedPropIndices}
            onToggleSelection={togglePropSelection}
            onToggleSelectAll={toggleSelectAll}
          />
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4 relative min-h-0">
        <div className="right-content-scroll flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
          <StatsBar
            furnitureCount={furnitureCount}
            otherCount={otherCount}
            totalCount={totalCount}
          />

          <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden flex-shrink-0">
            <UploadZone onFilesSelected={handleFiles} />
          </div>

          <div id="previewArea" className="flex flex-col gap-2">
            <PreviewPanel prop={previewProp} />
          </div>
        </div>
      </div>

      {/* Log Sidebar Component */}
      <LogSidebar
        isOpen={isLogPanelOpen}
        setIsOpen={setIsLogPanelOpen}
        logs={logs}
        onClearLogs={clearLogs}
      />
    </div>
  );
}
