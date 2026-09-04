export interface AgentToolCall {
  tool: string;
  params: Record<string, any>;
  result?: any;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ActiveTopic {
  topic: string;
  lastQuestion: string;
  dataAvailable?: boolean;
  missingData?: string;
  lastAnswer?: string;
  meta?: Record<string, any>;
}

export interface AgentQueryRequest {
  query: string;
  languageCode?: string;
  paymentId?: string;
  conversationHistory?: ConversationMessage[];
  activeTopic?: ActiveTopic;
  context?: {
    currentRoute?: string;
    selectedRegion?: string;
    role?: string;
  };
}

export interface AgentResponse {
  query: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  toolCalls: AgentToolCall[];
  languageCode: string;
  focusRegion?: string;
  navigationTarget?: string;
  activeTopic?: ActiveTopic;
  suggestedActions?: Array<{
    label: string;
    action: string;
    targetRoute?: string;
    payload?: any;
  }>;
  riskContext?: {
    paymentId: string;
    score: number;
    level: string;
    signals: string[];
  };
}

export interface RiskExplanationRequest {
  paymentId: string;
  languageCode?: string;
}
