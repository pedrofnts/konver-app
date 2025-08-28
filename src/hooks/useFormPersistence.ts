import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormPersistenceOptions {
  /**
   * Unique key for storing form data in sessionStorage
   */
  storageKey: string;
  
  /**
   * Initial form data - used when no persisted data is found
   */
  initialData: Record<string, unknown>;
  
  /**
   * Server data - used to detect conflicts between persisted and server state
   */
  serverData?: Record<string, unknown>;
  
  /**
   * Time in milliseconds to debounce persistence operations (default: 500ms)
   */
  debounceMs?: number;
  
  /**
   * Whether to enable automatic persistence (default: true)
   */
  enabled?: boolean;
}

interface UseFormPersistenceReturn<T> {
  /**
   * Current form data state
   */
  formData: T;
  
  /**
   * Set form data and persist to storage
   */
  setFormData: (data: T | ((prev: T) => T)) => void;
  
  /**
   * Update a specific field in the form
   */
  updateField: (field: keyof T, value: unknown) => void;
  
  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges: boolean;
  
  /**
   * Manually clear persisted data
   */
  clearPersistedData: () => void;
  
  /**
   * Reset form to initial or server data
   */
  resetForm: (useServerData?: boolean) => void;
  
  /**
   * Get the original (server) data for comparison
   */
  originalData: T;
  
  /**
   * Mark data as saved (removes unsaved changes flag)
   */
  markAsSaved: () => void;
  
  /**
   * Check if current data differs from server data
   */
  isDirty: boolean;
}

/**
 * Hook for automatic form persistence with session storage
 * Handles data restoration, conflict resolution, and unsaved changes detection
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  options: UseFormPersistenceOptions
): UseFormPersistenceReturn<T> {
  const {
    storageKey,
    initialData,
    serverData,
    debounceMs = 500,
    enabled = true
  } = options;

  const [formData, setFormDataState] = useState<T>(() => {
    if (!enabled || typeof window === 'undefined') {
      return (serverData as T) || (initialData as T);
    }

    try {
      const persisted = sessionStorage.getItem(storageKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        // Merge persisted data with current server data to handle new fields
        return { ...(serverData as T) || (initialData as T), ...parsed } as T;
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }

    return (serverData as T) || (initialData as T);
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const originalDataRef = useRef<T>((serverData as T) || (initialData as T));

  // Update original data reference when server data changes
  useEffect(() => {
    if (serverData) {
      originalDataRef.current = serverData as T;
    }
  }, [serverData]);

  // Debounced persistence function
  const persistFormData = useCallback((data: T) => {
    if (!enabled || typeof window === 'undefined') return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }, debounceMs);
  }, [storageKey, debounceMs, enabled]);

  // Check if form data differs from original data
  const isDirty = useCallback(() => {
    const original = originalDataRef.current;
    return Object.keys(formData).some(key => {
      const currentValue = formData[key];
      const originalValue = original[key];
      
      // Handle string comparison (trim whitespace)
      if (typeof currentValue === 'string' && typeof originalValue === 'string') {
        return currentValue.trim() !== originalValue.trim();
      }
      
      return currentValue !== originalValue;
    });
  }, [formData]);

  const setFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormDataState(prevData => {
      const newData = typeof data === 'function' ? data(prevData) : data;
      persistFormData(newData);
      setHasUnsavedChanges(true);
      return newData;
    });
  }, [persistFormData]);

  const updateField = useCallback((field: keyof T, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFormData]);

  const clearPersistedData = useCallback(() => {
    if (enabled && typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear persisted data:', error);
      }
    }
    setHasUnsavedChanges(false);
  }, [storageKey, enabled]);

  const resetForm = useCallback((useServerData = true) => {
    const resetData = useServerData && serverData ? serverData as T : initialData as T;
    setFormDataState(resetData);
    clearPersistedData();
    originalDataRef.current = resetData;
  }, [serverData, initialData, clearPersistedData]);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    clearPersistedData();
    originalDataRef.current = formData;
  }, [formData, clearPersistedData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  return {
    formData,
    setFormData,
    updateField,
    hasUnsavedChanges,
    clearPersistedData,
    resetForm,
    originalData: originalDataRef.current,
    markAsSaved,
    isDirty: isDirty()
  };
}