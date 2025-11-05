'use client';

import { useState, useCallback } from 'react';
import { UploadProgress, MAX_FILE_SIZE, formatFileSize } from '@/types/reference';

interface FileUploadProps {
  deckId?: string;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
}

export default function FileUpload({ deckId, onUploadComplete, maxFiles = 10 }: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File, deckId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (deckId) {
      formData.append('deckId', deckId);
    }

    const response = await fetch('/api/reference-materials/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  };

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Validate file sizes
    const invalidFiles = fileArray.filter(f => f.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      alert(`Some files are too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    // Check max files limit
    if (uploads.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Initialize upload progress
    const newUploads: UploadProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadIndex = uploads.length + i;

      try {
        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], status: 'uploading', progress: 50 };
          return updated;
        });

        const result = await uploadFile(file, deckId);

        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = {
            ...updated[uploadIndex],
            status: 'success',
            progress: 100,
            result,
          };
          return updated;
        });
      } catch (error: any) {
        setUploads(prev => {
          const updated = [...prev];
          updated[uploadIndex] = {
            ...updated[uploadIndex],
            status: 'error',
            progress: 0,
            error: error.message,
          };
          return updated;
        });
      }
    }

    // Notify parent of successful uploads
    const successfulUploads = uploads.filter(u => u.status === 'success' && u.result);
    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads.map(u => u.result));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [deckId, uploads.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl">📁</div>
          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              PDF, PowerPoint, Images, Videos (max {formatFileSize(MAX_FILE_SIZE)} per file)
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp4,.webm,.mov,.doc,.docx,.txt"
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block">
              Select Files
            </span>
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Uploads ({uploads.length})</h3>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              {/* File Icon */}
              <div className="text-2xl">
                {upload.status === 'success' && '✅'}
                {upload.status === 'error' && '❌'}
                {upload.status === 'uploading' && '⏳'}
                {upload.status === 'pending' && '📄'}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>

              {/* Progress Bar */}
              {upload.status === 'uploading' && (
                <div className="w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeUpload(index)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
