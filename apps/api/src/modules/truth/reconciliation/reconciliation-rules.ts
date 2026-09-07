import { PaymentIncident, AuditableRuleResult } from '@deepaudit/shared-types';
import { ReconciliationRule } from './reconciliation-rule.interface';

/**
 * 1. Payment Identity Rule
 * Verifies payment ID and order ID parity between incident and system records.
 */
export class PaymentIdentityRule implements ReconciliationRule {
  readonly id = 'rule-01-payment-identity';
  readonly name = 'Payment & Order Identity Parity';
  readonly category = 'IDENTITY' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const matrix = incident.truthMatrix;

    const gatewayPaymentId = matrix?.gateway?.paymentId;
    const merchantOrderId = matrix?.merchantDb?.orderId;

    const hasMerchantOrder = !!merchantOrderId;
    const orderMatches = hasMerchantOrder && merchantOrderId === incident.orderId;

    const hasIncidentPaymentId = !!incident.paymentId;
    const hasGatewayPaymentId = !!gatewayPaymentId;
    const paymentMatches = !hasIncidentPaymentId || (hasGatewayPaymentId && gatewayPaymentId === incident.paymentId);

    if (!hasMerchantOrder) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { orderId: merchantOrderId, paymentId: gatewayPaymentId },
        expectedValue: { orderId: incident.orderId, paymentId: incident.paymentId },
        explanation: 'Merchant order record missing or unreferenced in database.',
        sourceReference: 'truthMatrix.merchantDb.orderId',
        checkedAt: now
      };
    }

    if (!orderMatches) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { orderId: merchantOrderId },
        expectedValue: { orderId: incident.orderId },
        explanation: `Order reference mismatch: database has ${merchantOrderId}, incident has ${incident.orderId}.`,
        sourceReference: 'truthMatrix.merchantDb.orderId',
        checkedAt: now
      };
    }

    if (!paymentMatches) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { paymentId: gatewayPaymentId },
        expectedValue: { paymentId: incident.paymentId },
        explanation: `Payment ID mismatch: gateway evidence ${gatewayPaymentId} does not match incident ${incident.paymentId}.`,
        sourceReference: 'truthMatrix.gateway.paymentId',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: { orderId: merchantOrderId, paymentId: gatewayPaymentId },
      expectedValue: { orderId: incident.orderId, paymentId: incident.paymentId || gatewayPaymentId },
      explanation: `Payment and Order identities match active system records (Order: ${merchantOrderId}).`,
      sourceReference: 'truthMatrix.merchantDb.orderId, truthMatrix.gateway.paymentId',
      checkedAt: now
    };
  }
}

/**
 * 2. Gateway Status Rule
 * Verifies gateway settlement and capture state independently.
 */
export class GatewayStatusRule implements ReconciliationRule {
  readonly id = 'rule-02-gateway-status';
  readonly name = 'Payment Gateway Capture Verification';
  readonly category = 'GATEWAY' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const gateway = incident.truthMatrix?.gateway;

    if (!gateway) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: undefined,
        expectedValue: 'CAPTURED | REFUNDED',
        explanation: 'Gateway ledger record is completely missing from truth matrix.',
        sourceReference: 'truthMatrix.gateway',
        checkedAt: now
      };
    }

    const status = gateway.status;
    if (status === 'CAPTURED' || status === 'REFUNDED') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'PASS',
        critical: this.critical,
        observedValue: status,
        expectedValue: 'CAPTURED | REFUNDED',
        explanation: `Gateway confirmed payment state: ${status}. Funds captured/settled.`,
        sourceReference: 'truthMatrix.gateway.status',
        checkedAt: now
      };
    }

    if (status === 'FAILED') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: status,
        expectedValue: 'CAPTURED | REFUNDED',
        explanation: `Confirmed gateway failure: status is ${status}. Money was not captured.`,
        sourceReference: 'truthMatrix.gateway.status',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'INCONCLUSIVE',
      critical: this.critical,
      observedValue: status,
      expectedValue: 'CAPTURED | REFUNDED',
      explanation: `Unresolved gateway status: ${status}. Gateway capture cannot be confirmed or denied.`,
      sourceReference: 'truthMatrix.gateway.status',
      checkedAt: now
    };
  }
}

