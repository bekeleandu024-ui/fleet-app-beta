"use client";

/**
 * ExtractableInput Component
 * 
 * Input field with visual feedback when populated by AI extraction.
 * Shows green highlight animation when field is extracted.
 */

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ExtractableInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  /** Field path for extraction matching */
  fieldPath: string;
  /** Set of currently highlighted field paths */
  extractedFields: Set<string>;
  /** Whether extraction is in progress */
  isExtracting?: boolean;
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
}

const ExtractableInput = forwardRef<HTMLInputElement, ExtractableInputProps>(
  (
    {
      fieldPath,
      extractedFields,
      isExtracting = false,
      label,
      error,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const wasJustExtracted = extractedFields.has(fieldPath);
    const hasValue = value !== undefined && value !== "";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-zinc-400">{label}</label>
        )}
        <input
          ref={ref}
          value={value}
          className={cn(
            // Base styles
            "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200",
            "placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
            "transition-all duration-300",

            // Highlight when field was just extracted
            wasJustExtracted && [
              "ring-2 ring-emerald-500 border-emerald-500",
              "bg-emerald-500/10",
              "animate-pulse",
            ],

            // Subtle pulse while extraction is in progress and field is empty
            isExtracting && !hasValue && "bg-zinc-800/50",

            // Error state
            error && "border-red-500 focus:ring-red-500",

            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

ExtractableInput.displayName = "ExtractableInput";

export { ExtractableInput };

/**
 * ExtractableSelect Component
 * 
 * Select field with visual feedback when populated by AI extraction.
 */
export interface ExtractableSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fieldPath: string;
  extractedFields: Set<string>;
  isExtracting?: boolean;
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const ExtractableSelect = forwardRef<HTMLSelectElement, ExtractableSelectProps>(
  (
    {
      fieldPath,
      extractedFields,
      isExtracting = false,
      label,
      error,
      options,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const wasJustExtracted = extractedFields.has(fieldPath);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-zinc-400">{label}</label>
        )}
        <select
          ref={ref}
          value={value}
          className={cn(
            // Base styles
            "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200",
            "focus:outline-none focus:ring-1 focus:ring-indigo-500",
            "transition-all duration-300",

            // Highlight when field was just extracted
            wasJustExtracted && [
              "ring-2 ring-emerald-500 border-emerald-500",
              "bg-emerald-500/10",
            ],

            // Error state
            error && "border-red-500 focus:ring-red-500",

            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

ExtractableSelect.displayName = "ExtractableSelect";

export { ExtractableSelect };

/**
 * ExtractableTextarea Component
 * 
 * Textarea with visual feedback when populated by AI extraction.
 */
export interface ExtractableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldPath: string;
  extractedFields: Set<string>;
  isExtracting?: boolean;
  label?: string;
  error?: string;
}

const ExtractableTextarea = forwardRef<
  HTMLTextAreaElement,
  ExtractableTextareaProps
>((
  {
    fieldPath,
    extractedFields,
    isExtracting = false,
    label,
    error,
    className,
    value,
    ...props
  },
  ref
) => {
  const wasJustExtracted = extractedFields.has(fieldPath);
  const hasValue = value !== undefined && value !== "";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <textarea
        ref={ref}
        value={value}
        className={cn(
          // Base styles
          "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200",
          "placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
          "transition-all duration-300 resize-none",

          // Highlight when field was just extracted
          wasJustExtracted && [
            "ring-2 ring-emerald-500 border-emerald-500",
            "bg-emerald-500/10",
            "animate-pulse",
          ],

          // Subtle effect while extraction is in progress and field is empty
          isExtracting && !hasValue && "bg-zinc-800/50",

          // Error state
          error && "border-red-500 focus:ring-red-500",

          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
});

ExtractableTextarea.displayName = "ExtractableTextarea";

export { ExtractableTextarea };

export default ExtractableInput;
