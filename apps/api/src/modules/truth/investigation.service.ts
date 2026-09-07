import { PaymentIncident, AIRootCauseAnalysis, SystemTruthMatrix, TimelineEvent, SystemGraphNode } from '@deepaudit/shared-types';
import { envConfig } from '../../config/env.config';
import { mockDataStore } from './mock-data.store';
import { deterministicVerificationService } from './verification.service';
import { aiInvestigatorService } from './investigation/ai-investigator.service';

export class InvestigationService {
  /**
   * Investigates a payment issue from voice transcript or text complaint
   */
  public async investigateComplaint(params: {
    complaintText: string;
    orderId?: string;
    paymentId?: string;
    amount?: number;
    language?: string;
  }): Promise<PaymentIncident> {
    const text = params.complaintText || '';
    
    // 1. Entity & Intent Extraction
    const extracted = this.extractEntities(text, params);
    
    // 2. Locate or synthesize multi-system evidence
    let existingIncident: PaymentIncident | undefined;
    if (extracted.orderId || extracted.paymentId) {
      const lookup = mockDataStore.lookupCrossSystem(extracted.orderId || extracted.paymentId || '');
      if (lookup.found && lookup.incident) {
        existingIncident = lookup.incident;
      }
    }

    if (!existingIncident) {
      // Determine appropriate scenario archetype from language/keywords
      existingIncident = this.synthesizeIncidentFromComplaint(text, extracted);
    }

    // 3. Authoritative Deterministic Verification Layer (Runs FIRST)
    const verification = deterministicVerificationService.verifyIncident(existingIncident);
    existingIncident.verification = verification;

    // 4. Evidence-Grounded AI Investigation Subordinate to Deterministic Verification
    const aiInvestigation = await aiInvestigatorService.investigate(existingIncident, verification);
    existingIncident.aiInvestigation = aiInvestigation;
    existingIncident.status = 'ROOT_CAUSE_FOUND';

    // Backwards-compatible mapping for aiAnalysis
    const vs = aiInvestigation.voiceScript || {};
    existingIncident.aiAnalysis = {
      confidence: Math.round(aiInvestigation.confidence * 100),
      category: this.mapHypothesisToCategory(aiInvestigation.hypothesis, aiInvestigation.recommended_action),
      summary: aiInvestigation.verdict,
      detailedExplanation: aiInvestigation.observed_facts.join('. '),
      evidence: aiInvestigation.evidence,
      customerRisk: aiInvestigation.observed_facts.find(f => f.toLowerCase().includes('risk')) || 'Customer risk evaluated via authoritative evidence.',
      recommendedAction: aiInvestigation.recommended_action,
      voiceScript: {
        tamil: vs.tamil || `உங்கள் ₹${existingIncident.amount} கட்டணம் சரிபார்க்கப்பட்டது.`,
        english: vs.english || `Your payment of ₹${existingIncident.amount} was evaluated by the Truth Engine.`,
        tanglish: vs.tanglish || `Unga payment ₹${existingIncident.amount} verify aachu.`,
        hindi: vs.hindi || `आपके ₹${existingIncident.amount} के भुगतान का सत्यापन किया गया है।`
      },
    };

    // 5. Save & Audit Log
    mockDataStore.saveIncident(existingIncident);
    mockDataStore.addAuditEntry({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      incidentId: existingIncident.id,
      actor: 'AI_AGENT',
      actorName: 'AI Payment Incident Resolver (Gemini 2.5/Flash)',
      action: 'INVESTIGATION_COMPLETED',
      details: `Determined root cause: ${aiInvestigation.hypothesis} with ${Math.round(aiInvestigation.confidence * 100)}% confidence (AI status: ${aiInvestigation.aiStatus}). Deterministic verification: ${verification.isVerified ? 'PASSED' : 'REJECTED'}.`,
      cryptographicSignature: `SIG_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    });

    return existingIncident;
  }

  private extractEntities(text: string, params: { orderId?: string; paymentId?: string; amount?: number }) {
    let orderId = params.orderId;
    let paymentId = params.paymentId;
    let amount = params.amount;

    // Match patterns like ₹12,499 or 12499 or INR 12499
    if (!amount) {
      const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/i);
      if (amountMatch && amountMatch[1]) {
        const cleanAmt = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(cleanAmt) && cleanAmt > 0) {
          amount = cleanAmt;
        }
      }
    }

    // Match ORD_12345 or order #12345
    if (!orderId) {
      const ordMatch = text.match(/(?:ORD_?|order\s*(?:id|#)?\s*)([a-zA-Z0-9_-]+)/i);
      if (ordMatch && ordMatch[1]) {
        orderId = ordMatch[1].startsWith('ORD_') ? ordMatch[1] : `ORD_${ordMatch[1]}`;
      }
    }

    // Match PAY_12345 or pay_xxxx
    if (!paymentId) {
      const payMatch = text.match(/(?:PAY_?|payment\s*(?:id|#)?\s*)([a-zA-Z0-9_-]+)/i);
      if (payMatch && payMatch[1]) {
        paymentId = payMatch[1].startsWith('PAY_') ? payMatch[1] : `PAY_${payMatch[1]}`;
      }
    }

    return { orderId, paymentId, amount: amount || 12499 };
  }

  private synthesizeIncidentFromComplaint(text: string, extracted: { orderId?: string; paymentId?: string; amount: number }): PaymentIncident {
    const lc = text.toLowerCase();
    
    if (lc.includes('twice') || lc.includes('double') || lc.includes('இரண்டு முறை') || lc.includes('दो बार')) {
      const inc = mockDataStore.generateScenarioIncident('SCENARIO_2_DUPLICATE_PAYMENT');
      inc.amount = extracted.amount;
      inc.customerClaim = text;
      return inc;
    }
    
    if (lc.includes('declined') || lc.includes('failed') || lc.includes('தோல்வி') || lc.includes('रद्द')) {
      const inc = mockDataStore.generateScenarioIncident('SCENARIO_3_PAYMENT_FAILED_ORDER_PAID');
      inc.amount = extracted.amount;
      inc.customerClaim = text;
      return inc;
    }

    if (lc.includes('refund') || lc.includes('ரீஃபண்ட்') || lc.includes('रिफंड')) {
      const inc = mockDataStore.generateScenarioIncident('SCENARIO_4_REFUND_MISMATCH');
      inc.amount = extracted.amount;
      inc.customerClaim = text;
      return inc;
    }

    // Default to the flagship Webhook Failure scenario
    const inc = mockDataStore.generateScenarioIncident('SCENARIO_1_WEBHOOK_FAILURE');
    inc.amount = extracted.amount;
    inc.customerClaim = text;
    return inc;
  }

  private mapHypothesisToCategory(hypothesis: string, action: string): AIRootCauseAnalysis['category'] {
    const h = (hypothesis || '').toLowerCase();
    if (h.includes('duplicate')) return 'DUPLICATE_PAYMENT';
    if (h.includes('phantom') || h.includes('risk') || h.includes('failed')) return 'PHANTOM_CREDIT_DESYNC';
    if (h.includes('refund')) return 'REFUND_RECORD_MISMATCH';
    if (h.includes('transient') || h.includes('latency') || h.includes('monitor')) return 'TRANSIENT_WEBHOOK_DELAY';
    if (action === 'INITIATE_REFUND_WORKFLOW') return 'DUPLICATE_PAYMENT';
    if (action === 'SYNC_REFUND_STATUS') return 'REFUND_RECORD_MISMATCH';
    return 'WEBHOOK_PROCESSING_FAILURE';
  }
}

export const investigationService = new InvestigationService();
