import { Cpu, Menu, RefreshCw, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  onResetSession: () => void;
  sessionId: string | null;
}

export default function Header({ onMenuToggle, onResetSession, sessionId }: HeaderProps) {
  const [darkMode, setDarkMode] = useState<boolean>(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">NovaSupport</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Agent Desk</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {sessionId && (
          <button
            onClick={onResetSession}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Reset Session"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
