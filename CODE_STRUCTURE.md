# 代码结构说明

## 项目重构概述

本次重构的主要目标是：
1. **提取共享组件**：将重复使用的 UI 组件抽取到 `components/common/` 目录
2. **拆分过长组件**：将 Tab1 和 Tab2 的大型组件拆分为更小的、职责单一的子组件
3. **提取业务逻辑**：将数据处理、文件操作等逻辑提取到 hooks 和 utils 中
4. **改善代码可维护性**：通过模块化提高代码的可读性和可维护性

## 目录结构

```
src/
├── components/
│   ├── common/              # 共享组件
│   │   ├── Button.tsx       # 通用按钮组件
│   │   ├── Card.tsx         # 卡片容器组件
│   │   ├── ImageThumbnail.tsx  # 图片缩略图组件
│   │   ├── Modal.tsx        # 模态框组件
│   │   ├── SearchInput.tsx  # 搜索输入框组件
│   │   ├── UploadZone.tsx   # 文件上传区域组件
│   │   └── index.ts         # 导出索引
│   │
│   ├── tab1/                # Tab1 相关子组件
│   │   ├── CategoryFilter.tsx  # 分类筛选器
│   │   ├── PreviewPanel.tsx    # 预览面板
│   │   ├── PropGrid.tsx        # 道具网格展示
│   │   ├── StatsBar.tsx        # 统计栏
│   │   └── index.ts            # 导出索引
│   │
│   ├── tab2/                # Tab2 相关子组件
│   │   ├── RecordTable.tsx     # 追记表格
│   │   ├── RecordTableRow.tsx  # 表格行组件
│   │   ├── ScreenshotList.tsx  # 截图列表
│   │   └── index.ts            # 导出索引
│   │
│   ├── LogSidebar.tsx       # 日志侧边栏（共享）
│   ├── Tab1Inbound.tsx      # Tab1 主组件（待重构）
│   ├── Tab2Record.tsx       # Tab2 主组件（待重构）
│   ├── Tab3Settings.tsx     # Tab3 设置页
│   └── Tab4RulesManager.tsx # Tab4 规则管理
│
├── hooks/                   # 自定义 Hooks
│   ├── useImageUpload.ts    # 图片上传逻辑
│   ├── useLocalStorage.ts   # localStorage 管理
│   ├── useLogger.ts         # 日志管理
│   └── index.ts             # 导出索引
│
├── utils/                   # 工具函数
│   ├── categoryHelper.ts    # 分类相关工具
│   ├── exportHelper.ts      # 导出功能工具
│   ├── fileHelper.ts        # 文件处理工具
│   ├── rulesHelper.ts       # 规则处理（已存在）
│   └── index.ts             # 导出索引
│
├── types.ts                 # 类型定义
├── App.tsx                  # 主应用组件
└── main.tsx                 # 应用入口

```

## 组件说明

### 1. 共享组件 (components/common/)

#### Button.tsx
通用按钮组件，支持多种样式变体和尺寸。

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: Lucide 图标组件
- `disabled`: 是否禁用

**使用示例:**
```tsx
import { Button } from '@/components/common';
import { Trash2 } from 'lucide-react';

<Button variant="danger" icon={Trash2} onClick={handleDelete}>
  删除
</Button>
```

#### Card.tsx
卡片容器组件，提供统一的卡片样式。

**使用示例:**
```tsx
import { Card, CardHeader, CardTitle } from '@/components/common';

<Card>
  <CardHeader>
    <CardTitle icon>标题</CardTitle>
  </CardHeader>
  <div>内容</div>
</Card>
```

#### ImageThumbnail.tsx
图片缩略图组件，支持选中、删除、徽章显示等功能。

**Props:**
- `src`: 图片地址
- `onClick`: 点击事件
- `onDelete`: 删除事件
- `badge`: 徽章文本
- `isSelected`: 是否选中

#### Modal.tsx
模态框组件，提供统一的弹窗样式。

**Props:**
- `isOpen`: 是否打开
- `onClose`: 关闭回调
- `title`: 标题
- `footer`: 底部内容

