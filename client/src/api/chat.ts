import { apiClient } from './client';
import { ChatResponse } from '../types/chat';

export async function sendMessage(
  sessionId: string,
  message: string,
  channel: 'chat' | 'voice' = 'chat'
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/chat', {
    session_id: sessionId,
    message,
    channel,
  });
  return response.data;
}
