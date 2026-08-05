import { apiClient } from './client';
import { SessionStartResponse, HistoryResponse } from '../types/chat';

export async function startSession(): Promise<SessionStartResponse> {
  const response = await apiClient.post<SessionStartResponse>('/session/start', {});
  return response.data;
}

export async function getHistory(sessionId: string): Promise<HistoryResponse> {
  const response = await apiClient.get<HistoryResponse>(`/session/${sessionId}/history`);
  return response.data;
}
