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
  escalation_info?: EscalationInfo;
}

export interface EscalationInfo {
  ticket_id: string;
  reason: string;
  priority: string;
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
  escalated: boolean;
  escalation_info?: EscalationInfo;
  sources?: string[];
}
