import { X, Sparkles, BookOpen, AlertCircle, ShoppingBag, Radio } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  onSuggestedClick: (text: string) => void;
}

export default function Sidebar({ isOpen, onClose, sessionId, onSuggestedClick }: SidebarProps) {
  const quickPrompts = [
    { text: 'Where is my order ORD-100002?', icon: ShoppingBag, label: 'Order Status' },
    { text: 'My NovaPro headphones won\'t turn on', icon: Radio, label: 'Troubleshooting' },
    { text: 'What plans do you offer?', icon: BookOpen, label: 'Subscription Info' },
    { text: 'What is the return refund policy?', icon: Sparkles, label: 'Pricing & Refunds' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen md:h-[calc(100vh-4rem)] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Mobile Header */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Workspace Dashboard</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Session Information</span>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">ACTIVE ID</span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all select-all block mt-0.5">
                  {sessionId || 'Initializing...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-brand-500" />
                <span>Sandbox Dev Environment</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Quick Prompts</span>
            <div className="space-y-2">
              {quickPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSuggestedClick(p.text);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/10 transition-all group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/20 text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 mt-0.5">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">{p.label}</span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 leading-normal">{p.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>FastAPI Server Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
