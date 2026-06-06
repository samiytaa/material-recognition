import { HelpCircle, X, BookOpen, Zap, HelpCircle as QuestionIcon, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface RulesDocsModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesDocsModal({ open, onClose }: RulesDocsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-[#3C353B]/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
          <motion.div
            onClick={(event) => event.stopPropagation()}
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
                  文件名解析规则说明 ✦
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin max-h-[calc(85vh-110px)] text-left">
              
              {/* Section 1: 核心概念 */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                  <BookOpen size={14} className="text-[#9E4A4A]" />
                  核心概念
                </h3>
                <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                  <p className="font-medium">
                    系统会自动读取图片文件名，识别其中的信息，生成<strong className="text-[#A67020]">中文显示名称</strong>和<strong className="text-[#A67020]">分类</strong>。
                  </p>
                  <div className="bg-[#FAF8F5] border-l-4 border-[#C59F4A] p-2.5 rounded text-[11px]">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-[#A67020] mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-[#5C534C]">核心原理：</strong> 文件名按下划线 <code className="bg-white px-1.5 py-0.5 rounded border border-[#DFD2BD] font-mono text-[10px]">_</code> 分段，不同段代表不同的信息。
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: 快速示例 */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                  <Zap size={14} className="text-[#9E4A4A]" />
                  快速示例
                </h3>
                <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                  {/* 示例1: 家具类 */}
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

                  {/* 示例2: 密探头像 */}
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

                  {/* 示例3: 初见日家具 */}
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

              {/* Section 3: 映射表说明 */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                  <BookOpen size={14} className="text-[#9E4A4A]" />
                  映射表说明
                </h3>
                <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-3 text-xs text-[#5C534C] leading-relaxed">
                  <div>
                    <div className="font-bold text-[#A67020] mb-1.5">✦ 男主映射表</div>
                    <div className="text-[11px] flex flex-wrap gap-x-3 gap-y-1.5">
                      <span className="whitespace-nowrap">
                        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">lb</code> <span className="text-gray-600">→ 刘辩</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">fr</code> <span className="text-gray-600">→ 傅融</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">sc</code> <span className="text-gray-600">→ 孙策</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">yj</code> <span className="text-gray-600">→ 袁基</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">zc</code> <span className="text-gray-600">→ 左慈</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-dashed border-[#DFD2BD]/50 pt-2">
                    <div className="font-bold text-[#A67020] mb-1.5">✦ 分类映射表</div>
                    <div className="text-[11px] space-y-1.5">
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-gray-700 font-semibold whitespace-nowrap">户外：</span>
                        <span className="whitespace-nowrap">
                          <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono">jianzhu</code> <span className="text-gray-600">→ 建筑</span>
                        </span>
                        <span className="whitespace-nowrap">
                          <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono">jingguan</code> <span className="text-gray-600">→ 景观</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-gray-700 font-semibold whitespace-nowrap">户内：</span>
                        <span className="whitespace-nowrap">
                          <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono">qiju</code> <span className="text-gray-600">→ 起居</span>
                        </span>
                        <span className="whitespace-nowrap">
                          <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono">chufang</code> <span className="text-gray-600">→ 厨房</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-dashed border-[#DFD2BD]/50 pt-2">
                    <div className="font-bold text-[#A67020] mb-1.5">✦ 密探映射表</div>
                    <div className="text-[11px] flex flex-wrap gap-x-3 gap-y-1.5">
                      <span className="whitespace-nowrap">
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">sunfu</code> <span className="text-gray-600">→ 孙辅</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">sunyi</code> <span className="text-gray-600">→ 孙翊</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">zhanghong</code> <span className="text-gray-600">→ 张纮</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-[#FAF8F5] border-l-4 border-[#C59F4A] p-2.5 rounded text-[11px] mt-2">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-[#A67020] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">在 Tab4 中可以修改或添加新的映射规则</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: 常见问题 */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                  <QuestionIcon size={14} className="text-[#9E4A4A]" />
                  常见问题
                </h3>
                <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl space-y-2 text-xs text-[#5C534C] leading-relaxed">
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

              {/* Section 5: 快捷操作 */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9E4A4A]" />
                  <Zap size={14} className="text-[#9E4A4A]" />
                  快捷操作
                </h3>
                <div className="bg-white border border-[#E9DFD0] p-4 rounded-xl text-xs text-[#5C534C] leading-relaxed">
                  <div className="grid grid-cols-2 gap-3">
                    <ActionCard title="测试解析" desc="输入文件名查看解析结果" />
                    <ActionCard title="导出规则" desc="备份当前所有自定义规则" />
                    <ActionCard title="导入规则" desc="加载之前导出的规则文件" />
                    <ActionCard title="重置规则" desc="恢复到系统默认规则" />
                  </div>
                </div>
              </div>

            </div>

            {/* Backing footer */}
            <div className="border-t border-[#DFD2BD]/60 bg-[#FAF8F4] py-3.5 px-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#9E4A4A] hover:bg-[#B34A4A] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                合上书卷 (我知道了)
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
    <div className="bg-[#FAF8F5] rounded-lg border border-[#DFD2BD] p-3">
      <div className="text-xs font-bold text-[#674b2d] mb-2">{title}</div>
      <div className="bg-white rounded p-2 mb-2 border border-[#E9DFD0]">
        <div className="text-xs text-gray-600 mb-1.5 font-mono break-all">{filename}</div>
        <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-xs">
          {parts.map(([code, label, colorClass]) => (
            <div key={code} className="flex items-center gap-1 whitespace-nowrap">
              <span className={`${colorClass} px-1.5 py-0.5 rounded font-mono text-[10px]`}>{code}</span>
              <span className="text-gray-500 text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-green-50 border-l-2 border-green-500 px-2.5 py-1.5 rounded">
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
    <details className="bg-[#FAF8F5] rounded-lg border border-[#DFD2BD] p-2.5 cursor-pointer hover:border-[#C59F4A] transition-colors">
      <summary className="text-xs font-semibold text-[#5C534C] cursor-pointer list-none flex items-center gap-2">
        <span className="text-[#A67020]">•</span>
        {question}
      </summary>
      <div className="mt-2 text-xs text-gray-600 pl-4 border-l-2 border-[#C59F4A]">{answer}</div>
    </details>
  );
}

interface ActionCardProps {
  title: string;
  desc: string;
}

function ActionCard({ title, desc }: ActionCardProps) {
  return (
    <div className="bg-[#FAF8F5] rounded-lg border border-[#DFD2BD] p-2.5">
      <div className="text-xs font-bold text-[#674b2d] flex items-center gap-1.5 mb-1">
        <span className="h-1 w-1 rounded-full bg-[#A67020]" />
        {title}
      </div>
      <div className="text-[10px] text-gray-600 pl-3">{desc}</div>
    </div>
  );
}
