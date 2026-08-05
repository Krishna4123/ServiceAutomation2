import { Mic, MicOff, Volume2, Loader2, AlertCircle, XCircle } from 'lucide-react';
import type { RecorderState } from '../hooks/useVoiceRecorder';
import type { PlaybackState } from '../hooks/useVoicePlayback';

interface VoiceModeUIProps {
  recorderState: RecorderState;
  playbackState: PlaybackState;
  audioLevel: number;       // 0‒1 live amplitude
  recorderError: string | null;
  playbackError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopPlayback: () => void;
  onResetError: () => void;
  disabled?: boolean;
}

/**
 * VoiceModeUI — full-width voice interaction panel shown when mode === 'voice'.
 *
 * State machine visual:
 *  idle          → pulsing orb, "Tap to speak" prompt
 *  recording     → animated waveform bars using audioLevel, "Listening…"
 *  processing    → spinner, "Transcribing…"
 *  playing       → speaker wave icon, "Speaking…"
 *  error         → red alert, error message with retry
 */
export default function VoiceModeUI({
  recorderState,
  playbackState,
  audioLevel,
  recorderError,
  playbackError,
  onStartRecording,
  onStopRecording,
  onStopPlayback,
  onResetError,
  disabled = false,
}: VoiceModeUIProps) {
  const error = recorderError || playbackError;

  // Derive a single top-level state for rendering
  const isRecording = recorderState === 'recording';
  const isProcessing = recorderState === 'processing';
  const isPlaying = playbackState === 'playing' || playbackState === 'loading';
  const isError = recorderState === 'error' || playbackState === 'error';
  const isIdle = !isRecording && !isProcessing && !isPlaying && !isError;

  // ── Waveform bars (8 bars, height driven by audioLevel + random jitter) ──
  const bars = Array.from({ length: 8 }, (_, i) => {
    const base = isRecording ? audioLevel : 0;
    const jitter = isRecording ? Math.sin(Date.now() / 100 + i * 0.7) * 0.15 : 0;
    const height = Math.max(0.08, Math.min(1, base + jitter));
    return height;
  });

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[180px] select-none">

      {/* ── State visual ── */}
      <div className="flex flex-col items-center gap-3">

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-xs text-rose-500 font-medium text-center max-w-xs leading-snug">
              {error ?? 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={onResetError}
              className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 underline"
            >
              <XCircle className="w-3 h-3" /> Dismiss
            </button>
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
            <p className="text-xs text-violet-500 font-semibold tracking-wide uppercase">Transcribing…</p>
          </div>
        )}

        {/* Playing state */}
        {isPlaying && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xs text-emerald-500 font-semibold tracking-wide uppercase">Speaking…</p>
            <button
              onClick={onStopPlayback}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
            >
              Stop
            </button>
          </div>
        )}

        {/* Recording state — live waveform bars */}
        {isRecording && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-end gap-1 h-16 px-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-violet-500 transition-all"
                  style={{ height: `${Math.round(h * 56)}px`, opacity: 0.7 + h * 0.3 }}
                />
              ))}
            </div>
            <p className="text-xs text-violet-500 font-semibold tracking-wide uppercase animate-pulse">
              Listening…
            </p>
          </div>
        )}

        {/* Idle state — pulsing orb */}
        {isIdle && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16">
              {/* Outer pulse ring */}
              <span className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping" />
              <button
                id="voice-orb-btn"
                onClick={onStartRecording}
                disabled={disabled}
                className="relative w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
                title="Tap to speak"
              >
                <Mic className="w-7 h-7" />
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {disabled ? 'Connecting…' : 'Tap to speak'}
            </p>
          </div>
        )}

      </div>

      {/* ── Mic / Stop action button shown during recording ── */}
      {isRecording && (
        <button
          id="voice-stop-btn"
          onClick={onStopRecording}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <MicOff className="w-4 h-4" />
          Stop Recording
        </button>
      )}
    </div>
  );
}
