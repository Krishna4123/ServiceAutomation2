import { MessageSquare, Mic } from 'lucide-react';
import type { Mode } from '../hooks/useMode';

interface ModeToggleProps {
  mode: Mode;
  onToggle: () => void;
}

/**
 * ModeToggle — a compact pill button that switches between text and voice mode.
 * Designed to sit in the Header's right-hand action cluster.
 */
export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  const isVoice = mode === 'voice';

  return (
    <button
      id="mode-toggle-btn"
      onClick={onToggle}
      title={isVoice ? 'Switch to text mode' : 'Switch to voice mode'}
      aria-label={isVoice ? 'Switch to text mode' : 'Switch to voice mode'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-300 border select-none cursor-pointer
        ${
          isVoice
            ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/20'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      {isVoice ? (
        <>
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Voice</span>
        </>
      ) : (
        <>
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Text</span>
        </>
      )}
    </button>
  );
}
