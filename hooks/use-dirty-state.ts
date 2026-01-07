"use client";

import { useCallback, useRef, useState, useEffect } from "react";

interface UseDirtyStateOptions<T> {
  /** Initial data */
  initialData: T | null;
  /** Callback to save data */
  onSave?: (data: T) => Promise<void>;
  /** Callback when user tries to navigate away with unsaved changes */
  onUnsavedChanges?: (data: T) => Promise<"save" | "discard" | "cancel">;
  /** Auto-save delay in ms (0 to disable) */
  autoSaveDelay?: number;
  /** Fields to track for dirty state (if empty, tracks all) */
  trackedFields?: (keyof T)[];
}

export interface DirtyField {
  field: string;
  originalValue: unknown;
  currentValue: unknown;
}

/**
 * Hook for managing dirty state in Master-Detail views
 * 
 * Handles the "Context Switch" trap: when users click through records quickly,
 * the system must auto-save or prompt for unsaved changes.
 */
export function useDirtyState<T extends Record<string, unknown>>({
  initialData,
  onSave,
  onUnsavedChanges,
  autoSaveDelay = 2000, // 2 seconds
  trackedFields = [],
}: UseDirtyStateOptions<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [originalData, setOriginalData] = useState<T | null>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<DirtyField[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Compute dirty fields when data changes
  const computeDirtyFields = useCallback((current: T | null, original: T | null): DirtyField[] => {
    if (!current || !original) return [];

    const fieldsToCheck = trackedFields.length > 0 
      ? trackedFields 
      : (Object.keys(current) as (keyof T)[]);

    const dirty: DirtyField[] = [];
    for (const field of fieldsToCheck) {
      const currentValue = current[field];
      const originalValue = original[field];

      // Deep comparison for objects/arrays
      const isDifferent = JSON.stringify(currentValue) !== JSON.stringify(originalValue);
      
      if (isDifferent) {
        dirty.push({
          field: String(field),
          originalValue,
          currentValue,
        });
      }
    }

    return dirty;
  }, [trackedFields]);

  // Update field value
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      
      // Check if this makes the data dirty
      const dirty = computeDirtyFields(updated, originalData);
      setDirtyFields(dirty);
      setIsDirty(dirty.length > 0);

      return updated;
    });

    // Reset auto-save timer
    if (autoSaveDelay > 0 && onSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        if (data && isDirty) {
          save();
        }
      }, autoSaveDelay);
    }
  }, [originalData, autoSaveDelay, onSave, computeDirtyFields, data, isDirty]);

  // Save changes
  const save = useCallback(async () => {
    if (!data || !onSave || isSaving) return false;

    setIsSaving(true);
    try {
      await onSave(data);
      setOriginalData(data);
      setIsDirty(false);
      setDirtyFields([]);
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error("Failed to save:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, isSaving]);

  // Discard changes
  const discard = useCallback(() => {
    setData(originalData);
    setIsDirty(false);
    setDirtyFields([]);
  }, [originalData]);

  // Reset with new data (when selecting a different record)
  const reset = useCallback((newData: T | null) => {
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setData(newData);
    setOriginalData(newData);
    setIsDirty(false);
    setDirtyFields([]);
  }, []);

  // Check if we can navigate away
  const canNavigate = useCallback(async (onNavigate: () => void): Promise<boolean> => {
    if (!isDirty || !data) {
      onNavigate();
      return true;
    }

    if (onUnsavedChanges) {
      const action = await onUnsavedChanges(data);
      
      switch (action) {
        case "save":
          const saved = await save();
          if (saved) {
            onNavigate();
            return true;
          }
          return false;
        
        case "discard":
          discard();
          onNavigate();
          return true;
        
        case "cancel":
          return false;
      }
    } else {
      // Default behavior: auto-save
      const saved = await save();
      if (saved) {
        onNavigate();
        return true;
      }
      return false;
    }
  }, [isDirty, data, onUnsavedChanges, save, discard]);

  // Handle browser beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Update when initialData changes (new record selected)
  useEffect(() => {
    if (initialData !== originalData) {
      reset(initialData);
    }
  }, [initialData, originalData, reset]);

  return {
    data,
    originalData,
    isDirty,
    isSaving,
    dirtyFields,
    lastSaved,
    updateField,
    save,
    discard,
    reset,
    canNavigate,
    setData: (newData: T) => {
      setData(newData);
      const dirty = computeDirtyFields(newData, originalData);
      setDirtyFields(dirty);
      setIsDirty(dirty.length > 0);
    },
  };
}

/**
 * Hook that combines dirty state with navigation protection
 */
export function useNavigationGuard<T extends Record<string, unknown>>(
  options: UseDirtyStateOptions<T>
) {
  const dirtyState = useDirtyState(options);
  const [showDialog, setShowDialog] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const guardNavigation = useCallback((callback: () => void) => {
    if (!dirtyState.isDirty) {
      callback();
      return;
    }

    pendingCallbackRef.current = callback;
    setShowDialog(true);
  }, [dirtyState.isDirty]);

  const handleSave = useCallback(async () => {
    const saved = await dirtyState.save();
    if (saved) {
      setShowDialog(false);
      pendingCallbackRef.current?.();
      pendingCallbackRef.current = null;
    }
  }, [dirtyState]);

  const handleDiscard = useCallback(() => {
    dirtyState.discard();
    setShowDialog(false);
    pendingCallbackRef.current?.();
    pendingCallbackRef.current = null;
  }, [dirtyState]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    pendingCallbackRef.current = null;
  }, []);

  return {
    ...dirtyState,
    showDialog,
    guardNavigation,
    dialogProps: {
      isOpen: showDialog,
      onSave: handleSave,
      onDiscard: handleDiscard,
      onCancel: handleCancel,
      isSaving: dirtyState.isSaving,
      dirtyFields: dirtyState.dirtyFields,
    },
  };
}

// Re-export from the component
export { UnsavedChangesDialog } from "@/components/master-detail/unsaved-changes-dialog";
