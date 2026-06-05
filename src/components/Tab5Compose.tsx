import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trash2, Download, RefreshCw, Settings } from 'lucide-react';
import { UploadZone } from './common';

interface IconLibraryItem {
  id: string;
  name: string;
  base64: string;
  file: File;
}

interface BaseMapItem {
  color: string;
  name: string;
  src: string;
}

export default function Tab5Compose() {
  // 截图状态
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // icon库状态
  const [iconLibrary, setIconLibrary] = useState<IconLibraryItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  
  // 底图状态
  const [baseMaps] = useState<BaseMapItem[]>([
    { color: '金', name: '道具-金.png', src: '/basemaps/道具-金.png' },
    { color: '紫', name: '道具-紫.png', src: '/basemaps/道具-紫.png' },
    { color: '蓝', name: '道具-蓝.png', src: '/basemaps/道具-蓝.png' },
    { color: '绿', name: '道具-绿.png', src: '/basemaps/道具-绿.png' },
    { color: '咖', name: '道具-咖.png', src: '/basemaps/道具-咖.png' }
  ]);
  const [selectedBaseMapColor, setSelectedBaseMapColor] = useState<string | null>(null);
  
  // 合成状态
  const [compositeFilename, setCompositeFilename] = useState<string>('合成图片.png');
  const [recognizedOcrName, setRecognizedOcrName] = useState<string>('');
  
  // 日志状态
  const [logs, setLogs] = useState<string[]>([
    '[系统] 就绪。配置API Key后上传截图和透明icon库即可测试。',
    '[说明] 将先传入参考截图，再传入透明 icon 候选，调用视觉模型直接识别截图中对应的 icon。'
  ]);
  
  // refs
  const composeCanvasRef = useRef<HTMLCanvasElement>(null);

  // 从全局 localStorage 加载 API 配置
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    const savedEndpoint = localStorage.getItem('apiEndpoint');
    const savedKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('selectedModel');
    
    if (savedEndpoint) setApiEndpoint(savedEndpoint);
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  // 添加日志
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  // 截图上传处理
  const handleScreenshotUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      addLog('[错误] 仅支持图片文件');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setScreenshotPreview(dataUrl);
      setScreenshotBase64(dataUrl.split(',')[1]);
      addLog(`截图已上传: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // 清除截图
  const handleClearScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotBase64(null);
    addLog('截图已清除');
  };

  // icon库批量上传
  const handleIconLibraryUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    let successCount = 0;
    
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        addLog(`跳过非图片文件: ${file.name}`);
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        
        const newIcon: IconLibraryItem = {
          id: `icon_${Date.now()}_${Math.random()}`,
          name: file.name,
          base64: base64,
          file: file
        };
        
        setIconLibrary(prev => [...prev, newIcon]);
        successCount++;
      };
      reader.readAsDataURL(file);
    }
    
    // 延迟显示日志，确保所有文件都处理完
    setTimeout(() => {
      if (successCount > 0) {
        addLog(`成功添加 ${successCount} 个透明icon到库中`);
      }
    }, 100);
  };

  // 清空icon库
  const handleClearIcons = () => {
    if (confirm('确定要清空所有icon吗？')) {
      setIconLibrary([]);
      setSelectedIconId(null);
      addLog('icon库已清空');
    }
  };

  // 运行AI匹配
  const handleRunMatching = async () => {
    if (!apiEndpoint || !apiKey || !selectedModel) {
      addLog('[错误] 请先在顶部导航栏的 API 配置中配置 API 并选择模型');
      return;
    }
    
    if (!screenshotBase64) {
      addLog('[错误] 请先上传游戏截图');
      return;
    }
    
    if (iconLibrary.length === 0) {
      addLog('[错误] 请先添加透明icon库');
      return;
    }
    
    addLog('[开始] 正在调用AI进行视觉匹配...');
    addLog(`[信息] 截图已加载，icon库包含 ${iconLibrary.length} 个候选`);
    addLog(`[配置] 使用端点: ${apiEndpoint}`);
    addLog(`[配置] 使用模型: ${selectedModel}`);
    
    // TODO: 实现真实的API调用逻辑
    // 这里只是模拟
    setTimeout(() => {
      addLog('[成功] AI识别完成');
      addLog('[结果] 识别到的底色: 金');
      addLog('[结果] 匹配的icon: ' + (iconLibrary[0]?.name || '无'));
      setSelectedBaseMapColor('金');
      setSelectedIconId(iconLibrary[0]?.id || null);
      setRecognizedOcrName('测试道具');
      setCompositeFilename('测试道具_金.png');
    }, 2000);
  };

  // 刷新合成
  const handleRefreshCompose = () => {
    if (!selectedBaseMapColor || !selectedIconId) {
      addLog('[提示] 需要先完成AI匹配');
      return;
    }
    
    const canvas = composeCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const baseMap = baseMaps.find(b => b.color === selectedBaseMapColor);
    const icon = iconLibrary.find(i => i.id === selectedIconId);
    
    if (!baseMap || !icon) return;
    
    // 加载底图
    const baseImg = new Image();
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      
      // 加载icon
      const iconImg = new Image();
      iconImg.onload = () => {
        // 居中绘制icon
        const iconSize = canvas.width * 0.6;
        const x = (canvas.width - iconSize) / 2;
        const y = (canvas.height - iconSize) / 2;
        ctx.drawImage(iconImg, x, y, iconSize, iconSize);
        addLog('[合成] 图片合成完成');
      };
      iconImg.src = `data:image/png;base64,${icon.base64}`;
    };
    baseImg.src = baseMap.src;
  };

  // 下载合成图片
  const handleDownloadCompose = () => {
    const canvas = composeCanvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = compositeFilename;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`[下载] ${compositeFilename}`);
    });
  };

  // 清空日志
  const handleClearLogs = () => {
    setLogs([]);
    addLog('[系统] 日志已清空');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent text-[#443B43] scrollbar-thin overflow-y-auto space-y-4 pb-2">
      
      {/* API 配置提示卡片 */}
      <div className="bg-gradient-to-r from-[#E8F5E9] to-[#F1F8E9] border border-[#A5D6A7] rounded-2xl p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <Settings size={20} className="text-[#2E7D32] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-[#2E7D32] text-sm mb-1">💡 API 配置提示</h3>
            <p className="text-xs text-[#1B5E20] leading-relaxed mb-2">
              请先在顶部导航栏右上角点击 <span className="font-bold bg-white/50 px-2 py-0.5 rounded">API 配置</span> 按钮，配置 API 端点、密钥和模型。
            </p>
            {apiEndpoint && apiKey && selectedModel ? (
              <div className="bg-white/50 rounded-lg p-2 text-[10px] text-[#2E7D32]">
                <div>✅ 当前配置已加载</div>
                <div>• 端点: {apiEndpoint}</div>
                <div>• 模型: {selectedModel}</div>
              </div>
            ) : (
              <div className="bg-white/50 rounded-lg p-2 text-[10px] text-[#F57C00]">
                ⚠️ 尚未配置 API，请先完成配置后再进行测试
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 测试核心区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* 左侧: 游戏截图 */}
        <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
          <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3 flex items-center gap-2">
            <span>📸</span>
            1. 游戏内截图 (参考源)
          </h3>
          
          {screenshotPreview ? (
            <>
              <div className="bg-[#F8FAFC] rounded-xl min-h-[220px] flex items-center justify-center mb-3 p-4">
                <img src={screenshotPreview} alt="截图" className="max-w-full max-h-[260px] rounded-lg shadow-sm" />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleClearScreenshot}
                  className="px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  清除截图
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden">
              <UploadZone
                onFilesSelected={handleScreenshotUpload}
                accept="image/png,image/jpeg,image/webp"
                multiple={false}
                text="支持拖入截图"
                subText="或点击窗口选择游戏内截图文件"
              />
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-[#E9DFD0]">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-xs text-[#674b2d]">🧠 视觉模型识别任务</strong>
            </div>
            <div className="text-[9px] text-[#7f8c8d]">
              ✅ 区域划分 | icon圆形底色 | OCR文字 | icon视觉定位
            </div>
          </div>
        </div>

        {/* 右侧: 透明icon库 */}
        <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
          <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3 flex items-center gap-2">
            <span>🖼️</span>
            2. 解包透明 Icon 库 (待匹配)
          </h3>
          
          {iconLibrary.length === 0 ? (
            <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden">
              <UploadZone
                onFilesSelected={handleIconLibraryUpload}
                accept="image/png,image/webp,image/jpeg"
                multiple={true}
                text="支持拖入透明icon"
                subText="或点击窗口批量选择透明背景图标文件"
              />
            </div>
          ) : (
            <>
              <div className="bg-[#F9FBFD] rounded-xl p-2 min-h-[140px] max-h-[280px] overflow-y-auto mb-3">
                <div className="flex flex-wrap gap-3">
                  {iconLibrary.map(icon => (
                    <div
                      key={icon.id}
                      onClick={() => setSelectedIconId(icon.id)}
                      className={`bg-white rounded-xl p-2 border cursor-pointer transition-all ${
                        selectedIconId === icon.id 
                          ? 'border-2 border-[#1a73e8] bg-[#e8f0fe]' 
                          : 'border-[#dce5ec] hover:border-[#8B6F47]'
                      } w-20 text-center`}
                    >
                      <img
                        src={`data:image/png;base64,${icon.base64}`}
                        alt={icon.name}
                        className="w-14 h-14 object-contain rounded-lg mx-auto"
                        style={{
                          background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 50% / 16px 16px'
                        }}
                      />
                      <div className="text-[9px] mt-1.5 truncate">{icon.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleClearIcons}
                className="w-full px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                清空全部icon
              </button>
            </>
          )}
          
          <div className="mt-4 pt-3 border-t border-[#E9DFD0]">
            <div className="flex items-center justify-between">
              <strong className="text-xs text-[#674b2d]">🔗 匹配测试 (API多图视觉匹配)</strong>
              <button
                onClick={handleRunMatching}
                className="px-4 py-2 bg-[#8B6F47] hover:bg-[#6F5839] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                🎯 一键识别
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底图展示区域 和 合成图片展示区域 - 左右并列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* 左侧: 底图展示区域 */}
        <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-[#8B6F47] text-sm flex items-center gap-2">
              <span>🎨</span>
              3. 底图展示区域
            </h3>
            <span className="text-[10px] px-2 py-1 bg-[#EEF2FF] text-[#4B5563] rounded-full">
              {selectedBaseMapColor ? `已选择: ${selectedBaseMapColor}` : '等待AI返回底色'}
            </span>
          </div>
          
          <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
            {selectedBaseMapColor ? (
              <div className="flex gap-3 items-center">
                <img
                  src={baseMaps.find(b => b.color === selectedBaseMapColor)?.src}
                  alt={selectedBaseMapColor}
                  className="w-18 h-18 object-contain rounded-lg bg-[#EEF2F5]"
                />
                <div className="text-xs text-[#674b2d]">
                  当前底图: <span className="font-bold">{selectedBaseMapColor}</span>
                </div>
              </div>
            ) : (
              <div className="text-[#7f8c8d] text-xs">
                一键识别后，将根据AI返回的icon圆形底色自动定位对应底图。
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {baseMaps.map(baseMap => (
              <div
                key={baseMap.color}
                className={`bg-white rounded-xl p-2 border text-center w-20 transition-all ${
                  selectedBaseMapColor === baseMap.color
                    ? 'border-2 border-[#1a73e8] bg-[#e8f0fe]'
                    : 'border-[#dce5ec]'
                }`}
              >
                <img
                  src={baseMap.src}
                  alt={baseMap.color}
                  className="w-16 h-16 object-contain rounded-lg mx-auto bg-[#EEF2F5] shadow-sm"
                />
                <div className="text-[10px] mt-2 font-bold text-[#674b2d]">{baseMap.color}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧: 合成图片展示区域 */}
        <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-[#8B6F47] text-sm flex items-center gap-2">
              <span>🧩</span>
              4. 合成图片展示区域
            </h3>
            <span className="text-[10px] px-2 py-1 bg-[#EEF2FF] text-[#4B5563] rounded-full">
              {selectedBaseMapColor && selectedIconId ? '已完成' : '等待底图与icon'}
            </span>
          </div>
          
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-xl p-4 flex items-center justify-center min-h-[180px] mb-3"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
            }}
          >
            {selectedBaseMapColor && selectedIconId ? (
              <canvas
                ref={composeCanvasRef}
                width="140"
                height="140"
                className="rounded-xl shadow-lg"
                style={{ width: '140px', height: '140px' }}
              />
            ) : (
              <div className="text-[#7f8c8d] text-xs text-center max-w-[220px] leading-relaxed">
                AI 定位底图并匹配 icon 后，将自动合成为一张图片。
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-[#674b2d] mb-1">下载文件名</label>
            <input
              type="text"
              value={compositeFilename}
              onChange={(e) => setCompositeFilename(e.target.value)}
              placeholder="等待OCR识别物品名称"
              className="w-full text-xs px-3 py-2 border border-[#E9DFD0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B6F47] bg-white mb-3"
            />
            
            <div className="bg-[#F8FAFC] border border-[#E9DFD0] rounded-xl p-3 text-xs text-[#674b2d] leading-relaxed mb-3">
              {selectedBaseMapColor && selectedIconId ? (
                <>
                  <div><strong>底图颜色:</strong> {selectedBaseMapColor}</div>
                  <div><strong>匹配Icon:</strong> {iconLibrary.find(i => i.id === selectedIconId)?.name}</div>
                  <div><strong>识别名称:</strong> {recognizedOcrName || '未识别'}</div>
                </>
              ) : (
                '当前需要先完成底图定位和 icon 匹配。'
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCompose}
                disabled={!selectedBaseMapColor || !selectedIconId}
                className="px-3 py-1.5 bg-[#8B6F47] hover:bg-[#6F5839] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Download size={12} />
                下载
              </button>
              <button
                onClick={handleRefreshCompose}
                className="px-3 py-1.5 bg-[#8B6F47]/10 hover:bg-[#8B6F47]/20 text-[#674b2d] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} />
                刷新合成
              </button>
            </div>
          </div>
        </div>
        
      </div>

      {/* 日志区域 */}
      <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-[#8B6F47] text-sm flex items-center gap-2">
            <span>📜</span>
            识别与匹配日志 (API原始响应/分析)
          </h3>
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 bg-[#8B6F47]/10 hover:bg-[#8B6F47]/20 text-[#674b2d] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <Trash2 size={12} />
            清空日志
          </button>
        </div>
        
        <div className="bg-[#1E293B] text-[#E2E8F0] rounded-xl p-4 font-mono text-[10px] max-h-[360px] overflow-y-auto whitespace-pre-wrap break-words">
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
        
        <div className="mt-3 text-right text-[9px] text-[#7f8c8d]">
          测试方法：使用 API 多图输入，要求模型忽略截图背景和文字，只比较截图中的 icon 本体与透明 icon 候选。
        </div>
      </div>
      
    </div>
  );
}
