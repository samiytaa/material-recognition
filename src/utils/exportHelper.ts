import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PropItem, RecordRow } from '../types';

/**
 * 导出解析记录为 JSON
 */
export function exportParseRecordToJson(props: PropItem[]): void {
  const validProps = props.filter(p => p.image !== null);
  
  if (validProps.length === 0) {
    throw new Error('没有可导出的解析记录');
  }

  const parseRecords = validProps.map((prop, index) => ({
    序号: index + 1,
    原始文件名: prop.name,
    解析后名称: prop.displayName,
    类型: prop.type === 'furniture' ? '家具' : '其他道具',
    分类: prop.category,
    男主归属: prop.maleLead || '无',
    是否初见日: prop.isGrowthProp ? '是' : '否',
    是否地板: prop.isFloor ? '是' : '否',
    分类路径: prop.categoryPath?.join(' > ') || '未分类'
  }));

  const jsonContent = JSON.stringify(parseRecords, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `解析记录_${timestamp}.json`;
  saveAs(blob, fileName);

  return;
}

/**
 * 导出图片为 ZIP
 */
export async function exportImagesToZip(
  props: PropItem[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const validProps = props.filter(p => p.image !== null);
  
  if (validProps.length === 0) {
    throw new Error('没有可导出的图片');
  }

  const zip = new JSZip();
  const folder = zip.folder('道具图片');

  // 将每个图片添加到 zip
  for (let i = 0; i < validProps.length; i++) {
    const prop = validProps[i];
    if (prop.image) {
      // 从 base64 数据中提取实际的图片数据
      const base64Data = prop.image.split(',')[1];
      const fileName = `${prop.displayName}.png`;
      
      folder?.file(fileName, base64Data, { base64: true });
      onProgress?.(i + 1, validProps.length);
    }
  }

  // 生成 zip 文件
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // 下载文件
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `道具图片导出_${timestamp}.zip`;
  saveAs(blob, fileName);
}

/**
 * 导出追记数据为 ZIP
 */
export async function exportRecordsToZip(
  records: RecordRow[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const exportRows = records.filter(row => row.previewWithBase && row.outputName.trim() !== '');
  
  if (exportRows.length === 0) {
    throw new Error('没有可导出的数据');
  }

  const zip = new JSZip();
  const folder = zip.folder('加底图片');

  for (let i = 0; i < exportRows.length; i++) {
    const row = exportRows[i];
    if (row.previewWithBase) {
      const base64Data = row.previewWithBase.split(',')[1];
      const fileName = `${row.outputName}.png`;
      folder?.file(fileName, base64Data, { base64: true });
      onProgress?.(i + 1, exportRows.length);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `加底图片导出_${timestamp}.zip`;
  saveAs(blob, fileName);
}
