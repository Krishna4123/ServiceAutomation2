import { useState, useRef, useCallback } from 'react';
import { apiClient } from '../api/client';

export type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseVoiceRecorderReturn {
  recorderState: RecorderState;
  /** Start recording microphone audio */
  startRecording: () => Promise<void>;
  /** Stop recording, upload to /voice/transcribe, resolve with transcription */
  stopRecording: () => Promise<string | null>;
  /** Clear any error and reset to idle */
  resetRecorder: () => void;
  errorMessage: string | null;
  /** Peak audio level 0‒1 for a live visualisation (updated ~20× per second) */
  audioLevel: number;
}

/**
 * useVoiceRecorder — records microphone audio via MediaRecorder, uploads the
 * blob to POST /voice/transcribe and returns the Whisper transcription.
 *
 * The hook does NOT call sendMessage itself; the caller (SupportChat) decides
 * what to do with the returned text so it stays consistent with text-mode.
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // Audio-level visualisation
  // -------------------------------------------------------------------------
  const startLevelMonitor = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setAudioLevel(Math.min(rms * 4, 1)); // scale up a bit for visibility
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLevelMonitor = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // -------------------------------------------------------------------------
  // Start recording
  // -------------------------------------------------------------------------
  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access in your browser.'
        : `Could not access microphone: ${err?.message ?? err}`;
      setErrorMessage(msg);
      setRecorderState('error');
      return;
    }

    streamRef.current = stream;
    startLevelMonitor(stream);

    // Prefer webm/opus, fall back to whatever the browser supports
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100); // collect chunks every 100 ms
    setRecorderState('recording');
  }, [startLevelMonitor]);

  // -------------------------------------------------------------------------
  // Stop recording + transcribe
  // -------------------------------------------------------------------------
  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorderState !== 'recording') {
        resolve(null);
        return;
      }

      stopLevelMonitor();
      setRecorderState('processing');

      recorder.onstop = async () => {
        // Release mic
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setErrorMessage('No audio was captured. Please try again.');
          setRecorderState('error');
          resolve(null);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', blob, `recording.${ext}`);
          const { data } = await apiClient.post<{ transcription: string }>(
            '/voice/transcribe',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          setRecorderState('idle');
          resolve(data.transcription ?? null);
        } catch (err: any) {
          const detail = err?.response?.data?.detail ?? err?.message ?? 'Unknown error';
          setErrorMessage(`Transcription failed: ${detail}`);
          setRecorderState('error');
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [recorderState, stopLevelMonitor]);

  const resetRecorder = useCallback(() => {
    setRecorderState('idle');
    setErrorMessage(null);
    setAudioLevel(0);
  }, []);

  return { recorderState, startRecording, stopRecording, resetRecorder, errorMessage, audioLevel };
}
