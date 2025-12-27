"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentUploaderProps {
  tripId: string;
  documentType: 'BOL' | 'POD' | 'lumper_receipt' | 'weight_ticket' | 'inspection' | 'customs' | 'other';
  onUploadComplete?: (document: any) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

export function DocumentUploader({
  tripId,
  documentType,
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<Array<{ file: File; uploading: boolean; uploaded: boolean; error?: string }>>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, maxFiles - files.length).map((file) => ({
      file,
      uploading: false,
      uploaded: false,
    }));
    
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    maxFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const uploadFile = async (index: number) => {
    const fileEntry = files[index];
    if (!fileEntry) return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, uploading: true } : f))
    );

    try {
      // TODO: Replace with actual file upload to S3/R2
      // For now, we'll simulate upload
      const formData = new FormData();
      formData.append('file', fileEntry.file);
      
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const fileUrl = URL.createObjectURL(fileEntry.file); // Temporary - replace with actual URL

      // Save document metadata to database
      const response = await fetch(`/api/trips/${tripId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          fileUrl,
          fileName: fileEntry.file.name,
          fileSize: fileEntry.file.size,
          mimeType: fileEntry.file.type,
          uploadedBy: 'current-user-id', // TODO: Get from auth context
          uploadedByType: 'dispatcher',
          metadata: {
            originalName: fileEntry.file.name,
          },
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, uploading: false, uploaded: true } : f
        )
      );

      if (onUploadComplete) {
        onUploadComplete(result.document);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, uploading: false, error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!files[i].uploaded && !files[i].uploading) {
        await uploadFile(i);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-500">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              PDF, Images, Word documents (Max {maxSize / (1024 * 1024)}MB)
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileEntry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <File className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileEntry.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileEntry.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {fileEntry.uploaded && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {fileEntry.uploading && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {fileEntry.error && (
                  <span className="text-xs text-red-500">{fileEntry.error}</span>
                )}
                {!fileEntry.uploaded && !fileEntry.uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.some((f) => !f.uploaded) && (
        <Button
          type="button"
          onClick={uploadAll}
          disabled={files.some((f) => f.uploading)}
          className="w-full"
        >
          {files.some((f) => f.uploading) ? 'Uploading...' : 'Upload All'}
        </Button>
      )}
    </div>
  );
}
