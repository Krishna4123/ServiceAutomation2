import { useState, useRef, useCallback } from 'react';
import { apiClient } from '../api/client';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';

export interface UseVoicePlaybackReturn {
  playbackState: PlaybackState;
  /** Fetch MP3 from /voice/speak and play it */
  speak: (text: string, voice?: string) => Promise<void>;
  /** Stop audio immediately */
  stop: () => void;
  errorMessage: string | null;
}

/**
 * useVoicePlayback — fetches TTS audio from POST /voice/speak and plays it
 * through the browser's Web Audio / HTMLAudioElement.
 *
 * Falls back silently to browser speechSynthesis if the backend call fails.
 */
export function useVoicePlayback(): UseVoicePlaybackReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    // Also kill any browser fallback speech
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaybackState('idle');
  }, []);

  const speak = useCallback(async (text: string, voice = 'alloy') => {
    // Stop any currently playing audio first
    stop();
    setErrorMessage(null);
    setPlaybackState('loading');

    // Strip markdown so TTS doesn't read symbols
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/`/g, '')
      .replace(/#/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace [link](url) with link text
      .trim();

    if (!cleanText) {
      setPlaybackState('idle');
      return;
    }

    try {
      const response = await apiClient.post(
        '/voice/speak',
        { text: cleanText, voice },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setPlaybackState('playing');
      audio.onended = () => {
        setPlaybackState('idle');
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      };
      audio.onerror = () => {
        setPlaybackState('error');
        setErrorMessage('Audio playback failed.');
      };

      await audio.play();
    } catch (err: any) {
      console.warn('Backend TTS failed, falling back to browser speech synthesis:', err);

      // Silent fallback — browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setPlaybackState('playing');
        utterance.onend = () => setPlaybackState('idle');
        utterance.onerror = () => {
          setPlaybackState('error');
          setErrorMessage('Speech synthesis failed.');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setPlaybackState('idle');
      }
    }
  }, [stop]);

  return { playbackState, speak, stop, errorMessage };
}
