"use client";

/**
 * useOrderExtraction Hook
 * 
 * Handles AI-powered order extraction with streaming support
 * for progressive field population and visual feedback.
 */

import { useState, useCallback, useRef } from "react";
import type { ExtractedOrder } from "../types/extraction";
import {
  parseCompletedFields,
  looksLikeOrderRequest,
  mapExtractedToFormData,
} from "../lib/orderExtraction";

export interface UseOrderExtractionOptions {
  /** Callback when form data should be updated */
  onFormUpdate?: (data: Record<string, unknown>) => void;
  /** Current form data for merging */
  currentFormData?: Record<string, unknown>;
  /** Auto-trigger extraction for text that looks like an order */
  autoExtract?: boolean;
  /** Minimum text length to auto-extract */
  minAutoExtractLength?: number;
}

export interface UseOrderExtractionReturn {
  /** Whether extraction is in progress */
  isExtracting: boolean;
  /** Set of field paths that were just extracted (for highlight) */
  extractedFields: Set<string>;
  /** Error message if extraction failed */
  error: string | null;
  /** Progress indicator (0-100) */
  progress: number;
  /** Complete extracted data */
  extractedData: ExtractedOrder | null;
  /** Extract from text */
  extractFromText: (text: string) => Promise<ExtractedOrder | null>;
  /** Extract from image file */
  extractFromImage: (file: File) => Promise<ExtractedOrder | null>;
  /** Check if text looks like an order */
  shouldAutoExtract: (text: string) => boolean;
  /** Clear extraction state */
  reset: () => void;
}

const HIGHLIGHT_DURATION = 1500; // ms to show green highlight

