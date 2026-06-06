import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, X, Info } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                  <li>若包含中间字段拼写 <code className="font-bold font-mono px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px]">fd</code>，将自动识别为"初见日"成长道具。</li>
                  <li>例如：<code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">icon_s1_fd_fr_chenshe_1.png</code> 将自动解析成显示名称："初见日-傅融-陈设"。</li>
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
            onClick={onClose}
            className="px-6 py-2 bg-[#9E4A4A] hover:bg-[#B34A4A] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            合上书卷 (我知道了)
          </button>
        </div>

      </motion.div>
    </div>
  );
}
