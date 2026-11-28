import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * "Back" that returns to the page you came from (e.g. the exact chat you had
 * open). If this page was opened directly (no in-app history), it goes to
 * `fallback` instead of leaving the site.
 * @param {string} [fallback]
 * @returns {() => void}
 */
export function useGoBack(fallback = '/chat') {
  const navigate = useNavigate();
  const { key } = useLocation();
  return useCallback(() => {
    if (key !== 'default') navigate(-1);
    else navigate(fallback);
  }, [key, navigate, fallback]);
}
