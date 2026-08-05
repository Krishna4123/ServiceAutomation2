export function getOrGenerateSessionId(): string {
  let sessionId = localStorage.getItem('nova_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('nova_session_id', sessionId);
  }
  return sessionId;
}

export function clearSessionId(): void {
  localStorage.removeItem('nova_session_id');
}
