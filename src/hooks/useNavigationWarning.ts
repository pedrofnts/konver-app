import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseNavigationWarningOptions {
  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;
  
  /**
   * Custom message for the warning dialog
   */
  message?: string;
  
  /**
   * Whether to enable the warning (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to warn users about unsaved changes when navigating away
 * Handles both browser navigation (refresh/close) and React Router navigation
 */
export function useNavigationWarning({ 
  hasUnsavedChanges, 
  message = "Você tem alterações não salvas. Deseja sair mesmo assim?",
  enabled = true 
}: UseNavigationWarningOptions) {
  // Handle browser refresh/close
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message, enabled]);

  // Custom navigation function that prompts for confirmation
  const navigateWithWarning = useCallback((path: string, navigate: ReturnType<typeof useNavigate>) => {
    if (!enabled || !hasUnsavedChanges) {
      navigate(path);
      return;
    }

    const confirmed = window.confirm(message);
    if (confirmed) {
      navigate(path);
    }
  }, [hasUnsavedChanges, message, enabled]);

  // Function to check if navigation should be blocked
  const shouldBlockNavigation = useCallback(() => {
    return enabled && hasUnsavedChanges;
  }, [enabled, hasUnsavedChanges]);

  return {
    shouldBlockNavigation,
    navigateWithWarning
  };
}