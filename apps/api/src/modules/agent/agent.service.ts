import { GeminiOrchestrator } from '@deepaudit/ai-agent';
import { AgentResponse, Payment, ConversationMessage, ActiveTopic } from '@deepaudit/shared-types';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import { envConfig } from '../../config/env.config';

export class AgentService {
  private static instance: AgentService;
  private paymentsService = PaymentsService.getInstance();
  private auditService = AuditService.getInstance();

  private constructor() {}

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  private getOrchestrator(): GeminiOrchestrator {
    return new GeminiOrchestrator(envConfig.geminiApiKey);
  }

  /**
   * Explains deterministic risk factors for a specific payment using Gemini.
   */
  async explainPaymentRisk(paymentId: string, languageCode: string = 'en', actor: any): Promise<string> {
    const payment = this.paymentsService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    if (!payment.riskAssessment) {
      throw new Error(`Payment ${paymentId} does not have a completed risk assessment.`);
    }

    this.auditService.log({
      eventType: 'AI_EXPLANATION_REQUESTED',
      actorId: actor?.id || 'usr_corp_maker_01',
      actorName: actor?.name || 'Treasury Officer',
      actorRole: actor?.role || 'MAKER',
      targetEntity: 'PAYMENT',
      targetId: paymentId,
      orgId: actor?.orgId || 'org_acme_corp',
      summary: `AI risk explanation requested for payment ${payment.referenceNumber} in ${languageCode}`,
      metadata: { paymentId, languageCode }
    });

    const orchestrator = this.getOrchestrator();
    const explanation = await orchestrator.explainRisk(payment, payment.riskAssessment, languageCode);

    payment.riskAssessment.aiExplanation = explanation;

    this.auditService.log({
      eventType: 'AI_EXPLANATION_GENERATED',
      actorId: 'gemini_agent_service',
      actorName: 'DeepAudit Gemini Service',
      actorRole: 'AI_AGENT',
      targetEntity: 'PAYMENT',
      targetId: paymentId,
      orgId: actor?.orgId || 'org_acme_corp',
      summary: `AI risk explanation generated and validated for payment ${payment.referenceNumber}`,
      metadata: { paymentId, explanationLength: explanation.length }
    });

    return explanation;
  }

  /**
   * Process interactive treasury / fraud query with conversation memory and active topic tracking.
   */
  async processQuery(
    query: string,
    languageCode: string = 'en',
    actor: any,
    conversationHistory?: ConversationMessage[],
    activeTopic?: ActiveTopic
  ): Promise<AgentResponse> {
    const q = query.toLowerCase();

    // 1. Detect Intent with Context Resolution
    let intent = 'GENERAL_QUERY';
    if (q.includes('yesterday') || q.includes('நேற்று') || q.includes('कल')) {
      intent = 'YESTERDAY_REVENUE';
    } else if (q.includes('fail') || q.includes('error') || q.includes('தோல்வி') || q.includes('ஃபெயில்')) {
      intent = 'PAYMENT_FAILURES';
    } else if (q.includes('collection') || q.includes('today') || q.includes('இன்னைக்கு') || q.includes('வசூல்')) {
      intent = 'TODAY_COLLECTION';
    } else if (q.includes('coimbatore') || q.includes('chennai') || q.includes('trichy') || q.includes('கோயம்புத்தூர்')) {
      intent = 'REGIONAL_METRICS';
    } else if (q.includes('last month') || q.includes('previous month') || q.includes('கடந்த மாதம்')) {
      intent = 'LAST_MONTH_REVENUE';
    } else if (activeTopic) {
      intent = `FOLLOW_UP_ON_${activeTopic.topic.toUpperCase()}`;
    }

    // 2. Select strictly relevant business telemetry (No unrelated metric dumping)
    let relevantData: Record<string, any> = {};

    if (intent === 'PAYMENT_FAILURES' || activeTopic?.topic === 'payment_failures') {
      relevantData = {
        overallSuccessRate: '96.8%',
        failureLogsAvailable: false,
        note: 'Detailed bank error codes and gateway drop logs are not connected.'
      };
    } else if (intent === 'YESTERDAY_REVENUE' || activeTopic?.topic === 'yesterday_revenue') {
      relevantData = {
        yesterdayRevenueAvailable: false,
        connectedLedgerDateRange: 'Current day and monthly aggregate only.'
      };
    } else if (intent === 'TODAY_COLLECTION' || activeTopic?.topic === 'today_collection') {
      relevantData = {
        todayCollectionINR: 145000,
        todayTransactionsCount: 42,
        todaySettlementRatePercent: 98
      };
    } else if (intent === 'REGIONAL_METRICS' || activeTopic?.topic === 'coimbatore' || activeTopic?.topic === 'chennai') {
      relevantData = {
        regionalHighlights: {
          Coimbatore: 'Top performing city with ₹8.2 Lakh monthly volume, +31% growth',
          Chennai: '₹3.1 Lakh monthly volume, steady growth',
          Trichy: 'Payments down 8% this week due to lower new customer acquisition'
        }
      };
    } else if (intent === 'LAST_MONTH_REVENUE' || activeTopic?.topic === 'last_month_revenue') {
      relevantData = {
        currentMonthlyRevenueINR: 1240000,
        monthlyGrowthPercent: 18,
        previousMonthCalculatedINR: 1050847
      };
    } else {
      relevantData = {
        monthlyRevenueINR: 1240000,
        monthlyGrowthPercent: 18,
        overallSuccessRate: '96.8%'
      };
    }

    // 3. Debugging logs as requested
    console.log("Current User Message:", query);
    console.log("Active Topic:", activeTopic || 'None');
    console.log("Recent Conversation:", conversationHistory || []);
    console.log("Detected Intent:", intent);
    console.log("Relevant Data:", relevantData);

    // 4. Dispatch to Gemini Orchestrator
    const orchestrator = this.getOrchestrator();
    const response = await orchestrator.processQuery(
      query,
      relevantData,
      languageCode,
      conversationHistory,
      activeTopic
    );

    return response;
  }
}