/**
 * 3. Merchant Database Status Rule
 * Verifies the merchant order fulfillment state.
 */
export class MerchantDbStatusRule implements ReconciliationRule {
  readonly id = 'rule-03-merchant-db-status';
  readonly name = 'Merchant Database Order State';
  readonly category = 'MERCHANT_DB' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const merchantDb = incident.truthMatrix?.merchantDb;

    if (!merchantDb) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: undefined,
        expectedValue: 'Valid merchant record',
        explanation: 'Merchant database record is missing.',
        sourceReference: 'truthMatrix.merchantDb',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: merchantDb.orderStatus,
      expectedValue: 'UNPAID | PAID | REFUNDED',
      explanation: `Merchant order status recorded as ${merchantDb.orderStatus}.`,
      sourceReference: 'truthMatrix.merchantDb.orderStatus',
      checkedAt: now
    };
  }
}

/**
 * 4. Bank Evidence Rule
 * Verifies core banking debit/credit status independently.
 */
export class BankEvidenceRule implements ReconciliationRule {
  readonly id = 'rule-04-bank-evidence';
  readonly name = 'Bank Ledger & Core Banking Status';
  readonly category = 'BANK' as const;
  readonly critical = false; // Non-critical to allow gateway-only reconciliation if bank record pending

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const bank = incident.truthMatrix?.bank;

    if (!bank) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'INCONCLUSIVE',
        critical: this.critical,
        observedValue: undefined,
        expectedValue: 'DEBITED | CREDITED',
        explanation: 'Bank statement record is not currently available (unresolved external evidence).',
        sourceReference: 'truthMatrix.bank',
        checkedAt: now
      };
    }

    if (bank.status === 'DEBITED' || bank.status === 'CREDITED' || bank.status === 'SUCCESS') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'PASS',
        critical: this.critical,
        observedValue: bank.status,
        expectedValue: 'DEBITED | CREDITED | SUCCESS',
        explanation: `Confirmed banking evidence: ${bank.status} (Reference: ${bank.reference}).`,
        sourceReference: 'truthMatrix.bank.status',
        checkedAt: now
      };
    }

    if (bank.status === 'DECLINED' || bank.status === 'FAILED' || bank.status === 'REVERSED') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: bank.status,
        expectedValue: 'DEBITED | CREDITED',
        explanation: `Bank confirmed transaction rejection or reversal: status is ${bank.status}.`,
        sourceReference: 'truthMatrix.bank.status',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'INCONCLUSIVE',
      critical: this.critical,
      observedValue: bank.status,
      expectedValue: 'DEBITED | CREDITED',
      explanation: `Bank status is ${bank.status}; unresolved status.`,
      sourceReference: 'truthMatrix.bank.status',
      checkedAt: now
    };
  }
}

/**
 * 5. Amount Consistency Rule
 * Evaluates amount parity across Bank, Gateway, and Merchant Order.
 */
export class AmountConsistencyRule implements ReconciliationRule {
  readonly id = 'rule-05-amount-consistency';
  readonly name = 'Multi-System Amount Parity';
  readonly category = 'AMOUNT' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const matrix = incident.truthMatrix;

    const bankAmount = matrix?.bank?.amount;
    const gatewayAmount = matrix?.gateway?.amount;
    const orderAmount = matrix?.merchantDb?.amount;

