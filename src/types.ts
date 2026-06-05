import parseConfig from './parseConfig.json';
import categoryConfig from './categoryConfig.json';

export interface PropItem {
  name: string;
  displayName: string;
  type: 'furniture' | 'other';
  category: string;
  maleLead: string | null;
  isGrowthProp: boolean;
  isFloor: boolean;
  image: string | null;
  categoryPath?: string[];
}

export interface RecordRow {
  id: number;
  originalImage: string | null;
  screenshot: string | null;
  propName: string;
  baseColor: string;
  category: string;
  previewWithBase: string | null;
  outputName: string;
}

export const MALE_LEADS: Record<string, string> = parseConfig['男主映射'];
export const OUTDOOR_CATEGORIES: Record<string, string> = parseConfig['户外分类'];
export const INDOOR_CATEGORIES: Record<string, string> = parseConfig['户内分类'];
export const FLOOR_CATEGORIES: Record<string, string> = parseConfig['地板分类'];
export const SPY_NAMES: Record<string, string> = parseConfig['密探名映射'];

export const CATEGORIES: Record<string, string> = {
  ...OUTDOOR_CATEGORIES,
  ...INDOOR_CATEGORIES,
  ...FLOOR_CATEGORIES
};

// 处理 outdoor_diban 可能映射到"地面"或"水面"的情况
export function normalizeCategoryName(category: string): string {
  if (category === '地面/水面') {
    return '地面';
  }
  return category;
}

export function getCategoryPath(categoryName: string): string[] {
  const config = categoryConfig as any;
  
  if (config['除家具以外的道具']) {
    for (const [mainCat, items] of Object.entries(config['除家具以外的道具'])) {
      if (Array.isArray(items) && items.includes(categoryName)) {
        return ['除家具以外的道具', mainCat, categoryName];
      }
    }
  }
  
  if (config['家具']) {
    if (config['家具']['套装'] && config['家具']['套装'].includes(categoryName)) {
      return ['家具', '套装', categoryName];
    }
    
    if (config['家具']['自由装修']) {
      // 处理衬景分类（天空、地貌、筑台）
      if (config['家具']['自由装修']['衬景'] && 
          Array.isArray(config['家具']['自由装修']['衬景']) && 
          config['家具']['自由装修']['衬景'].includes(categoryName)) {
        return ['家具', '自由装修', '衬景', categoryName];
      }
      
      // 如果categoryName本身就是"衬景"
      if (categoryName === '衬景') {
        return ['家具', '自由装修', '衬景'];
      }
      
      for (const [subCat, items] of Object.entries(config['家具']['自由装修'])) {
        if (Array.isArray(items) && items.includes(categoryName)) {
          return ['家具', '自由装修', subCat, categoryName];
        }
      }
    }
  }
  
  return ['其他', categoryName];
}

