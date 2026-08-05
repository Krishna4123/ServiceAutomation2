export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-[80px]">
      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" />
      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:0.2s]" />
      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:0.4s]" />
    </div>
  );
}
