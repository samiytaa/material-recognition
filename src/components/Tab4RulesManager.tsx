import React, { useEffect, useMemo, useState } from 'react';
import { parseFileName, reloadRules } from '../types';
import { DeleteConfirmModal } from './tab4/DeleteConfirmModal';
import { NoticeBanner } from './tab4/NoticeBanner';
import { RulesDocsModal } from './tab4/RulesDocsModal';
import { RulesSummary } from './tab4/RulesSummary';
import { RulesTable } from './tab4/RulesTable';
import { RulesToolbar } from './tab4/RulesToolbar';
import { TestRuleModal } from './tab4/TestRuleModal';
import { TAB_CONFIGS } from './tab4/constants';
import { createDefaultRulesData, exportRulesData, importRulesData, readSavedRulesData } from './tab4/rulesData';
import type { EditingEntry, EditingRule, MappingEntry, MappingListType, MappingType, Notice, OwnershipRule, OwnershipValue, RulesData } from './tab4/types';

export default function Tab4RulesManager() {
  const [activeTab, setActiveTab] = useState<MappingType>('maleLeads');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [rulesData, setRulesData] = useState<RulesData>(() => readSavedRulesData());

  const [editingEntry, setEditingEntry] = useState<EditingEntry>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  const [editingRule, setEditingRule] = useState<EditingRule>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editOwnershipType, setEditOwnershipType] = useState<OwnershipValue>('none');
  const [editExtractFrom, setEditExtractFrom] = useState('segments');
  const [editAllowNone, setEditAllowNone] = useState(false);

  const [deletingEntry, setDeletingEntry] = useState<EditingEntry>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [testFileName, setTestFileName] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('customRulesData', JSON.stringify(rulesData));
    reloadRules();
  }, [rulesData]);

  const showNotice = (text: string, type: Notice['type'] = 'info') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const mappingList = (type: MappingType) => rulesData[type as MappingListType] as MappingEntry[];

  const handleTabChange = (type: MappingType) => {
    setActiveTab(type);
    setSearchKeyword('');
    setEditingEntry(null);
    setEditingRule(null);
  };

  const handleAdd = (type: MappingType) => {
    if (type === 'ownershipRules') {
      const newIndex = rulesData.ownershipRules.length;
      setRulesData((prev) => ({
        ...prev,
        ownershipRules: [...prev.ownershipRules, { category: '', defaultOwnership: 'none', extractFrom: 'segments', allowNone: false }],
      }));
      setEditingRule({ index: newIndex });
      setEditCategory('');
      setEditOwnershipType('none');
      setEditExtractFrom('segments');
      setEditAllowNone(false);
      showNotice('已添加空白归属规则，请填写内容', 'info');
      return;
    }

    const newIndex = mappingList(type).length;
    setRulesData((prev) => ({
      ...prev,
      [type]: [...prev[type as MappingListType], { key: '', value: '' }],
    }));
    setEditingEntry({ type, index: newIndex });
    setEditKey('');
    setEditValue('');
    showNotice('已添加空白条目，请填写内容', 'info');
  };

  const handleEdit = (type: MappingType, index: number) => {
    if (type === 'ownershipRules') {
      const rule = rulesData.ownershipRules[index];
      setEditingRule({ index });
      setEditCategory(rule.category);
      setEditOwnershipType(rule.defaultOwnership);
      setEditExtractFrom(rule.extractFrom);
      setEditAllowNone(rule.allowNone || false);
      return;
    }

    const entry = mappingList(type)[index];
    setEditingEntry({ type, index });
    setEditKey(entry.key);
    setEditValue(entry.value);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    const trimmedKey = editKey.trim();
    const trimmedValue = editValue.trim();
    if (!trimmedKey || !trimmedValue) {
      showNotice('键和值不能为空', 'error');
      return;
    }

    const { type, index } = editingEntry;
    const dataArray = mappingList(type);
    const hasDuplicate = dataArray.some((entry, entryIndex) => entryIndex !== index && entry.key === trimmedKey);
    if (hasDuplicate) {
      showNotice(`键「${trimmedKey}」已存在，请使用不同的键`, 'error');
      return;
    }

    setRulesData((prev) => ({
      ...prev,
      [type]: prev[type as MappingListType].map((entry, entryIndex) => (entryIndex === index ? { key: trimmedKey, value: trimmedValue } : entry)),
    }));
    setEditingEntry(null);
    showNotice('保存成功', 'success');
  };

  const handleSaveRuleEdit = () => {
    if (!editingRule) return;

    const trimmedCategory = editCategory.trim();
    if (!trimmedCategory) {
      showNotice('分类名称不能为空', 'error');
      return;
    }

    const { index } = editingRule;
    const hasDuplicate = rulesData.ownershipRules.some((rule, ruleIndex) => ruleIndex !== index && rule.category === trimmedCategory);
    if (hasDuplicate) {
      showNotice(`分类「${trimmedCategory}」已存在，请使用不同的分类名`, 'error');
      return;
    }

    setRulesData((prev) => ({
      ...prev,
      ownershipRules: prev.ownershipRules.map((rule, ruleIndex) =>
        ruleIndex === index
          ? { category: trimmedCategory, defaultOwnership: editOwnershipType, extractFrom: editExtractFrom, allowNone: editAllowNone }
          : rule,
      ),
    }));
    setEditingRule(null);
    showNotice('保存成功', 'success');
  };

  const handleCancelEdit = () => {
    if (editingEntry) {
      const { type, index } = editingEntry;
      const dataArray = mappingList(type);
      if (!dataArray[index].key && !dataArray[index].value) {
        setRulesData((prev) => ({ ...prev, [type]: dataArray.filter((_, entryIndex) => entryIndex !== index) }));
      }
      setEditingEntry(null);
      return;
    }

    if (editingRule) {
      const { index } = editingRule;
      if (!rulesData.ownershipRules[index].category) {
        setRulesData((prev) => ({ ...prev, ownershipRules: prev.ownershipRules.filter((_, ruleIndex) => ruleIndex !== index) }));
      }
      setEditingRule(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingEntry) return;

    const { type, index } = deletingEntry;
    if (type === 'ownershipRules') {
      const rule = rulesData.ownershipRules[index];
      setRulesData((prev) => ({ ...prev, ownershipRules: prev.ownershipRules.filter((_, ruleIndex) => ruleIndex !== index) }));
      showNotice(`已删除「${rule.category}」的归属规则`, 'success');
    } else {
      const entry = mappingList(type)[index];
      setRulesData((prev) => ({ ...prev, [type]: prev[type as MappingListType].filter((_, entryIndex) => entryIndex !== index) }));
      showNotice(`已删除「${entry.key} → ${entry.value}」`, 'success');
    }

    setDeletingEntry(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportRulesData(rulesData), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `allRulesConfig_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showNotice('所有规则已导出为 JSON 文件', 'success');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        setRulesData(importRulesData(JSON.parse(readerEvent.target?.result as string)));
        showNotice('规则已成功导入', 'success');
      } catch (error) {
        console.error('导入失败:', error);
        showNotice('导入失败：JSON 格式错误', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = () => {
    if (!confirm('确定要重置为默认规则吗？当前的自定义规则将被清空！')) return;
    setRulesData(createDefaultRulesData());
    showNotice('已重置为默认规则', 'success');
  };

  const handleTestRule = () => {
    if (!testFileName.trim()) {
      showNotice('请输入测试文件名', 'error');
      return;
    }

    try {
      setTestResult(parseFileName(testFileName));
      showNotice('解析成功', 'success');
    } catch (error) {
      showNotice(`解析失败: ${error}`, 'error');
      setTestResult(null);
    }
  };

  const filteredData = useMemo(() => {
    const currentData: Array<MappingEntry | OwnershipRule> = activeTab === 'ownershipRules' ? rulesData.ownershipRules : mappingList(activeTab);
    if (!searchKeyword.trim()) return currentData;

    const keyword = searchKeyword.toLowerCase();
    return currentData.filter((item) => {
      if (activeTab === 'ownershipRules') {
        const rule = item as OwnershipRule;
        return rule.category.toLowerCase().includes(keyword) || rule.defaultOwnership.toLowerCase().includes(keyword) || rule.extractFrom.toLowerCase().includes(keyword);
      }

      const entry = item as MappingEntry;
      return entry.key.toLowerCase().includes(keyword) || entry.value.toLowerCase().includes(keyword);
    });
  }, [activeTab, rulesData, searchKeyword]);

  const currentConfig = TAB_CONFIGS.find((config) => config.id === activeTab)!;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent">
      <NoticeBanner notice={notice} />

      <RulesToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onShowDocs={() => setShowDocsModal(true)}
        onShowTest={() => setShowTestModal(true)}
      />

      <RulesSummary
        config={currentConfig}
        searchKeyword={searchKeyword}
        filteredCount={filteredData.length}
        onSearchChange={setSearchKeyword}
        onAdd={() => handleAdd(activeTab)}
      />

      <RulesTable
        activeTab={activeTab}
        filteredData={filteredData}
        rulesData={rulesData}
        searchKeyword={searchKeyword}
        editingEntry={editingEntry}
        editingRule={editingRule}
        editKey={editKey}
        editValue={editValue}
        editCategory={editCategory}
        editOwnershipType={editOwnershipType}
        editExtractFrom={editExtractFrom}
        editAllowNone={editAllowNone}
        onEditKeyChange={setEditKey}
        onEditValueChange={setEditValue}
        onEditCategoryChange={setEditCategory}
        onEditOwnershipTypeChange={setEditOwnershipType}
        onEditExtractFromChange={setEditExtractFrom}
        onEditAllowNoneChange={setEditAllowNone}
        onEdit={handleEdit}
        onDelete={(type, index) => setDeletingEntry({ type, index })}
        onSaveEdit={handleSaveEdit}
        onSaveRuleEdit={handleSaveRuleEdit}
        onCancelEdit={handleCancelEdit}
      />

      <DeleteConfirmModal deletingEntry={deletingEntry} rulesData={rulesData} onCancel={() => setDeletingEntry(null)} onConfirm={handleConfirmDelete} />
      <RulesDocsModal open={showDocsModal} onClose={() => setShowDocsModal(false)} />
      <TestRuleModal
        open={showTestModal}
        testFileName={testFileName}
        testResult={testResult}
        onClose={() => setShowTestModal(false)}
        onFileNameChange={setTestFileName}
        onTest={handleTestRule}
      />
    </div>
  );
}
