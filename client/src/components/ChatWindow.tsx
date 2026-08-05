import { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSuggestedClick: (text: string) => void;
}

export default function ChatWindow({ messages, isTyping, onSuggestedClick }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xl font-bold shadow-sm">
            N
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">NovaSupport Workspace</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
            Initializing your secure support pipeline. Type a message or click a quick prompt from the sidebar to begin.
          </p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} onSuggestedClick={onSuggestedClick} />
        ))
      )}

      {isTyping && (
        <div className="flex justify-start my-4">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
