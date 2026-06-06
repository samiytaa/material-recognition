import { Edit3, Globe, Save, Settings, Trash2, User, Users, X } from 'lucide-react';
import { EXTRACT_FROM_OPTIONS, FURNITURE_CATEGORY_OPTIONS, OWNERSHIP_TYPE_OPTIONS } from './constants';
import type { EditingEntry, EditingRule, FurnitureCategoryType, FurnitureMappingEntry, MappingEntry, MappingListType, MappingType, OwnershipRule, OwnershipValue, RulesData } from './types';

interface RulesTableProps {
  activeTab: MappingType;
  filteredData: Array<MappingEntry | OwnershipRule | FurnitureMappingEntry>;
  rulesData: RulesData;
  searchKeyword: string;
  editingEntry: EditingEntry;
  editingRule: EditingRule;
  editKey: string;
  editValue: string;
  editFurnitureCategoryType: FurnitureCategoryType;
  editCategory: string;
  editOwnershipType: OwnershipValue;
  editExtractFrom: string;
  editAllowNone: boolean;
  onEditKeyChange: (value: string) => void;
  onEditValueChange: (value: string) => void;
  onEditFurnitureCategoryTypeChange: (value: FurnitureCategoryType) => void;
  onEditCategoryChange: (value: string) => void;
  onEditOwnershipTypeChange: (value: OwnershipValue) => void;
  onEditExtractFromChange: (value: string) => void;
  onEditAllowNoneChange: (value: boolean) => void;
  onEdit: (type: MappingType, index: number) => void;
  onDelete: (type: MappingType, index: number) => void;
  onSaveEdit: () => void;
  onSaveRuleEdit: () => void;
  onCancelEdit: () => void;
}

export function RulesTable(props: RulesTableProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white border border-[#E9DFD0] rounded-xl shadow-xs">
      {props.activeTab === 'ownershipRules'
        ? <OwnershipRulesTable {...props} />
        : props.activeTab === 'furnitureCats'
        ? <FurnitureMappingRulesTable {...props} />
        : <MappingRulesTable {...props} activeTab={props.activeTab as MappingListType} />}
    </div>
  );
}

