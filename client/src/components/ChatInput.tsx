import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, channel?: 'chat' | 'voice') => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  voiceTranscript: string;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  isListening,
  startListening,
  stopListening,
  voiceTranscript,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync transcription to text input
  useEffect(() => {
    if (voiceTranscript) {
      setInput(prev => {
        // If there's already text, append the transcript
        return prev ? `${prev.trim()} ${voiceTranscript}` : voiceTranscript;
      });
    }
  }, [voiceTranscript]);

  // Adjust input height automatically based on content size
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim(), isListening ? 'voice' : 'chat');
    setInput('');
    if (isListening) {
      stopListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all max-w-4xl mx-auto">
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          title={isListening ? 'Stop Listening' : 'Use Voice Input'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : 'Ask about orders, plans, or troubleshoot a device...'}
          className="flex-1 bg-transparent border-0 outline-0 ring-0 focus:ring-0 text-sm py-2 px-1 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none min-h-[36px]"
          disabled={disabled}
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-white disabled:text-slate-400 dark:disabled:text-slate-600 transition-all shadow-md shadow-brand-500/10 cursor-pointer flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
