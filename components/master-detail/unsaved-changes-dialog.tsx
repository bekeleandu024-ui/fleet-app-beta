"use client";

import { cn } from "@/lib/utils";

interface DirtyField {
  field: string;
  originalValue: unknown;
  currentValue: unknown;
}

/**
 * Simple confirmation dialog component for unsaved changes
 */
interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  dirtyFields?: DirtyField[];
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
  dirtyFields = [],
}: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          Unsaved Changes
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          You have unsaved changes. What would you like to do?
        </p>

        {/* Show dirty fields */}
        {dirtyFields.length > 0 && (
          <div className="mb-4 p-3 bg-zinc-800 rounded-md">
            <p className="text-xs text-zinc-500 mb-2">Modified fields:</p>
            <div className="space-y-1">
              {dirtyFields.map((field) => (
                <div key={field.field} className="text-xs text-zinc-300">
                  • {field.field}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onDiscard}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
