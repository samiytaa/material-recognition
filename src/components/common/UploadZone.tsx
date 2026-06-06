import React, { useRef } from 'react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  text?: string;
  subText?: string;
}

export default function UploadZone({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  text = '支持拖入图片',
  subText = '或点击窗口选择图片文件',
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className="drag-area group flex flex-col items-center justify-center py-8 px-6 text-center cursor-pointer transition-all duration-200 hover:bg-gold-light"
      >
        <span className="text-sm font-bold text-[#674b2d] tracking-wide mb-1">
          {text}
        </span>
        <span className="text-xs font-medium text-gold-deep/70">
          {subText}
        </span>
      </div>
    </>
  );
}
