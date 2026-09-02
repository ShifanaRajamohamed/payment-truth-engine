/** All typed interfaces for the Dhwani agent system. */

export type AgentIntent =
  | 'GET_BUSINESS_OVERVIEW'
  | 'GET_REVENUE'
  | 'GET_REGION_REVENUE'
  | 'GET_BEST_REGION'
  | 'GET_PAYMENT_STATUS'
  | 'GET_FAILED_PAYMENTS'
  | 'GET_PAYMENT_METHODS'
  | 'GET_CUSTOMERS'
  | 'GET_REPEAT_CUSTOMERS'
  | 'EXPLAIN_METRIC'
  | 'NAVIGATE_MAP'
  | 'NAVIGATE_PAYMENTS'
  | 'NAVIGATE_CUSTOMERS'
  | 'NAVIGATE_DECISION_LAB'
  | 'NAVIGATE_INSIGHTS'
  | 'RUN_SIMULATION'
  | 'GET_RECOMMENDATIONS'
  | 'REGION_WHY_DOWN'
  | 'UNKNOWN';

export interface AgentToolCall {
  tool: string;
  params: Record<string, unknown>;
}

export interface SimulationParams {
  region: string;
  segment: 'repeat' | 'new' | 'high_value' | 'all';
  discountPct: number;
  durationDays: number;
}

export interface SimulationResult {
  params: SimulationParams;
  revenueChangeFmt: string;    // "+₹18,000" or "−₹5,000"
  revenueChangeSign: '+' | '-' | '~';
  orderChangeFmt: string;      // "+120"
  orderChangeSign: '+' | '-' | '~';
  returnChangeLabel: string;   // plain language
  recommendation: string;      // plain language
  disclaimer: string;
  isEstimate: true;
}

export interface AgentResponse {
  intent: AgentIntent;
  text: string;                // plain-language response (already translated)
  toolCalls: AgentToolCall[];
  navigationTarget?: string;   // Angular route e.g. '/app/map'
  focusRegion?: string;        // city name to focus on map
  simulationResult?: SimulationResult;
  confidence: 'high' | 'medium' | 'low';
}
