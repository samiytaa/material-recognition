import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { useBasemapGroups, type MapGroup, type BasemapItem } from '../hooks';

interface CategoryRow {
  id: string;
  name: string;
}

export default function Tab3Settings() {
  // 使用统一的底图组管理 Hook
  const { groups, saveGroups } = useBasemapGroups();

  // --- STATE FOR SECTION 2: CATEGORY COLS ---
  const [categories, setCategories] = useState<CategoryRow[]>(() => {
    const saved = localStorage.getItem('tab3_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'cat_jw', name: '家具' },
      { id: 'cat_tx', name: '密探头像' },
      { id: 'cat_dj', name: '活动道具' }
    ];
  });

  // --- EDITING COLOR STATE ---
  const [editingColor, setEditingColor] = useState<{ groupIndex: number; itemIndex: number } | null>(null);
  const [colorInputValue, setColorInputValue] = useState('');

  // --- LOCAL PERSISTENCE ---
  // 不再需要手动管理 groups 的 localStorage，由 Hook 处理

  useEffect(() => {
    localStorage.setItem('tab3_categories', JSON.stringify(categories));
  }, [categories]);

  // --- FILE UPLOADER REF ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetGroupIndex, setTargetGroupIndex] = useState<number | null>(null);

  // --- MODALS FOR INTERACTION ---
  const [renamingCategory, setRenamingCategory] = useState<CategoryRow | null>(null);
  const [renameInputName, setRenameInputName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<CategoryRow | null>(null);

  // --- STATE FOR DRAG REORDERING (CATEGORIES) ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- STATE FOR DRAG REORDERING (BASEMAPS) ---
  const [draggedBasemap, setDraggedBasemap] = useState<{ groupIndex: number; itemIndex: number } | null>(null);

  // --- NOTIFICATION FEEDBACK ---
  const [notice, setNotice] = useState<string | null>(null);
  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice(null);
    }, 2500);
  };

  // 清理 localStorage
  const handleClearStorage = () => {
    if (!confirm('确定要清理所有缓存数据吗？\n\n这将清除：\n- Tab1导入的道具列表\n- Tab2的记录列表和上传的截图\n- Tab5的上传文件\n\n注意：底图配置不会被清除')) {
      return;
    }

    try {
      // 清除 Tab1 数据
      localStorage.removeItem('savedProps');
      
      // 清除 Tab2 数据
      localStorage.removeItem('tab2_recordList');
      localStorage.removeItem('tab2_uploadedScreenshots');
      
      // 清除 Tab5 数据
      localStorage.removeItem('tab5_screenshot');
      localStorage.removeItem('tab5_screenshot_base64');
      localStorage.removeItem('tab5_icon_library');
      
      triggerNotice('✓ 已成功清理所有缓存数据，请刷新页面');
      setTimeout(() => {
        alert('缓存已清理完成！\n\n请按 F5 刷新页面以应用更改。');
      }, 500);
    } catch (error) {
      triggerNotice('❌ 清理失败：' + error);
    }
  };

  // --- HANDLERS FOR SECTION 1 (MAP GROUPS) ---
  const handleAddNewGroup = () => {
    const newGroup: MapGroup = {
      id: `group_${Date.now()}`,
      name: '新分组',
      thumbnails: []
    };
    saveGroups([...groups, newGroup]);
    triggerNotice('已成功创建新分组，可上传底图并重命名');
  };

  const triggerUploadForGroup = (index: number) => {
    setTargetGroupIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleGroupFileNameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (targetGroupIndex === null || !e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    let successCount = 0;
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        triggerNotice('仅支持导入图片底图素材！');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newItem: BasemapItem = {
          id: `basemap_${Date.now()}_${Math.random()}`,
          image: dataUrl,
          color: '未命名'
        };
        const cloned = [...groups];
        cloned[targetGroupIndex] = {
          ...cloned[targetGroupIndex],
          thumbnails: [...cloned[targetGroupIndex].thumbnails, newItem]
        };
        saveGroups(cloned);
        successCount++;
        if (successCount === files.length) {
          triggerNotice(`成功导入 ${files.length} 个底图素材到「${groups[targetGroupIndex].name}」`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Rename Group name inline
  const handleRenameGroupInline = (index: number, newName: string) => {
    const cloned = [...groups];
    cloned[index] = { ...cloned[index], name: newName };
    saveGroups(cloned);
  };

  // Delete an entire Map Group
  const handleDeleteGroup = (index: number) => {
    if (confirm(`确定要删除底图分组「·${groups[index].name}」吗？`)) {
      saveGroups(groups.filter((_, idx) => idx !== index));
      triggerNotice('底图分组已成功移除');
    }
  };

  // Remove a single asset in thumbnails
  const handleRemoveAsset = (groupIndex: number, assetIndex: number) => {
    const cloned = [...groups];
    const thumbs = [...cloned[groupIndex].thumbnails];
    thumbs.splice(assetIndex, 1);
    cloned[groupIndex] = { ...cloned[groupIndex], thumbnails: thumbs };
    saveGroups(cloned);
    triggerNotice('素材圆片已移除');
  };

  // Start editing color
  const handleStartEditColor = (groupIndex: number, itemIndex: number) => {
    setEditingColor({ groupIndex, itemIndex });
    setColorInputValue(groups[groupIndex].thumbnails[itemIndex].color);
  };

  // Save color change
  const handleSaveColor = () => {
    if (!editingColor) return;
    const { groupIndex, itemIndex } = editingColor;
    const cloned = [...groups];
    const items = [...cloned[groupIndex].thumbnails];
    items[itemIndex] = { ...items[itemIndex], color: colorInputValue.trim() || '未命名' };
    cloned[groupIndex] = { ...cloned[groupIndex], thumbnails: items };
    saveGroups(cloned);
    triggerNotice(`颜色标签已更新为「${colorInputValue.trim() || '未命名'}」`);
    setEditingColor(null);
  };

  // --- HANDLERS FOR SECTION 2 (CLASSIFICATIONS) ---
  const handleAddNewCategory = () => {
    const newCat: CategoryRow = {
      id: `cat_${Date.now()}`,
      name: ''
    };
    setCategories(prev => [...prev, newCat]);
    triggerNotice('新增一条空白分类，请点击【修改】编辑其名称');
  };

  // Rename trigger
  const handleOpenRenameModal = (cat: CategoryRow) => {
    setRenamingCategory(cat);
    setRenameInputName(cat.name);
  };

  const handleSaveRename = () => {
    if (!renamingCategory) return;
    const trimmed = renameInputName.trim();
    setCategories(prev => prev.map(c => c.id === renamingCategory.id ? { ...c, name: trimmed } : c));
    triggerNotice(`分类名已成功修改为「${trimmed || '未命名'}」`);
    setRenamingCategory(null);
  };

  // Delete trigger
  const handleOpenDeleteModal = (cat: CategoryRow) => {
    setDeletingCategory(cat);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
    triggerNotice(`已成功删除分类「${deletingCategory.name || '未命名'}」`);
    setDeletingCategory(null);
  };

  // Drag and Drop implementation for safe reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
    // Visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Perform swap in categories array
    const cloned = [...categories];
    const targetItem = cloned[draggedIndex];
    cloned.splice(draggedIndex, 1);
    cloned.splice(index, 0, targetItem);
    
    setDraggedIndex(index);
    setCategories(cloned);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // Manual move keys (Fallbacks or alternate reordering)
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const cloned = [...categories];
    const temp = cloned[index];
    cloned[index] = cloned[targetIndex];
    cloned[targetIndex] = temp;
    setCategories(cloned);
    triggerNotice('已调整分类排布序列');
  };

  // --- BASEMAP DRAG AND DROP HANDLERS ---
  const handleBasemapDragStart = (e: React.DragEvent, groupIndex: number, itemIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBasemap({ groupIndex, itemIndex });
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleBasemapDragOver = (e: React.DragEvent, groupIndex: number, itemIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedBasemap) return;
    if (draggedBasemap.groupIndex !== groupIndex) return; // 只允许在同一组内拖拽
    if (draggedBasemap.itemIndex === itemIndex) return;

    // 重新排序缩略图
    const cloned = [...groups];
    const thumbnails = [...cloned[groupIndex].thumbnails];
    const [movedItem] = thumbnails.splice(draggedBasemap.itemIndex, 1);
    thumbnails.splice(itemIndex, 0, movedItem);
    cloned[groupIndex] = { ...cloned[groupIndex], thumbnails };
    saveGroups(cloned);

    setDraggedBasemap({ groupIndex, itemIndex });
  };

  const handleBasemapDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    if (draggedBasemap) {
      triggerNotice('底图顺序已调整');
    }
    setDraggedBasemap(null);
  };

  return (
    <div id="tab3-container" className="flex-1 flex flex-col min-h-0 bg-transparent text-[#443B43] scrollbar-thin overflow-y-auto space-y-6 pb-2">
      
      {/* Mini notification banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 bg-[#8B6F47] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wider shadow-lg flex items-center gap-2 z-40"
          >
            <Sparkles size={14} className="text-[#FFF2C5]" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden input for loading background file assets */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleGroupFileNameUpload}
        className="hidden"
      />

      {/* BLOCK 1: TOP BACKGROUND IMPORT SECTION */}
      <div id="settings-block-1" className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow relative decorative-corners">
        <div className="flex items-center justify-between border-b border-[#EEDFCA] pb-2 mb-3 select-none">
          <div className="flex items-center gap-2 text-[#8B6F47]">
            <span className="text-sm">✦</span>
            <h2 className="font-serif font-bold text-[#8B6F47] text-sm tracking-wider">
              底图配置
            </h2>
          </div>
          {/* New Group Button: Rounded Brown */}
          <button
            onClick={handleAddNewGroup}
            className="px-3 py-1.5 bg-[#8B6F47] hover:bg-[#6F5839] text-white text-xs font-bold rounded-full cursor-pointer transition-all hover:shadow-xs active:translate-y-0.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>新建分组</span>
          </button>
        </div>

        {/* List of groups */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs font-sans">
              未配置任何底图素材分组。点击右上角“新建分组”按钮开始。
            </div>
          ) : (
            groups.map((group, groupIdx) => (
              <div 
                key={group.id} 
                className="flex items-center gap-5 py-3 px-4 bg-white/40 hover:bg-white/70 rounded-xl transition-all"
              >
                {/* 1. Group name with bullet point - compact */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[#D4A574] font-bold text-base select-none leading-none">●</span>
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleRenameGroupInline(groupIdx, e.target.value)}
                    className="font-serif font-bold text-sm text-[#674b2d] bg-transparent hover:bg-white/90 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59F4A] rounded-md px-2 py-1 w-24 border border-transparent transition-all"
                    title="点击编辑分组名称"
                  />
                </div>

                {/* 2. Thumbnails in a tight horizontal row */}
                <div className="flex-1 flex items-center gap-3">
                  {/* Current thumbnails */}
                  <AnimatePresence>
                    {group.thumbnails.map((item, fileIdx) => (
                      <motion.div
                        key={`${group.id}_img_${fileIdx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <div
                          className="group relative flex flex-col items-center select-none cursor-move"
                          draggable
                          onDragStart={(e) => handleBasemapDragStart(e, groupIdx, fileIdx)}
                          onDragOver={(e) => handleBasemapDragOver(e, groupIdx, fileIdx)}
                          onDragEnd={handleBasemapDragEnd}
                        >
                        {/* Compact thumbnail */}
                        <div className="w-14 h-14 rounded-xl border-2 border-[#E5DEC4] hover:border-[#D4A574] overflow-hidden bg-white shadow-sm hover:shadow-md flex items-center justify-center p-1 transition-all">
                          <img
                            src={item.image}
                            alt="预览"
                            className="w-full h-full object-contain rounded-lg pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        {/* Color label below image - compact */}
                        {editingColor?.groupIndex === groupIdx && editingColor?.itemIndex === fileIdx ? (
                          <input
                            type="text"
                            value={colorInputValue}
                            onChange={(e) => setColorInputValue(e.target.value)}
                            onBlur={handleSaveColor}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveColor();
                              if (e.key === 'Escape') setEditingColor(null);
                            }}
                            className="mt-1 w-12 text-center text-[11px] font-bold text-[#8B6F47] bg-white border-2 border-[#C59F4A] rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#8B6F47]"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => handleStartEditColor(groupIdx, fileIdx)}
                            className="mt-1 text-[11px] font-bold text-[#8B6F47] hover:text-[#C59F4A] cursor-pointer transition-colors"
                            title="点击修改颜色标签"
                          >
                            {item.color}
                          </button>
                        )}
                        
                        {/* Compact delete button on hover */}
                        <button
                          onClick={() => handleRemoveAsset(groupIdx, fileIdx)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex w-5 h-5 bg-[#9E4A4A] text-white rounded-full items-center justify-center text-[10px] border border-white font-bold cursor-pointer hover:bg-red-700 shadow-sm transition-all hover:scale-110"
                          title="移除此素材"
                        >
                          ✕
                        </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Compact action buttons */}
                  <div className="flex items-center gap-2 ml-1">
                    {/* Add button - smaller and elegant */}
                    <button
                      onClick={() => triggerUploadForGroup(groupIdx)}
                      className="w-10 h-10 bg-[#D4A574] hover:bg-[#C69563] text-white font-bold flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-sm flex-shrink-0"
                      title="添加新底图素材"
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                    
                    {/* Delete group button - smaller and elegant */}
                    <button
                      onClick={() => handleDeleteGroup(groupIdx)}
                      className="w-10 h-10 bg-gray-50 hover:bg-[#9E4A4A] text-gray-400 hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 flex-shrink-0"
                      title="删除整个分组"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 清理缓存按钮区域 */}
      <div id="settings-block-cache" className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow relative decorative-corners">
        <div className="flex items-center justify-between border-b border-[#EEDFCA] pb-2 mb-3 select-none">
          <div className="flex items-center gap-2 text-[#8B6F47]">
            <span className="text-sm">✦</span>
            <h2 className="font-serif font-bold text-[#8B6F47] text-sm tracking-wider">
              缓存管理
            </h2>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-[#FFF8E7] border border-[#FFE0A3] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#FFA726] rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-[#8B6F47] mb-1">清理所有缓存数据</h3>
                <p className="text-[10px] text-[#674b2d] leading-relaxed mb-3">
                  清除 Tab1、Tab2、Tab5 的所有缓存数据（包括上传的图片和记录）。底图配置不会被清除。
                  <br />
                  <span className="text-[#D97706] font-bold">注意：此操作不可撤销，清理后需要刷新页面！</span>
                </p>
                <button
                  onClick={handleClearStorage}
                  className="px-4 py-2 bg-gradient-to-r from-[#FFA726] to-[#FB8C00] hover:from-[#FB8C00] hover:to-[#F57C00] text-white text-xs font-bold rounded-lg cursor-pointer transition-all hover:shadow-md flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  清理缓存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* RENAME MODAL DIALOG POPUP */}
      <AnimatePresence>
        {renamingCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl relative p-5 decorative-corners"
            >
              <h3 className="font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-2 mb-4 text-sm flex items-center gap-1.5 select-none">
                <span>✦</span> 修改分类名称
              </h3>
              
              <div className="space-y-3 mb-5">
                <label className="block text-[11px] font-bold text-gray-500 select-none">
                  分类名称：
                </label>
                <input
                  type="text"
                  value={renameInputName}
                  onChange={(e) => setRenameInputName(e.target.value)}
                  className="w-full bg-white border border-[#E5DEC4] rounded-lg px-3 py-2 text-xs text-[#674b2d] focus:outline-none focus:ring-1 focus:ring-[#8B6F47]"
                  placeholder="请输入分类名称..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setRenamingCategory(null);
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => setRenamingCategory(null)}
                  className="px-4 py-1.5 bg-[#443B43]/10 hover:bg-[#443B43]/20 text-[#443B43] font-bold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRename}
                  className="px-4 py-1.5 bg-[#8B6F47] hover:bg-[#6F5839] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  确认保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL DIALOG POPUP */}
      <AnimatePresence>
        {deletingCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl relative p-5 decorative-corners"
            >
              <h3 className="font-serif font-bold text-[#9E4A4A] border-b border-[#DFD2BD] pb-2 mb-4 text-sm flex items-center gap-1.5 select-none animate-pulse">
                <span>⚠️</span> 确认删除分类
              </h3>

              <div className="text-xs text-[#674b2d] leading-relaxed mb-6">
                您确定要彻底删除该分类吗？
                <div className="bg-[#FAF0ED] text-[#9E4A4A] border-l-2 border-[#9E4A4A] px-3 py-2.5 rounded-r-lg font-bold mt-2 font-serif">
                  {deletingCategory.name || <span className="italic">未命名空白条目</span>}
                </div>
                <div className="text-[10px] text-gray-400 mt-2">
                  * 此操作将立即生效（本地及持久缓存），删除后不可撤销，请务必再次核实。
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-1.5 bg-[#443B43]/10 hover:bg-[#443B43]/20 text-[#443B43] font-bold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-[#9E4A4A] hover:bg-[#B34A4A] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
