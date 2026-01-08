"use client";

/**
 * PasteZone Component
 * 
 * Handles paste and drop events for AI order extraction.
 * Shows visual feedback during extraction with progress indicator.
 */

import { useCallback, useState, useRef, DragEvent, ClipboardEvent, ChangeEvent } from "react";
import { Sparkles, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasteZoneProps {
  /** Whether extraction is in progress */
  isExtracting: boolean;
  /** Progress indicator (0-100) */
  progress: number;
  /** Error message */
  error: string | null;
  /** Whether extraction was successful */
  isSuccess?: boolean;
  /** Callback to extract from text */
  onExtractText: (text: string) => Promise<unknown>;
  /** Callback to extract from image */
  onExtractImage: (file: File) => Promise<unknown>;
  /** Check if text should auto-extract */
  shouldAutoExtract: (text: string) => boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
}

export function PasteZone({
  isExtracting,
  progress,
  error,
  isSuccess,
  onExtractText,
  onExtractImage,
  shouldAutoExtract,
  placeholder = "Paste rate con or drag image...",
  className,
}: PasteZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste event
  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLInputElement>) => {
      const items = e.clipboardData.items;

      // Check for image in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            await onExtractImage(blob);
            return;
          }
        }
      }

      // Handle text paste
      const text = e.clipboardData.getData("text");
      if (text && shouldAutoExtract(text)) {
        e.preventDefault();
        setInputValue(text.slice(0, 50) + "..."); // Show truncated preview
        await onExtractText(text);
      }
    },
    [onExtractText, onExtractImage, shouldAutoExtract]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Check for files (images)
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        await onExtractImage(files[0]);
        return;
      }

      // Handle dropped text
      const text = e.dataTransfer.getData("text");
      if (text) {
        setInputValue(text.slice(0, 50) + "...");
        await onExtractText(text);
      }
    },
    [onExtractText, onExtractImage]
  );

  // Handle file input change
  const handleFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        await onExtractImage(file);
      }
    },
    [onExtractImage]
  );

  // Click to upload
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all duration-200",
        // Default state
        !isDragging && !isExtracting && !error && !isSuccess && [
          "border-zinc-700 bg-zinc-900 hover:border-zinc-600",
        ],
        // Dragging state
        isDragging && [
          "border-indigo-500 bg-indigo-500/10 scale-[1.02]",
        ],
        // Extracting state
        isExtracting && [
          "border-indigo-500 bg-indigo-500/5",
        ],
        // Error state
        error && [
          "border-red-500/50 bg-red-500/5",
        ],
        // Success state (brief)
        isSuccess && [
          "border-emerald-500/50 bg-emerald-500/5",
        ],
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Progress bar overlay */}
      {isExtracting && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-lg transition-all duration-300"
          style={{
            width: `${progress}%`,
            opacity: progress > 0 ? 1 : 0,
          }}
        />
      )}

      {/* Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
        {isExtracting ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        ) : error ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Sparkles className={cn(
            "w-4 h-4 transition-colors",
            isDragging ? "text-indigo-300" : "text-indigo-400"
          )} />
        )}
      </div>

      {/* Input field */}
      <input
        type="text"
        className={cn(
          "w-full h-9 bg-transparent pl-10 pr-10 text-sm focus:outline-none transition-colors",
          isExtracting || error
            ? "text-zinc-400 placeholder-zinc-500"
            : "text-zinc-300 placeholder-zinc-500"
        )}
        placeholder={
          isExtracting
            ? `Extracting... ${progress}%`
            : error
            ? "Extraction failed - try again"
            : placeholder
        }
        value={isExtracting ? "" : inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPaste={handlePaste}
        disabled={isExtracting}
      />

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={isExtracting}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors",
          isExtracting
            ? "text-zinc-600 cursor-not-allowed"
            : "text-zinc-500 hover:text-indigo-400 cursor-pointer"
        )}
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Status message */}
      {(isExtracting || error) && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded",
              isExtracting && "text-indigo-400 animate-pulse",
              error && "text-red-400"
            )}
          >
            {isExtracting
              ? "AI extracting order details..."
              : error}
          </span>
        </div>
      )}
    </div>
  );
}

export default PasteZone;