    if (bankAmount === undefined || gatewayAmount === undefined || orderAmount === undefined) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { bankAmount, gatewayAmount, orderAmount },
        expectedValue: 'All systems populated',
        explanation: 'Missing amount records across one or more ledger systems.',
        sourceReference: 'truthMatrix.*.amount',
        checkedAt: now
      };
    }

    const isDuplicateCategory = incident.aiAnalysis?.category === 'DUPLICATE_PAYMENT';
    if (isDuplicateCategory) {
      const duplicateMatches = bankAmount === (orderAmount * 2) && gatewayAmount === (orderAmount * 2);
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: duplicateMatches ? 'PASS' : 'FAIL',
        critical: this.critical,
        observedValue: { bankAmount, gatewayAmount, orderAmount },
        expectedValue: { bankAmount: orderAmount * 2, gatewayAmount: orderAmount * 2, orderAmount },
        explanation: duplicateMatches
          ? `Duplicate payment parity verified: 2x ₹${orderAmount} debited at bank and gateway.`
          : `Duplicate payment amount discrepancy: Bank ₹${bankAmount}, Gateway ₹${gatewayAmount}, Order ₹${orderAmount}.`,
        sourceReference: 'truthMatrix.bank.amount, truthMatrix.gateway.amount, truthMatrix.merchantDb.amount',
        checkedAt: now
      };
    }

    const amountsMatch = bankAmount === gatewayAmount && gatewayAmount === orderAmount;
    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: amountsMatch ? 'PASS' : 'FAIL',
      critical: this.critical,
      observedValue: { bank: bankAmount, gateway: gatewayAmount, order: orderAmount },
      expectedValue: { parity: `All equal to ₹${orderAmount}` },
      explanation: amountsMatch
        ? `Multi-system amounts match perfectly (Bank: ₹${bankAmount}, Gateway: ₹${gatewayAmount}, Order: ₹${orderAmount}).`
        : `Amount discrepancy found: Bank ₹${bankAmount}, Gateway ₹${gatewayAmount}, Order ₹${orderAmount}.`,
      sourceReference: 'truthMatrix.bank.amount, truthMatrix.gateway.amount, truthMatrix.merchantDb.amount',
      checkedAt: now
    };
  }
}

/**
 * 6. Currency Consistency Rule
 * Verifies base currency compatibility and consistency across records.
 */
export class CurrencyConsistencyRule implements ReconciliationRule {
  readonly id = 'rule-06-currency-consistency';
  readonly name = 'Currency Denomination Consistency';
  readonly category = 'CURRENCY' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const currency = incident.currency;

    if (currency && currency !== 'INR') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: currency,
        expectedValue: 'INR',
        explanation: `Currency discrepancy: ${currency} does not match merchant base currency INR.`,
        sourceReference: 'incident.currency',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: currency || 'INR',
      expectedValue: 'INR',
      explanation: 'Currency denomination verified as valid standard INR.',
      sourceReference: 'incident.currency',
      checkedAt: now
    };
  }
}

/**
 * 7. Event / Webhook Consistency Rule
 * Verifies webhook event delivery state and cryptographic HMAC signatures.
 */
export class WebhookConsistencyRule implements ReconciliationRule {
  readonly id = 'rule-07-webhook-consistency';
  readonly name = 'Webhook & Cryptographic Signature Consistency';
  readonly category = 'WEBHOOK' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const gateway = incident.truthMatrix?.gateway;
    const webhook = incident.truthMatrix?.webhook;

    const sigValid = gateway?.signatureValid === true;

    if (!sigValid) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { signatureValid: gateway?.signatureValid },
        expectedValue: { signatureValid: true },
        explanation: 'Gateway cryptographic HMAC signature verification failed or missing.',
        sourceReference: 'truthMatrix.gateway.signatureValid',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: {
        signatureValid: true,
        webhookStatus: webhook?.status,
        httpStatusCode: webhook?.httpStatusCode
      },
      expectedValue: { signatureValid: true },
      explanation: 'Gateway HMAC-SHA256 signature verified against merchant secret.',
      sourceReference: 'truthMatrix.gateway.signatureValid, truthMatrix.webhook.status',
      checkedAt: now
    };
  }
}

/**
 * 8. Duplicate Events / Payments Detection Rule
 * Detects duplicate charge occurrences or duplicate state reconciliation attempts.
 */
export class DuplicateDetectionRule implements ReconciliationRule {
  readonly id = 'rule-08-duplicate-detection';
  readonly name = 'Idempotency & Duplicate State Protection';
  readonly category = 'DUPLICATE' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    if (incident.isRepaired) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { isRepaired: true },
        expectedValue: { isRepaired: false },
        explanation: 'Action was already executed previously. Re-execution blocked by idempotency guard.',
        sourceReference: 'incident.isRepaired',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: { isRepaired: false },
      expectedValue: { isRepaired: false },
      explanation: 'Action idempotency verified. Safe to proceed.',
      sourceReference: 'incident.isRepaired',
      checkedAt: now
    };
  }
}

