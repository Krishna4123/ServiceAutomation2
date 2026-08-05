import { User, Cpu, HelpCircle } from 'lucide-react';
import { Message } from '../types/chat';
import SourcesFootnote from './SourcesFootnote';
import SuggestedActions from './SuggestedActions';
import EscalationCard from './EscalationCard';

interface MessageBubbleProps {
  message: Message;
  onSuggestedClick: (text: string) => void;
}

export default function MessageBubble({ message, onSuggestedClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (message.status === 'escalated' && message.escalation) {
    return (
      <div className="flex justify-start items-start gap-3 my-4 animate-fade-in">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <EscalationCard escalation={message.escalation} />
          {message.timestamp && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1.5 ml-1">
              {message.timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 group ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Cpu className="w-4 h-4" />
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none'
          }`}
        >
          {/* Main message text */}
          <div className="whitespace-pre-wrap font-normal select-text">{message.content}</div>

          {/* Status Badges */}
          {!isUser && message.status === 'clarifying' && (
            <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Needs Clarification</span>
            </div>
          )}

          {/* Sources Footnote */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourcesFootnote sources={message.sources} />
          )}
        </div>

        {/* Suggested Actions chips outside bubble for spacing */}
        {!isUser && message.suggested_actions && message.suggested_actions.length > 0 && (
          <SuggestedActions actions={message.suggested_actions} onClick={onSuggestedClick} />
        )}

        {message.timestamp && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 block select-none">
            {message.timestamp}
          </span>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
