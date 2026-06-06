import type React from 'react';
import { AlertCircle, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface TestRuleModalProps {
  open: boolean;
  testFileName: string;
  testResult: any;
  onClose: () => void;
  onFileNameChange: (value: string) => void;
  onTest: () => void;
}

const EXAMPLES = [
  'icon_s1_sc_jianzhu_1001.png',
  'icon_sunfu_s.png',
  'icon_ccl_3021.png',
  'icon_s1_fd_lb_qiju_2001.png',
  'cjr_sc_1001.png',
];

export function TestRuleModal({ open, testFileName, testResult, onClose, onFileNameChange, onTest }: TestRuleModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#DFD2BD] pb-3 mb-4">
              <h3 className="font-serif font-bold text-[#4F73C7] text-base flex items-center gap-2">
                <Search size={18} />
                测试文件名解析
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#674b2d] mb-2">输入文件名（含或不含 .png 后缀）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testFileName}
                  onChange={(event) => onFileNameChange(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && onTest()}
                  placeholder="例：icon_s1_sc_jianzhu_1001.png"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-[#E9DFD0] focus:border-[#4F73C7] focus:ring-1 focus:ring-[#4F73C7] outline-none rounded-lg"
                />
                <button onClick={onTest} className="px-4 py-2 bg-[#4F73C7] hover:bg-[#3E5FA3] text-white rounded-lg text-sm font-bold transition-all">
                  解析
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-white/50 rounded-lg border border-[#E9DFD0]">
              <div className="text-xs font-semibold text-[#674b2d] mb-2">常用示例：</div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      onFileNameChange(example);
                      setTimeout(onTest, 100);
                    }}
                    className="px-2 py-1 bg-white hover:bg-[#F5F0E8] border border-[#E9DFD0] rounded text-xs text-gray-600 hover:text-[#674b2d] transition-all font-mono"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {testResult && <TestResult result={testResult} />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TestResult({ result }: { result: any }) {
  const details = result.classification.furnitureDetails;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F5F9FF] border border-[#4F73C7]/30 rounded-lg p-4">
      <div className="text-sm font-bold text-[#4F73C7] mb-3 flex items-center gap-2">
        <AlertCircle size={16} />
        解析结果
      </div>

      <div className="space-y-2 text-xs">
        <ResultLine label="显示名称："><span className="font-bold text-[#674b2d]">{result.displayName}</span></ResultLine>
        <ResultLine label="道具类型：">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${result.type === 'furniture' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {result.type === 'furniture' ? '家具' : '其他道具'}
          </span>
        </ResultLine>
        <ResultLine label="分类："><span className="font-semibold text-[#8B6F47]">{result.category}</span></ResultLine>
        <ResultLine label="分类路径："><span className="font-mono text-gray-600">{result.categoryPath.join(' > ')}</span></ResultLine>
        <ResultLine label="归属类型："><OwnershipBadge type={result.ownership.type} /></ResultLine>

        {result.ownership.name && (
          <ResultLine label="归属角色：">
            <span className="font-bold text-[#D86B6B]">{result.ownership.name}</span>
            {result.ownership.code && <span className="ml-2 text-gray-400 font-mono">({result.ownership.code})</span>}
          </ResultLine>
        )}

        {details && (
          <>
            <ResultLine label="场景类型："><span className="font-semibold">{details.scene === 'indoor' ? '户内' : details.scene === 'outdoor' ? '户外' : '衬景'}</span></ResultLine>
            {details.isFloor && <SpecialMark>地板/地面</SpecialMark>}
            {details.isGrowthProp && <SpecialMark className="bg-pink-100 text-pink-700">初见日道具</SpecialMark>}
            {details.isSuit && <SpecialMark className="bg-purple-100 text-purple-700">套装家具</SpecialMark>}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ResultLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-24 text-gray-500">{label}</span>
      {children}
    </div>
  );
}

function OwnershipBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${type === 'male_lead' ? 'bg-red-100 text-red-700' : type === 'spy' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
      {type === 'male_lead' ? '男主' : type === 'spy' ? '密探' : '无归属'}
    </span>
  );
}

function SpecialMark({ children, className = 'bg-yellow-100 text-yellow-700' }: { children: React.ReactNode; className?: string }) {
  return (
    <ResultLine label="特殊标记：">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${className}`}>{children}</span>
    </ResultLine>
  );
}
