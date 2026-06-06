import { useState, useCallback } from 'react';
import { RecordRow } from '../types';

export function useRowSelection(filteredRecordList: RecordRow[]) {
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [lastSelectedRowId, setLastSelectedRowId] = useState<number | null>(null);

  // 切换行选择状态（支持 Ctrl 和 Shift 多选）
  const toggleRowSelection = useCallback((rowId: number, event?: React.MouseEvent) => {
    const row = filteredRecordList.find(r => r.id === rowId);
    if (!row) return;

    // Shift 连选
    if (event?.shiftKey && lastSelectedRowId !== null) {
      const lastIndex = filteredRecordList.findIndex(r => r.id === lastSelectedRowId);
      const currentIndex = filteredRecordList.findIndex(r => r.id === rowId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredRecordList.slice(start, end + 1).map(r => r.id);

        setSelectedRowIds(prev => [...new Set([...prev, ...rangeIds])]);
        return;
      }
    }

    // Ctrl 离散多选 / 普通 toggle
    setSelectedRowIds(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );

    // 更新锚点
    setLastSelectedRowId(rowId);
  }, [filteredRecordList, lastSelectedRowId]);

  // 全选/取消全选（基于过滤后的列表）
  const toggleSelectAll = useCallback(() => {
    const filteredIds = filteredRecordList.map(row => row.id);
    const allFilteredSelected = filteredIds.every(id => selectedRowIds.includes(id));

    if (allFilteredSelected) {
      setSelectedRowIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedRowIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  }, [filteredRecordList, selectedRowIds]);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedRowIds([]);
    setLastSelectedRowId(null);
  }, []);

  return {
    selectedRowIds,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection
  };
}
