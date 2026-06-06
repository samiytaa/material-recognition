/**
 * 测试新的解析逻辑
 * 运行方式: node test-parse-new.js
 */

// 模拟导入 types.ts 的逻辑
const parseConfig = require('./src/parseConfig.json');
const categoryConfig = require('./src/categoryConfig.json');
const ownershipRulesConfig = require('./src/categoryOwnershipRules.json');

// 初始化规则
const MALE_LEADS = parseConfig['男主映射'];
const SPY_NAMES = parseConfig['密探名映射'];
const OUTDOOR_CATEGORIES = parseConfig['户外分类'];
const INDOOR_CATEGORIES = parseConfig['户内分类'];
const FLOOR_CATEGORIES = parseConfig['地板分类'];
const CATEGORIES = { ...OUTDOOR_CATEGORIES, ...INDOOR_CATEGORIES, ...FLOOR_CATEGORIES };
const OWNERSHIP_RULES = ownershipRulesConfig.categoryOwnershipRules;

// 测试用例
const testCases = [
  // 家具
  'icon_s1001_lb_qiju_001.png',
  'icon_s1002_fd_sc_jianzhu_002.png',
  'icon_s1003_all_diban_003.png',
  
  // 套装
  'icon_xzrhw_001.png',
  'icon_xzr_002.png',
  
  // 密探头像
  'icon_achan_s.png',
  'icon2_sunfu_red_l.png',
  'icon_cat_xiahouyuan_m.png',
  
  // 男主道具
  'icon_nz_lb_001.png',
  'icon_ccl_1001.png',
  'icon_component_11001.png',
  'cjr_liubian_1002.png',
  
  // 密探道具
  'icon_mt_achan_001.png',
  'icon_mc_sunfu_001.png',
  'icon_sp_zhangliao_001.png',
  
  // 活动
  'icon_hhst_lb_001.png',
  'icon_qxhd_achan_001.png',
  
  // 其他
  'icon_txk_001.png',
  'icon_yxbj_001.png',
  '日华浮绢·壹.png',
];

console.log('=' .repeat(80));
console.log('开始测试新的解析逻辑');
console.log('=' .repeat(80));
console.log('');

// 简化版解析函数（仅用于测试展示）
function testParse(fileName) {
  console.log(`文件名: ${fileName}`);
  console.log('-'.repeat(80));
  
  const cleanName = fileName.replace(/\.png$/i, '').replace(/\s*#\d+$/, '').trim();
  const segments = cleanName.split('_');
  
  // 模拟识别逻辑
  let category = '未知';
  let ownershipType = 'none';
  let ownershipName = null;
  let displayName = cleanName;
  
  // 检测男主
  for (const seg of segments) {
    if (MALE_LEADS[seg]) {
      ownershipType = 'male_lead';
      ownershipName = MALE_LEADS[seg];
      break;
    }
  }
  
  // 检测密探
  if (!ownershipName) {
    for (const seg of segments) {
      if (SPY_NAMES[seg]) {
        ownershipType = 'spy';
        ownershipName = SPY_NAMES[seg];
        break;
      }
    }
  }
  
  // 识别分类
  if (cleanName.match(/^icon_s\d+_/)) {
    category = '家具';
    const match = cleanName.match(/_([a-z]+)_\d+$/);
    if (match && CATEGORIES[match[1]]) {
      category = CATEGORIES[match[1]];
    }
  } else if (cleanName.includes('_nz_')) {
    category = '男主元素';
  } else if (cleanName.includes('_mt_')) {
    category = '密探相关';
  } else if (cleanName.includes('_ccl_')) {
    category = '男主互动道具';
  } else if (cleanName.includes('_component_')) {
    category = '男主装饰';
  } else if (cleanName.includes('cjr')) {
    category = '初见日道具';
  } else if (cleanName.match(/_s$/)) {
    category = '密探头像';
  } else if (cleanName.match(/^icon[23]_/) || cleanName.includes('_cat_') || cleanName.includes('_dog_')) {
    category = '头像类';
  }
  
  // 生成展示名
  if (ownershipName) {
    displayName = `${ownershipName}-${category}`;
  } else {
    displayName = category;
  }
  
  console.log(`  分类: ${category}`);
  console.log(`  归属类型: ${ownershipType === 'male_lead' ? '男主' : ownershipType === 'spy' ? '密探' : '无'}`);
  console.log(`  归属名称: ${ownershipName || '无'}`);
  console.log(`  展示名称: ${displayName}`);
  console.log('');
}

// 运行测试
testCases.forEach(testCase => {
  testParse(testCase);
});

console.log('=' .repeat(80));
console.log('测试完成');
console.log('=' .repeat(80));
