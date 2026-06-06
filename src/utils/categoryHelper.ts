import categoryConfig from '../categoryConfig.json';

export interface CategoryNode {
  level1: string;
  level2: string[];
}

/**
 * 从 categoryConfig.json 构建分类树
 */
export function buildCategoryTree(config: any): CategoryNode[] {
  const tree: CategoryNode[] = [];

  // "家具" 单独处理：把 套装/自由装修 的所有叶子铺开成二级
  const furniture = config['家具'] || {};
  const furnitureL2: string[] = [];
  for (const [l2, sub] of Object.entries(furniture)) {
    if (Array.isArray(sub)) {
      // 套装：["户内","户外"]
      (sub as string[]).forEach(s => furnitureL2.push(`${l2}·${s}`));
    } else if (typeof sub === 'object') {
      // 自由装修
      for (const [l3, items] of Object.entries(sub as object)) {
        if (Array.isArray(items)) {
          (items as string[]).forEach(s => furnitureL2.push(`${l3}·${s}`));
        }
      }
    }
  }
  tree.push({ level1: '家具', level2: furnitureL2 });

  // "除家具以外的道具" 下的各一级分类
  const nonFurniture = config['除家具以外的道具'] || {};
  const orderedNonFurniture = ['男主类', '密探类', '头像类', '活动类', '其他类'];
  for (const l1 of orderedNonFurniture) {
    const children = nonFurniture[l1];
    if (Array.isArray(children)) {
      tree.push({ level1: l1, level2: children as string[] });
    }
  }

  for (const [l1, children] of Object.entries(nonFurniture)) {
    if (!orderedNonFurniture.includes(l1) && Array.isArray(children)) {
      tree.push({ level1: l1, level2: children as string[] });
    }
  }

  return tree;
}

/**
 * 获取默认的分类树
 */
export function getDefaultCategoryTree(): CategoryNode[] {
  return buildCategoryTree(categoryConfig);
}

/**
 * 检查道具是否匹配分类过滤器
 */
export function matchesFilter(
  prop: { type: string; category: string; displayName: string },
  filter: { level1: string; level2: string | null },
  categoryTree: CategoryNode[]
): boolean {
  if (filter.level1 === 'all') return true;

  const l1 = filter.level1;
  const l2 = filter.level2;

  if (l1 === '家具') {
    if (prop.type !== 'furniture') return false;
    if (!l2) return true;
    
    // l2 格式为 "套装·户内" 或 "起居" 等，尝试匹配 category
    const subLabel = l2.includes('·') ? l2.split('·')[1] : l2;
    return prop.category === subLabel || prop.category === l2;
  } else {
    // 非家具：用一级分类名匹配，或直接用二级分类匹配 category/displayName
    if (l2) {
      return prop.category === l2 || prop.displayName.includes(l2);
    } else {
      // 只选了一级，显示该大类下所有
      const treeNode = categoryTree.find(n => n.level1 === l1);
      if (treeNode) {
        return treeNode.level2.some(sub =>
          prop.category === sub || prop.displayName.includes(sub)
        );
      } else {
        return prop.type !== 'furniture';
      }
    }
  }
}
