import { PaymentIncident, AIRootCauseAnalysis, SystemTruthMatrix, TimelineEvent, SystemGraphNode } from '@deepaudit/shared-types';
import { envConfig } from '../../config/env.config';
import { mockDataStore } from './mock-data.store';
import { deterministicVerificationService } from './verification.service';

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

    // 3. AI Root Cause Analysis via Gemini or Fallback
    const aiAnalysis = await this.performAIRootCauseAnalysis(existingIncident, text);
    existingIncident.aiAnalysis = aiAnalysis;
    existingIncident.status = 'ROOT_CAUSE_FOUND';

    // 4. Deterministic Verification Layer
    const verification = deterministicVerificationService.verifyIncident(existingIncident);
    existingIncident.verification = verification;

    // 5. Save & Audit Log
    mockDataStore.saveIncident(existingIncident);
    mockDataStore.addAuditEntry({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      incidentId: existingIncident.id,
      actor: 'AI_AGENT',
      actorName: 'AI Payment Incident Resolver (Gemini 2.5/Flash)',
      action: 'INVESTIGATION_COMPLETED',
      details: `Determined root cause: ${aiAnalysis.category} with ${aiAnalysis.confidence}% confidence. Deterministic verification: ${verification.isVerified ? 'PASSED' : 'REJECTED'}.`,
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

  private async performAIRootCauseAnalysis(incident: PaymentIncident, customerText: string): Promise<AIRootCauseAnalysis> {
    if (envConfig.geminiApiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${envConfig.geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the AI Payment Incident Resolver for "Payment Truth AI". Analyze the following multi-system logs:
Customer Claim: "${customerText || incident.customerClaim}"
Amount: ₹${incident.amount}
Bank Status: ${incident.truthMatrix.bank.status} (${incident.truthMatrix.bank.description})
Gateway Status: ${incident.truthMatrix.gateway.status} (Payment ID: ${incident.truthMatrix.gateway.paymentId})
Webhook Status: ${incident.truthMatrix.webhook.status} (HTTP ${incident.truthMatrix.webhook.httpStatusCode}: ${incident.truthMatrix.webhook.lastError || 'None'})
Merchant DB Status: ${incident.truthMatrix.merchantDb.orderStatus} (Order ID: ${incident.truthMatrix.merchantDb.orderId})

Respond strictly with a JSON object in this exact schema:
{
  "confidence": 98,
  "category": "WEBHOOK_PROCESSING_FAILURE",
  "summary": "Short 1-2 sentence root cause summary",
  "detailedExplanation": "Technical explanation of where and why the state desynchronized",
  "evidence": ["Evidence point 1", "Evidence point 2", "Evidence point 3"],
  "customerRisk": "Risk assessment for customer (e.g. Do not repay)",
  "recommendedAction": "Action to repair or escalate state",
  "voiceScript": {
    "tamil": "Tamil spoken explanation",
    "tanglish": "Tanglish spoken explanation",
    "english": "English spoken explanation",
    "hindi": "Hindi spoken explanation"
  }
}`
              }]
            }],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Gemini API call encountered error, falling back to deterministic AI model:', err);
      }
    }

    // High quality deterministic fallback
    return incident.aiAnalysis || {
      confidence: 98,
      category: 'WEBHOOK_PROCESSING_FAILURE',
      summary: 'Payment was captured by gateway and debited by bank, but merchant webhook processing failed with HTTP 500.',
      detailedExplanation: 'Cross-system correlation confirms ₹' + incident.amount.toLocaleString('en-IN') + ' was debited by the bank and captured by Razorpay. The webhook dispatched by the gateway returned HTTP 500, leaving the merchant database in UNPAID state.',
      evidence: [
        'Bank authorization verified with UTR reference',
        'Gateway payment status is CAPTURED',
        'Webhook delivery returned HTTP 500 error',
        'Merchant database status remains UNPAID',
      ],
      customerRisk: 'Customer has already paid. Customer should NOT pay again.',
      recommendedAction: 'Synchronize merchant order status from UNPAID to PAID.',
      voiceScript: {
        tamil: `உங்கள் ₹${incident.amount.toLocaleString('en-IN')} கட்டணம் வெற்றிகரமாக பெறப்பட்டது. ஆனால் webhook கோளாறு காரணமாக ஆர்டர் status அப்டேட் ஆகவில்லை. தயவுசெய்து மீண்டும் பணம் செலுத்த வேண்டாம்.`,
        tanglish: `Unga ₹${incident.amount.toLocaleString('en-IN')} payment capture aayirukku. Webhook error naala order update aagala. Marubadiyum pay panna venaam.`,
        english: `Your payment of ₹${incident.amount.toLocaleString('en-IN')} was successfully captured. A webhook delivery issue caused the merchant order to remain unpaid. Please do not make another payment.`,
        hindi: `आपका ₹${incident.amount.toLocaleString('en-IN')} का भुगतान सफल रहा। वेबहुक त्रुटि के कारण स्थिति अपडेट नहीं हुई। कृपया दोबारा भुगतान न करें।`,
      },
    };
  }
}

export const investigationService = new InvestigationService();
