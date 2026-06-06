import React from 'react';
import { motion } from 'motion/react';
import { Settings, X, RefreshCw } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiEndpoint: string;
  setApiEndpoint: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  availableModels: string[];
  isFetchingModels: boolean;
  onFetchModels: () => void;
  onSave: () => void;
}

export default function ApiConfigModal({
  isOpen,
  onClose,
  apiEndpoint,
  setApiEndpoint,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  availableModels,
  isFetchingModels,
  onFetchModels,
  onSave
}: ApiConfigModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                onClick={onFetchModels}
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
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-gray-50 text-[#5C534C] text-xs font-bold rounded-xl cursor-pointer transition-all border border-[#E9DFD0] hover:border-[#DFD2BD]"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            保存配置
          </button>
        </div>

      </motion.div>
    </div>
  );
}
