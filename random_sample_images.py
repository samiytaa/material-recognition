import os
import shutil
import random
from pathlib import Path

def sample_images(source_dir, target_dir, sample_count=100):
    """
    从源目录随机抽取指定数量的图片复制到目标目录
    
    参数:
        source_dir: 源图片目录路径
        target_dir: 目标目录路径
        sample_count: 抽取的图片数量
    """
    # 创建目标目录
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    
    # 获取源目录中的所有图片文件
    source_path = Path(source_dir)
    image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp'}
    all_images = [f for f in source_path.iterdir() 
                  if f.is_file() and f.suffix.lower() in image_extensions]
    
    # 检查图片数量
    total_images = len(all_images)
    print(f"源目录中共有 {total_images} 张图片")
    
    if total_images == 0:
        print("错误：源目录中没有找到图片文件")
        return
    
    # 确定实际抽取数量
    actual_sample_count = min(sample_count, total_images)
    if actual_sample_count < sample_count:
        print(f"警告：源目录图片数量不足，将抽取全部 {actual_sample_count} 张图片")
    
    # 随机抽取图片
    selected_images = random.sample(all_images, actual_sample_count)
    
    # 复制图片到目标目录
    print(f"\n开始复制 {actual_sample_count} 张图片...")
    for i, image_file in enumerate(selected_images, 1):
        target_file = target_path / image_file.name
        shutil.copy2(image_file, target_file)
        if i % 10 == 0:
            print(f"已复制 {i}/{actual_sample_count} 张图片")
    
    print(f"\n完成！已将 {actual_sample_count} 张图片复制到: {target_dir}")
    print(f"目标目录: {target_path.absolute()}")

if __name__ == "__main__":
    # 配置路径
    source_directory = r"c:\Users\yunqi\Desktop\材料识别\导入图片"
    target_directory = r"c:\Users\yunqi\Desktop\材料识别\测试图片"
    
    # 执行抽取
    sample_images(source_directory, target_directory, sample_count=100)
