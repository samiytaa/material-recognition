# Tab2 数据结构更新说明

## 更新时间
2026-06-06

## 更新内容

### 1. 数据结构变更

#### 原数据结构
```typescript
export interface RecordRow {
  id: number;
  originalImage: string | null;
  screenshot: string | null;
  propName: string;
  baseColor: string;
  category: string;  // ← 旧：单一分类字段
  previewWithBase: string | null;
  outputName: string;
}
```

#### 新数据结构
```typescript
export interface RecordRow {
  id: number;
  originalImage: string | null;
  screenshot: string | null;
  propName: string;
  baseColor: string;
  // 新增三列：类型、分类、相关（从Tab1数据同步，前端不可修改）
  propType: string;       // 道具类型（如：其他道具、家具等）
  propCategory: string;   // 道具分类（如：初见日道具、密探头像等）
  propRelated: string;    // 相关角色（如：男主-刘辩、密探-孙辅、无）
  previewWithBase: string | null;
  outputName: string;
}
```

### 2. Tab1 导入逻辑更新

#### 数据生成规则
从 Tab1 解析的道具数据中提取以下信息：

- **propType**: 根据 `prop.type` 字段
  - `furniture` → "家具"
  - 其他 → "其他道具"

- **propCategory**: 直接使用 `prop.category`
  - 示例：初见日道具、密探头像、男主互动道具等

- **propRelated**: 根据 `prop.ownership` 字段
  - `type === 'male_lead'` → "男主-{name}"
  - `type === 'spy'` → "密探-{name}"
  - `type === 'none'` → "无"

#### 导入接口
```typescript
onImportToTab2?: (images: Array<{ 
  image: string; 
  name: string; 
  fileName: string; 
  propType: string;      // 新增
  propCategory: string;  // 新增
  propRelated: string;   // 新增
}>) => void;
```

### 3. Tab2 表格结构更新

#### 表头变更
| 旧表头 | 新表头 |
|--------|--------|
| 道具icon | 道具icon |
| 游戏截图 | 游戏截图 |
| 道具名 | 道具名 |
| 底色 | 底色 |
| **分类** | **类型**（新） |
| - | **分类**（新） |
| - | **相关**（新） |
| 加底预览 | 加底预览 |
| 输出名称 | 输出名称 |

#### 列特性
- **类型**、**分类**、**相关** 三列：
  - 只读显示（灰色背景）
  - 数据来源于 Tab1 解析结果
  - 前端不可编辑
  - 在 AI 识别时保持不变

### 4. 功能影响

#### 受影响的功能
1. **Tab1 导入到 Tab2**
   - ✅ 已更新，新增三列数据传递

2. **AI 一键识别**
   - ✅ 已更新，识别后保持类型、分类、相关字段不变
   - ❌ 移除了自动判断分类的逻辑

3. **数据保存**
   - ✅ 已更新，保存时包含三个新字段

4. **加底预览**
   - ✅ 无影响，功能正常

5. **导出功能**
   - ✅ 无影响，功能正常

#### 不受影响的功能
- 截图上传
- 手动编辑道具名、底色
- 批量选择/删除
- 退回截图
- 查看大图

### 5. 兼容性处理

#### 旧数据迁移
- 旧数据（只有 `category` 字段）需要手动迁移或重新从 Tab1 导入
- 建议：清空 Tab2 现有数据，重新从 Tab1 导入以获得完整的类型、分类、相关信息

#### localStorage 数据
- `tab2_recordList`: 需要包含新的三个字段
- `tab2_uploadedScreenshots`: 无影响

### 6. 用户使用流程

#### 推荐流程
1. 在 **Tab1** 上传道具图片
2. Tab1 自动解析文件名，识别类型、分类、相关角色
3. 点击"导入到 Tab2"按钮
4. Tab2 自动创建记录，包含完整的类型、分类、相关信息
5. 上传游戏截图
6. 使用"一键识别"匹配截图与道具（AI 只识别道具名和底色）
7. 选择底图组，点击"加底"
8. 导出最终结果

### 7. 技术细节

#### 修改的文件
- `src/types.ts` - 更新 RecordRow 接口
- `src/components/Tab1Inbound.tsx` - 更新导入逻辑
- `src/components/Tab2Record.tsx` - 移除 availableCategories，更新 AI 识别逻辑
- `src/components/tab2/RecordTable.tsx` - 更新表头结构
- `src/components/tab2/RecordTableRow.tsx` - 新增三列只读显示
- `src/App.tsx` - 更新 onImportToTab2 回调

#### 代码示例：新增的只读列
```tsx
{/* 类型（从Tab1同步，不可修改） */}
<td className="p-2 border border-[#F2ECE5]">
  <div className="w-full text-center text-xs px-2 py-1.5 bg-[#F9F6F2] border border-[#E9DFDB]/40 rounded font-bold text-[#8B6F47] cursor-not-allowed">
    {row.propType || '未知'}
  </div>
</td>
```

## 测试建议

1. 清空 Tab2 现有数据（或清除 localStorage）
2. 在 Tab1 上传测试图片（包含男主、密探、初见日等不同类型）
3. 检查 Tab1 解析结果是否正确
4. 导入到 Tab2，检查三列数据是否正确显示
5. 上传截图并测试 AI 识别功能
6. 验证加底和导出功能

## 注意事项

⚠️ **重要**：由于数据结构变更，建议用户：
1. 备份现有数据（导出 JSON）
2. 清空 Tab2 数据
3. 重新从 Tab1 导入，以获得完整的新字段数据