#### SearchInput.tsx
搜索输入框组件，带清除按钮。

**Props:**
- `value`: 输入值
- `onChange`: 变化回调
- `placeholder`: 占位文本

#### UploadZone.tsx
文件上传区域，支持拖拽和点击上传。

**Props:**
- `onFilesSelected`: 文件选择回调
- `accept`: 接受的文件类型
- `multiple`: 是否多选

### 2. Tab1 子组件 (components/tab1/)

#### CategoryFilter.tsx
分类筛选器，支持两级分类展开/收起。

#### PreviewPanel.tsx
预览面板，显示选中道具的详细信息。

#### PropGrid.tsx
道具网格展示，使用 ImageThumbnail 组件。

#### StatsBar.tsx
统计信息栏，显示道具数量统计。

### 3. Tab2 子组件 (components/tab2/)

#### RecordTable.tsx
追记表格主组件，管理整个表格的展示。

#### RecordTableRow.tsx
表格行组件，处理单行的编辑和交互。

#### ScreenshotList.tsx
截图列表，显示待处理的截图。

## Hooks 说明

### useLogger
日志管理 Hook，提供统一的日志记录功能。

**返回值:**
- `logs`: 日志数组
- `addLog`: 添加日志函数
- `clearLogs`: 清空日志函数

**使用示例:**
```tsx
const { logs, addLog, clearLogs } = useLogger('初始化完成');
addLog('上传了 5 个文件');
```

### useLocalStorage
localStorage 管理 Hook，提供类型安全的本地存储。

**返回值:**
- `[value, setValue, removeValue]`: 类似 useState

**使用示例:**
```tsx
const [props, setProps, removeProps] = useLocalStorage<PropItem[]>('savedProps', []);
```

### useImageUpload
图片上传 Hook，处理文件读取和进度跟踪。

**返回值:**
- `uploadFiles`: 上传函数
- `isUploading`: 是否正在上传
- `progress`: 上传进度

## 工具函数说明

### fileHelper.ts
文件处理相关工具函数。

主要函数:
- `processImageFiles`: 处理和过滤图片文件
- `readFileAsDataURL`: 读取文件为 Base64
- `filterImageFiles`: 过滤出图片文件

### categoryHelper.ts
分类相关工具函数。

主要函数:
- `buildCategoryTree`: 构建分类树
- `getDefaultCategoryTree`: 获取默认分类树
- `matchesFilter`: 检查是否匹配过滤器

### exportHelper.ts
导出功能相关工具函数。

主要函数:
- `exportParseRecordToJson`: 导出解析记录为 JSON
- `exportImagesToZip`: 导出图片为 ZIP
- `exportRecordsToZip`: 导出追记数据为 ZIP

## 下一步重构计划

### Tab1Inbound.tsx 重构
使用新的组件和 hooks 重写 Tab1：

```tsx
import { StatsBar, CategoryFilter, PropGrid, PreviewPanel } from './tab1';
import { SearchInput, UploadZone, Button } from './common';
import { useLogger, useLocalStorage } from '../hooks';
import { buildCategoryTree, matchesFilter } from '../utils';
```

### Tab2Record.tsx 重构
使用新的组件和 hooks 重写 Tab2：

```tsx
import { RecordTable, ScreenshotList } from './tab2';
import { UploadZone, Button } from './common';
import { useLogger, useLocalStorage } from '../hooks';
```

## 重构优势

1. **代码复用**: 共享组件可在多个地方使用
2. **职责单一**: 每个组件只负责一个功能
3. **易于测试**: 小组件更容易编写单元测试
4. **易于维护**: 修改某个功能时只需要改对应的小组件
5. **类型安全**: 通过 TypeScript 提供完整的类型支持
6. **性能优化**: 小组件更容易进行性能优化和懒加载

## 注意事项

1. 所有新组件都保持了原有的样式和功能
2. 使用索引文件 (index.ts) 简化导入路径
3. 保持与现有代码的兼容性
4. 逐步迁移，避免一次性改动过大
