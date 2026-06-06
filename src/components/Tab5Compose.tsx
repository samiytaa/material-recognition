import { useCallback, useEffect, useRef, useState } from 'react';
import { runDirectVisionMatching } from '../utils/visionApiHelper';
import { useBasemapGroups, useIconLibrary } from '../hooks';
import {
  ScreenshotPanel,
  IconLibraryPanel,
  BasemapPanel,
  LogPanel,
  CompositePanel
} from './tab5';
import { compositeImageWithBasemap } from '../utils/tab2Helper';

export default function Tab5Compose() {
  // 日志状态
  const [logs, setLogs] = useState<string[]>([
    '[系统] 就绪。配置API Key后上传截图和透明icon库即可测试。',
    '[说明] 一键识别 - AI同时看到参考图和候选icon，进行直接视觉比较'
  ]);

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  }, []);

  // 截图状态
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // icon库管理
  const {
    iconLibrary,
    selectedIconId,
    setSelectedIconId,
    handleIconLibraryUpload,
    deleteIcon,
    clearIconLibrary,
    restoreFromStorage
  } = useIconLibrary(addLog);

  // 底图组管理
  const { groups: baseMapGroups } = useBasemapGroups(addLog);
  const [selectedBaseMapGroupId, setSelectedBaseMapGroupId] = useState<string>('');
  const [selectedBaseMapColor, setSelectedBaseMapColor] = useState<string | null>(null);

  // 合成状态
  const [compositeFilename, setCompositeFilename] = useState<string>('合成图片.png');
  const [recognizedOcrName, setRecognizedOcrName] = useState<string>('');
  const [enableContainScale, setEnableContainScale] = useState<boolean>(() => {
    const saved = localStorage.getItem('tab5_enableContainScale');
    return saved !== null ? saved === 'true' : true;
  });

  // 批次大小控制
  const [batchSize, setBatchSize] = useState<number>(5);

  // refs
  const composeCanvasRef = useRef<HTMLCanvasElement>(null);

  // API 配置
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

    const savedScreenshot = localStorage.getItem('tab5_screenshot');
    const savedScreenshotBase64 = localStorage.getItem('tab5_screenshot_base64');
    if (savedScreenshot && savedScreenshotBase64) {
      setScreenshotPreview(savedScreenshot);
      setScreenshotBase64(savedScreenshotBase64);
      addLog('已恢复上次上传的截图');
    }

    restoreFromStorage();

    const savedBatchSize = localStorage.getItem('tab5_batchSize');
    if (savedBatchSize) {
      const parsedBatchSize = parseInt(savedBatchSize);
      if (!isNaN(parsedBatchSize) && parsedBatchSize >= 1 && parsedBatchSize <= 20) {
        setBatchSize(parsedBatchSize);
      }
    } else {
      localStorage.setItem('tab5_batchSize', '5');
    }

    if (baseMapGroups.length > 0 && !selectedBaseMapGroupId) {
      setSelectedBaseMapGroupId(baseMapGroups[0].id);
    }

    const style = document.createElement('style');
    style.textContent = `.hide-scrollbar::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [baseMapGroups, selectedBaseMapGroupId, restoreFromStorage]);

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

  const renderComposite = async (baseMapColor: string, iconId: string) => {
    const canvas = composeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentGroup = baseMapGroups.find(g => g.id === selectedBaseMapGroupId);
    const baseMaps = currentGroup?.thumbnails || [];
    const baseMap = baseMaps.find(b => b.color === baseMapColor);
    const icon = iconLibrary.find(i => i.id === iconId);

    if (!baseMap || !icon) return;

    try {
      const compositeDataUrl = await compositeImageWithBasemap(
        `data:image/png;base64,${icon.base64}`,
        baseMap.image,
        enableContainScale
      );

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mode = enableContainScale ? 'Contain 等比缩放' : '原始尺寸（超出裁切）';
        addLog(`[合成] 使用 ${mode} 模式完成`);
      };
      img.src = compositeDataUrl;
    } catch (error) {
      addLog('[合成] 合成失败');
    }
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



  const handleClearLogs = () => {
    setLogs([]);
    addLog('[系统] 日志已清空');
  };

  const handleBatchSizeChange = (size: number) => {
    setBatchSize(size);
    localStorage.setItem('tab5_batchSize', size.toString());
  };

  const handleContainScaleChange = (enabled: boolean) => {
    setEnableContainScale(enabled);
    if (selectedBaseMapColor && selectedIconId) {
      setTimeout(() => renderComposite(selectedBaseMapColor, selectedIconId), 50);
    }
  };

  const canRunRecognition = !!(screenshotBase64 && iconLibrary.length > 0 && apiEndpoint && apiKey && selectedModel);
  const recognitionTooltip = !apiEndpoint || !apiKey || !selectedModel
    ? '请先配置API'
    : !screenshotBase64
    ? '请先上传截图'
    : iconLibrary.length === 0
    ? '请先添加icon'
    : '一键识别 - AI将直接看到参考图和候选icon图片';

  return (
    <div
      className="hide-scrollbar flex-1 flex flex-col min-h-0 bg-transparent text-[#443B43] overflow-y-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex-shrink-0 space-y-4 px-2 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ScreenshotPanel
            screenshotPreview={screenshotPreview}
            onScreenshotUpload={handleScreenshotUpload}
            onClearScreenshot={handleClearScreenshot}
          />

          <IconLibraryPanel
            iconLibrary={iconLibrary}
            selectedIconId={selectedIconId}
            onIconSelect={setSelectedIconId}
            onIconUpload={handleIconLibraryUpload}
            onIconDelete={deleteIcon}
            onClearAll={clearIconLibrary}
            addLog={addLog}
          />

          <BasemapPanel
            basemapGroups={baseMapGroups}
            selectedGroupId={selectedBaseMapGroupId}
            selectedColor={selectedBaseMapColor}
            onGroupChange={setSelectedBaseMapGroupId}
            onColorSelect={setSelectedBaseMapColor}
            addLog={addLog}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LogPanel
            logs={logs}
            batchSize={batchSize}
            onBatchSizeChange={handleBatchSizeChange}
            onRunRecognition={handleRunDirectMatching}
            onClearLogs={handleClearLogs}
            canRunRecognition={canRunRecognition}
            recognitionTooltip={recognitionTooltip}
          />

          <CompositePanel
            canvasRef={composeCanvasRef}
            compositeFilename={compositeFilename}
            recognizedOcrName={recognizedOcrName}
            selectedBaseMapColor={selectedBaseMapColor}
            selectedIconId={selectedIconId}
            iconLibrary={iconLibrary}
            enableContainScale={enableContainScale}
            onFilenameChange={setCompositeFilename}
            onContainScaleChange={handleContainScaleChange}
            onDownload={handleDownloadCompose}
            onRefresh={handleRefreshCompose}
            addLog={addLog}
          />
        </div>
      </div>
    </div>
  );
}
