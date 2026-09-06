import { GeminiOrchestrator } from '@deepaudit/ai-agent';
import { AgentResponse, Payment, ConversationMessage, ActiveTopic } from '@deepaudit/shared-types';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import { envConfig } from '../../config/env.config';
import { geminiConfig } from '../../config/gemini.config';
import { getBusinessKnowledge } from './business-knowledge.store';

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
    return new GeminiOrchestrator(envConfig.geminiApiKey, geminiConfig.defaultModel);
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
    _actor: any,
    conversationHistory?: ConversationMessage[],
    activeTopic?: ActiveTopic
  ): Promise<AgentResponse> {
    const ledger = getBusinessKnowledge();
    const q = query.toLowerCase();
    const cityHint = ['coimbatore', 'chennai', 'trichy', 'madurai', 'mumbai', 'bengaluru', 'bangalore', 'delhi']
      .find(c => q.includes(c));

    const isSimulation = /what if|if i give|discount|offer|simulate|kudutha|தள்ளுபடி|கொடுத்தால்|छूट/.test(q);
    const discountMatch = q.match(/(\d+)\s*%/);
    const discountPct = discountMatch ? parseInt(discountMatch[1], 10) : 10;
    const region = ledger.regions.find((r: any) => r.name.toLowerCase() === cityHint)
      || ledger.regions.find((r: any) => r.name.toLowerCase() === 'coimbatore')
      || ledger.regions[0];
    const m = ledger.simulationModel;
    const ordersUpliftPercent = +(discountPct * m.priceElasticity * 0.6).toFixed(1);
    const netMarginImpactPercent = +(-(discountPct * (1 - m.cannibalizationPercent / 100) * (m.grossMarginPercent / 100) * 10)).toFixed(1);
    const projectedRevenueINR = Math.round(region.monthlyVolumeINR * (1 + ordersUpliftPercent / 100) * (1 - discountPct / 100));
    const projectedOrders = Math.round(region.orders * (1 + ordersUpliftPercent / 100));

    const relevantData = {
      ...ledger,
      focusHint: cityHint || null,
      missingDataPolicy: 'If a field is absent, infer from related ledger fields or Indian payments practice and label it as an estimate. Never refuse the question.',
      deterministicProjection: isSimulation ? {
        simulationRequest: { region: region.name, discountPercent: discountPct, horizon: '30 days' },
        ordersUpliftPercent,
        projectedOrders,
        projectedRevenueINR,
        revenueChangeINR: projectedRevenueINR - region.monthlyVolumeINR,
        netMarginImpactPercent
      } : undefined
    };

    const orchestrator = this.getOrchestrator();
    return orchestrator.processQuery(
      query,
      relevantData,
      languageCode,
      conversationHistory,
      activeTopic
    );
  }
}
