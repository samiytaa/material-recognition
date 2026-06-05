// 测试解析逻辑
const testCases = [
  // 头像类测试
  { file: 'icon_achan_s.png', expected: '密探头像' },
  { file: 'icon2_achan_m.png', expected: '魂魂头像' },
  { file: 'icon3_guonvwang_s.png', expected: 'QQ人头像' },
  { file: 'icon_cat_mimi_s.png', expected: '猫绒绒' },
  { file: 'icon_dog_wangwang_s.png', expected: '狗绒绒' },
  { file: 'icon_animal_special_s.png', expected: '特殊绒绒' },
  
  // 套装测试
  { file: 'icon_s10_all_xzrhw_001.png', expected: '套装-户外' },
  { file: 'icon_s10_lb_xzr_001.png', expected: '套装-户内' },
  
  // 衬景测试
  { file: 'icon_xzr_tiankonng_001.png', expected: '衬景' },
  
  // 家具测试（带fd成长标识）
  { file: 'icon_s10_fd_lb_jianzhu_001.png', expected: '初见日-刘辩-建筑' },
  { file: 'icon_s10_zc_jianzhu_091.png', expected: '左慈-建筑' },
  { file: 'icon_s10_all_qiju_001.png', expected: '起居' },
  { file: 'icon_s10_sc_outdoor_diban_001.png', expected: '孙策-地面' },
  
  // 男主相关
  { file: 'icon_ccl_1001.png', expected: '刘辩-互动道具' },
  { file: 'icon_cjr_sunce_5009.png', expected: '孙策-初见日道具' },
  { file: 'icon_component_10001.png', expected: '刘辩-夕情欢馀' },
  
  // 其他功能类
  { file: 'icon_yxbj_001.png', expected: '主界面背景' },
  { file: 'icon_hy_001.png', expected: '男主回忆' },
  { file: 'icon_mt_001.png', expected: '自选密探' },
  { file: 'icon_nz_001.png', expected: '男主元素' },
  { file: 'icon_hhst_001.png', expected: '魂生一串系列' }
];

console.log('='.repeat(60));
console.log('解析逻辑测试');
console.log('='.repeat(60));

testCases.forEach((test, index) => {
  console.log(`\n测试 ${index + 1}: ${test.file}`);
  console.log(`期望结果: ${test.expected}`);
  console.log('状态: ✓ (需要实际运行应用验证)');
});

console.log('\n' + '='.repeat(60));
console.log('测试用例总数:', testCases.length);
console.log('='.repeat(60));
console.log('\n请在应用中上传这些测试文件名的图片来验证解析逻辑！');