function OwnershipRulesTable({
  filteredData,
  rulesData,
  searchKeyword,
  editingRule,
  editCategory,
  editOwnershipType,
  editExtractFrom,
  editAllowNone,
  onEditCategoryChange,
  onEditOwnershipTypeChange,
  onEditExtractFromChange,
  onEditAllowNoneChange,
  onEdit,
  onDelete,
  onSaveRuleEdit,
  onCancelEdit,
}: RulesTableProps) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-[#FAF8F5] border-b border-[#E9DFD0] sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[25%]">分类名称</th>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[20%]">归属类型</th>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[25%]">提取方式</th>
          <th className="px-4 py-3 text-center font-bold text-[#674b2d] w-[15%]">允许无归属</th>
          <th className="px-4 py-3 text-center font-bold text-[#674b2d] w-[15%]">操作</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
              {searchKeyword ? '未找到匹配的规则' : '暂无数据，点击右上角"新增"按钮添加'}
            </td>
          </tr>
        ) : (
          (filteredData as OwnershipRule[]).map((rule) => {
            const realIdx = rulesData.ownershipRules.findIndex((entry) => entry === rule);
            const isEditing = editingRule?.index === realIdx;

            return (
              <tr key={`rule_${realIdx}`} className="border-b border-[#F5F0E8] hover:bg-[#FFFEF8] transition-colors">
                {isEditing ? (
                  <EditableOwnershipRow
                    editCategory={editCategory}
                    editOwnershipType={editOwnershipType}
                    editExtractFrom={editExtractFrom}
                    editAllowNone={editAllowNone}
                    onEditCategoryChange={onEditCategoryChange}
                    onEditOwnershipTypeChange={onEditOwnershipTypeChange}
                    onEditExtractFromChange={onEditExtractFromChange}
                    onEditAllowNoneChange={onEditAllowNoneChange}
                    onSaveRuleEdit={onSaveRuleEdit}
                    onCancelEdit={onCancelEdit}
                  />
                ) : (
                  <ReadonlyOwnershipRow rule={rule} realIdx={realIdx} onEdit={onEdit} onDelete={onDelete} />
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function EditableOwnershipRow({
  editCategory,
  editOwnershipType,
  editExtractFrom,
  editAllowNone,
  onEditCategoryChange,
  onEditOwnershipTypeChange,
  onEditExtractFromChange,
  onEditAllowNoneChange,
  onSaveRuleEdit,
  onCancelEdit,
}: Pick<RulesTableProps, 'editCategory' | 'editOwnershipType' | 'editExtractFrom' | 'editAllowNone' | 'onEditCategoryChange' | 'onEditOwnershipTypeChange' | 'onEditExtractFromChange' | 'onEditAllowNoneChange' | 'onSaveRuleEdit' | 'onCancelEdit'>) {
  return (
    <>
      <td className="px-4 py-2">
        <input type="text" value={editCategory} onChange={(event) => onEditCategoryChange(event.target.value)} className="w-full px-2 py-1 border border-[#7B68EE] rounded focus:outline-none focus:ring-1 focus:ring-[#7B68EE] text-xs" placeholder="输入分类名称..." autoFocus />
      </td>
      <td className="px-4 py-2">
        <select value={editOwnershipType} onChange={(event) => onEditOwnershipTypeChange(event.target.value as OwnershipValue)} className="w-full px-2 py-1 border border-[#7B68EE] rounded focus:outline-none focus:ring-1 focus:ring-[#7B68EE] text-xs">
          {OWNERSHIP_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select value={editExtractFrom} onChange={(event) => onEditExtractFromChange(event.target.value)} className="w-full px-2 py-1 border border-[#7B68EE] rounded focus:outline-none focus:ring-1 focus:ring-[#7B68EE] text-xs">
          {EXTRACT_FROM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 text-center">
        <input type="checkbox" checked={editAllowNone} onChange={(event) => onEditAllowNoneChange(event.target.checked)} className="w-4 h-4 cursor-pointer" />
      </td>
      <td className="px-4 py-2">
        <EditActions saveClassName="bg-[#7B68EE] hover:bg-[#6A5ACD]" onSave={onSaveRuleEdit} onCancel={onCancelEdit} />
      </td>
    </>
  );
}

function ReadonlyOwnershipRow({ rule, realIdx, onEdit, onDelete }: { rule: OwnershipRule; realIdx: number; onEdit: RulesTableProps['onEdit']; onDelete: RulesTableProps['onDelete'] }) {
  const ownershipOption = OWNERSHIP_TYPE_OPTIONS.find((option) => option.value === rule.defaultOwnership);

  return (
    <>
      <td className="px-4 py-2 font-semibold text-[#674b2d]">{rule.category || <span className="text-gray-300 italic">（空）</span>}</td>
      <td className="px-4 py-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white inline-flex items-center gap-1" style={{ backgroundColor: ownershipOption?.color }}>
          {rule.defaultOwnership === 'male_lead' && <User size={10} />}
          {rule.defaultOwnership === 'spy' && <Users size={10} />}
          {rule.defaultOwnership === 'none' && <Globe size={10} />}
          {rule.defaultOwnership === 'mixed' && <Settings size={10} />}
          {ownershipOption?.label}
        </span>
      </td>
      <td className="px-4 py-2 font-mono text-xs text-[#443B43]">
        {EXTRACT_FROM_OPTIONS.find((option) => option.value === rule.extractFrom)?.label || rule.extractFrom}
      </td>
      <td className="px-4 py-2 text-center">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.allowNone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{rule.allowNone ? '是' : '否'}</span>
      </td>
      <td className="px-4 py-2">
        <RowActions editClassName="bg-[#7B68EE]/10 hover:bg-[#7B68EE]/20 text-[#6A5ACD]" onEdit={() => onEdit('ownershipRules', realIdx)} onDelete={() => onDelete('ownershipRules', realIdx)} />
      </td>
    </>
  );
}

function MappingRulesTable(props: RulesTableProps & { activeTab: MappingListType }) {
  const dataArray = props.rulesData[props.activeTab];

  return (
    <table className="w-full text-xs">
      <thead className="bg-[#FAF8F5] border-b border-[#E9DFD0] sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[40%]">键（拼音/代码）</th>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[40%]">值（中文名）</th>
          <th className="px-4 py-3 text-center font-bold text-[#674b2d] w-[20%]">操作</th>
        </tr>
      </thead>
      <tbody>
        {props.filteredData.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
              {props.searchKeyword ? '未找到匹配的条目' : '暂无数据，点击右上角"新增"按钮添加'}
            </td>
          </tr>
        ) : (
          (props.filteredData as MappingEntry[]).map((entry) => {
            const realIdx = dataArray.findIndex((item) => item === entry);
            const isEditing = props.editingEntry?.type === props.activeTab && props.editingEntry.index === realIdx;

            return (
              <tr key={`${props.activeTab}_${realIdx}`} className="border-b border-[#F5F0E8] hover:bg-[#FFFEF8] transition-colors">
                {isEditing ? <EditableMappingRow {...props} /> : <ReadonlyMappingRow activeTab={props.activeTab} entry={entry} realIdx={realIdx} onEdit={props.onEdit} onDelete={props.onDelete} />}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function FurnitureMappingRulesTable(props: RulesTableProps) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-[#FAF8F5] border-b border-[#E9DFD0] sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[22%]">分类类型</th>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[30%]">键（代码）</th>
          <th className="px-4 py-3 text-left font-bold text-[#674b2d] w-[32%]">值（分类名）</th>
          <th className="px-4 py-3 text-center font-bold text-[#674b2d] w-[16%]">操作</th>
        </tr>
      </thead>
      <tbody>
        {props.filteredData.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
              {props.searchKeyword ? '未找到匹配的条目' : '暂无数据，点击右上角"新增"按钮添加'}
            </td>
          </tr>
        ) : (
          (props.filteredData as FurnitureMappingEntry[]).map((entry, displayIndex) => {
            const isEditing = props.editingEntry?.type === entry.categoryType && props.editingEntry.index === entry.sourceIndex;

            return (
              <tr key={`${entry.categoryType}_${entry.sourceIndex}_${displayIndex}`} className="border-b border-[#F5F0E8] hover:bg-[#FFFEF8] transition-colors">
                {isEditing ? <EditableMappingRow {...props} showCategoryType /> : <ReadonlyFurnitureMappingRow entry={entry} displayIndex={displayIndex} onEdit={props.onEdit} onDelete={props.onDelete} />}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function EditableMappingRow({
  editKey,
  editValue,
  editFurnitureCategoryType,
  onEditKeyChange,
  onEditValueChange,
  onEditFurnitureCategoryTypeChange,
  onSaveEdit,
  onCancelEdit,
  showCategoryType = false,
}: RulesTableProps & { showCategoryType?: boolean }) {
  return (
    <>
      {showCategoryType && (
        <td className="px-4 py-2">
          <select
            value={editFurnitureCategoryType}
            onChange={(event) => onEditFurnitureCategoryTypeChange(event.target.value as FurnitureCategoryType)}
            className="w-full px-2 py-1 border border-[#C59F4A] rounded focus:outline-none focus:ring-1 focus:ring-[#C59F4A] text-xs"
          >
            {FURNITURE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </td>
      )}
      <td className="px-4 py-2">
        <input type="text" value={editKey} onChange={(event) => onEditKeyChange(event.target.value)} className="w-full px-2 py-1 border border-[#C59F4A] rounded focus:outline-none focus:ring-1 focus:ring-[#C59F4A] font-mono" placeholder="输入键..." autoFocus />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={editValue}
          onChange={(event) => onEditValueChange(event.target.value)}
          className="w-full px-2 py-1 border border-[#C59F4A] rounded focus:outline-none focus:ring-1 focus:ring-[#C59F4A]"
          placeholder="输入值..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSaveEdit();
            if (event.key === 'Escape') onCancelEdit();
          }}
        />
      </td>
      <td className="px-4 py-2">
        <EditActions saveClassName="bg-[#8B6F47] hover:bg-[#6F5839]" onSave={onSaveEdit} onCancel={onCancelEdit} />
      </td>
    </>
  );
}

function ReadonlyFurnitureMappingRow({ entry, displayIndex, onEdit, onDelete }: { entry: FurnitureMappingEntry; displayIndex: number; onEdit: RulesTableProps['onEdit']; onDelete: RulesTableProps['onDelete'] }) {
  const option = FURNITURE_CATEGORY_OPTIONS.find((item) => item.value === entry.categoryType);

  return (
    <>
      <td className="px-4 py-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white inline-flex items-center" style={{ backgroundColor: option?.color }}>
          {option?.label}
        </span>
      </td>
      <td className="px-4 py-2 font-mono text-[#674b2d]">{entry.key || <span className="text-gray-300 italic">（空）</span>}</td>
      <td className="px-4 py-2 text-[#443B43]">{entry.value || <span className="text-gray-300 italic">（空）</span>}</td>
      <td className="px-4 py-2">
        <RowActions editClassName="bg-[#C59F4A]/10 hover:bg-[#C59F4A]/20 text-[#A67020]" onEdit={() => onEdit('furnitureCats', displayIndex)} onDelete={() => onDelete(entry.categoryType, entry.sourceIndex)} />
      </td>
    </>
  );
}

function ReadonlyMappingRow({ activeTab, entry, realIdx, onEdit, onDelete }: { activeTab: MappingType; entry: MappingEntry; realIdx: number; onEdit: RulesTableProps['onEdit']; onDelete: RulesTableProps['onDelete'] }) {
  return (
    <>
      <td className="px-4 py-2 font-mono text-[#674b2d]">{entry.key || <span className="text-gray-300 italic">（空）</span>}</td>
      <td className="px-4 py-2 text-[#443B43]">{entry.value || <span className="text-gray-300 italic">（空）</span>}</td>
      <td className="px-4 py-2">
        <RowActions editClassName="bg-[#C59F4A]/10 hover:bg-[#C59F4A]/20 text-[#A67020]" onEdit={() => onEdit(activeTab, realIdx)} onDelete={() => onDelete(activeTab, realIdx)} />
      </td>
    </>
  );
}

function EditActions({ saveClassName, onSave, onCancel }: { saveClassName: string; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={onSave} className={`px-3 py-1 text-white rounded-md font-semibold transition-all ${saveClassName}`}><Save size={12} /></button>
      <button onClick={onCancel} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md font-semibold transition-all"><X size={12} /></button>
    </div>
  );
}

function RowActions({ editClassName, onEdit, onDelete }: { editClassName: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={onEdit} className={`px-2 py-1 rounded transition-all ${editClassName}`} title="编辑"><Edit3 size={12} /></button>
      <button onClick={onDelete} className="px-2 py-1 bg-[#D86B6B]/10 hover:bg-[#D86B6B]/20 text-[#9E4A4A] rounded transition-all" title="删除"><Trash2 size={12} /></button>
    </div>
  );
}
