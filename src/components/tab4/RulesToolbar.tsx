import type React from 'react';
import { Download, HelpCircle, RefreshCw, Search, Upload } from 'lucide-react';
import { TAB_CONFIGS } from './constants';
import type { MappingType } from './types';

interface RulesToolbarProps {
  activeTab: MappingType;
  onTabChange: (type: MappingType) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onShowDocs: () => void;
  onShowTest: () => void;
}

export function RulesToolbar({
  activeTab,
  onTabChange,
  onExport,
  onImport,
  onReset,
  onShowDocs,
  onShowTest,
}: RulesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white/60 p-3 rounded-xl border border-[#E9DFD0]">
      <div className="flex flex-wrap gap-1.5">
        {TAB_CONFIGS.map((config) => {
          const TabIcon = config.icon;
          return (
            <button
              key={config.id}
              onClick={() => onTabChange(config.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === config.id
                  ? 'text-white shadow-sm'
                  : 'bg-white/80 text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
              style={{ backgroundColor: activeTab === config.id ? config.color : undefined }}
            >
              <TabIcon size={14} />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onShowDocs}
          className="px-3 py-1.2 bg-gradient-to-r from-[#FCF5EA] to-[#FAF0E0] hover:from-[#FAF0E0] hover:to-[#EFE2D0] text-[#A67020] border border-[#EFE2D0] rounded-lg text-xs font-bold tracking-wider hover:shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5 select-none leading-normal"
          title="查看完整解析规则文档"
        >
          <HelpCircle size={13} className="text-[#A67020]" />
          规则文档
        </button>

        <button
          onClick={onShowTest}
          className="px-3 py-1.5 bg-[#4F73C7] hover:bg-[#3E5FA3] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="测试文件名解析"
        >
          <Search size={12} />
          测试解析
        </button>

        <button
          onClick={onExport}
          className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#C59F4A] text-[#674b2d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="导出规则为 JSON 文件"
        >
          <Download size={12} />
          导出
        </button>

        <label className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#C59F4A] text-[#674b2d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <Upload size={12} />
          导入
          <input type="file" accept=".json" onChange={onImport} className="hidden" />
        </label>

        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-white border border-[#E9DFD0] hover:border-[#D86B6B] text-[#9E4A4A] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="重置为默认规则"
        >
          <RefreshCw size={12} />
          重置
        </button>
      </div>
    </div>
  );
}
