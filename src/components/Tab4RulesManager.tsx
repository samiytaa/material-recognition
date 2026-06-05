import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, Save, X, Download, Upload, RefreshCw, Search, AlertCircle } from 'lucide-react';
import parseConfig from '../parseConfig.json';
import { reloadRules } from '../types';

// ─── 数据类型定义 ────────────────────────────────────────────

interface MappingEntry {
  key: string;
  value: string;
}

type MappingType = 
  | 'maleLeads'      // 男主映射
  | 'spyNames'       // 密探名映射
  | 'outdoorCats'    // 户外分类
  | 'indoorCats'     // 户内分类
  | 'floorCats';     // 地板分类

interface RulesData {
  maleLeads: MappingEntry[];
  spyNames: MappingEntry[];
  outdoorCats: MappingEntry[];
  indoorCats: MappingEntry[];
  floorCats: MappingEntry[];
}

// ─── 标签页配置 ──────────────────────────────────────────────

const TAB_CONFIGS: Array<{ id: MappingType; label: string; description: string; color: string }> = [
  { id: 'maleLeads',   label: '男主映射',   description: '拼音 → 男主中文名', color: '#D86B6B' },
  { id: 'spyNames',    label: '密探名映射', description: '拼音 → 密探中文名', color: '#8B6F47' },
  { id: 'outdoorCats', label: '户外分类',   description: '代码 → 户外分类名', color: '#C59F4A' },
  { id: 'indoorCats',  label: '户内分类',   description: '代码 → 户内分类名', color: '#4F73C7' },
  { id: 'floorCats',   label: '地板分类',   description: '代码 → 地板分类名', color: '#9E4A4A' },
];

// ─── 主组件 ──────────────────────────────────────────────────

