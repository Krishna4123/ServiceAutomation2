export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  intent?: string;
  status?: 'resolved' | 'clarifying' | 'escalated';
  missing_slots?: string[];
  escalated?: boolean;
  sources?: string[];
  suggested_actions?: string[];
  escalation?: EscalationInfo;
}

export interface EscalationInfo {
  reason: string;
  ticket_id: string;
  summary: string;
}

export interface SessionStartResponse {
  session_id: string;
  greeting?: string;
  message?: string;
}

export interface HistoryResponse {
  session_id: string;
  history: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }[];
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  intent?: string;
  status?: 'resolved' | 'clarifying' | 'escalated';
  missing_slots?: string[];
  escalated?: boolean;
  sources?: string[];
  suggested_actions?: string[];
  escalation?: EscalationInfo;
}
