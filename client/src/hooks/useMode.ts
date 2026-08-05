import { useState, useCallback } from 'react';

export type Mode = 'text' | 'voice';

/**
 * useMode — tracks the current interaction mode (text vs. voice).
 *
 * All components that need to react to mode changes should call this hook
 * (or accept `mode` / `setMode` as props from a common ancestor).
 */
export function useMode() {
  const [mode, setModeState] = useState<Mode>('text');

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'text' ? 'voice' : 'text'));
  }, []);

  return { mode, setMode, toggleMode };
}
