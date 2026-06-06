import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, Info, Settings, RefreshCw } from 'lucide-react';
import { PropItem, RecordRow } from './types';
import Tab1Inbound from './components/Tab1Inbound';
import Tab2Record from './components/Tab2Record';
import Tab3Settings from './components/Tab3Settings';
import Tab4RulesManager from './components/Tab4RulesManager';
import Tab5Compose from './components/Tab5Compose';
import { ProgressBar } from './components/common';

export default function App() {
  // 从localStorage读取上次打开的tab，如果没有则默认为tab5
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5'>(() => {
    const savedTab = localStorage.getItem('lastActiveTab');
    return (savedTab as 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5') || 'tab5';
  });
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState<boolean>(false);
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);

  // Tab 1 state configurations
  const [propsList, setPropsList] = useState<PropItem[]>([]);

  const [currentFilter, setCurrentFilter] = useState<{ level1: string; level2: string | null }>({ level1: 'all', level2: null });
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>(['系统初始化完成']);

  // Tab 2 state configurations（不再从localStorage加载完整数据，避免存储配额问题）
  const [recordList, setRecordList] = useState<RecordRow[]>([]);

  const [recordLogs, setRecordLogs] = useState<string[]>(['Tab2 追记系统初始化完成']);
  const [selectedRecordPart, setSelectedRecordPart] = useState<{ rowId: number; type: 'original' | 'screenshot' } | null>(null);

  // Bottom global progress bar setups
  const [progressBarVisible, setProgressBarVisible] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Sync log streaming helpers
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs(['系统初始化完成']);
    addLog('日志已清空');
  };

  const addRecordLog = (message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setRecordLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  const clearRecordLogs = () => {
    setRecordLogs(['Tab2 追记系统初始化完成']);
    addRecordLog('日志已清空');
  };

  const showProgressBar = () => {
    setProgressBarVisible(true);
    setProgressPercent(0);
  };

  const hideProgressBar = () => {
    setTimeout(() => {
      setProgressBarVisible(false);
    }, 700);
  };

  const updateProgress = (current: number, total: number) => {
    const percent = Math.round((current / total) * 100);
    setProgressPercent(percent);
  };

  // Clear loaded items helper
  const clearAllProps = () => {
    if (confirm('确定要清空所有已导入的道具吗？')) {
      setPropsList([]);
      setPreviewIndex(null);
      // 清空本地存储
      localStorage.removeItem('savedProps');
      addLog('已清空所有道具（包括本地存储）');
    }
  };

  // 监听activeTab变化，保存到localStorage
  useEffect(() => {
    localStorage.setItem('lastActiveTab', activeTab);
  }, [activeTab]);

  // Load from local storage initially
  useEffect(() => {
    // 清理可能导致配额溢出的旧数据
    try {
      const oldRecordList = localStorage.getItem('tab2_recordList');
      const oldScreenshots = localStorage.getItem('tab2_uploadedScreenshots');
      
      if (oldRecordList) {
        const size = new Blob([oldRecordList]).size / (1024 * 1024);
        if (size > 1) {
          console.log(`清理旧的 tab2_recordList 数据 (${size.toFixed(2)}MB)`);
          localStorage.removeItem('tab2_recordList');
          addRecordLog(`已清理旧的大容量记录数据 (${size.toFixed(2)}MB)，请从Tab1重新导入`);
        }
      }
      
      if (oldScreenshots) {
        const size = new Blob([oldScreenshots]).size / (1024 * 1024);
        if (size > 1) {
          console.log(`清理旧的 tab2_uploadedScreenshots 数据 (${size.toFixed(2)}MB)`);
          localStorage.removeItem('tab2_uploadedScreenshots');
          addRecordLog(`已清理旧的大容量截图数据 (${size.toFixed(2)}MB)`);
        }
      }
    } catch (err) {
      console.error('清理旧数据失败:', err);
    }
    
    const localProps = localStorage.getItem('savedProps');
    if (localProps) {
      try {
        const parsed = JSON.parse(localProps);
        
        // 数据迁移：检查是否是旧格式
        const migratedData = parsed.map((prop: any) => {
          // 如果已经是新格式，直接返回
          if (prop.classification && prop.ownership) {
            return prop;
          }
          
          // 旧格式迁移到新格式
          const ownershipType = prop.maleLead ? 'male_lead' : 'none';
          const ownership = {
            type: ownershipType,
            name: prop.maleLead || null,
            code: null
          };
          
          const classification = {
            type: prop.type || 'other',
            category: prop.category || '其他',
            categoryPath: prop.categoryPath || ['其他'],
            furnitureDetails: prop.type === 'furniture' ? {
              scene: 'indoor' as const,
              isFloor: prop.isFloor || false,
              isGrowthProp: prop.isGrowthProp || false,
              isSuit: false
            } : undefined
          };
          
          return {
            name: prop.name,
            displayName: prop.displayName,
            image: prop.image,
            classification,
            ownership,
            tags: Array.isArray(prop.tags) ? prop.tags : [],
            // 兼容字段
            type: prop.type || 'other',
            category: prop.category || '其他',
            categoryPath: prop.categoryPath || ['其他'],
            maleLead: prop.maleLead || null,
            isGrowthProp: prop.isGrowthProp || false,
            isFloor: prop.isFloor || false
          };
        });
        
        setPropsList(migratedData);
        
        // 如果进行了迁移，保存新格式
        if (JSON.stringify(parsed) !== JSON.stringify(migratedData)) {
          localStorage.setItem('savedProps', JSON.stringify(migratedData));
          addLog(`从本地存储加载了 ${migratedData.length} 个历史道具（已自动迁移到新格式）`);
        } else {
          addLog(`从本地存储加载了 ${migratedData.length} 个历史道具（含图片数据）`);
        }
      } catch (err) {
        console.error(err);
        addLog('加载本地道具数据失败');
      }
    }
    const localRecords = localStorage.getItem('recordData');
    if (localRecords) {
      try {
        const parsed = JSON.parse(localRecords);
        addRecordLog(`从当地存储加值了 ${parsed.length} 条追记历史单行信息`);
      } catch (err) {
        console.error(err);
      }
    }
    
    // 加载 API 配置
    const savedApiEndpoint = localStorage.getItem('apiEndpoint');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('selectedModel');
    const savedModels = localStorage.getItem('availableModels');
    
    if (savedApiEndpoint) setApiEndpoint(savedApiEndpoint);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setSelectedModel(savedModel);
    
    // 加载上次拉取的模型列表
    if (savedModels) {
      try {
        const parsedModels = JSON.parse(savedModels);
        setAvailableModels(parsedModels);
      } catch (err) {
        console.error('加载模型列表失败:', err);
      }
    }
  }, []);

  // 保存 API 配置
  const saveApiConfig = () => {
    localStorage.setItem('apiEndpoint', apiEndpoint);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('selectedModel', selectedModel);
    
    // 保存时重新排序模型列表，将当前选择的模型置顶
    if (availableModels.length > 0 && selectedModel) {
      const sortedModels = sortModels(availableModels, selectedModel);
      setAvailableModels(sortedModels);
      localStorage.setItem('availableModels', JSON.stringify(sortedModels));
    }
    
    addLog(`API 配置已保存${selectedModel ? `，当前模型: ${selectedModel}` : ''}`);
    setIsApiConfigOpen(false);
  };

  // 模型排序函数：将上次选择的模型排在最前面，其余按字母顺序排序
  const sortModels = (models: string[], lastSelected: string | null): string[] => {
    const sorted = [...models].sort((a, b) => {
      // 优先级1: 上次选择的模型排第一
      if (lastSelected) {
        if (a === lastSelected) return -1;
        if (b === lastSelected) return 1;
      }
      
      // 优先级2: 按字母顺序排序
      return a.localeCompare(b, 'en', { sensitivity: 'base' });
    });
    
    return sorted;
  };

  // 拉取可用模型列表
  const fetchAvailableModels = async () => {
    if (!apiEndpoint || !apiKey) {
      addLog('[错误] 请先填写 API 端点和密钥');
      return;
    }

    setIsFetchingModels(true);
    addLog('[开始] 正在拉取可用模型列表...');

    try {
      const response = await fetch(`${apiEndpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 适配不同的API响应格式
      let models: string[] = [];
      if (data.data && Array.isArray(data.data)) {
        // OpenAI 格式
        models = data.data.map((m: any) => m.id || m.name || m).filter(Boolean);
      } else if (Array.isArray(data.models)) {
        // 其他格式
        models = data.models.map((m: any) => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
      } else if (Array.isArray(data)) {
        models = data.map((m: any) => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
      }

      // 排序：上次选择的模型排第一，其余按字母顺序
      const sortedModels = sortModels(models, selectedModel || null);
      
      setAvailableModels(sortedModels);
      // 保存模型列表到本地存储
      localStorage.setItem('availableModels', JSON.stringify(sortedModels));
      
      // 如果有上次选择的模型且在列表中，自动选择它
      if (selectedModel && sortedModels.includes(selectedModel)) {
        addLog(`[成功] 获取到 ${sortedModels.length} 个可用模型，已自动选择上次使用的模型: ${selectedModel}`);
      } else if (sortedModels.length > 0) {
        // 如果没有上次选择的模型，自动选择第一个
        setSelectedModel(sortedModels[0]);
        addLog(`[成功] 获取到 ${sortedModels.length} 个可用模型，已自动选择: ${sortedModels[0]}`);
      } else {
        addLog(`[成功] 获取到 ${sortedModels.length} 个可用模型`);
      }
    } catch (error: any) {
      addLog(`[错误] 拉取模型失败: ${error.message}`);
      console.error('拉取模型失败:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <div id="root-container" className="min-h-screen bg-[#FAF7F2] text-[#674b2d] flex flex-row relative overflow-hidden font-sans pr-1">
      
      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-h-0 h-screen p-0 overflow-hidden z-10">
        
        {/* Top Header Card Info Section / Styled Top Navigation Bar */}
        <div className="header-section flex items-center justify-between gap-6 px-6 py-2 bg-gradient-to-r from-[#FAF8F5] via-[#FCFAF7] to-[#FAF8F5] border-b border-[#E9DFD0] shadow-sm relative select-none">
          
          {/* Left Wing Brand Identity Logo */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D86B6B] to-[#9E4A4A] rounded-lg flex items-center justify-center text-white shadow-sm border border-[#C59F4A]/30 flex-shrink-0">
              <span className="text-base font-serif">鸢</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-serif font-bold text-gold-deep tracking-wider">入库道具素材管理面板</span>
              <span className="text-[8px] font-mono font-medium text-[#C5B198] tracking-widest uppercase leading-none">WIKI INVENTORY CONTROL</span>
            </div>
          </div>

          {/* Center/Right Nav Pill Menu Items */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab('tab1');
                addLog('一键切页：① 入库');
              }}
              className={`header-left cursor-pointer transition-all duration-300 font-bold px-4 py-1.5 text-xs rounded-md select-none tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tab1'
                ? 'bg-plum-deep text-white shadow-sm shadow-[#443B43]/20 font-extrabold border border-[#443B43]'
                : 'bg-white/40 hover:bg-[#FAF2E5] text-gray-500 hover:text-[#5C534C] border border-transparent'
              }`}
            >
              <span className="text-[9px] opacity-75">✦</span>
              ① 入库
            </button>
            
            <button
              onClick={() => {
                setActiveTab('tab2');
                addRecordLog('一键切页：② 追记');
              }}
              className={`header-left cursor-pointer transition-all duration-300 font-bold px-4 py-1.5 text-xs rounded-md select-none tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tab2'
                ? 'bg-plum-deep text-white shadow-sm shadow-[#443B43]/20 font-extrabold border border-[#443B43]'
                : 'bg-white/40 hover:bg-[#FAF2E5] text-gray-500 hover:text-[#5C534C] border border-transparent'
              }`}
            >
              <span className="text-[9px] opacity-75">✦</span>
              ② 追记
            </button>

            <button
              onClick={() => {
                setActiveTab('tab3');
                addLog('一键切页：③ 设置');
              }}
              className={`header-left cursor-pointer transition-all duration-300 font-bold px-4 py-1.5 text-xs rounded-md select-none tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tab3'
                ? 'bg-plum-deep text-white shadow-sm shadow-[#443B43]/20 font-extrabold border border-[#443B43]'
                : 'bg-white/40 hover:bg-[#FAF2E5] text-gray-500 hover:text-[#5C534C] border border-transparent'
              }`}
            >
              <span className="text-[9px] opacity-75">✦</span>
              ③ 设置
            </button>

            <button
              onClick={() => {
                setActiveTab('tab4');
                addLog('一键切页：④ 规则');
              }}
              className={`header-left cursor-pointer transition-all duration-300 font-bold px-4 py-1.5 text-xs rounded-md select-none tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tab4'
                ? 'bg-plum-deep text-white shadow-sm shadow-[#443B43]/20 font-extrabold border border-[#443B43]'
                : 'bg-white/40 hover:bg-[#FAF2E5] text-gray-500 hover:text-[#5C534C] border border-transparent'
              }`}
            >
              <span className="text-[9px] opacity-75">✦</span>
              ④ 规则
            </button>

            <button
              onClick={() => {
                setActiveTab('tab5');
                addLog('一键切页：⑤ 图鉴合成');
              }}
              className={`header-left cursor-pointer transition-all duration-300 font-bold px-4 py-1.5 text-xs rounded-md select-none tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tab5'
                ? 'bg-plum-deep text-white shadow-sm shadow-[#443B43]/20 font-extrabold border border-[#443B43]'
                : 'bg-white/40 hover:bg-[#FAF2E5] text-gray-500 hover:text-[#5C534C] border border-transparent'
              }`}
            >
              <span className="text-[9px] opacity-75">✦</span>
              ⑤ 图鉴合成
            </button>
          </div>

          {/* Right Accented Status & Help Panel */}
          <div className="flex items-center gap-3">
            {/* API 配置按钮 */}
            <button
              onClick={() => setIsApiConfigOpen(true)}
              className="px-3 py-1.2 bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] hover:from-[#C8E6C9] hover:to-[#A5D6A7] text-[#2E7D32] border border-[#A5D6A7] rounded-lg text-xs font-bold tracking-wider hover:shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5 select-none leading-normal"
              title="配置 API 端点和密钥"
            >
              <Settings size={13} className="text-[#2E7D32]" />
              <span>API 配置</span>
            </button>
            
            {/* Elegant Help rules trigger button with compressed padding */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-3 py-1.2 bg-gradient-to-r from-[#FCF5EA] to-[#FAF0E0] hover:from-[#FAF0E0] hover:to-[#EFE2D0] text-[#A67020] border border-[#EFE2D0] rounded-lg text-xs font-bold tracking-wider hover:shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5 select-none leading-normal"
              title="查看系统说明、入库及校对解析规则"
            >
              <HelpCircle size={13} className="text-[#A67020]" />
              <span>帮助规则</span>
            </button>


          </div>

        </div>

        {/* Tab content area container with balanced adaptive paddings */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'tab1' ? (
              <motion.div
                key="tab1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <Tab1Inbound
                  propsList={propsList}
                  setPropsList={setPropsList}
                  currentFilter={currentFilter}
                  setCurrentFilter={setCurrentFilter}
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                  previewIndex={previewIndex}
                  setPreviewIndex={setPreviewIndex}
                  logs={logs}
                  addLog={addLog}
                  clearLogs={clearLogs}
                  clearAllProps={clearAllProps}
                />
              </motion.div>
            ) : activeTab === 'tab2' ? (
              <motion.div
                key="tab2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <Tab2Record
                  recordList={recordList}
                  setRecordList={setRecordList}
                  propsList={propsList}
                  setPropsList={setPropsList}
                  recordLogs={recordLogs}
                  addRecordLog={addRecordLog}
                  clearRecordLogs={clearRecordLogs}
                  showProgressBar={showProgressBar}
                  hideProgressBar={hideProgressBar}
                  updateProgress={updateProgress}
                  selectedPart={selectedRecordPart}
                  setSelectedPart={setSelectedRecordPart}
                  tab1PropsList={propsList}
                />
              </motion.div>
            ) : activeTab === 'tab3' ? (
              <motion.div
                key="tab3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <Tab3Settings />
              </motion.div>
            ) : activeTab === 'tab4' ? (
              <motion.div
                key="tab4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <Tab4RulesManager />
              </motion.div>
            ) : (
              <motion.div
                key="tab5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <Tab5Compose />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom progress bar container - 仅在非 tab2 时显示 */}
        {activeTab !== 'tab2' && (
          <ProgressBar
            visible={progressBarVisible}
            percent={progressPercent}
          />
        )}

      </main>

      {/* Help & Rules Modal Overlay */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 bg-[#3C353B]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative decorative-corners"
            >
              {/* Traditional red/gold decorative header bar */}
              <div className="bg-gradient-to-r from-[#9E4A4A] via-[#D86B6B] to-[#9E4A4A] py-4 px-6 text-white border-b border-[#C59F4A]/30 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-[#FFF2C5]" />
                  <span className="font-serif font-bold text-sm sm:text-base tracking-widest text-[#FFF2C5]">
                    说明 ✦ 
                  </span>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin max-h-[calc(85vh-110px)] text-left">
                
                {/* Section 1: Inbound File Parsing Rules */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                    ① 道具入库文件名解析结构与规则
                  </h3>
                  <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                    <p className="font-medium">
                      系统在上载图片时，若检测到特定前缀格式的文件，将自动解析出男主、分类、初见日状态：
                    </p>
                    <div className="bg-[#FAF8F5] border-l-4 border-[#C59F4A] p-2.5 rounded font-mono text-[10px] text-[#A67020] select-all">
                      文件名模板：icon_s&#123;季节&#125;_&#123;fd_&#125;&#123;男主缩写&#125;_&#123;类别缩写&#125;_&#123;序号&#125;.png
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] pt-1">
                      <div>
                        <span className="font-bold text-[#A67020]">✦ 亲密男主对应表：</span>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li><span className="font-semibold">lb</span>：刘辩</li>
                          <li><span className="font-semibold">fr</span>：傅融</li>
                          <li><span className="font-semibold">yj</span>：袁基</li>
                          <li><span className="font-semibold">zc</span>：左忘</li>
                          <li><span className="font-semibold">sc</span>：孙策</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-[#A67020]">✦ 道具类别对应表：</span>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li><span className="font-semibold">chenshe</span>：陈设</li>
                          <li><span className="font-semibold">jianzhu</span>：建筑</li>
                          <li><span className="font-semibold">jingguan</span>：景观</li>
                          <li><span className="font-semibold">diban</span>：地板</li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-[#DFD2BD]/50 pt-2.5 mt-2">
                      <span className="font-bold text-[#5C534C]">特别规则：</span>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                        <li>若包含中间字段拼写 <code className="font-bold font-mono px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px]">fd</code>，将自动识别为“初见日”成长道具。</li>
                        <li>例如：<code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">icon_s1_fd_fr_chenshe_1.png</code> 将自动解析成显示名称：“初见日-傅融-陈设”。</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 2: Tab2 Manual Correction rules */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                    ② 多选操作说明
                  </h3>
                  <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-[#D86B6B] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-[#5C534C]">点击多选框区域操作：</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li><span className="font-semibold">普通点击：</span>切换当前行的选中状态</li>
                          <li><span className="font-semibold">Ctrl + 点击：</span>离散多选，保持其他选中项，切换当前行</li>
                          <li><span className="font-semibold">Shift + 点击：</span>区间连选，从上次选中行到当前行的所有行都被选中</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Tab2 Automatic classification rules */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                    ③ AI自动匹配、加底与分类机制
                  </h3>
                  <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-2 text-xs text-[#5C534C] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#A67020] min-w-[20px] text-right">1.</span>
                      <p><strong>预设分类规则：</strong> 系统内置了 <strong>【家具类】</strong> 和 <strong>【其他类】</strong> 两款极简预设。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#A67020] min-w-[20px] text-right">2.</span>
                      <p><strong>自动智能匹配：</strong> 点击 <strong>[AI匹配]</strong> 后，系统会自动帮您回填道具名、底色属性与分类类别，最终生成格式化的输出名称，极大地提升了处理效率。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#A67020] min-w-[20px] text-right">3.</span>
                      <p><strong>一键同步加底：</strong> 完成匹配后，点击 <strong>[加底]</strong> 能将素材融入古风传统边框垫底，并能一键快速导出至您的本地电脑中。</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Backing footer */}
              <div className="border-t border-[#DFD2BD]/60 bg-[#FAF8F4] py-3.5 px-6 flex justify-end">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-6 py-2 bg-[#9E4A4A] hover:bg-[#B34A4A] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  合上书卷 (我知道了)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API 配置弹窗 */}
      <AnimatePresence>
        {isApiConfigOpen && (
          <div className="fixed inset-0 bg-[#3C353B]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2E7D32] via-[#388E3C] to-[#2E7D32] py-4 px-6 text-white border-b border-[#A5D6A7]/30 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-[#C8E6C9]" />
                  <span className="font-serif font-bold text-sm sm:text-base tracking-widest text-[#C8E6C9]">
                    API 配置
                  </span>
                </div>
                <button
                  onClick={() => setIsApiConfigOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* API 端点 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#5C534C] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                    API 端点
                  </label>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://example.com/v1"
                    className="w-full px-4 py-2.5 bg-white border border-[#E9DFD0] rounded-lg text-sm text-[#5C534C] focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                  />
                  <p className="text-xs text-[#8B6F47] pl-2">输入 API 服务的完整地址</p>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#5C534C] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••"
                    className="w-full px-4 py-2.5 bg-white border border-[#E9DFD0] rounded-lg text-sm text-[#5C534C] focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all font-mono"
                  />
                  <p className="text-xs text-[#8B6F47] pl-2">输入您的 API 密钥（将安全存储在本地）</p>
                </div>

                {/* 模型选择 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#5C534C] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                    模型
                  </label>
                  <div className="flex gap-2">
                    {availableModels.length > 0 ? (
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-[#E9DFD0] rounded-lg text-sm text-[#5C534C] focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                      >
                        <option value="">请选择模型</option>
                        {availableModels.map((model, index) => (
                          <option key={model} value={model}>
                            {index === 0 && model === localStorage.getItem('selectedModel') 
                              ? `⭐ ${model} (上次选择)` 
                              : model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        placeholder="请输入模型名称，例如：gpt-4o"
                        className="flex-1 px-4 py-2.5 bg-white border border-[#E9DFD0] rounded-lg text-sm text-[#5C534C] focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                      />
                    )}
                    <button
                      onClick={fetchAvailableModels}
                      disabled={isFetchingModels || !apiEndpoint || !apiKey}
                      className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#388E3C] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5"
                      title="从API端点拉取可用模型列表"
                    >
                      {isFetchingModels ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>拉取中...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>拉取模型</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#8B6F47] pl-2">
                    {availableModels.length > 0 
                      ? selectedModel 
                        ? `已选择: ${selectedModel} | 共 ${availableModels.length} 个可用模型（自动排序）` 
                        : `已获取 ${availableModels.length} 个可用模型（按字母排序）`
                      : '点击"拉取模型"按钮从API获取可用模型列表，会自动记忆您的选择'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[#DFD2BD]/60 bg-[#FAF8F4] py-3.5 px-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsApiConfigOpen(false)}
                  className="px-5 py-2 bg-white hover:bg-gray-50 text-[#5C534C] text-xs font-bold rounded-xl cursor-pointer transition-all border border-[#E9DFD0] hover:border-[#DFD2BD]"
                >
                  取消
                </button>
                <button
                  onClick={saveApiConfig}
                  className="px-6 py-2 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  保存配置
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
