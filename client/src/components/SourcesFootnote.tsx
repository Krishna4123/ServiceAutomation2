import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface SourcesFootnoteProps {
  sources: string[];
}

export default function SourcesFootnote({ sources }: SourcesFootnoteProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Sourced from policy docs ({sources.length})</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <ul className="mt-2 space-y-1 pl-5 list-disc text-[11px] text-slate-500 dark:text-slate-400">
          {sources.map((src, idx) => (
            <li key={idx}>
              <span className="font-mono">{src}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
