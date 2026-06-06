import { HelpCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface RulesDocsModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesDocsModal({ open, onClose }: RulesDocsModalProps) {
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
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-[#DFD2BD] pb-3 mb-4">
              <h3 className="font-serif font-bold text-[#7B68EE] text-base flex items-center gap-2">
                <HelpCircle size={18} />
                文件名解析规则说明
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* 核心概念 */}
            <div className="mb-4">
              <div className="text-sm font-bold text-[#674b2d] mb-2">📖 核心概念</div>
              <div className="bg-[#F5F9FF] border border-[#7B68EE]/30 rounded-lg p-4 text-xs text-gray-700">
                <p className="mb-2">
                  系统会自动读取图片文件名，识别其中的信息，生成<strong className="text-[#7B68EE]">中文显示名称</strong>和<strong className="text-[#7B68EE]">分类</strong>。
                </p>
                <p className="text-gray-600">
                  💡 <strong>核心原理：</strong> 文件名按下划线 <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">_</code> 分段，不同段代表不同的信息。
                </p>
              </div>
            </div>

            {/* 快速示例 */}
            <div className="mb-4">
              <div className="text-sm font-bold text-[#674b2d] mb-2">⚡ 快速示例</div>
              
              {/* 示例1 */}
              <div className="space-y-3">
                {/* 家具类示例 */}
                <ExampleCard
                  title="家具类（最常见）"
                  filename="icon_s1_sc_jianzhu_1001.png"
                  parts={[
                    ['icon', '前缀', 'bg-blue-100'],
                    ['s1', '第一季', 'bg-green-100'],
                    ['sc', '男主代码 → 孙策', 'bg-red-100'],
                    ['jianzhu', '分类代码 → 建筑', 'bg-yellow-100'],
                    ['1001', '编号', 'bg-purple-100'],
                  ]}
                  result="孙策-建筑"
                />

                {/* 密探头像示例 */}
                <ExampleCard
                  title="密探头像"
                  filename="icon_sunfu_s.png"
                  parts={[
                    ['icon', '前缀', 'bg-blue-100'],
                    ['sunfu', '密探拼音 → 孙辅', 'bg-yellow-100'],
                    ['s', '密探头像标记', 'bg-purple-100'],
                  ]}
                  result="密探头像-孙辅"
                />

                {/* 初见日家具示例 */}
                <ExampleCard
                  title="初见日家具"
                  filename="icon_s1_fd_lb_qiju_2001.png"
                  parts={[
                    ['fd', '初见日标记', 'bg-pink-100'],
                    ['lb', '男主代码 → 刘辩', 'bg-red-100'],
                    ['qiju', '分类代码 → 起居', 'bg-yellow-100'],
                  ]}
                  result="初见日-刘辩-起居"
                />
              </div>
            </div>

            {/* 映射表说明 */}
            <div className="mb-4">
              <div className="text-sm font-bold text-[#674b2d] mb-2">📋 映射表说明</div>
              <div className="bg-white/50 rounded-lg border border-[#E9DFD0] p-3">
                <div className="text-xs space-y-2">
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">男主映射表</div>
                    <div className="text-gray-600">
                      <code className="bg-red-100 px-1.5 py-0.5 rounded">lb</code> → 刘辩　
                      <code className="bg-red-100 px-1.5 py-0.5 rounded">fr</code> → 傅融　
                      <code className="bg-red-100 px-1.5 py-0.5 rounded">sc</code> → 孙策　
                      <code className="bg-red-100 px-1.5 py-0.5 rounded">yj</code> → 袁基　
                      <code className="bg-red-100 px-1.5 py-0.5 rounded">zc</code> → 左慈
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">分类映射表</div>
                    <div className="text-gray-600">
                      <span className="block">户外：<code className="bg-yellow-100 px-1.5 py-0.5 rounded">jianzhu</code> → 建筑、<code className="bg-yellow-100 px-1.5 py-0.5 rounded">jingguan</code> → 景观</span>
                      <span className="block">户内：<code className="bg-yellow-100 px-1.5 py-0.5 rounded">qiju</code> → 起居、<code className="bg-yellow-100 px-1.5 py-0.5 rounded">chufang</code> → 厨房</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">密探映射表</div>
                    <div className="text-gray-600">
                      <code className="bg-blue-100 px-1.5 py-0.5 rounded">sunfu</code> → 孙辅　
                      <code className="bg-blue-100 px-1.5 py-0.5 rounded">sunyi</code> → 孙翊　
                      <code className="bg-blue-100 px-1.5 py-0.5 rounded">zhanghong</code> → 张纮
                    </div>
                  </div>
                  
                  <div className="text-gray-500 mt-2">
                    💡 在 Tab4 中可以修改或添加新的映射规则
                  </div>
                </div>
              </div>
            </div>

            {/* 常见问题 */}
            <div className="mb-4">
              <div className="text-sm font-bold text-[#674b2d] mb-2">❓ 常见问题</div>
              <div className="space-y-2">
                <FaqItem 
                  question="修改规则后，已导入的图片会自动更新吗？" 
                  answer="不会自动更新。需要在 Tab1 点击「重新解析」按钮，才会用新规则重新解析所有已导入的图片。"
                />
                <FaqItem 
                  question="如果文件名不符合任何格式会怎样？" 
                  answer="会被归类为「其他」，显示名为原文件名。"
                />
                <FaqItem 
                  question="可以添加新的男主或密探吗？" 
                  answer="可以！在 Tab4 选择对应的映射表，点击新增，填写代码和中文名即可。"
                />
                <FaqItem 
                  question="什么是归属规则？" 
                  answer="归属规则定义了每个分类如何提取归属信息（男主/密探/无）。例如「建筑」分类默认从家具格式段中提取男主信息。"
                />
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="mb-2">
              <div className="text-sm font-bold text-[#674b2d] mb-2">⚡ 快捷操作</div>
              <div className="grid grid-cols-2 gap-2">
                <ActionCard icon="🧪" title="测试解析" desc="输入文件名查看解析结果" />
                <ActionCard icon="💾" title="导出规则" desc="备份当前所有自定义规则" />
                <ActionCard icon="📥" title="导入规则" desc="加载之前导出的规则文件" />
                <ActionCard icon="🔄" title="重置规则" desc="恢复到系统默认规则" />
              </div>
            </div>

            {/* 底部提示 */}
            <div className="mt-4 pt-3 border-t border-[#DFD2BD] flex items-center justify-between">
              <div className="text-xs text-gray-500">💡 提示：点击「测试解析」按钮可以实时测试文件名解析效果</div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#7B68EE] hover:bg-[#6A5ACD] text-white rounded-lg text-sm font-semibold transition-all"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============ 子组件 ============

interface ExampleCardProps {
  title: string;
  filename: string;
  parts: Array<[string, string, string]>;
  result: string;
}

function ExampleCard({ title, filename, parts, result }: ExampleCardProps) {
  return (
    <div className="bg-white/50 rounded-lg border border-[#E9DFD0] p-3">
      <div className="text-xs font-bold text-[#674b2d] mb-2">{title}</div>
      <div className="bg-gray-50 rounded p-2 mb-2">
        <div className="text-xs text-gray-600 mb-1 font-mono">{filename}</div>
        <div className="flex flex-wrap gap-1 text-xs">
          {parts.map(([code, label, colorClass]) => (
            <div key={code} className="flex items-center gap-1">
              <span className={`${colorClass} px-1.5 py-0.5 rounded font-mono`}>{code}</span>
              <span className="text-gray-500 text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-green-50 border-l-2 border-green-500 px-2 py-1 rounded">
        <span className="text-xs text-gray-600">解析结果：</span>
        <span className="text-xs font-bold text-green-700">{result}</span>
      </div>
    </div>
  );
}

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <details className="bg-white/50 rounded-lg border border-[#E9DFD0] p-2 cursor-pointer hover:border-[#7B68EE]/30 transition-colors">
      <summary className="text-xs font-semibold text-gray-700 cursor-pointer">{question}</summary>
      <div className="mt-1 text-xs text-gray-600 pl-3 border-l-2 border-[#7B68EE]/30">{answer}</div>
    </details>
  );
}

interface ActionCardProps {
  icon: string;
  title: string;
  desc: string;
}

function ActionCard({ icon, title, desc }: ActionCardProps) {
  return (
    <div className="bg-white/50 rounded-lg border border-[#E9DFD0] p-2">
      <div className="text-xs font-bold text-[#674b2d] flex items-center gap-1 mb-1">
        <span>{icon}</span>
        {title}
      </div>
      <div className="text-[10px] text-gray-600">{desc}</div>
    </div>
  );
}
