"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "../ui/Button";

export const FileDropzone = ({
  onFileSelected,
  accept = ".xlsx",
  fileName,
}: {
  onFileSelected: (file: File) => void;
  accept?: string;
  fileName?: string | null;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center gap-3 rounded-16 border-2 border-dashed px-6 py-10 text-center transition-colors
        ${isDragging ? "border-app-accent-text bg-app-surface-2" : "border-app-border-strong bg-app-surface"}
      `}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" className="text-app-faint">
        <path
          d="M12 15V3m0 12-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {fileName ? (
        <p className="text-std-16B-170 text-app-text">選択中のファイル: {fileName}</p>
      ) : (
        <p className="text-std-16N-170 text-app-muted">
          ここにExcelファイルをドラッグ&ドロップ、または
        </p>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        ファイルを選択
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
