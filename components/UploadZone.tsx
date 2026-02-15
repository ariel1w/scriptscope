'use client';

import { useState, useCallback } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export default function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    []
  );

  const handleFile = (file: File) => {
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or TXT file');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive ? 'border-[#c9a962] bg-[#c9a962]/5' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#c9a962]'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".pdf,.txt"
          onChange={handleChange}
          disabled={disabled}
        />
        <div className="text-5xl mb-4">📄</div>
        <p className="text-xl font-serif font-semibold text-[#0a1628] mb-2">
          Drop your screenplay here or click to browse
        </p>
        <p className="text-sm text-gray-500">PDF or TXT files • Up to 150 pages</p>
      </div>
    </div>
  );
}
