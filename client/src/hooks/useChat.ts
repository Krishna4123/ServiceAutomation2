import { useState, useEffect } from 'react';
import { Message } from '../types/chat';
import { sendMessage as apiSendMessage } from '../api/chat';
import { getHistory } from '../api/session';

export function useChat(sessionId: string | null, initialGreeting?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load history when session starts
  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      try {
        setError(null);
        const data = await getHistory(sessionId);
        if (data.history && data.history.length > 0) {
          const mapped: Message[] = data.history.map(h => ({
            role: h.role,
            content: h.content,
            timestamp: h.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(mapped);
        } else if (initialGreeting) {
          // If history is empty, seed greeting
          setMessages([
            {
              role: 'assistant',
              content: initialGreeting,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading history:', err);
        // Fallback to greeting on history fetch failure
        if (initialGreeting) {
          setMessages([
            {
              role: 'assistant',
              content: initialGreeting,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    };

    loadHistory();
  }, [sessionId, initialGreeting]);

  const sendMessage = async (text: string, channel: 'chat' | 'voice' = 'chat') => {
    if (!sessionId) return null;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const response = await apiSendMessage(sessionId, text, channel);

      // Infer status from backend response values
      let status: 'resolved' | 'clarifying' | 'escalated' = 'resolved';
      if (response.escalated) {
        status = 'escalated';
      } else if (response.intent === 'clarify') {
        status = 'clarifying';
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        status,
        escalated: response.escalated,
        sources: response.sources,
        suggested_actions: response.intent === 'clarify' ? ['I need warranty info', 'I need troubleshooting'] : [],
        escalation_info: response.escalation_info || (response.escalated ? {
          ticket_id: response.reply.match(/TKT-[A-Z0-9]+/)?.[0] || 'TKT-PENDING',
          reason: 'Auto-escalation triggered by agent rules',
          priority: 'normal'
        } : undefined)
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      return assistantMessage;
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
      setIsTyping(false);
      return null;
    }
  };

  return {
    messages,
    sendMessage,
    isTyping,
    error,
    clearHistory: () => setMessages([])
  };
}
