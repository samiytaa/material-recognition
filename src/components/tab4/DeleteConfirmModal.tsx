import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OWNERSHIP_TYPE_OPTIONS } from './constants';
import type { EditingEntry, MappingEntry, RulesData } from './types';

interface DeleteConfirmModalProps {
  deletingEntry: EditingEntry;
  rulesData: RulesData;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ deletingEntry, rulesData, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
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
              {deletingEntry.type === 'ownershipRules' ? (
                <div className="text-xs text-[#674b2d]">
                  <span className="font-bold">{rulesData.ownershipRules[deletingEntry.index].category}</span>
                  <span className="block mt-1 text-gray-500">
                    归属规则：{OWNERSHIP_TYPE_OPTIONS.find((option) => option.value === rulesData.ownershipRules[deletingEntry.index].defaultOwnership)?.label}
                  </span>
                </div>
              ) : (
                <MappingDeletePreview entry={rulesData[deletingEntry.type][deletingEntry.index]} />
              )}
            </div>

            <div className="text-[10px] text-gray-500 mb-4">此操作不可撤销，确定要删除吗？</div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all">
                取消
              </button>
              <button onClick={onConfirm} className="px-4 py-1.5 bg-[#D86B6B] hover:bg-[#B34A4A] text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MappingDeletePreview({ entry }: { entry: MappingEntry }) {
  return (
    <div className="text-xs text-[#674b2d] font-mono">
      <span className="font-bold">{entry.key}</span>
      <span className="mx-2 text-gray-400">→</span>
      <span className="font-bold">{entry.value}</span>
    </div>
  );
}
