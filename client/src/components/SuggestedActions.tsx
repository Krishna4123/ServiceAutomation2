interface SuggestedActionsProps {
  actions: string[];
  onClick: (action: string) => void;
}

export default function SuggestedActions({ actions, onClick }: SuggestedActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((act, idx) => (
        <button
          key={idx}
          onClick={() => onClick(act)}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
        >
          {act}
        </button>
      ))}
    </div>
  );
}
