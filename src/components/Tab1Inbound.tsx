import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  FileUp, 
  Sparkles, 
  FileText, 
  Calendar, 
  Layout, 
  Grid, 
  Bookmark, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Info,
  Download,
  XCircle,
  Package,
  RefreshCw
} from 'lucide-react';
import { PropItem, parseFileName, reloadRules } from '../types';
import LogSidebar from './LogSidebar';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import categoryConfig from '../categoryConfig.json';

// ---- 分类配置类型定义 ----
type CategoryConfig = {
  [level1: string]: string[] | { [level2: string]: string[] | { [level3: string]: string[] } };
};

// 从 categoryConfig.json 提取扁平化的一级/二级结构
// level1: 男主类 / 密探类 / 头像类 / 活动类 / 其他类 / 家具
// level2: 对应子项
function buildCategoryTree(config: any): { level1: string; level2: string[] }[] {
  const tree: { level1: string; level2: string[] }[] = [];
  // "除家具以外的道具" 下的各一级分类
  const nonFurniture = config['除家具以外的道具'] || {};
  for (const [l1, children] of Object.entries(nonFurniture)) {
    if (Array.isArray(children)) {
      tree.push({ level1: l1, level2: children as string[] });
    }
  }
  // "家具" 单独处理：把 套装/自由装修 的所有叶子铺开成二级
  const furniture = config['家具'] || {};
  const furnitureL2: string[] = [];
  for (const [l2, sub] of Object.entries(furniture)) {
    if (Array.isArray(sub)) {
      // 套装：["户内","户外"]
      (sub as string[]).forEach(s => furnitureL2.push(`${l2}·${s}`));
    } else if (typeof sub === 'object') {
      // 自由装修
      for (const [l3, items] of Object.entries(sub as object)) {
        if (Array.isArray(items)) {
          (items as string[]).forEach(s => furnitureL2.push(`${l3}·${s}`));
        }
      }
    }
  }
  tree.push({ level1: '家具', level2: furnitureL2 });
  return tree;
}

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
  onImportToTab2?: (images: Array<{ image: string; name: string }>) => void;
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
  onImportToTab2
}: Tab1InboundProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'image' | 'folder'>('image');
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  // 展开的一级分类
  const [expandedL1, setExpandedL1] = useState<string | null>(null);

  // 构建分类树
  const categoryTree = buildCategoryTree(categoryConfig);

  // Filter & Search matching
  const filteredProps = propsList.map((prop, idx) => ({ prop, idx })).filter(({ prop }) => {
    let showByFilter = true;
    if (currentFilter.level1 !== 'all') {
      // 根据 displayName / category / type 做简单匹配
      const l1 = currentFilter.level1;
      const l2 = currentFilter.level2;

      if (l1 === '家具') {
        showByFilter = prop.type === 'furniture';
        if (showByFilter && l2) {
          // l2 格式为 "套装·户内" 或 "起居" 等，尝试匹配 category
          const subLabel = l2.includes('·') ? l2.split('·')[1] : l2;
          showByFilter = prop.category === subLabel || prop.category === l2;
        }
      } else {
        // 非家具：用一级分类名匹配，或直接用二级分类匹配 category/displayName
        if (l2) {
          showByFilter =
            prop.category === l2 ||
            prop.displayName.includes(l2);
        } else {
          // 只选了一级，显示该大类下所有
          const treeNode = categoryTree.find(n => n.level1 === l1);
          if (treeNode) {
            showByFilter = treeNode.level2.some(sub =>
              prop.category === sub || prop.displayName.includes(sub)
            );
          } else {
            showByFilter = prop.type !== 'furniture';
          }
        }
      }
    }

    let showBySearch = true;
    if (searchKeyword.trim() !== '') {
      const keyword = searchKeyword.toLowerCase();
      const n = prop.name.toLowerCase();
      const dn = prop.displayName.toLowerCase();
      showBySearch = n.includes(keyword) || dn.includes(keyword);
    }

    return showByFilter && showBySearch;
  });

  // Count helper stats
  const furnitureCount = propsList.filter(p => p.type === 'furniture' && p.image !== null).length;
  const otherCount = propsList.filter(p => p.type === 'other' && p.image !== null).length;
  const totalCount = propsList.filter(p => p.image !== null).length;

  // File loading helper
  const handleFiles = (files: FileList) => {
    const list = Array.from(files);
    const imageFiles = list.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      // 获取当前已存在的文件名集合
      const existingNames = new Set(propsList.map(p => p.name));
      
      // 过滤掉重复的文件
      const uniqueFiles = imageFiles.filter(file => {
        const parseResult = parseFileName(file.name);
        return !existingNames.has(parseResult.originalName);
      });

      const duplicateCount = imageFiles.length - uniqueFiles.length;
      
      if (duplicateCount > 0) {
        addLog(`⚠ 检测到 ${duplicateCount} 个重复文件，已自动跳过`);
      }

      if (uniqueFiles.length === 0) {
        addLog('所有文件均为重复，未上传任何图片');
        return;
      }

      addLog(`成功拖入 / 上传 ${uniqueFiles.length} 个图片文件（跳过 ${duplicateCount} 个重复）`);

      // 批量处理所有文件
      const newProps: PropItem[] = [];
      let processedCount = 0;

      uniqueFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const parseResult = parseFileName(file.name);

          newProps[index] = {
            name: parseResult.originalName,
            displayName: parseResult.displayName,
            type: parseResult.type,
            category: parseResult.category,
            maleLead: parseResult.maleLead,
            isGrowthProp: parseResult.isGrowthProp,
            isFloor: parseResult.isFloor,
            image: dataUrl
          };

          processedCount++;

          let logMsg = `【分配至槽位 ${processedCount}】 ${file.name}`;
          if (parseResult.type === 'furniture') {
            logMsg += ` → [分类: ${parseResult.category}]`;
            if (parseResult.maleLead) {
              logMsg += `（归属: ${parseResult.maleLead}）`;
            }
            if (parseResult.isGrowthProp) {
              logMsg += ` [初见日]`;
            }
          }
          addLog(logMsg);

          // 当所有文件都处理完成后，更新状态
          if (processedCount === uniqueFiles.length) {
            setPropsList(prev => {
              // 保留现有已上传的图片
              const existingProps = prev.filter(p => p.image !== null);
              // 添加新上传的图片
              const updatedProps = [...existingProps, ...newProps];
              
              // 自动保存到本地存储
              setTimeout(() => {
                autoSavePropsToLocal(updatedProps);
              }, 100);
              
              return updatedProps;
            });
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      addLog('未检测到有效的图片文件');
    }
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
  const deleteSingleProp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const prop = propsList[index];
    setPropsList(prev => {
      const updatedProps = prev.filter((_, idx) => idx !== index);
      
      // 自动保存删除后的状态
      setTimeout(() => {
        autoSavePropsToLocal(updatedProps);
      }, 100);
      
      return updatedProps;
    });
    addLog(`删除图片：${prop.displayName}`);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const onFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const previewProp = previewIndex !== null ? propsList[previewIndex] : null;

  // 导出解析记录为 JSON
  const exportParseRecordToJson = () => {
    const validProps = propsList.filter(p => p.image !== null);
    if (validProps.length === 0) {
      addLog('没有可导出的解析记录');
      alert('请先导入图片后再导出解析记录');
      return;
    }

    const parseRecords = validProps.map((prop, index) => ({
      序号: index + 1,
      原始文件名: prop.name,
      解析后名称: prop.displayName,
      类型: prop.type === 'furniture' ? '家具' : '其他道具',
      分类: prop.category,
      男主归属: prop.maleLead || '无',
      是否初见日: prop.isGrowthProp ? '是' : '否',
      是否地板: prop.isFloor ? '是' : '否',
      分类路径: prop.categoryPath?.join(' > ') || '未分类'
    }));

    const jsonContent = JSON.stringify(parseRecords, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `解析记录_${timestamp}.json`;
    saveAs(blob, fileName);

    addLog(`✓ 成功导出 ${validProps.length} 条解析记录为 ${fileName}`);
    alert(`成功导出 ${validProps.length} 条解析记录！\n\n文件名: ${fileName}`);
  };

  // 导出图片为 ZIP
  // 重新解析所有图片
  const reparseAllImages = () => {
    const validProps = propsList.filter(p => p.image !== null);
    if (validProps.length === 0) {
      addLog('没有可重新解析的图片');
      alert('请先导入图片后再重新解析');
      return;
    }

    // 刷新规则（从 localStorage 读取最新的自定义规则）
    reloadRules();
    addLog(`开始重新解析 ${validProps.length} 个图片（已加载最新规则）...`);
    
    const updatedProps = validProps.map((prop, index) => {
      const parseResult = parseFileName(prop.name);
      
      // 如果解析结果有变化，记录日志
      if (prop.displayName !== parseResult.displayName || 
          prop.category !== parseResult.category ||
          prop.type !== parseResult.type) {
        addLog(`[${index + 1}/${validProps.length}] 更新: ${prop.name} → ${parseResult.displayName} [${parseResult.category}]`);
      }
      
      return {
        ...prop,
        displayName: parseResult.displayName,
        type: parseResult.type,
        category: parseResult.category,
        maleLead: parseResult.maleLead,
        isGrowthProp: parseResult.isGrowthProp,
        isFloor: parseResult.isFloor
      };
    });

    setPropsList(updatedProps);
    
    // 自动保存到本地存储
    setTimeout(() => {
      autoSavePropsToLocal(updatedProps);
    }, 100);
    
    addLog(`✓ 重新解析完成！共处理 ${validProps.length} 个图片`);
    alert(`重新解析完成！\n\n共处理 ${validProps.length} 个图片`);
  };

  const exportImagesToZip = async () => {
    const validProps = propsList.filter(p => p.image !== null);
    if (validProps.length === 0) {
      addLog('没有可导出的图片');
      alert('请先导入图片后再导出');
      return;
    }

    try {
      addLog(`开始导出 ${validProps.length} 个图片为 ZIP...`);
      
      const zip = new JSZip();
      const folder = zip.folder('道具图片');

      // 将每个图片添加到 zip
      for (let i = 0; i < validProps.length; i++) {
        const prop = validProps[i];
        if (prop.image) {
          // 从 base64 数据中提取实际的图片数据
          const base64Data = prop.image.split(',')[1];
          const fileName = `${prop.displayName}.png`;
          
          folder?.file(fileName, base64Data, { base64: true });
          addLog(`[${i + 1}/${validProps.length}] 添加: ${fileName}`);
        }
      }

      // 生成 zip 文件
      addLog('正在生成 ZIP 文件...');
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // 下载文件
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `道具图片导出_${timestamp}.zip`;
      saveAs(blob, fileName);
      
      addLog(`✓ 成功导出 ${validProps.length} 个图片为 ${fileName}`);
      alert(`成功导出 ${validProps.length} 个图片！\n\n文件名: ${fileName}`);
    } catch (error) {
      console.error('导出失败:', error);
      addLog(`✗ 导出失败: ${error}`);
      alert('导出失败，请查看控制台日志');
    }
  };

  // 导入图片到Tab2
  const importToTab2 = () => {
    const validProps = propsList.filter(p => p.image !== null);
    if (validProps.length === 0) {
      addLog('没有可导入的图片');
      alert('请先导入图片后再导入到Tab2');
      return;
    }

    if (!onImportToTab2) {
      addLog('导入到Tab2功能未配置');
      return;
    }

    const imagesToImport = validProps.map(prop => ({
      image: prop.image!,
      name: prop.displayName
    }));

    onImportToTab2(imagesToImport);
    addLog(`✓ 成功导入 ${validProps.length} 张图片到Tab2的道具原图列`);
    alert(`成功导入 ${validProps.length} 张图片到Tab2！`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      {/* Input file helper element */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
      />
      
      {/* Input folder helper element */}
      <input 
        type="file" 
        multiple 
        accept="image/*"
        // @ts-ignore
        webkitdirectory="" 
        directory=""
        ref={folderInputRef} 
        onChange={onFolderChange} 
        className="hidden" 
      />

      {/* Left Content Column */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Style selection buttons container */}
        <div className="flex flex-wrap gap-2 items-start justify-between mb-4 bg-white/40 p-2 rounded-xl china-border">
          {/* 分类筛选器：一级 + 二级 */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* 一级分类行 */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* 全部 */}
              <button
                onClick={() => {
                  setCurrentFilter({ level1: 'all', level2: null });
                  setExpandedL1(null);
                  setIsLogPanelOpen(false);
                  addLog('筛选变更为: 全部');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  currentFilter.level1 === 'all'
                    ? 'bg-plum-deep text-white shadow-sm'
                    : 'bg-[#F2ECE4] text-[#674b2d] hover:bg-[#EADBCC]'
                }`}
              >
                全部
              </button>

              {/* 各一级分类 */}
              {categoryTree.map(node => {
                const isActiveL1 = currentFilter.level1 === node.level1;
                const isExpanded = expandedL1 === node.level1;
                return (
                  <button
                    key={node.level1}
                    onClick={() => {
                      if (isExpanded) {
                        // 再次点击收起，同时清空二级筛选保留一级
                        setExpandedL1(null);
                      } else {
                        setExpandedL1(node.level1);
                        setCurrentFilter({ level1: node.level1, level2: null });
                        setIsLogPanelOpen(false);
                        addLog(`筛选变更为: ${node.level1}`);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                      isActiveL1
                        ? 'bg-plum-deep text-white shadow-sm'
                        : 'bg-[#F2ECE4] text-[#674b2d] hover:bg-[#EADBCC]'
                    }`}
                  >
                    {node.level1}
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* 二级分类行（动态展开） */}
            <AnimatePresence>
              {expandedL1 && (() => {
                const node = categoryTree.find(n => n.level1 === expandedL1);
                if (!node) return null;
                return (
                  <motion.div
                    key={expandedL1}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1 pt-1 pl-2 border-l-2 border-[#C59F4A]/30">
                      {/* 二级「全部」 */}
                      <button
                        onClick={() => {
                          setCurrentFilter({ level1: expandedL1, level2: null });
                          addLog(`筛选变更为: ${expandedL1} > 全部`);
                        }}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                          currentFilter.level1 === expandedL1 && currentFilter.level2 === null
                            ? 'bg-gold-deep text-white shadow-sm'
                            : 'bg-[#FAF2E5] text-[#8E6B3A] hover:bg-[#F0E4CC]'
                        }`}
                      >
                        全部
                      </button>
                      {node.level2.map(sub => (
                        <button
                          key={sub}
                          onClick={() => {
                            setCurrentFilter({ level1: expandedL1, level2: sub });
                            addLog(`筛选变更为: ${expandedL1} > ${sub}`);
                          }}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                            currentFilter.level2 === sub
                              ? 'bg-gold-deep text-white shadow-sm'
                              : 'bg-[#FAF2E5] text-[#8E6B3A] hover:bg-[#F0E4CC]'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* 清空图片按钮 */}
          <div className="flex gap-2 flex-shrink-0 items-start pt-0.5">
            <button
              onClick={reparseAllImages}
              disabled={totalCount === 0}
              id="reparseBtn"
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                totalCount > 0
                  ? 'bg-[#F0F8FF] text-[#4F73C7] hover:bg-[#E0ECFF] border border-[#D1E4FF] cursor-pointer'
                  : 'bg-[#F5F5F5] text-[#B0B0B0] border border-[#E0E0E0] cursor-not-allowed'
              }`}
              title="重新解析所有图片的文件名"
            >
              <RefreshCw size={12} />
              重新解析
            </button>

            <button
              onClick={exportParseRecordToJson}
              disabled={totalCount === 0}
              id="exportJsonBtn"
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                totalCount > 0
                  ? 'bg-[#FFF8E1] text-[#F57C00] hover:bg-[#FFECB3] border border-[#FFE082] cursor-pointer'
                  : 'bg-[#F5F5F5] text-[#B0B0B0] border border-[#E0E0E0] cursor-not-allowed'
              }`}
              title="导出解析记录为JSON文件用于调试"
            >
              <FileText size={12} />
              导出JSON
            </button>
            
            <button
              onClick={clearAllProps}
              id="clearAllBtn"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#FFF0F0] text-[#D86B6B] hover:bg-[#FFE0E0] border border-[#FFD6D6] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={12} />
              清空图片
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gold-deep">
            <Search size={14} />
          </div>
          <input
            id="searchInput"
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="我是搜索框（默认开头为：icon_）"
            className="w-full pl-10 pr-16 py-2.5 text-center text-xs bg-[#FAF7F2] border border-[#E4E8F0] focus:border-gold-shiny focus:ring-1 focus:ring-gold-shiny outline-none text-[#674b2d] placeholder-[#A2978E] font-medium rounded-lg transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => {
                setSearchKeyword('');
                addLog('已清空搜索内容');
              }}
              id="searchClearBtn"
              className="absolute inset-y-1.5 right-2 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-[#EADBCC] text-[#674b2d] hover:bg-[#E3CBB3] transition-all cursor-pointer"
            >
              清空
            </button>
          )}
        </div>

        {/* Display Item Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div 
            id="propsGrid"
            className="grid grid-cols-6 gap-3.5 mb-2"
          >
            {propsList
              .filter(prop => prop.image !== null) // 只显示有图片的项
              .map((prop, displayIdx) => {
                // Find original index for matching
                const originalIdx = propsList.indexOf(prop);
                const isMatched = filteredProps.some(f => f.idx === originalIdx);
                if (!isMatched) return null;

                const isSelected = previewIndex === originalIdx;

                return (
                  <motion.div
                    layoutId={`slot-${originalIdx}`}
                    key={originalIdx}
                    onClick={() => setPreviewIndex(originalIdx)}
                    className={`group relative flex flex-col items-center bg-white border rounded-xl p-2 cursor-pointer select-none transition-all duration-300 china-border ${
                      isSelected 
                      ? 'shadow-lg ring-2 ring-gold-shiny/80 bg-[#FFFDF7] -translate-y-0.5' 
                      : 'hover:shadow-md hover:-translate-y-0.5 shadow-sm'
                    }`}
                  >
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => deleteSingleProp(originalIdx, e)}
                      className="absolute top-1 left-1 z-20 w-5 h-5 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                      title="删除此图片"
                    >
                      <X size={12} />
                    </button>

                    <div 
                      className="prop-thumbnail relative w-full aspect-square rounded-lg border flex items-center justify-center transition-all border-[#EADFCD] bg-transparent"
                      style={{ 
                        backgroundImage: `url(${prop.image})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Category badges */}
                      {prop.type === 'furniture' && (
                        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end z-10 pointer-events-none">
                          {prop.isGrowthProp ? (
                            <span className="prop-badge growth px-2 py-0.5 text-[9px] font-bold bg-[#D86B6B] text-white rounded shadow-sm scale-90 origin-top-right uppercase">初见日</span>
                          ) : prop.isFloor ? (
                            <span className="prop-badge floor px-2 py-0.5 text-[9px] font-bold bg-[#4F73C7] text-white rounded shadow-sm scale-90 origin-top-right">地板</span>
                          ) : prop.category !== '其他' ? (
                            <span className="prop-badge px-2 py-0.5 text-[9px] font-bold bg-gold-deep text-white rounded shadow-sm scale-90 origin-top-right">{prop.category}</span>
                          ) : null}
                        </div>
                      )}

                      {/* Decorative slots order label */}
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-bold font-mono text-gold-deep/40">{displayIdx + 1}</span>
                    </div>

                    {/* Prop name */}
                    <div className="mt-2 text-center w-full px-1">
                      <div className="text-[11px] font-bold text-[#674b2d] truncate group-hover:text-gold-deep transition-colors">
                        {prop.displayName}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Right Drawer Panel with Scroll view */}
      <div className="w-full lg:w-80 flex flex-col gap-4 relative min-h-0">
        {/* Scrollable content area */}
        <div className="right-content-scroll flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
          {/* Core numerical inventory system - Optimized & Simplified */}
          <div className="stats-area bg-[#FAF8F5]/60 border border-[#E9DFD0] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />
              <span className="font-serif font-bold text-[11px] text-[#A67020] tracking-wider">库内存量统计</span>
            </div>
            
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-[#8E8276] text-[10px]">家具</span>
                <span className="font-bold text-[#674b2d]" id="furnitureCount">{furnitureCount}</span>
              </div>
              <span className="text-[#DFD2BD]">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#8E8276] text-[10px]">其它</span>
                <span className="font-bold text-[#674b2d]" id="otherPropsCount">{otherCount}</span>
              </div>
              <span className="text-[#DFD2BD]">|</span>
              <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-[#E9DFD0] shadow-xs">
                <span className="text-gold-deep font-bold font-serif text-[10px]">共</span>
                <span className="font-bold text-[#9E4A4A]" id="totalCount">{totalCount}</span>
              </div>
            </div>
          </div>

          {/* Drag & Drop action area */}
          <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden flex-shrink-0">
            {/* Upload area content */}
            <div
              id="dragArea"
              onDragOver={onDragOver}
              onDragLeave={onDragOver}
              onDrop={onDrop}
              onClick={triggerUpload}
              className="drag-area group flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-all duration-200 hover:bg-gold-light"
            >
              <span className="text-sm font-bold text-[#674b2d] tracking-wide mb-1">
                支持拖入图片
              </span>
              <span className="text-xs font-medium text-gold-deep/70">
                或点击窗口选择图片文件
              </span>
            </div>
          </div>

          {/* Large image previewer */}
          <div id="previewArea" className="flex flex-col gap-2">
            {previewProp && previewProp.image ? (
              <>
                {/* 图片卡片 */}
                <div className="bg-white/80 rounded-xl p-3 border border-[#ECDDB9] shadow-sm flex items-center justify-center min-h-[180px]">
                  <img
                    src={previewProp.image}
                    alt="大图预览"
                    className="max-w-full max-h-44 object-contain rounded transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* 信息卡片 */}
                <div className="bg-[#FAF4EA] border border-[#ECDDB9] rounded-xl p-3 shadow-sm">
                  {/* 居中显示的展示名称 */}
                  <div className="text-center mb-2">
                    <span className="font-bold text-[#674b2d] text-base block leading-tight">{previewProp.displayName}</span>
                  </div>

                  {/* 原文件名 */}
                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    <span className="font-semibold text-[#8E8276] text-[11px]">原文件名:</span>
                    <span className="text-[11px] text-gray-500 font-mono">{previewProp.name}</span>
                  </div>

                  {/* 分类 */}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="font-semibold text-[#8E8276] text-[11px]">分类:</span>
                    <span className="font-bold text-[#674b2d] text-[11px]">{previewProp.category}</span>
                  </div>

                  {previewProp.type === 'furniture' && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {previewProp.maleLead && (
                        <span className="text-[9px] font-bold bg-[#F5F0E8] text-[#8B6F47] border border-[#D4C4AA] px-1.5 py-0.5 rounded-full">{previewProp.maleLead}</span>
                      )}
                      {previewProp.isGrowthProp && (
                        <span className="text-[9px] font-bold bg-[#FFEBEB] text-[#D86B6B] border border-[#FFD1D1] px-1.5 py-0.5 rounded-full">初见日</span>
                      )}
                      {previewProp.isFloor && (
                        <span className="text-[9px] font-bold bg-[#EBF3FF] text-[#4F73C7] border border-[#D1E4FF] px-1.5 py-0.5 rounded-full">地板</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#FAF4EA] border border-[#ECDDB9] rounded-xl p-6 flex flex-col items-center justify-center min-h-[180px] shadow-sm">
                <div className="w-8 h-8 bg-white/80 text-gold-deep flex items-center justify-center rounded-full mb-1.5">
                  <Info size={16} className="animate-pulse" />
                </div>
                <span className="text-xs font-bold text-[#A67020] leading-relaxed">
                  点击左侧缩略图即可查看大图
                </span>
                <span className="text-[10px] font-medium text-[#C59F67] mt-0.5">
                  (快来点点我吧)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Locked bottom submit / commit button action block */}
        <div className="save-button-area border-t border-gold-medium/30 pt-3 bg-transparent">
          <button
            onClick={importToTab2}
            disabled={totalCount === 0}
            id="importToTab2Button"
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
              totalCount > 0 
                ? 'bg-gradient-to-r from-[#7B68EE] to-[#6A5ACD] hover:to-[#5B4BBD] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' 
                : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
            }`}
          >
            <Download size={16} />
            导入到 Tab2
          </button>
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
