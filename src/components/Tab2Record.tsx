import React from 'react';
import LogSidebar from './LogSidebar';
import {
  RecordTable,
  BatchOperationsBar,
  BasemapSettings,
  ExportModeModal,
  RecordSidePanel,
  CalibrationReviewModal
} from './tab2';
import { Card, RecognitionProgressModal } from './common';
import {
  useTab2RecordController,
  type Tab2RecordControllerProps as Tab2RecordProps
} from '../hooks/useTab2RecordController';

export default function Tab2Record(props: Tab2RecordProps) {
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewRowId, setReviewRowId] = React.useState<number | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = React.useState<number | null>(null);

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
    deleteScreenshotFromRow,
    confirmRowIcon,
    returnRowIcon,
    handleCellImageUpload,
    handleBatchDeleteSelected,
    handleBatchReturnSelected,
    handleBatchConfirmSelected,
    runAiMatch,
    exportBatchFiles,
    exportConfirmedAndRemoveRows,
    exportReadyCount,
    confirmedExportReadyCount,
    matchedCount,
    unMatchedCount,
    pendingRecognitionCount,
    getIconStatus
  } = useTab2RecordController(props);

  const { recordList, setRecordList, recordLogs, addRecordLog, clearRecordLogs } = props;
  const reviewRows = filteredRecordList;
  const reviewCurrentIndex = reviewRowId === null
    ? -1
    : reviewRows.findIndex(row => row.id === reviewRowId);
  const reviewCurrentRow = reviewCurrentIndex >= 0 ? reviewRows[reviewCurrentIndex] : null;
  const reviewOriginalIndex = reviewCurrentRow
    ? recordList.findIndex(row => row.id === reviewCurrentRow.id)
    : -1;

  React.useEffect(() => {
    if (!reviewModalOpen) return;
    if (reviewRows.length === 0) {
      setReviewModalOpen(false);
      setReviewRowId(null);
      return;
    }
    if (reviewCurrentIndex === -1) {
      setReviewRowId(reviewRows[0].id);
    }
  }, [reviewCurrentIndex, reviewModalOpen, reviewRows]);

  const openReviewModal = () => {
    const firstReviewRow = reviewRows.find(row => selectedRowIds.includes(row.id)) ?? reviewRows[0];
    if (!firstReviewRow) {
      return;
    }

    setReviewRowId(firstReviewRow.id);
    setReviewModalOpen(true);
    const originalIndex = recordList.findIndex(row => row.id === firstReviewRow.id);
    addRecordLog(`进入校对模式：第 ${originalIndex + 1} 行`);
  };

  const openReviewModalForRow = (filteredRowIndex: number) => {
    const row = filteredRecordList[filteredRowIndex];
    if (!row) return;

    setReviewRowId(row.id);
    setReviewModalOpen(true);
    const originalIndex = recordList.findIndex(record => record.id === row.id);
    addRecordLog(`进入校对模式：第 ${originalIndex + 1} 行`);
  };

  const navigateReviewRow = (nextIndex: number) => {
    const nextRow = reviewRows[nextIndex];
    if (!nextRow) return;
    setReviewRowId(nextRow.id);
    const originalIndex = recordList.findIndex(row => row.id === nextRow.id);
    addRecordLog(`校对切换到第 ${originalIndex + 1} 行`);
  };

  const handleReviewConfirm = () => {
    if (reviewOriginalIndex === -1) return;
    confirmRowIcon(reviewOriginalIndex);
  };

  const handleReviewReturn = () => {
    if (reviewOriginalIndex === -1) return;
    returnRowIcon(reviewOriginalIndex);
  };

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

      <CalibrationReviewModal
        isOpen={reviewModalOpen && reviewCurrentIndex >= 0}
        rows={reviewRows}
        currentIndex={Math.max(reviewCurrentIndex, 0)}
        iconStatus={reviewCurrentRow ? getIconStatus(reviewCurrentRow) : 'none'}
        onClose={() => setReviewModalOpen(false)}
        onNavigate={navigateReviewRow}
        onConfirm={handleReviewConfirm}
        onReturn={handleReviewReturn}
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
              openReviewModalForRow(filteredRowIndex);
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
            focusedRowIndex={focusedRowIndex}
            onFocusRow={setFocusedRowIndex}
          />
        </div>

        {/* 快捷键提示 */}
        {filteredRecordList.length > 0 && (
          <div className="mt-2 px-3 py-1.5 bg-[#FAF8F4] border border-[#DFD2BD]/40 rounded-lg">
            <div className="flex items-center gap-4 text-[10px] text-[#8B6F47]">
              <span className="font-semibold">快捷操作：</span>
              <span>单击行 = 选中</span>
              <span>双击行 = 校对</span>
              <span>Enter = 确认</span>
              <span>Backspace/R = 退回</span>
              <span>↑/↓ = 切换行</span>
            </div>
          </div>
        )}
      </Card>

      <RecordSidePanel
        iconLibraryCount={iconLibraryCount}
        selectedScreenshotCategory={selectedScreenshotCategory}
        pendingRecognitionCount={pendingRecognitionCount}
        exportReadyCount={exportReadyCount}
        confirmedExportReadyCount={confirmedExportReadyCount}
        canReview={reviewRows.length > 0}
        onScreenshotCategoryChange={setSelectedScreenshotCategory}
        onBatchScreenshotUpload={handleBatchScreenshotUpload}
        onRunAiMatch={runAiMatch}
        onOpenReview={openReviewModal}
        onExport={() => setExportModeModalOpen(true)}
        onExportConfirmedAndRemove={exportConfirmedAndRemoveRows}
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
