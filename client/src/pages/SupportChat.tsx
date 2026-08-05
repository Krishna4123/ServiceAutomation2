import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { AlertCircle } from 'lucide-react';

export default function SupportChat() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { sessionId, greeting, loading: sessionLoading, error: sessionError, resetSession } = useSession();
  const { messages, sendMessage, isTyping, error: chatError, clearHistory } = useChat(sessionId, greeting);
  const { isListening, startListening, stopListening, transcript, speak } = useVoice();

  // Show error messages as transient toasts
  useEffect(() => {
    const errorMsg = sessionError || chatError;
    if (errorMsg) {
      setToastMessage(errorMsg);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [sessionError, chatError]);

  const handleSend = async (text: string, channel: 'chat' | 'voice' = 'chat') => {
    const response = await sendMessage(text, channel);
    // If sent via voice, synthesize speech reply
    if (response && channel === 'voice') {
      speak(response.content);
    }
  };

  const handleSuggestedClick = (text: string) => {
    handleSend(text, 'chat');
  };

  const handleReset = () => {
    clearHistory();
    resetSession();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessionId={sessionId}
        onSuggestedClick={handleSuggestedClick}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onResetSession={handleReset}
          sessionId={sessionId}
        />

        {/* Global Loading / Info Indicators */}
        {sessionLoading && (
          <div className="bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 py-1.5 px-4 text-center text-xs font-semibold animate-pulse border-b border-brand-100 dark:border-brand-950/30">
            Establishing secure connection context...
          </div>
        )}

        {/* Interactive Chat Frame */}
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onSuggestedClick={handleSuggestedClick}
        />

        {/* Input Bar */}
        <ChatInput
          onSend={handleSend}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
          voiceTranscript={transcript}
          disabled={sessionLoading || !!sessionError}
        />

        {/* Error Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 p-4 rounded-xl bg-rose-600 text-white flex items-start gap-3 shadow-xl z-50 animate-bounce">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-medium leading-relaxed">
              <p>{toastMessage}</p>
              <button
                onClick={handleReset}
                className="mt-2 px-2.5 py-1 rounded bg-white/20 text-[10px] font-bold tracking-wide uppercase hover:bg-white/35 transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
