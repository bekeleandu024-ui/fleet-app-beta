"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Upload,
  FileCheck,
  Image as ImageIcon,
  File,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PODUploadModalProps {
  tripId: string;
  tripNumber: string;
  orderId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export function PODUploadModal({
  tripId,
  tripNumber,
  orderId,
  onClose,
  onSuccess,
}: PODUploadModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [notes, setNotes] = useState("");

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tripId", tripId);
      formData.append("orderId", orderId);
      formData.append("documentType", "POD");
      formData.append("notes", notes);

      const res = await fetch(`/api/farm-out/trips/${tripId}/pod`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload POD");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-out-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip-bids"] });
      onSuccess?.();
      onClose();
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPEG, PNG, WebP image or PDF file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    const uploadedFile: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFile.preview = e.target?.result as string;
        setSelectedFile(uploadedFile);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(uploadedFile);
    }

    // Store the actual file for upload
    (window as any).__podFile = file;
  };

  const handleUpload = () => {
    const file = (window as any).__podFile as File;
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-lg bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-amber-400" />
                Upload Proof of Delivery
              </h2>
              <p className="text-sm text-zinc-500">
                Trip {tripNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300/90">
                <strong>POD is required to close this trip.</strong> Upload the signed delivery receipt 
                or bill of lading to confirm delivery and enable settlement.
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
                dragActive
                  ? "border-amber-500 bg-amber-500/10"
                  : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  {selectedFile.preview ? (
                    <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden bg-zinc-800">
                      <img
                        src={selectedFile.preview}
                        alt="POD Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <File className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready to upload
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <Upload className="h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-300 mb-1">
                    Drop POD document here or click to browse
                  </p>
                  <p className="text-xs text-zinc-500">
                    Accepts JPEG, PNG, WebP or PDF (max 10MB)
                  </p>
                </>
              )}
            </div>

            {/* Camera Option (for mobile simulation) */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
                Take Photo
              </button>
              <span className="text-zinc-700">•</span>
              <button
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Choose from Gallery
              </button>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Notes (optional)
              </label>
              <Input
                placeholder="Any delivery notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload POD
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
