import { useEffect, useState } from 'react';
import { PropItem, RecordRow } from '../types';
import { getFileNameWithoutExtension } from '../utils/fileHelper';
import { DEFAULT_SCREENSHOT_CATEGORY } from '../utils/tab2Helper';
import { loadTab2Screenshots } from '../utils/tab2ScreenshotStorage';

interface UseTab2RecordPersistenceOptions {
  recordList: RecordRow[];
  setRecordList: React.Dispatch<React.SetStateAction<RecordRow[]>>;
  propsList: PropItem[];
  addRecordLog: (msg: string) => void;
}

export function useTab2RecordPersistence({
  recordList,
  setRecordList,
  propsList,
  addRecordLog
}: UseTab2RecordPersistenceOptions) {
  const [hasRestoredRecords, setHasRestoredRecords] = useState(false);

  useEffect(() => {
    if (!hasRestoredRecords) return;

    if (recordList.length > 0) {
      try {
        const compressedData = recordList.map(row => ({
          id: row.id,
          propName: row.propName,
          baseColor: row.baseColor,
          propType: row.propType,
          propCategory: row.propCategory,
          propRelated: row.propRelated,
          outputName: row.outputName,
          originalImage: row.originalImage,
          hasOriginalImage: row.originalImage !== null,
          hasScreenshot: row.screenshot !== null,
          hasPreview: row.previewWithBase !== null,
          originalImageFileName: row.originalImageFileName,
          screenshotOriginalName: row.screenshotOriginalName,
          screenshotCategory: row.screenshotCategory,
          previousScreenshotCategory: row.previousScreenshotCategory,
          matchedPropFileName: row.matchedPropFileName
        }));

        localStorage.setItem('tab2_recordList_compressed', JSON.stringify(compressedData));
      } catch (error) {
        console.error('保存失败:', error);
      }
    } else {
      localStorage.removeItem('tab2_recordList_compressed');
    }
  }, [recordList, hasRestoredRecords]);

  useEffect(() => {
    if (hasRestoredRecords) return;
    if (recordList.length > 0) {
      setHasRestoredRecords(true);
      return;
    }

    const savedRowsStr = localStorage.getItem('tab2_recordList_compressed');
    if (!savedRowsStr) {
      setHasRestoredRecords(true);
      return;
    }

    let cancelled = false;

    try {
      const savedRows = JSON.parse(savedRowsStr);
      if (!Array.isArray(savedRows) || savedRows.length === 0) {
        setHasRestoredRecords(true);
        return;
      }

      const restoredRows: RecordRow[] = savedRows.map((row: any, index: number) => {
        const matchedName = row.matchedPropFileName || row.originalImageFileName;
        const matchedProp = matchedName
          ? propsList.find(prop => prop.name === matchedName || prop.name === getFileNameWithoutExtension(matchedName))
          : null;

        return {
          id: typeof row.id === 'number' ? row.id : index,
          originalImage: matchedProp?.image || row.originalImage || null,
          originalImageFileName: row.originalImageFileName || matchedProp?.name,
          matchedPropFileName: row.matchedPropFileName || matchedProp?.name,
          screenshot: null,
          screenshotOriginalName: row.screenshotOriginalName,
          screenshotCategory: row.screenshotCategory || DEFAULT_SCREENSHOT_CATEGORY,
          previousScreenshotCategory: row.previousScreenshotCategory,
          propName: row.propName || matchedProp?.displayName || '',
          baseColor: row.baseColor || '金',
          propType: row.propType || (matchedProp ? (matchedProp.type === 'furniture' ? '家具' : '其他道具') : ''),
          propCategory: row.propCategory || matchedProp?.category || '',
          propRelated: row.propRelated || (matchedProp?.ownership?.type === 'male_lead' && matchedProp.ownership.name
            ? `男主-${matchedProp.ownership.name}`
            : matchedProp?.ownership?.type === 'spy' && matchedProp.ownership.name
            ? `密探-${matchedProp.ownership.name}`
            : ''),
          previewWithBase: null,
          outputName: row.outputName || row.propName || matchedProp?.displayName || ''
        };
      });

      loadTab2Screenshots(restoredRows.map(row => row.id))
        .then(savedScreenshots => {
          if (cancelled) return;

          const rowsWithScreenshots = restoredRows.map(row => ({
            ...row,
            screenshot: savedScreenshots.get(row.id) || row.screenshot
          }));

          setRecordList(rowsWithScreenshots);
          const restoredScreenshotCount = rowsWithScreenshots.filter(row => row.screenshot).length;
          addRecordLog(`✓ 已恢复 Tab2 条目 ${rowsWithScreenshots.length} 行，截图 ${restoredScreenshotCount} 张（已从Tab1重建可用icon结果）`);
        })
        .catch(error => {
          if (cancelled) return;
          setRecordList(restoredRows);
          addRecordLog(`⚠ 恢复Tab2截图失败，仅恢复条目状态: ${error}`);
        })
        .finally(() => {
          if (!cancelled) setHasRestoredRecords(true);
        });
    } catch (error) {
      addRecordLog(`⚠ 恢复Tab2条目失败: ${error}`);
      setHasRestoredRecords(true);
    }

    return () => {
      cancelled = true;
    };
  }, [propsList, recordList.length, hasRestoredRecords]);

  return hasRestoredRecords;
}
