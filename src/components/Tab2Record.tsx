import React from 'react';
import LogSidebar from './LogSidebar';
import {
  RecordTable,
  BatchOperationsBar,
  BasemapSettings,
  ExportModeModal,
  RecordSidePanel
} from './tab2';
import { Card, RecognitionProgressModal } from './common';
import {
  useTab2RecordController,
  type Tab2RecordControllerProps as Tab2RecordProps
} from '../hooks/useTab2RecordController';

export default function Tab2Record(props: Tab2RecordProps) {
  const {
    fileInputRef1,
    fileInputRef2,
    isLogPanelOpen,
    setIsLogPanelOpen,
    selectedScreenshotCategory,
    setSelectedScreenshotCategory,
    exportModeModalOpen,
    setExportModeModalOpen,
    recognitionProgress,
    exportProgress,
    screenshotFilter,
    setScreenshotFilter,
    filteredRecordList,
    selectedRowIds,
    toggleRowSelection,
    toggleSelectAll,
    basemapGroups,
    selectedGroupId,
    setSelectedGroupId,
    availableColors,
    enableContainScale,
    setEnableContainScale,
    iconLibraryCount,
    handleBatchScreenshotUpload,
    onCellFileChange,
    viewRowImage,
    deleteScreenshotFromRow,
    confirmRowIcon,
    returnRowIcon,
    handleCellImageUpload,
    handleBatchDeleteSelected,
    handleBatchReturnSelected,
    handleBatchConfirmSelected,
    runAiMatch,
    exportBatchFiles,
    exportReadyCount,
    matchedCount,
    unMatchedCount,
    pendingRecognitionCount,
    getIconStatus
  } = useTab2RecordController(props);

  const { recordList, setRecordList, recordLogs, addRecordLog, clearRecordLogs } = props;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1 overflow-hidden relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef1}
        onChange={(e) => onCellFileChange(e, 'original')}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef2}
        onChange={(e) => onCellFileChange(e, 'screenshot')}
        className="hidden"
      />

      {/* 识别进度弹窗 */}
      <RecognitionProgressModal
        isOpen={recognitionProgress.isOpen}
        current={recognitionProgress.current}
        total={recognitionProgress.total}
        successCount={recognitionProgress.successCount}
        failCount={recognitionProgress.failCount}
        currentProcessing={recognitionProgress.currentProcessing}
        logs={recordLogs}
      />

      {/* 导出进度弹窗 */}
      <RecognitionProgressModal
        isOpen={exportProgress.isOpen}
        current={exportProgress.current}
        total={exportProgress.total}
        successCount={exportProgress.successCount}
        failCount={exportProgress.failCount}
        currentProcessing={exportProgress.currentProcessing}
        logs={exportProgress.logs}
        title="正在导出中..."
      />

      <ExportModeModal
        isOpen={exportModeModalOpen}
        onClose={() => setExportModeModalOpen(false)}
        onExport={exportBatchFiles}
      />

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden decorative-corners" padding="md">
        {/* 筛选器和操作栏 */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <BatchOperationsBar
            selectedCount={selectedRowIds.length}
            screenshotFilter={screenshotFilter}
            totalRecords={recordList.length}
            matchedCount={matchedCount}
            unMatchedCount={unMatchedCount}
            onScreenshotFilterChange={setScreenshotFilter}
            onDeleteSelected={handleBatchDeleteSelected}
            onReturnSelected={handleBatchReturnSelected}
            onConfirmSelected={handleBatchConfirmSelected}
          />

          <BasemapSettings
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
            enableContainScale={enableContainScale}
            onContainScaleChange={setEnableContainScale}
            addLog={addRecordLog}
          />
        </div>

        <div className="overflow-auto flex-1 border border-[#DFD2BD]/40 rounded-xl relative scrollbar-thin">
          <RecordTable
            records={filteredRecordList}
            availableColors={availableColors}
            basemapGroups={basemapGroups}
            selectedGroupId={selectedGroupId}
            enableContainScale={enableContainScale}
            selectedRowIds={selectedRowIds}
            onToggleRowSelection={(filteredRowIndex, event) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              toggleRowSelection(rowId, event);
            }}
            onToggleSelectAll={toggleSelectAll}
            onViewImage={(filteredRowIndex, type) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              viewRowImage(originalRowIndex, type);
            }}
            onUploadImage={(filteredRowIndex, type) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              handleCellImageUpload(originalRowIndex, type);
            }}
            onUpdateRow={(filteredRowIndex, updates) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              setRecordList(prev => {
                const updated = [...prev];
                updated[originalRowIndex] = { ...updated[originalRowIndex], ...updates };
                return updated;
              });
              if (updates.baseColor) {
                addRecordLog(`第 ${originalRowIndex + 1} 行底色变更为: ${updates.baseColor}`);
              }
            }}
            getIconStatus={getIconStatus}
            onConfirmIcon={(filteredRowIndex) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              confirmRowIcon(originalRowIndex);
            }}
            onReturnIcon={(filteredRowIndex) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              returnRowIcon(originalRowIndex);
            }}
            onDeleteScreenshot={(filteredRowIndex) => {
              const rowId = filteredRecordList[filteredRowIndex].id;
              const originalRowIndex = recordList.findIndex(r => r.id === rowId);
              deleteScreenshotFromRow(originalRowIndex);
            }}
          />
        </div>
      </Card>

      <RecordSidePanel
        iconLibraryCount={iconLibraryCount}
        selectedScreenshotCategory={selectedScreenshotCategory}
        pendingRecognitionCount={pendingRecognitionCount}
        exportReadyCount={exportReadyCount}
        onScreenshotCategoryChange={setSelectedScreenshotCategory}
        onBatchScreenshotUpload={handleBatchScreenshotUpload}
        onRunAiMatch={runAiMatch}
        onExport={() => setExportModeModalOpen(true)}
      />

      <LogSidebar
        isOpen={isLogPanelOpen}
        setIsOpen={setIsLogPanelOpen}
        logs={recordLogs}
        onClearLogs={clearRecordLogs}
      />
    </div>
  );
}