export default function Tab4RulesManager() {
  // 当前选中的映射类型
  const [activeTab, setActiveTab] = useState<MappingType>('maleLeads');
  
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 映射数据（从 parseConfig.json 初始化）
  const [rulesData, setRulesData] = useState<RulesData>(() => {
    const saved = localStorage.getItem('customRulesData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('读取自定义规则失败:', e);
      }
    }
    // 默认从 parseConfig.json 加载
    return {
      maleLeads: Object.entries(parseConfig['男主映射']).map(([k, v]) => ({ key: k, value: v })),
      spyNames: Object.entries(parseConfig['密探名映射']).map(([k, v]) => ({ key: k, value: v })),
      outdoorCats: Object.entries(parseConfig['户外分类']).map(([k, v]) => ({ key: k, value: v })),
      indoorCats: Object.entries(parseConfig['户内分类']).map(([k, v]) => ({ key: k, value: v })),
      floorCats: Object.entries(parseConfig['地板分类']).map(([k, v]) => ({ key: k, value: v })),
    };
  });
  
  // 编辑中的条目
  const [editingEntry, setEditingEntry] = useState<{ type: MappingType; index: number } | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  
  // 删除确认
  const [deletingEntry, setDeletingEntry] = useState<{ type: MappingType; index: number } | null>(null);
  
  // 通知消息
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // ─── 持久化 ──────────────────────────────────────────────────
  
  useEffect(() => {
    localStorage.setItem('customRulesData', JSON.stringify(rulesData));
    // 通知 types.ts 重新加载规则
    reloadRules();
  }, [rulesData]);
  
  // ─── 通知工具 ────────────────────────────────────────────────
  
  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };
  
  // ─── CRUD 操作 ───────────────────────────────────────────────
  
  // 新增条目
  const handleAdd = (type: MappingType) => {
    const newEntry: MappingEntry = { key: '', value: '' };
    setRulesData(prev => ({
      ...prev,
      [type]: [...prev[type], newEntry],
    }));
    // 自动进入编辑模式
    const newIndex = rulesData[type].length;
    setEditingEntry({ type, index: newIndex });
    setEditKey('');
    setEditValue('');
    showNotice('已添加空白条目，请填写内容', 'info');
  };
  
  // 开始编辑
  const handleEdit = (type: MappingType, index: number) => {
    const entry = rulesData[type][index];
    setEditingEntry({ type, index });
    setEditKey(entry.key);
    setEditValue(entry.value);
  };
  
  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingEntry) return;
    
    const trimmedKey = editKey.trim();
    const trimmedValue = editValue.trim();
    
    if (!trimmedKey || !trimmedValue) {
      showNotice('键和值不能为空', 'error');
      return;
    }
    
    // 检查重复 key（除了当前编辑项）
    const { type, index } = editingEntry;
    const hasDuplicate = rulesData[type].some((entry, idx) => 
      idx !== index && entry.key === trimmedKey
    );
    
    if (hasDuplicate) {
      showNotice(`键「${trimmedKey}」已存在，请使用不同的键`, 'error');
      return;
    }
    
    setRulesData(prev => ({
      ...prev,
      [type]: prev[type].map((entry, idx) => 
        idx === index ? { key: trimmedKey, value: trimmedValue } : entry
      ),
    }));
    
    setEditingEntry(null);
    showNotice('保存成功', 'success');
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    if (editingEntry) {
      const { type, index } = editingEntry;
      // 如果是新建的空白条目且未填写，删除它
      if (!rulesData[type][index].key && !rulesData[type][index].value) {
        setRulesData(prev => ({
          ...prev,
          [type]: prev[type].filter((_, idx) => idx !== index),
        }));
      }
    }
    setEditingEntry(null);
  };
  
  // 删除条目
  const handleDelete = (type: MappingType, index: number) => {
    setDeletingEntry({ type, index });
  };
  
  const handleConfirmDelete = () => {
    if (!deletingEntry) return;
    
    const { type, index } = deletingEntry;
    const entry = rulesData[type][index];
    
    setRulesData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== index),
    }));
    
    setDeletingEntry(null);
    showNotice(`已删除「${entry.key} → ${entry.value}」`, 'success');
  };
  
  // 导出规则为 JSON
  const handleExport = () => {
    const exportData = {
      '男主映射': Object.fromEntries(rulesData.maleLeads.map(e => [e.key, e.value])),
      '密探名映射': Object.fromEntries(rulesData.spyNames.map(e => [e.key, e.value])),
      '户外分类': Object.fromEntries(rulesData.outdoorCats.map(e => [e.key, e.value])),
      '户内分类': Object.fromEntries(rulesData.indoorCats.map(e => [e.key, e.value])),
      '地板分类': Object.fromEntries(rulesData.floorCats.map(e => [e.key, e.value])),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parseConfig_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotice('规则已导出为 JSON 文件', 'success');
  };
  
  // 导入规则 JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        setRulesData({
          maleLeads: Object.entries(imported['男主映射'] || {}).map(([k, v]) => ({ key: k, value: v as string })),
          spyNames: Object.entries(imported['密探名映射'] || {}).map(([k, v]) => ({ key: k, value: v as string })),
          outdoorCats: Object.entries(imported['户外分类'] || {}).map(([k, v]) => ({ key: k, value: v as string })),
          indoorCats: Object.entries(imported['户内分类'] || {}).map(([k, v]) => ({ key: k, value: v as string })),
          floorCats: Object.entries(imported['地板分类'] || {}).map(([k, v]) => ({ key: k, value: v as string })),
        });
        
        showNotice('规则已成功导入', 'success');
      } catch (error) {
        console.error('导入失败:', error);
        showNotice('导入失败：JSON 格式错误', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 重置 input
  };
  
  // 重置为默认规则
  const handleReset = () => {
    if (!confirm('确定要重置为默认规则吗？当前的自定义规则将被清空！')) return;
    
    setRulesData({
      maleLeads: Object.entries(parseConfig['男主映射']).map(([k, v]) => ({ key: k, value: v })),
      spyNames: Object.entries(parseConfig['密探名映射']).map(([k, v]) => ({ key: k, value: v })),
      outdoorCats: Object.entries(parseConfig['户外分类']).map(([k, v]) => ({ key: k, value: v })),
      indoorCats: Object.entries(parseConfig['户内分类']).map(([k, v]) => ({ key: k, value: v })),
      floorCats: Object.entries(parseConfig['地板分类']).map(([k, v]) => ({ key: k, value: v })),
    });
    
    showNotice('已重置为默认规则', 'success');
  };
  
  // ─── 数据过滤 ────────────────────────────────────────────────
  
  const currentData = rulesData[activeTab];
  const filteredData = currentData.filter(entry => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return entry.key.toLowerCase().includes(keyword) || 
           entry.value.toLowerCase().includes(keyword);
  });
  
  const currentConfig = TAB_CONFIGS.find(c => c.id === activeTab)!;
  
  // ─── 渲染 ────────────────────────────────────────────────────
  
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent">
      
      {/* 通知横幅 */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed top-14 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-50 ${
              notice.type === 'success' ? 'bg-[#8B6F47] text-white' :
              notice.type === 'error' ? 'bg-[#D86B6B] text-white' :
              'bg-[#C59F4A] text-white'
            }`}
          >
            {notice.type === 'error' && <AlertCircle size={14} />}
            <span>{notice.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white/60 p-3 rounded-xl border border-[#E9DFD0]">
        
        {/* 左侧：标签切换 */}
        <div className="flex flex-wrap gap-1.5">
          {TAB_CONFIGS.map(config => (
            <button
              key={config.id}
              onClick={() => {
                setActiveTab(config.id);
                setSearchKeyword('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === config.id
                  ? 'text-white shadow-sm'
                  : 'bg-white/80 text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
              style={{ 
                backgroundColor: activeTab === config.id ? config.color : undefined 
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
        
        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#C59F4A] text-[#674b2d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="导出规则为 JSON 文件"
          >
            <Download size={12} />
            导出
          </button>
          
          <label className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#C59F4A] text-[#674b2d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
            <Upload size={12} />
            导入
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#D86B6B] text-[#9E4A4A] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="重置为默认规则"
          >
            <RefreshCw size={12} />
            重置
          </button>
        </div>
      </div>
      
      {/* 中间：搜索栏 + 新增按钮 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索键或值..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E9DFD0] focus:border-[#C59F4A] focus:ring-1 focus:ring-[#C59F4A] outline-none rounded-lg"
          />
        </div>
        
        <button
          onClick={() => handleAdd(activeTab)}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          style={{ backgroundColor: currentConfig.color }}
        >
          <Plus size={14} />
          新增
        </button>
      </div>
      
      {/* 描述栏 */}
      <div className="bg-[#FAF8F5] border border-[#E9DFD0] rounded-lg px-4 py-2 mb-3 flex items-center gap-2 text-xs text-[#8E8276]">
        <span className="font-semibold" style={{ color: currentConfig.color }}>
          {currentConfig.label}
        </span>
        <span>·</span>
        <span>{currentConfig.description}</span>
        <span className="ml-auto font-mono text-[#C59F4A]">
          共 {filteredData.length} 条
        </span>
      </div>
      
      {/* 表格区域 */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#E9DFD0] rounded-xl shadow-xs">
        <table className="w-full text-xs">
          <thead className="bg-[#FAF8F5] border-b border-[#E9DFD0] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[40%]">键（拼音/代码）</th>
              <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[40%]">值（中文名）</th>
              <th className="px-4 py-3 text-center font-bold text-[#674b2d] w-[20%]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  {searchKeyword ? '未找到匹配的条目' : '暂无数据，点击右上角"新增"按钮添加'}
                </td>
              </tr>
            ) : (
              filteredData.map((entry, displayIdx) => {
                const realIdx = currentData.findIndex(e => e === entry);
                const isEditing = editingEntry?.type === activeTab && editingEntry.index === realIdx;
                
                return (
                  <tr 
                    key={`${activeTab}_${realIdx}`}
                    className="border-b border-[#F5F0E8] hover:bg-[#FFFEF8] transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editKey}
                            onChange={(e) => setEditKey(e.target.value)}
                            className="w-full px-2 py-1 border border-[#C59F4A] rounded focus:outline-none focus:ring-1 focus:ring-[#C59F4A] font-mono"
                            placeholder="输入键..."
                            autoFocus
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-2 py-1 border border-[#C59F4A] rounded focus:outline-none focus:ring-1 focus:ring-[#C59F4A]"
                            placeholder="输入值..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-[#8B6F47] hover:bg-[#6F5839] text-white rounded-md font-semibold transition-all"
                            >
                              <Save size={12} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md font-semibold transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-mono text-[#674b2d]">
                          {entry.key || <span className="text-gray-300 italic">（空）</span>}
                        </td>
                        <td className="px-4 py-2 text-[#443B43]">
                          {entry.value || <span className="text-gray-300 italic">（空）</span>}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(activeTab, realIdx)}
                              className="px-2 py-1 bg-[#C59F4A]/10 hover:bg-[#C59F4A]/20 text-[#A67020] rounded transition-all"
                              title="编辑"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(activeTab, realIdx)}
                              className="px-2 py-1 bg-[#D86B6B]/10 hover:bg-[#D86B6B]/20 text-[#9E4A4A] rounded transition-all"
                              title="删除"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deletingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-xl w-full max-w-sm p-5 shadow-2xl"
            >
              <h3 className="font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-2 mb-4 text-sm flex items-center gap-1.5">
                <AlertCircle size={16} className="text-[#D86B6B]" />
                确认删除
              </h3>
              
              <div className="bg-[#FAF0ED] border-l-4 border-[#D86B6B] px-3 py-2 rounded-r-lg mb-4">
                <div className="text-xs text-[#674b2d] font-mono">
                  <span className="font-bold">{rulesData[deletingEntry.type][deletingEntry.index].key}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-bold">{rulesData[deletingEntry.type][deletingEntry.index].value}</span>
                </div>
              </div>
              
              <div className="text-[10px] text-gray-500 mb-4">
                此操作不可撤销，确定要删除吗？
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingEntry(null)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-[#D86B6B] hover:bg-[#B34A4A] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
