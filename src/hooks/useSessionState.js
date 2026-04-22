import { useState, useEffect } from 'react';

/**
 * A custom hook that behaves exactly like useState, but synchronizes 
 * the state with the browser's sessionStorage.
 *
 * @param {string} key - The unique session storage key
 * @param {any} initialValue - The fallback value if key doesn't exist
 * @returns {[any, function]} State and state setter
 */
export function useSessionState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = sessionStorage.getItem(key);
      // We parse the JSON, but catch exceptions in case it's malformed
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}