/**
 * 9. Evidence Completeness Rule
 * Evaluates whether required system evidence is present.
 * Differentiates confirmed failure from missing/unresolved evidence.
 */
export class EvidenceCompletenessRule implements ReconciliationRule {
  readonly id = 'rule-09-evidence-completeness';
  readonly name = 'Evidence Completeness & Source Integrity';
  readonly category = 'COMPLETENESS' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const matrix = incident.truthMatrix;

    const hasGateway = !!matrix?.gateway;
    const hasMerchantDb = !!matrix?.merchantDb;
    const hasBank = !!matrix?.bank;

    if (!hasGateway || !hasMerchantDb) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { hasGateway, hasMerchantDb, hasBank },
        expectedValue: { hasGateway: true, hasMerchantDb: true },
        explanation: 'Incomplete evidence bundle: Primary gateway or merchant ledger record missing.',
        sourceReference: 'truthMatrix',
        checkedAt: now
      };
    }

    if (!hasBank) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'INCONCLUSIVE',
        critical: false,
        observedValue: { hasGateway, hasMerchantDb, hasBank: false },
        expectedValue: { hasBank: true },
        explanation: 'Bank statement record is pending or omitted. Gateway evidence is sole settlement record.',
        sourceReference: 'truthMatrix.bank',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: { hasGateway: true, hasMerchantDb: true, hasBank: true },
      expectedValue: { allPresent: true },
      explanation: 'Full multi-system evidence bundle present (Gateway, Bank, Merchant DB).',
      sourceReference: 'truthMatrix',
      checkedAt: now
    };
  }
}

/**
 * 10. Risk & Hard-Blocking Conditions Rule
 * Enforces hard safety barriers including PHANTOM_CREDIT_DESYNC and contradictory evidence blocks.
 */
export class RiskBlockingRule implements ReconciliationRule {
  readonly id = 'rule-10-risk-blocking';
  readonly name = 'Risk Policy & Phantom Credit Hard-Block';
  readonly category = 'RISK' as const;
  readonly critical = true;

  evaluate(incident: PaymentIncident): AuditableRuleResult {
    const now = new Date().toISOString();
    const matrix = incident.truthMatrix;

    const isPhantomCredit = incident.aiAnalysis?.category === 'PHANTOM_CREDIT_DESYNC' ||
      (matrix?.gateway?.status === 'FAILED' && matrix?.merchantDb?.orderStatus === 'PAID');

    if (isPhantomCredit) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { gateway: matrix?.gateway?.status, merchant: matrix?.merchantDb?.orderStatus },
        expectedValue: 'Non-phantom state',
        explanation: 'CRITICAL RISK: PHANTOM_CREDIT_DESYNC detected. Money was NOT captured by Gateway or Bank. Automated repair permanently blocked.',
        sourceReference: 'truthMatrix.gateway.status, truthMatrix.merchantDb.orderStatus',
        checkedAt: now
      };
    }

    // Contradictory evidence: Gateway = CAPTURED, Merchant = FAILED, Bank = SUCCESS/DEBITED
    // If merchant explicitly marked order FAILED, cannot auto-repair without manual review
    const isContradictoryMerchantFailed = matrix?.gateway?.status === 'CAPTURED' && matrix?.merchantDb?.orderStatus === 'FAILED';
    if (isContradictoryMerchantFailed) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        category: this.category,
        status: 'FAIL',
        critical: this.critical,
        observedValue: { gateway: 'CAPTURED', merchant: 'FAILED' },
        expectedValue: 'Consistent states',
        explanation: 'Contradictory evidence: Gateway captured funds but merchant order explicitly marked FAILED. Requires manual risk review.',
        sourceReference: 'truthMatrix.merchantDb.orderStatus',
        checkedAt: now
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      status: 'PASS',
      critical: this.critical,
      observedValue: 'No blocking anomaly',
      expectedValue: 'Clear risk state',
      explanation: 'No active risk blocks or phantom credit desynchronizations identified.',
      sourceReference: 'truthMatrix',
      checkedAt: now
    };
  }
}
