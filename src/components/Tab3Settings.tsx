import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, HelpCircle, Save, Info, Sparkles, Upload } from 'lucide-react';

// Design pre-seeded SVGs for background maps to make it look extremely premium
const PRESEEDED_PROPS_SVG = [
  // 1. Traditional Red-Gold Border (Golden Chinese clouds)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%238E2C2C"/><stop offset="85%" stop-color="%23561A1A"/><stop offset="100%" stop-color="%233A1010"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg1)" stroke="%23D4AF37" stroke-width="4"/><circle cx="50" cy="50" r="41" fill="none" stroke="%23D5C5A3" stroke-width="1" stroke-dasharray="3,3"/><path d="M 35 50 Q 42 45 50 50 Q 58 55 65 50" stroke="%23D4AF37" stroke-width="1.5" fill="none" opacity="0.6"/><path d="M 40 55 Q 50 48 60 55" stroke="%23D4AF37" stroke-dasharray="2,2" fill="none" opacity="0.4"/><circle cx="50" cy="50" r="10" fill="none" stroke="%23D4AF37" stroke-width="0.5" opacity="0.5"/></svg>`,
  // 2. Pure Jade Frame (Emerald border with radial gradient)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23EBF5F0"/><stop offset="70%" stop-color="%23C2DFD2"/><stop offset="100%" stop-color="%234A9B7A"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg2)" stroke="%231E5B42" stroke-width="3.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="%23ffffff" stroke-width="1.5" opacity="0.7"/><circle cx="50" cy="50" r="34" fill="none" stroke="%231E5B42" stroke-width="1" stroke-dasharray="5,2" opacity="0.4"/><path d="M 50 20 L 50 80 M 20 50 L 80 50" stroke="%231E5B42" stroke-width="0.5" opacity="0.2"/></svg>`,
  // 3. Golden Fortune Cloud Border
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%232E1A47"/><stop offset="85%" stop-color="%231E0F30"/><stop offset="100%" stop-color="%230F071A"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg3)" stroke="%23D4AF37" stroke-width="4"/><path d="M 45 42 C 40 40, 40 50, 48 48 C 50 48, 52 44, 48 42 Z M 52 58 C 45 58, 45 52, 54 54 Q 58 55, 52 58 Z" fill="%23D4AF37" opacity="0.7"/><circle cx="50" cy="50" r="38" fill="none" stroke="%23A67C33" stroke-width="1" opacity="0.5"/></svg>`
];

const PRESEEDED_AVATARS_SVG = [
  // 1. Imperial Jade Ring
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg4" cx="50%" cy="50%" r="50%"><stop offset="70%" stop-color="%23E8F5E9"/><stop offset="100%" stop-color="%232E7D32"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg4)" stroke="%232E7D32" stroke-width="5"/><circle cx="50" cy="50" r="38" fill="none" stroke="%23A67C33" stroke-width="2" stroke-dasharray="10,4"/><polygon points="50,20 54,34 68,34 57,42 61,56 50,48 39,56 43,42 32,34 46,34" fill="%23D4AF37" opacity="0.2"/></svg>`,
  // 2. Peony Crimson Ring
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg5" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23FAEAEE"/><stop offset="80%" stop-color="%23E8B2C0"/><stop offset="100%" stop-color="%23C2185B"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg5)" stroke="%23880E4F" stroke-width="4"/><circle cx="50" cy="50" r="39" fill="none" stroke="%23C2185B" stroke-width="1.5" stroke-dasharray="2,2"/><path d="M 50 25 Q 52 35 60 30 Q 55 40 65 42 Q 53 43 50 55" stroke="%23880E4F" stroke-width="0.8" fill="none" opacity="0.5"/></svg>`,
  // 3. Sky Azure Coin Frame
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="rg6" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23E0F2F1"/><stop offset="90%" stop-color="%234DB6AC"/><stop offset="100%" stop-color="%2300695C"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23rg6)" stroke="%23004D40" stroke-width="4"/><rect x="36" y="36" width="28" height="28" fill="none" stroke="%23004D40" stroke-width="2.5" rx="2" opacity="0.8"/><circle cx="50" cy="50" r="40" fill="none" stroke="%23ffffff" stroke-width="1" opacity="0.4"/></svg>`
];

interface MapGroup {
  id: string;
  name: string;
  thumbnails: string[];
}

interface CategoryRow {
  id: string;
  name: string;
}

export default function Tab3Settings() {
  // --- STATE FOR SECTION 1: MAP GROUPS ---
  const [groups, setGroups] = useState<MapGroup[]>(() => {
    const saved = localStorage.getItem('tab3_groups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'group_prop', name: '道具底', thumbnails: [...PRESEEDED_PROPS_SVG] },
      { id: 'group_avatar', name: '头像底', thumbnails: [...PRESEEDED_AVATARS_SVG] }
    ];
  });

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

  // --- LOCAL PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('tab3_groups', JSON.stringify(groups));
  }, [groups]);

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

  // --- STATE FOR DRAG REORDERING ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- NOTIFICATION FEEDBACK ---
  const [notice, setNotice] = useState<string | null>(null);
  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice(null);
    }, 2500);
  };

  // --- HANDLERS FOR SECTION 1 (MAP GROUPS) ---
  const handleAddNewGroup = () => {
    const newGroup: MapGroup = {
      id: `group_${Date.now()}`,
      name: 'xxxx',
      thumbnails: []
    };
    setGroups(prev => [...prev, newGroup]);
    triggerNotice('已成功创建新分组 ·xxxx');
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
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        triggerNotice('仅支持导入图片底图素材！');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setGroups(prev => {
          const cloned = [...prev];
          cloned[targetGroupIndex] = {
            ...cloned[targetGroupIndex],
            thumbnails: [...cloned[targetGroupIndex].thumbnails, dataUrl]
          };
          return cloned;
        });
        triggerNotice(`成功导入素材到「·${groups[targetGroupIndex].name}」`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Rename Group name inline
  const handleRenameGroupInline = (index: number, newName: string) => {
    setGroups(prev => {
      const cloned = [...prev];
      cloned[index] = { ...cloned[index], name: newName };
      return cloned;
    });
  };

  // Delete an entire Map Group
  const handleDeleteGroup = (index: number) => {
    if (confirm(`确定要删除底图分组「·${groups[index].name}」吗？`)) {
      setGroups(prev => prev.filter((_, idx) => idx !== index));
      triggerNotice('底图分组已成功移除');
    }
  };

  // Remove a single asset in thumbnails
  const handleRemoveAsset = (groupIndex: number, assetIndex: number) => {
    setGroups(prev => {
      const cloned = [...prev];
      const thumbs = [...cloned[groupIndex].thumbnails];
      thumbs.splice(assetIndex, 1);
      cloned[groupIndex] = { ...cloned[groupIndex], thumbnails: thumbs };
      return cloned;
    });
    triggerNotice('素材圆片已移除');
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

  return (
    <div id="tab3-container" className="flex-1 flex flex-col min-h-0 bg-transparent text-[#443B43] scrollbar-thin overflow-y-auto space-y-6 pb-2">
      
      {/* Mini notification banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 bg-[#4A9B7A] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wider shadow-lg flex items-center gap-2 z-40"
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
      <div id="settings-block-1" className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-5 md:p-6 shadow-xs traditional-shadow relative decorative-corners">
        <div className="flex items-center justify-between border-b border-[#EEDFCA] pb-3 mb-4 select-none">
          <div className="flex items-center gap-2 text-[#4A9B7A]">
            <span className="text-sm">✦</span>
            <h2 className="font-serif font-bold text-[#4A9B7A] text-sm md:text-base tracking-wider">
              底图导入/分类
            </h2>
          </div>
          {/* New Group Button: Rounded Green */}
          <button
            onClick={handleAddNewGroup}
            className="px-4 py-1.5 bg-[#4A9B7A] hover:bg-[#3E8569] text-white text-xs font-bold rounded-full cursor-pointer transition-all hover:shadow-xs active:translate-y-0.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>新建分组</span>
          </button>
        </div>

        {/* List of groups */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs font-sans">
              未配置任何底图素材分组。点击右上角“新建分组”按钮开始。
            </div>
          ) : (
            groups.map((group, groupIdx) => (
              <div 
                key={group.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dashed border-[#F3EFE9] pb-4 last:border-0 last:pb-0 gap-3"
              >
                {/* 1. Group info (Prefix Dot · Name) */}
                <div className="flex items-center gap-2 flex-shrink-0 min-w-[124px]">
                  <span className="text-amber-600 font-bold text-sm select-none">·</span>
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleRenameGroupInline(groupIdx, e.target.value)}
                    className="font-serif font-bold text-xs text-[#674b2d] bg-transparent hover:bg-white/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59F4A] rounded px-1.5 py-0.5 w-24 border border-transparent transition-colors"
                    title="双击或点击即可重命名分组名"
                  />
                  
                  {/* Option to delete group if custom added */}
                  <button
                    onClick={() => handleDeleteGroup(groupIdx)}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-[#9E4A4A] rounded transition-colors cursor-pointer"
                    title="删除整条分组"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* 2. Horizontal circular asset thumbnails list + plus key */}
                <div className="flex-1 flex flex-wrap items-center gap-2.5">
                  {/* Current thumbnails */}
                  <AnimatePresence>
                    {group.thumbnails.map((item, fileIdx) => (
                      <motion.div
                        key={`${group.id}_img_${fileIdx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative w-10 h-10 select-none"
                      >
                        {/* Square thumbnail container with rounded corners */}
                        <div className="w-10 h-10 rounded-lg border border-[#D5C5A3]/50 overflow-hidden bg-white/70 shadow-xs flex items-center justify-center p-0.5">
                          <img
                            src={item}
                            alt="预览"
                            className="w-full h-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {/* Float delete tag on hover */}
                        <button
                          onClick={() => handleRemoveAsset(groupIdx, fileIdx)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex w-4.5 h-4.5 bg-[#9E4A4A] text-white rounded-full items-center justify-center text-[8px] border border-white font-bold cursor-pointer hover:bg-red-700 shadow-sm transition-all"
                          title="移除此素材体"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Rightmost: Light brown circular plus button */}
                  <button
                    onClick={() => triggerUploadForGroup(groupIdx)}
                    className="w-8 h-8 bg-[#D4A574] hover:bg-[#C69563] text-white font-bold flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border border-[#B88E5A]/20 flex-shrink-0"
                    title="点击加号导入新底图素材到当前队列末端"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BLOCK 2: MIDDLE CATEGORIES MANAGEMENT */}
      <div id="settings-block-2" className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-5 md:p-6 shadow-xs traditional-shadow relative decorative-corners flex flex-col justify-between">
        <div className="flex items-center gap-2 border-b border-[#EEDFCA] pb-3 mb-4 select-none">
          <span className="text-sm text-[#4A9B7A]">✦</span>
          <h2 className="font-serif font-bold text-[#4A9B7A] text-sm md:text-base tracking-wider">
            分类
          </h2>
        </div>

        {/* Categories drag-and-drop vertical table row layout */}
        <div className="space-y-3 mb-5">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              无任何预设类别，请使用下方“+”号按钮添加新的分类条目。
            </div>
          ) : (
            categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                layoutId={cat.id}
                className="flex items-center gap-3"
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
              >
                {/* 2.1. Left custom styled wide green input/display tag bar */}
                <div className="flex-1 min-w-0 flex items-center bg-[#EBF5F0] border border-[#4A9B7A]/40 rounded-full px-5 py-2 hover:bg-[#E4F2EB] transition-colors shadow-xs">
                  {/* Subtle drag handle representation */}
                  <div className="mr-3 cursor-grab text-[#4A9B7A]/50 select-none hidden sm:block text-xs font-mono" title="可以上下拖拽分类条目进行排序">
                    ☰
                  </div>
                  <span className="text-xs font-serif font-bold text-[#346F54] tracking-wide truncate">
                    {cat.name || <span className="text-gray-400 font-sans font-normal italic">点击右侧“修改”键编辑名称</span>}
                  </span>
                </div>

                {/* 2.2. Right action buttons styled in green rounded pill set */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Modify Button */}
                  <button
                    onClick={() => handleOpenRenameModal(cat)}
                    className="px-3 py-1.5 bg-[#4A9B7A]/10 hover:bg-[#4A9B7A]/25 text-[#346F54] text-xs font-bold rounded-full cursor-pointer transition-all flex items-center gap-1 border border-[#4A9B7A]/20"
                    title="修改本类别名称"
                  >
                    <Edit3 size={11} />
                    <span className="hidden xs:inline">修改</span>
                  </button>

                  {/* Reorder arrows and indicator (Move Button) */}
                  <div className="flex items-center bg-[#4A9B7A]/10 rounded-full border border-[#4A9B7A]/20 p-0.5">
                    <button
                      onClick={() => handleMoveCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-[#346F54] hover:bg-[#4A9B7A]/20 disabled:opacity-20 disabled:pointer-events-none rounded-full transition-colors cursor-pointer"
                      title="向上移动"
                    >
                      <ArrowUp size={11} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 text-[#346F54] hover:bg-[#4A9B7A]/20 disabled:opacity-20 disabled:pointer-events-none rounded-full transition-colors cursor-pointer"
                      title="向下移动"
                    >
                      <ArrowDown size={11} strokeWidth={2.5} />
                    </button>
                    <div 
                      className="px-1.5 text-[10px] text-[#346F54] font-bold select-none cursor-grab"
                      title="按住此区块或点击排序"
                    >
                      移动
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleOpenDeleteModal(cat)}
                    className="px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/25 text-[#9E4A4A] text-xs font-bold rounded-full cursor-pointer transition-all flex items-center gap-1 border border-[#9E4A4A]/20"
                    title="删除此分类条目"
                  >
                    <Trash2 size={11} />
                    <span className="hidden xs:inline">删除</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 2.3. Area bottom center: Light brown circular plus button */}
        <div className="flex justify-center select-none pt-2">
          <button
            onClick={handleAddNewCategory}
            className="w-9 h-9 bg-[#D4A574] hover:bg-[#C69563] text-white font-bold flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border border-[#B88E5A]/20"
            title="点击加号新增一条空白分类条目"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* BLOCK 3: BOTTOM STATIC SHORTCUTS KEYBOARD LIST */}
      <div id="settings-block-3" className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-5 md:p-6 shadow-xs traditional-shadow relative decorative-corners">
        <div className="flex items-center gap-2 border-b border-[#EEDFCA] pb-3 mb-4 select-none">
          <span className="text-sm text-[#4A9B7A]">✦</span>
          <h2 className="font-serif font-bold text-[#4A9B7A] text-sm md:text-base tracking-wider">
            快捷键
          </h2>
        </div>

        {/* Pure static documentation layout styled in 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-[#674b2d] divide-y md:divide-y-0 md:divide-x divide-[#EEDFCA]/50 select-none">
          
          {/* Column 1 */}
          <div className="flex flex-col justify-center items-center py-2 md:py-0 md:px-4">
            <span className="font-bold text-[#A67C33] tracking-wider mb-1.5">【保存】</span>
            <span className="font-mono bg-white shadow-inner border border-[#E6DEC4] rounded-lg px-2.5 py-1 text-amber-800 text-[11px] font-bold">
              CTRL + S
            </span>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col justify-center items-center py-2 md:py-0 md:px-4 text-center">
            <span className="font-bold text-[#A67C33] tracking-wider mb-1.5">【撤回】</span>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono bg-white shadow-inner border border-[#E6DEC4] rounded-lg px-2.5 py-1 text-amber-800 text-[11px] font-bold">
                CTRL + Z
              </span>
              <span className="text-[10px] text-gray-400 italic">
                （其他的暂时不需要感觉）
              </span>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col justify-center items-center py-2 md:py-0 md:px-4">
            <span className="font-bold text-[#A67C33] tracking-wider mb-1.5">【截图】</span>
            <span className="font-mono bg-white shadow-inner border border-[#E6DEC4] rounded-lg px-2.5 py-1 text-amber-800 text-[11px] font-bold">
              F1
            </span>
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
                  className="w-full bg-white border border-[#E5DEC4] rounded-lg px-3 py-2 text-xs text-[#674b2d] focus:outline-none focus:ring-1 focus:ring-[#4A9B7A]"
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
                  className="px-4 py-1.5 bg-[#4A9B7A] hover:bg-[#3E8569] text-white font-bold rounded-lg cursor-pointer shadow-xs"
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
