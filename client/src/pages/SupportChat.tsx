import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import VoiceModeUI from '../components/VoiceModeUI';
import ModeToggle from '../components/ModeToggle';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';
import { useMode } from '../hooks/useMode';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoicePlayback } from '../hooks/useVoicePlayback';
import { AlertCircle } from 'lucide-react';

export default function SupportChat() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Core state ──────────────────────────────────────────────────────────
  const { sessionId, greeting, loading: sessionLoading, error: sessionError, resetSession } = useSession();
  const { messages, sendMessage, isTyping, error: chatError, clearHistory } = useChat(sessionId, greeting);

  // ── Mode (text vs. voice) ────────────────────────────────────────────────
  const { mode, toggleMode } = useMode();

  // ── Voice hooks ──────────────────────────────────────────────────────────
  const {
    recorderState,
    startRecording,
    stopRecording,
    resetRecorder,
    errorMessage: recorderError,
    audioLevel,
  } = useVoiceRecorder();

  const {
    playbackState,
    speak,
    stop: stopPlayback,
    errorMessage: playbackError,
  } = useVoicePlayback();

  // ── Error toasts ─────────────────────────────────────────────────────────
  useEffect(() => {
    const errorMsg = sessionError || chatError;
    if (!errorMsg) return;
    setToastMessage(errorMsg);
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [sessionError, chatError]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Send a text message, optionally synthesising the reply with TTS. */
  const handleSend = async (text: string, channel: 'chat' | 'voice' = 'chat'): Promise<void> => {
    const response = await sendMessage(text, channel);
    if (response && channel === 'voice') {
      void speak(response.content);
    }
  };

  /** Called when user taps "Stop Recording" in VoiceModeUI. */
  const handleStopRecording = async () => {
    const transcription = await stopRecording();
    if (transcription && transcription.trim()) {
      await handleSend(transcription.trim(), 'voice');
    }
  };

  const handleSuggestedClick = (text: string) => {
    handleSend(text, 'chat');
  };

  const handleReset = () => {
    clearHistory();
    resetSession();
    stopPlayback();
    resetRecorder();
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
          actions={<ModeToggle mode={mode} onToggle={toggleMode} />}
        />

        {/* Session loading banner */}
        {sessionLoading && (
          <div className="bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 py-1.5 px-4 text-center text-xs font-semibold animate-pulse border-b border-brand-100 dark:border-brand-950/30">
            Establishing secure connection context…
          </div>
        )}

        {/* ── Chat transcript (always visible) ── */}
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onSuggestedClick={handleSuggestedClick}
        />

        {/* ── Input layer — switches based on mode ── */}
        {mode === 'text' ? (
          <ChatInput
            onSend={handleSend}
            /* In text mode we pass no-ops for legacy voice mic button */
            isListening={false}
            startListening={() => {}}
            stopListening={() => {}}
            voiceTranscript=""
            disabled={sessionLoading || !!sessionError}
          />
        ) : (
          <VoiceModeUI
            recorderState={recorderState}
            playbackState={playbackState}
            audioLevel={audioLevel}
            recorderError={recorderError}
            playbackError={playbackError}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
            onStopPlayback={stopPlayback}
            onResetError={resetRecorder}
            disabled={sessionLoading || !!sessionError}
          />
        )}

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