export function useOrderExtraction(
  options: UseOrderExtractionOptions = {}
): UseOrderExtractionReturn {
  const {
    onFormUpdate,
    currentFormData = {},
    autoExtract = true,
    minAutoExtractLength = 100,
  } = options;

  // State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedOrder | null>(null);

  // Track emitted fields to avoid duplicates
  const emittedFieldsRef = useRef<Set<string>>(new Set());
  const highlightTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Add field to highlighted set and schedule removal
   */
  const highlightField = useCallback((path: string) => {
    // Clear existing timer for this field
    const existingTimer = highlightTimersRef.current.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Add to highlighted fields
    setExtractedFields((prev) => new Set(prev).add(path));

    // Schedule removal
    const timer = setTimeout(() => {
      setExtractedFields((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
      highlightTimersRef.current.delete(path);
    }, HIGHLIGHT_DURATION);

    highlightTimersRef.current.set(path, timer);
  }, []);

  /**
   * Process streaming SSE response
   */
  const processStream = useCallback(
    async (
      response: Response,
      onComplete: (data: ExtractedOrder) => void
    ) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "partial") {
                // Extract completed fields from partial JSON
                const fields = parseCompletedFields(parsed.json);
                
                for (const [fieldName, value] of Object.entries(fields)) {
                  if (!emittedFieldsRef.current.has(fieldName)) {
                    emittedFieldsRef.current.add(fieldName);
                    highlightField(fieldName);
                    
                    // Estimate progress based on common fields
                    const fieldCount = emittedFieldsRef.current.size;
                    setProgress(Math.min(fieldCount * 5, 90));
                  }
                }
              } else if (parsed.type === "complete") {
                setProgress(100);
                onComplete(parsed.data as ExtractedOrder);
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
    [highlightField]
  );

  /**
   * Extract order from text
   */
  const extractFromText = useCallback(
    async (text: string): Promise<ExtractedOrder | null> => {
      if (!text.trim()) return null;

      setIsExtracting(true);
      setError(null);
      setProgress(5);
      emittedFieldsRef.current = new Set();
      setExtractedFields(new Set());

      try {
        const response = await fetch("/api/ai/extract-order-streaming", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, stream: true }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Extraction failed");
        }

        let result: ExtractedOrder | null = null;

        await processStream(response, (data) => {
          result = data;
          setExtractedData(data);

          // Map to form data and update
          if (onFormUpdate) {
            const formData = mapExtractedToFormData(data, currentFormData);
            onFormUpdate(formData);
          }

          // Highlight all extracted top-level fields
          const allFields = getAllFieldPaths(data);
          allFields.forEach(highlightField);
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Extraction failed";
        setError(message);
        console.error("Order extraction error:", err);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [currentFormData, highlightField, onFormUpdate, processStream]
  );

  /**
   * Extract order from image file
   */
  const extractFromImage = useCallback(
    async (file: File): Promise<ExtractedOrder | null> => {
      setIsExtracting(true);
      setError(null);
      setProgress(5);
      emittedFieldsRef.current = new Set();
      setExtractedFields(new Set());

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch("/api/ai/extract-order-streaming", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, stream: true }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Extraction failed");
        }

        let result: ExtractedOrder | null = null;

        await processStream(response, (data) => {
          result = data;
          setExtractedData(data);

          // Map to form data and update
          if (onFormUpdate) {
            const formData = mapExtractedToFormData(data, currentFormData);
            onFormUpdate(formData);
          }

          // Highlight all extracted top-level fields
          const allFields = getAllFieldPaths(data);
          allFields.forEach(highlightField);
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Extraction failed";
        setError(message);
        console.error("Order extraction error:", err);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [currentFormData, highlightField, onFormUpdate, processStream]
  );

  /**
   * Check if text should trigger auto-extraction
   */
  const shouldAutoExtract = useCallback(
    (text: string): boolean => {
      if (!autoExtract) return false;
      if (text.length < minAutoExtractLength) return false;
      return looksLikeOrderRequest(text);
    },
    [autoExtract, minAutoExtractLength]
  );

  /**
   * Reset extraction state
   */
  const reset = useCallback(() => {
    setIsExtracting(false);
    setExtractedFields(new Set());
    setError(null);
    setProgress(0);
    setExtractedData(null);
    emittedFieldsRef.current = new Set();

    // Clear all highlight timers
    highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
    highlightTimersRef.current.clear();
  }, []);

  return {
    isExtracting,
    extractedFields,
    error,
    progress,
    extractedData,
    extractFromText,
    extractFromImage,
    shouldAutoExtract,
    reset,
  };
}

/**
 * Get all field paths from extracted data for highlighting
 */
function getAllFieldPaths(data: ExtractedOrder): string[] {
  const paths: string[] = [];

  if (data.customer) paths.push("customer", "customerName");
  if (data.equipment?.type) paths.push("equipment.type", "equipmentType");
  if (data.equipment?.size) paths.push("equipment.size", "equipmentLength");

  // Handle multi-stop orders
  if (data.stops && data.stops.length > 0) {
    data.stops.forEach((stop, idx) => {
      const prefix = `stops.${idx}`;
      if (stop.facilityName) paths.push(`${prefix}.locationName`);
      if (stop.streetAddress) paths.push(`${prefix}.streetAddress`);
      if (stop.city) paths.push(`${prefix}.city`);
      if (stop.state) paths.push(`${prefix}.state`);
      if (stop.zip) paths.push(`${prefix}.postalCode`);
      if (stop.country) paths.push(`${prefix}.country`);
      if (stop.contactName) paths.push(`${prefix}.contactName`);
      if (stop.contactPhone) paths.push(`${prefix}.contactPhone`);
      if (stop.appointmentDate) paths.push(`${prefix}.appointmentStart`, `${prefix}.appointmentEnd`);
    });
  } else {
    // Legacy single pickup/delivery
    if (data.pickup) {
      const p = data.pickup;
      if (p.facilityName) paths.push("pickup.facilityName", "stops.0.locationName");
      if (p.streetAddress) paths.push("pickup.streetAddress", "stops.0.streetAddress");
      if (p.city) paths.push("pickup.city", "stops.0.city");
      if (p.state) paths.push("pickup.state", "stops.0.state");
      if (p.zip) paths.push("pickup.zip", "stops.0.postalCode");
      if (p.contactName) paths.push("pickup.contactName", "stops.0.contactName");
      if (p.contactPhone) paths.push("pickup.contactPhone", "stops.0.contactPhone");
      if (p.appointmentDate) paths.push("stops.0.appointmentStart");
    }

    if (data.delivery) {
      const d = data.delivery;
      if (d.facilityName) paths.push("delivery.facilityName", "stops.1.locationName");
      if (d.streetAddress) paths.push("delivery.streetAddress", "stops.1.streetAddress");
      if (d.city) paths.push("delivery.city", "stops.1.city");
      if (d.state) paths.push("delivery.state", "stops.1.state");
      if (d.zip) paths.push("delivery.zip", "stops.1.postalCode");
      if (d.contactName) paths.push("delivery.contactName", "stops.1.contactName");
      if (d.contactPhone) paths.push("delivery.contactPhone", "stops.1.contactPhone");
      if (d.appointmentDate) paths.push("stops.1.appointmentStart");
    }
  }

  // Freight fields
  if (data.freight) {
    const f = data.freight;
    if (f.commodity) paths.push("freight.commodity", "freightItems.0.commodity");
    if (f.weight) paths.push("freight.weight", "freightItems.0.weightLbs", "totalWeightLbs");
    if (f.pallets) paths.push("freight.pallets", "freightItems.0.quantity", "totalPallets");
    if (f.pieces) paths.push("freight.pieces", "freightItems.0.pieces", "totalPieces");
    if (f.hazmat != null) paths.push("freight.hazmat", "freightItems.0.isHazmat");
  }

  // Other fields
  if (data.quotedRate) paths.push("quotedRate");
  if (data.serviceType) paths.push("serviceType", "isDirect");
  if (data.source) paths.push("source", "sourceChannel");
  if (data.specialInstructions) paths.push("specialInstructions");
  if (data.references?.length) paths.push("references");
  if (data.accessorials?.length) paths.push("accessorials");

  return paths;
}

export default useOrderExtraction;
