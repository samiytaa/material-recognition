import { Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { runDirectVisionMatching } from '../utils/visionApiHelper';
import { UploadZone } from './common';

// 导入底图图片
import propGold from '/basemaps/prop-gold.png';
import propPurple from '/basemaps/prop-purple.png';
import propBlue from '/basemaps/prop-blue.png';
import propGreen from '/basemaps/prop-green.png';
import propBrown from '/basemaps/prop-brown.png';

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
    { color: '金', name: 'prop-gold.png', src: propGold },
    { color: '紫', name: 'prop-purple.png', src: propPurple },
    { color: '蓝', name: 'prop-blue.png', src: propBlue },
    { color: '绿', name: 'prop-green.png', src: propGreen },
    { color: '咖', name: 'prop-brown.png', src: propBrown }
  ]);
  const [selectedBaseMapColor, setSelectedBaseMapColor] = useState<string | null>(null);

  // 合成状态
  const [compositeFilename, setCompositeFilename] = useState<string>('合成图片.png');
  const [recognizedOcrName, setRecognizedOcrName] = useState<string>('');

  // 批次大小控制
  const [batchSize, setBatchSize] = useState<number>(5);

  // 日志状态
  const [logs, setLogs] = useState<string[]>([
    '[系统] 就绪。配置API Key后上传截图和透明icon库即可测试。',
    '[说明] 一键识别 - AI同时看到参考图和候选icon，进行直接视觉比较'
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

    // 从localStorage恢复上传的图片
    const savedScreenshot = localStorage.getItem('tab5_screenshot');
    const savedScreenshotBase64 = localStorage.getItem('tab5_screenshot_base64');
    const savedIconLibrary = localStorage.getItem('tab5_icon_library');
    const savedBatchSize = localStorage.getItem('tab5_batchSize');

    if (savedScreenshot && savedScreenshotBase64) {
      setScreenshotPreview(savedScreenshot);
      setScreenshotBase64(savedScreenshotBase64);
      addLog('已恢复上次上传的截图');
    }

    if (savedIconLibrary) {
      try {
        const parsed = JSON.parse(savedIconLibrary);
        setIconLibrary(parsed);
        addLog(`已恢复 ${parsed.length} 个icon`);
      } catch (e) {
        console.error('恢复icon库失败', e);
      }
    }

    // 恢复上次的批次数量设置，默认为5
    if (savedBatchSize) {
      const parsedBatchSize = parseInt(savedBatchSize);
      if (!isNaN(parsedBatchSize) && parsedBatchSize >= 1 && parsedBatchSize <= 20) {
        setBatchSize(parsedBatchSize);
      }
    } else {
      // 首次使用时设置默认值为5
      localStorage.setItem('tab5_batchSize', '5');
    }

    // 添加隐藏滚动条的样式
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
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
      const base64 = dataUrl.split(',')[1];
      setScreenshotPreview(dataUrl);
      setScreenshotBase64(base64);
      setSelectedBaseMapColor(null);
      setSelectedIconId(null);
      // 保存到localStorage
      localStorage.setItem('tab5_screenshot', dataUrl);
      localStorage.setItem('tab5_screenshot_base64', base64);
      addLog(`截图已上传: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // 清除截图
  const handleClearScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotBase64(null);
    setSelectedBaseMapColor(null);
    setSelectedIconId(null);
    // 清除localStorage
    localStorage.removeItem('tab5_screenshot');
    localStorage.removeItem('tab5_screenshot_base64');
    addLog('截图已清除');
  };

  // icon库批量上传
  const handleIconLibraryUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    let successCount = 0;
    let skipCount = 0;
    const skippedFiles: string[] = [];
    const newIcons: IconLibraryItem[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        addLog(`跳过非图片文件: ${file.name}`);
        continue;
      }

      // 检查文件名是否已存在
      const isDuplicate = iconLibrary.some(icon => icon.name === file.name);
      if (isDuplicate) {
        skippedFiles.push(file.name);
        skipCount++;
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

        newIcons.push(newIcon);

        // 更新状态和localStorage
        setIconLibrary(prev => {
          const updated = [...prev, newIcon];
          localStorage.setItem('tab5_icon_library', JSON.stringify(updated));
          return updated;
        });
        successCount++;
      };
      reader.readAsDataURL(file);
    }

    // 延迟显示日志，确保所有文件都处理完
    setTimeout(() => {
      if (successCount > 0) {
        addLog(`成功添加 ${successCount} 个透明icon到库中`);
      }
      if (skipCount > 0) {
        addLog(`跳过 ${skipCount} 个重复文件名: ${skippedFiles.slice(0, 3).join(', ')}${skipCount > 3 ? '...' : ''}`);
      }
    }, 100);
  };

  // 清空icon库
  const handleClearIcons = () => {
    if (confirm('确定要清空所有icon吗？')) {
      setIconLibrary([]);
      setSelectedIconId(null);
      localStorage.removeItem('tab5_icon_library');
      addLog('icon库已清空');
    }
  };

  // 直接视觉识别（提示词在 visionApiHelper.ts 中统一定义，Tab2 也使用同一提示词）
  const handleRunDirectMatching = async () => {
    if (!apiEndpoint || !apiKey || !selectedModel) {
      addLog('[错误] 请先在顶部导航栏的 API 配置中配置 API 并选择模型');
      alert('请先配置API端点、Key并选择模型！');
      return;
    }

    if (!screenshotBase64) {
      addLog('[错误] 请先上传游戏截图');
      alert('请先上传游戏截图！');
      return;
    }

    if (iconLibrary.length === 0) {
      addLog('[错误] 请先添加透明icon库');
      alert('请先添加透明icon到库中！');
      return;
    }

    addLog('========================================');
    addLog('[识别方式] 一键识别');
    addLog('[说明] AI将同时看到参考图和候选icon图片，进行直接视觉比较');
    addLog('[开始] 使用一键识别方法...');
    addLog(`[信息] 截图已加载，icon库包含 ${iconLibrary.length} 个候选`);
    addLog(`[配置] 使用端点: ${apiEndpoint}`);
    addLog(`[配置] 使用模型: ${selectedModel}`);

    // 调用新的直接视觉识别API
    const result = await runDirectVisionMatching(
      {
        endpoint: apiEndpoint,
        apiKey: apiKey,
        model: selectedModel
      },
      screenshotBase64,
      iconLibrary,
      addLog,
      batchSize
    );

    if (result.success && result.color && result.iconIndex !== undefined && result.name) {
      const matchedIcon = iconLibrary[result.iconIndex];
      if (!matchedIcon) {
        addLog('[失败] AI返回的icon索引在当前候选库中不存在');
        return;
      }

      // 设置匹配结果
      setSelectedBaseMapColor(result.color);
      setSelectedIconId(matchedIcon.id);
      setRecognizedOcrName(result.name);
      setCompositeFilename(`${result.name}_${result.color}.png`);

      // 自动触发合成
      setTimeout(() => {
        renderComposite(result.color!, matchedIcon.id);
      }, 100);

      addLog('[完成] 已自动应用匹配结果并合成图片');
      addLog('[识别方式] 一键识别 ✓');
    } else {
      addLog(`[失败] 匹配未成功: ${result.error || '未知错误'}`);
      addLog('[识别方式] 一键识别 ✗');
      alert(`匹配失败：${result.error || '未知错误'}\n\n请检查API配置和网络连接`);
    }
  };

  const renderComposite = (baseMapColor: string, iconId: string) => {
    const canvas = composeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseMap = baseMaps.find(b => b.color === baseMapColor);
    const icon = iconLibrary.find(i => i.id === iconId);

    if (!baseMap || !icon) return;

    const baseImg = new Image();
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      const iconImg = new Image();
      iconImg.onload = () => {
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

  // 刷新合成
  const handleRefreshCompose = () => {
    if (!selectedBaseMapColor || !selectedIconId) {
      addLog('[提示] 需要先完成AI匹配');
      return;
    }

    renderComposite(selectedBaseMapColor, selectedIconId);
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
    <div
      className="hide-scrollbar flex-1 flex flex-col min-h-0 bg-transparent text-[#443B43] overflow-y-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >

      {/* 第一行：三个卡片 - 游戏截图、Icon库、底图展示 */}
      <div className="flex-shrink-0 space-y-4 px-2 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* 1. 游戏内截图 */}
          <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
            <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3">
              游戏内截图
            </h3>

            {screenshotPreview ? (
              <>
                <div className="bg-[#F8FAFC] rounded-xl min-h-[180px] flex items-center justify-center mb-3">
                  <img src={screenshotPreview} alt="截图" className="max-w-full max-h-[200px] rounded-lg shadow-sm" />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleClearScreenshot}
                    className="w-full px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
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
          </div>

          {/* 2. 透明 icon  */}
          <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
            <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3">
              透明 icon
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
                <div className="bg-[#F9FBFD] rounded-xl p-1 min-h-[120px] max-h-[220px] overflow-y-auto mb-3">
                  <div className="grid grid-cols-6 gap-1">
                    {iconLibrary.map(icon => (
                      <div
                        key={icon.id}
                        onClick={() => setSelectedIconId(icon.id)}
                        className={`bg-white rounded-lg p-1 border cursor-pointer transition-all relative group ${selectedIconId === icon.id
                            ? 'border-2 border-[#1a73e8] bg-[#e8f0fe]'
                            : 'border-[#dce5ec] hover:border-[#8B6F47]'
                          } text-center aspect-square flex flex-col items-center justify-center`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIconLibrary(prev => {
                              const updated = prev.filter(i => i.id !== icon.id);
                              localStorage.setItem('tab5_icon_library', JSON.stringify(updated));
                              return updated;
                            });
                            if (selectedIconId === icon.id) {
                              setSelectedIconId(null);
                            }
                            addLog(`删除icon: ${icon.name}`);
                          }}
                          className="absolute top-0 right-0 bg-[#9E4A4A] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="删除"
                        >
                          ×
                        </button>
                        <div className="w-full aspect-square bg-white rounded flex items-center justify-center mb-0.5">
                          <img
                            src={`data:image/png;base64,${icon.base64}`}
                            alt={icon.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="text-[8px] truncate w-full px-0.5">{icon.name}</div>
                      </div>
                    ))}

                    {/* 追加图片虚线格子 */}
                    <label className="bg-white rounded-lg p-1 border-2 border-dashed border-[#8B6F47]/40 hover:border-[#8B6F47] hover:bg-[#8B6F47]/5 cursor-pointer transition-all text-center aspect-square flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/png,image/webp,image/jpeg"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleIconLibraryUpload(e.target.files);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <div className="w-full aspect-square bg-white rounded flex items-center justify-center mb-0.5">
                        <div className="text-2xl font-light text-[#8B6F47]">+</div>
                      </div>
                      <div className="text-[8px] truncate w-full px-0.5 text-[#8B6F47]">追加</div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleClearIcons}
                  className="w-full px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  清空全部
                </button>
              </>
            )}
          </div>

          {/* 3. 底图 */}
          <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
                底图
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {baseMaps.map(baseMap => (
                <div
                  key={baseMap.color}
                  className={`bg-white rounded-xl p-2 border text-center w-16 transition-all ${selectedBaseMapColor === baseMap.color
                      ? 'border-2 border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dce5ec]'
                    }`}
                >
                  <img
                    src={baseMap.src}
                    alt={baseMap.color}
                    className="w-12 h-12 object-contain rounded-lg mx-auto bg-[#EEF2F5] shadow-sm"
                  />
                  <div className="text-[9px] mt-1.5 font-bold text-[#674b2d]">{baseMap.color}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 第二行：两个卡片 - 日志、合成图片展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 左侧: 日志 */}
          <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
                日志
              </h3>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-[#674b2d] font-bold whitespace-nowrap">每批数量</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={batchSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 20) {
                        setBatchSize(val);
                        // 保存到localStorage
                        localStorage.setItem('tab5_batchSize', val.toString());
                      }
                    }}
                    className="w-14 text-xs px-2 py-1 border border-[#E9DFD0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B6F47] bg-white text-center"
                  />
                </div>
                <button
                  onClick={handleRunDirectMatching}
                  disabled={!screenshotBase64 || iconLibrary.length === 0 || !apiEndpoint || !apiKey || !selectedModel}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#4A7C9E] to-[#5B8CAE] hover:from-[#396380] hover:to-[#4A7C9E] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                  title={!apiEndpoint || !apiKey || !selectedModel ? '请先配置API' : !screenshotBase64 ? '请先上传截图' : iconLibrary.length === 0 ? '请先添加icon' : '一键识别 - AI将直接看到参考图和候选icon图片'}
                >
                  <Eye size={13} />
                  一键识别
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 bg-[#8B6F47]/10 hover:bg-[#8B6F47]/20 text-[#674b2d] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  清空日志
                </button>
              </div>
            </div>

            <div className="bg-[#1E293B] text-[#E2E8F0] rounded-xl p-4 font-mono text-[10px] h-[280px] overflow-y-auto whitespace-pre-wrap break-words">
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>

            <div className="mt-3 text-right text-[9px] text-[#7f8c8d]">

            </div>
          </div>

          {/* 右侧: 合成图片 */}
          <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
                合成图片
              </h3>
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
              {selectedBaseMapColor && selectedIconId && (
                <canvas
                  ref={composeCanvasRef}
                  width="140"
                  height="140"
                  className="rounded-xl shadow-lg"
                  style={{ width: '140px', height: '140px' }}
                />
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
      </div>

    </div>
  );
}
