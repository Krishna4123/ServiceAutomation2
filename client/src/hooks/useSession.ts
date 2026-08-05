import { useState, useEffect } from 'react';
import { getOrGenerateSessionId } from '../utils/uuid';
import { startSession } from '../api/session';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>('Hello! How can I help you today?');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initSession = async (forceNew = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let currentSessionId = getOrGenerateSessionId();
      if (forceNew) {
        currentSessionId = crypto.randomUUID();
        localStorage.setItem('nova_session_id', currentSessionId);
      }
      
      const sessionData = await startSession();
      // Use backend returned session_id if provided
      const resolvedSessionId = sessionData.session_id || currentSessionId;
      localStorage.setItem('nova_session_id', resolvedSessionId);
      setSessionId(resolvedSessionId);

      if (sessionData.greeting) {
        setGreeting(sessionData.greeting);
      }
    } catch (err: any) {
      console.error('Failed to initialize session:', err);
      setError('Could not connect to the backend server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  return { sessionId, greeting, loading, error, resetSession: () => initSession(true) };
}