export function parseFileName(fileName: string) {
  let cleanName = fileName.replace(/\.png$/i, '').replace(/\s*#\d+$/, '').trim();
  
  // 特殊处理：cjr_ 开头的初见日道具（不带 icon_ 前缀）
  if (cleanName.startsWith('cjr_')) {
    let leadName = null;
    const cjrMatch = cleanName.match(/^cjr_([a-z]+)_/);
    if (cjrMatch) {
      const leadCode = cjrMatch[1];
      const mapping: Record<string, string> = {
        'sunce': '孙策', 'liubian': '刘辩', 'furong': '傅融',
        'yuanji': '袁基', 'zuoci': '左慈', 'sc': '孙策', 'lb': '刘辩',
        'fr': '傅融', 'yj': '袁基', 'zc': '左慈'
      };
      leadName = mapping[leadCode] || null;
    }
    return {
      originalName: fileName,
      displayName: leadName ? `${leadName}-初见日道具` : '初见日道具',
      type: 'other' as const,
      category: '初见日道具',
      maleLead: leadName,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('初见日道具')
    };
  }
  
  if (!cleanName.startsWith('icon')) {
    return {
      originalName: fileName,
      displayName: cleanName,
      type: 'other' as const,
      category: '其他',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: ['其他']
    };
  }

  let type: 'furniture' | 'other' = 'other';
  let category = '其他';
  let maleLead: string | null = null;
  let isGrowthProp = false;
  let isFloor = false;
  let categoryPath: string[] = [];

  const spyMatch = cleanName.match(/^(?:icon[23]|icon_cat|icon_dog|icon_animal)_(.+?)(?:_(red))?_([lms]{1,2})$/);
  if (spyMatch) {
    const spyPinyin = spyMatch[1];
    const isRed = spyMatch[2] === 'red';
    const level = spyMatch[3];
    
    const levelMap: Record<string, string> = { 'l': '大', 'm': '中', 's': '小', 'ss': '超小' };
    let spyName = SPY_NAMES[spyPinyin] || spyPinyin;
    let avatarType = '密探头像';
    
    if (cleanName.startsWith('icon2_')) avatarType = '魂魂头像';
    else if (cleanName.startsWith('icon3_')) avatarType = 'QQ人头像';
    else if (cleanName.startsWith('icon_cat_')) avatarType = '猫绒绒';
    else if (cleanName.startsWith('icon_dog_')) avatarType = '狗绒绒';
    else if (cleanName.startsWith('icon_animal_')) avatarType = '特殊绒绒';
    
    let displayName = `${avatarType}-${spyName}`;
    if (isRed) displayName += '-红';
    if (levelMap[level]) displayName += `(${levelMap[level]})`;
    
    return {
      originalName: fileName,
      displayName,
      type: 'other' as const,
      category: avatarType,
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath(avatarType)
    };
  }
  
  if (cleanName.match(/_s$/)) {
    return {
      originalName: fileName,
      displayName: '密探头像',
      type: 'other' as const,
      category: '密探头像',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('密探头像')
    };
  }

  // 套装分类：户外套装用 _xzrhw_，户内套装用 _xzr_ 但不包含分类标识
  if (cleanName.includes('_xzrhw_')) {
    return {
      originalName: fileName,
      displayName: '套装-户外',
      type: 'furniture' as const,
      category: '户外',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: ['家具', '套装', '户外']
    };
  }
  
  // 检查是否为户内套装（_xzr_ 但后面不跟具体分类标识）
  const xzrMatch = cleanName.match(/_xzr_(?!qiju|zhiwu|zhuangshi|guajian|qiangzhi|diban|outdoor_diban|jianzhu|jingguan|chenshe)/);
  if (xzrMatch || (cleanName.includes('_xzr_') && !cleanName.match(/_(qiju|zhiwu|zhuangshi|guajian|qiangzhi|diban|outdoor_diban|jianzhu|jingguan|chenshe)_/))) {
    return {
      originalName: fileName,
      displayName: '套装-户内',
      type: 'furniture' as const,
      category: '户内',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: ['家具', '套装', '户内']
    };
  }
  
  // 衬景场景（天空、地貌、筑台都归类为衬景）
  if (cleanName.startsWith('icon_xzr')) {
    return {
      originalName: fileName,
      displayName: '衬景',
      type: 'furniture' as const,
      category: '衬景',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: ['家具', '自由装修', '衬景']
    };
  }

  const otherCats: Record<string, string> = {
    'yxbj': '主界面背景', 'bgm': '主界面音乐', 'fudie': '符牒', 'hd': '活动',
    'lyx': '留音匣', 'mxp': '日志', 'txk2': '自定义头像框',
    'txk': '头像框', 'xzrdz': '家具道具', 'xrxj': '笺匣'
  };

  for (const [code, name] of Object.entries(otherCats)) {
    if (cleanName.includes(`_${code}_`) || cleanName.endsWith(`_${code}`)) {
      return {
        originalName: fileName,
        displayName: name,
        type: 'other' as const,
        category: name,
        maleLead: null,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath(name)
      };
    }
  }
  
  // 礼包 lb 需要特殊处理，避免与男主"刘辩"冲突
  // 只有在不是家具格式的情况下才匹配礼包
  if ((cleanName.includes('_lb_') || cleanName.endsWith('_lb')) && 
      !cleanName.match(/^icon_s\d+_/)) {
    return {
      originalName: fileName,
      displayName: '礼包',
      type: 'other' as const,
      category: '礼包',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('礼包')
    };
  }

  if (cleanName.includes('_ccl_')) {
    const cclMatch = cleanName.match(/_ccl_(\d{4})/);
    if (cclMatch) {
      const leadNum = cclMatch[1][0];
      const leadNames: Record<string, string> = {
        '1': '刘辩', '2': '傅融', '3': '袁基', '4': '左慈', '5': '孙策'
      };
      const leadName = leadNames[leadNum] || '未知';
      return {
        originalName: fileName,
        displayName: `${leadName}-互动道具`,
        type: 'other' as const,
        category: '男主互动道具',
        maleLead: leadName,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath('男主互动道具')
      };
    }
  }


  if (cleanName.includes('_cjr_') || cleanName.match(/_cjr\d+_/)) {
    let leadName = null;
    const cjrMatch = cleanName.match(/_cjr\d*_([a-z]+)_/);
    if (cjrMatch) {
      const leadCode = cjrMatch[1];
      if (MALE_LEADS[leadCode]) {
        leadName = MALE_LEADS[leadCode];
      } else {
        const mapping: Record<string, string> = {
          'sunce': '孙策', 'liubian': '刘辩', 'furong': '傅融',
          'yuanji': '袁基', 'zuoci': '左慈'
        };
        leadName = mapping[leadCode] || null;
      }
    }
    return {
      originalName: fileName,
      displayName: leadName ? `${leadName}-初见日道具` : '初见日道具',
      type: 'other' as const,
      category: '初见日道具',
      maleLead: leadName,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('初见日道具')
    };
  }

  if (cleanName.includes('_component_')) {
    const compMatch = cleanName.match(/_component_(\d{5})/);
    if (compMatch) {
      const code = compMatch[1];
      const leadNum = code[0];
      const batchNum = code[1];
      const leadNames: Record<string, string> = {
        '1': '刘辩', '2': '傅融', '3': '袁基', '4': '左慈', '5': '孙策'
      };
      const batchNames: Record<string, string> = {
        '1': '夕情欢馀', '2': '春月柳', '3': '燕歌行'
      };
      const leadName = leadNames[leadNum] || '未知';
      const batchName = batchNames[batchNum] || '';
      return {
        originalName: fileName,
        displayName: batchName ? `${leadName}-${batchName}` : `${leadName}-装饰`,
        type: 'other' as const,
        category: '男主装饰',
        maleLead: leadName,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath('男主装饰')
      };
    }
  }


  if (cleanName.includes('_hy_')) {
    return {
      originalName: fileName,
      displayName: '男主回忆',
      type: 'other' as const,
      category: '男主回忆',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('男主回忆')
    };
  }

  if (cleanName.includes('_jsln_')) {
    return {
      originalName: fileName,
      displayName: '吉光片羽',
      type: 'other' as const,
      category: '吉光片羽',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('吉光片羽')
    };
  }

  const mtCats: Record<string, string> = {
    'mt_cjhd': '言事章', 'mt_shadow_cjhd': '言事章影子',
    'mt_skin': '密探皮肤', 'mtwq': '密探温泉',
    'mc': '密探礼物', 'sp': '心纸'
  };

  for (const [code, name] of Object.entries(mtCats)) {
    if (cleanName.includes(`_${code}_`) || cleanName.includes(`_${code}`)) {
      return {
        originalName: fileName,
        displayName: name,
        type: 'other' as const,
        category: name,
        maleLead: null,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath(name)
      };
    }
  }

  if (cleanName.includes('_mt_') && !cleanName.includes('_mt_cjhd') && 
      !cleanName.includes('_mt_shadow') && !cleanName.includes('_mt_skin')) {
    return {
      originalName: fileName,
      displayName: '自选密探',
      type: 'other' as const,
      category: '自选密探',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('自选密探')
    };
  }


  const nzCats: Record<string, string> = {
    'nz_cjhd': '男主言事章', 'nz_shadow_cjhd': '男主言事章影子',
    'nz_skin': '男主皮肤', 'nz_xzrdz': '男主心纸君动作',
    'nz_xzrpf': '男主心纸君皮肤', 'nzbg': '男主背景'
  };

  for (const [code, name] of Object.entries(nzCats)) {
    if (cleanName.includes(`_${code}_`) || cleanName.includes(`_${code}`)) {
      return {
        originalName: fileName,
        displayName: name,
        type: 'other' as const,
        category: name,
        maleLead: null,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath(name)
      };
    }
  }

  if (cleanName.includes('_nz_') && !cleanName.includes('_nz_cjhd') && 
      !cleanName.includes('_nz_shadow') && !cleanName.includes('_nz_skin') && 
      !cleanName.includes('_nz_xzr') && !cleanName.includes('_nzbg')) {
    return {
      originalName: fileName,
      displayName: '男主元素',
      type: 'other' as const,
      category: '男主元素',
      maleLead: null,
      isGrowthProp: false,
      isFloor: false,
      categoryPath: getCategoryPath('男主元素')
    };
  }

  const actCats: Record<string, string> = {
    'hhst2': '魂生一串系列2', 'hhst': '魂生一串系列',
    'qxhd': '七夕活动', 'rouge': '肉鸽',
    'ydzz': '躬耕南阳', 'yuandan': '海岛漂流',
    'yzn': '一周年', 'bzn': '半周年'
  };

  for (const [code, name] of Object.entries(actCats)) {
    if (cleanName.includes(`_${code}_`) || cleanName.includes(`_${code}`)) {
      return {
        originalName: fileName,
        displayName: name,
        type: 'other' as const,
        category: name,
        maleLead: null,
        isGrowthProp: false,
        isFloor: false,
        categoryPath: getCategoryPath(name)
      };
    }
  }


  const furnitureMatch = cleanName.match(/^icon_s(\d+)_(?:(fd)_)?([a-z]+)_([a-z_]+)_(\d+)$/);
  
  if (furnitureMatch) {
    const isFd = furnitureMatch[2] === 'fd';
    const leadOrAll = furnitureMatch[3];
    const categoryCode = furnitureMatch[4];

    isGrowthProp = isFd;
    
    if (CATEGORIES[categoryCode]) {
      category = normalizeCategoryName(CATEGORIES[categoryCode]);
      type = 'furniture';
      
      if (FLOOR_CATEGORIES[categoryCode]) {
        isFloor = true;
      }
      
      categoryPath = getCategoryPath(category);
    }

    if (leadOrAll !== 'all' && MALE_LEADS[leadOrAll]) {
      maleLead = MALE_LEADS[leadOrAll];
    }

    let displayName = cleanName;
    if (type === 'furniture') {
      if (isGrowthProp && maleLead) {
        displayName = `初见日-${maleLead}-${category}`;
      } else if (maleLead) {
        displayName = `${maleLead}-${category}`;
      } else {
        displayName = category;
      }
    }

    return {
      originalName: fileName,
      displayName,
      type,
      category,
      maleLead,
      isGrowthProp,
      isFloor,
      categoryPath
    };
  }

  return {
    originalName: fileName,
    displayName: cleanName,
    type: 'other' as const,
    category: '其他',
    maleLead: null,
    isGrowthProp: false,
    isFloor: false,
    categoryPath: ['其他']
  };
}
