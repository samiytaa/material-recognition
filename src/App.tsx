import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Settings } from 'lucide-react';
import { PropItem, RecordRow } from './types';
import Tab1Inbound from './components/Tab1Inbound';
import Tab2Record from './components/Tab2Record';
import Tab3Settings from './components/Tab3Settings';
import Tab4RulesManager from './components/Tab4RulesManager';
import Tab5Compose from './components/Tab5Compose';
import { ProgressBar, HelpModal, ApiConfigModal } from './components/common';

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
              <span className="text-xs font-serif font-bold text-gold-deep tracking-wider">道具素材管理面板</span>
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

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        apiEndpoint={apiEndpoint}
        setApiEndpoint={setApiEndpoint}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
        isFetchingModels={isFetchingModels}
        onFetchModels={fetchAvailableModels}
        onSave={saveApiConfig}
      />

    </div>
  );
}
