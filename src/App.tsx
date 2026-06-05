import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, Info } from 'lucide-react';
import { PropItem, RecordRow } from './types';
import Tab1Inbound from './components/Tab1Inbound';
import Tab2Record from './components/Tab2Record';
import Tab3Settings from './components/Tab3Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2' | 'tab3'>('tab1');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Tab 1 state configurations
  const [propsList, setPropsList] = useState<PropItem[]>([]);

  const [currentFilter, setCurrentFilter] = useState<{ level1: string; level2: string | null }>({ level1: 'all', level2: null });
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>(['系统初始化完成']);

  // Tab 2 state configurations
  const [recordList, setRecordList] = useState<RecordRow[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      originalImage: null,
      screenshot: null,
      propName: '',
      baseColor: '金',
      category: '家具类',
      previewWithBase: null,
      outputName: ''
    }));
  });

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

  // Load from local storage initially
  useEffect(() => {
    const localProps = localStorage.getItem('savedProps');
    if (localProps) {
      try {
        const parsed = JSON.parse(localProps);
        setPropsList(parsed);
        addLog(`从本地存储加载了 ${parsed.length} 个历史道具（含图片数据）`);
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
  }, []);

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
          </div>

          {/* Right Accented Status & Help Panel */}
          <div className="flex items-center gap-3">
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
                  recordLogs={recordLogs}
                  addRecordLog={addRecordLog}
                  clearRecordLogs={clearRecordLogs}
                  showProgressBar={showProgressBar}
                  hideProgressBar={hideProgressBar}
                  updateProgress={updateProgress}
                  selectedPart={selectedRecordPart}
                  setSelectedPart={setSelectedRecordPart}
                />
              </motion.div>
            ) : (
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
            )}
          </AnimatePresence>
        </div>

        {/* Bottom progress bar container */}
        <AnimatePresence>
          {progressBarVisible && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              id="progressBarContainer"
              className="progress-bar-container bg-[#FFFBF0] border border-[#ECDDB9] rounded-2xl p-4 mt-4 flex items-center gap-4 shadow-md z-30 justify-between decorative-corners"
            >
              <span className="progress-bar-label font-serif font-bold text-[#A67020] text-xs flex items-center gap-1.5">
                <span>🕊️</span>
                我是进度条（安心感）
              </span>
              <div className="progress-bar flex-1 h-5 bg-white border border-[#EADBCC] rounded-full overflow-hidden relative shadow-inner">
                <div 
                  id="progressBarFill" 
                  className="progress-bar-fill h-full bg-gradient-to-r from-[#D4AF37] to-[#C59F4A] transition-all duration-200 flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span id="progressBarFillText">{progressPercent}%</span>
                </div>
                <div id="progressBarText" className="progress-bar-text absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-900/30 pointer-events-none">
                  {progressPercent}%
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    系统书卷 ✦ 帮助与规则说明数
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
                    ② 人工校对与修改操作
                  </h3>
                  <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-[#D86B6B] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-[#5C534C]">表格单元格覆写：</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li>双击或直接点击表格内第3列【道具名】输入框，即可随心所欲实时覆写内容。</li>
                          <li>【底色】和【分类】列提供了一键下拉菜单，支持您进行低成本手工修正笔录。</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2.5 border-t border-dashed border-[#DFD2BD]/60">
                      <Info size={14} className="text-[#4A9B7A] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-[#5C534C]">实时更新与同步：</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li>保存、重载或运行AI深度自动匹配时，均会全网实时追踪、整合并自动同步您的覆写内容。</li>
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

    </div>
  );
}
