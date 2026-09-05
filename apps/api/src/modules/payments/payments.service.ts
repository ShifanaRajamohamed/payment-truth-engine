import { Payment, CreatePaymentDto, Beneficiary } from '@deepaudit/shared-types';
import { RiskEngine } from '@deepaudit/risk-engine';
import { AuditService } from '../audit/audit.service';
import { PaymentProvider } from './payment-provider.interface';
import { RazorpayAdapter } from './adapters/razorpay.adapter';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';

export class PaymentsService {
  private static instance: PaymentsService;
  private payments: Payment[] = [];
  private beneficiaries: Beneficiary[] = [];
  private paymentProvider: PaymentProvider;
  private auditService = AuditService.getInstance();

  private constructor() {
    this.paymentProvider = new RazorpayAdapter();
    this.seedInitialData();
  }

  static getInstance(): PaymentsService {
    if (!PaymentsService.instance) {
      PaymentsService.instance = new PaymentsService();
    }
    return PaymentsService.instance;
  }

  setProvider(provider: PaymentProvider) {
    this.paymentProvider = provider;
  }

  getPayments(filters?: { status?: string; method?: string; query?: string }): Payment[] {
    let result = [...this.payments];

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.method && filters.method !== 'ALL') {
      result = result.filter(p => p.method === filters.method);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(p =>
        p.referenceNumber.toLowerCase().includes(q) ||
        p.beneficiary.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getPaymentById(id: string): Payment | undefined {
    return this.payments.find(p => p.id === id);
  }

  getBeneficiaries(): Beneficiary[] {
    return this.beneficiaries;
  }

  /**
   * Corporate payment creation flow with deterministic risk analysis and audit trail.
   */
  async createPayment(dto: CreatePaymentDto, actor: { id: string; name: string; role: string; orgId: string }): Promise<Payment> {
    const beneficiary = this.beneficiaries.find(b => b.id === dto.beneficiaryId) || {
      id: dto.beneficiaryId,
      name: 'Aditya Infotech Services',
      accountNumber: '928374928123',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      category: 'VENDOR',
      status: 'VERIFIED',
      totalPaymentsVolume: 1254000,
      paymentCount: 14,
      riskRating: 'LOW',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    };

    const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const referenceNumber = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newPayment: Payment = {
      id: paymentId,
      referenceNumber,
      creatorId: actor.id,
      creatorName: actor.name,
      orgId: actor.orgId,
      beneficiaryId: beneficiary.id,
      beneficiary,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      method: dto.method,
      purpose: dto.purpose,
      status: 'PENDING_RISK_CHECK',
      gateway: this.paymentProvider.name,
      region: dto.region || 'Maharashtra',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Log PAYMENT_CREATED
    this.auditService.log({
      eventType: 'PAYMENT_CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetEntity: 'PAYMENT',
      targetId: paymentId,
      orgId: actor.orgId,
      summary: `Payment ${referenceNumber} created for ₹${dto.amount.toLocaleString('en-IN')} to ${beneficiary.name}`,
      metadata: { amount: dto.amount, beneficiaryId: beneficiary.id, method: dto.method }
    });

    // Run deterministic risk engine
    const riskAssessment = RiskEngine.assess({
      payment: newPayment,
      beneficiary,
      historicalPayments: this.payments
    });
    newPayment.riskAssessment = riskAssessment;

    // Log RISK_ASSESSED
    this.auditService.log({
      eventType: 'RISK_ASSESSED',
      actorId: 'system_risk_engine',
      actorName: 'Deterministic Risk Engine',
      actorRole: 'SYSTEM',
      targetEntity: 'PAYMENT',
      targetId: paymentId,
      orgId: actor.orgId,
      summary: `Risk evaluated: Score ${riskAssessment.overallScore}/100 (${riskAssessment.level}). Signals: ${riskAssessment.signals.length}`,
      metadata: { score: riskAssessment.overallScore, level: riskAssessment.level, actionRequired: riskAssessment.actionRequired }
    });

    // Update status based on risk assessment
    if (riskAssessment.actionRequired === 'BLOCK') {
      newPayment.status = 'FLAGGED_HIGH_RISK';
    } else if (riskAssessment.actionRequired === 'STEP_UP_AUTH') {
      newPayment.status = 'STEP_UP_REQUIRED';
      newPayment.authorization = {
        id: `auth_${Date.now()}`,
        paymentId,
        requiresStepUp: true,
        stepUpMethod: 'PASSKEY_WEBAUTHN',
        stepUpStatus: 'PENDING',
        approvalChain: [
          { stepNumber: 1, requiredRole: 'MAKER', status: 'PENDING' },
          { stepNumber: 2, requiredRole: 'CHECKER', status: 'PENDING' }
        ],
        isFullyAuthorized: false,
        finalDecision: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.auditService.log({
        eventType: 'STEP_UP_AUTH_REQUIRED',
        actorId: 'system_risk_engine',
        actorName: 'Policy Enforcement',
        actorRole: 'SYSTEM',
        targetEntity: 'PAYMENT',
        targetId: paymentId,
        orgId: actor.orgId,
        summary: `Step-up passkey verification required for ${referenceNumber} due to ${riskAssessment.level} risk score.`,
        metadata: { level: riskAssessment.level }
      });
    } else if (riskAssessment.actionRequired === 'DUAL_APPROVAL') {
      newPayment.status = 'PENDING_APPROVAL';
      newPayment.authorization = {
        id: `auth_${Date.now()}`,
        paymentId,
        requiresStepUp: false,
        stepUpStatus: 'NOT_REQUIRED',
        approvalChain: [
          { stepNumber: 1, requiredRole: 'CHECKER', status: 'PENDING' }
        ],
        isFullyAuthorized: false,
        finalDecision: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Auto approved / low risk
      newPayment.status = 'APPROVED';
      const execResult = await this.paymentProvider.processPayment(newPayment);
      newPayment.status = execResult.status;
    }

    this.payments.unshift(newPayment);
    return newPayment;
  }

  private seedInitialData() {
    this.beneficiaries = [
      { id: 'ben_01', name: 'Tata Steel Corp Ltd', accountNumber: '00298374921', ifscCode: 'SBIN0001234', bankName: 'State Bank of India', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 4850000, paymentCount: 32, riskRating: 'LOW', createdAt: '2024-01-10T10:00:00.000Z' },
      { id: 'ben_02', name: 'Infosys Cloud Infrastructure', accountNumber: '91827364512', ifscCode: 'HDFC0004321', bankName: 'HDFC Bank', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 3200000, paymentCount: 18, riskRating: 'LOW', createdAt: '2024-02-15T11:00:00.000Z' },
      { id: 'ben_03', name: 'Apex Logistics Mumbai', accountNumber: '55667788990', ifscCode: 'ICIC0009876', bankName: 'ICICI Bank', category: 'VENDOR', status: 'NEW_COOLING_PERIOD', coolingPeriodExpiresAt: new Date(Date.now() + 18 * 3600000).toISOString(), totalPaymentsVolume: 0, paymentCount: 0, riskRating: 'HIGH', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: 'ben_04', name: 'Reliance Retail Wholesale', accountNumber: '11223344556', ifscCode: 'KKBK0001122', bankName: 'Kotak Bank', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 615000, paymentCount: 8, riskRating: 'LOW', createdAt: '2024-05-12T14:30:00.000Z' },
      { id: 'ben_05', name: 'Unverified Offshore Vendor LLC', accountNumber: '77889900112', ifscCode: 'UTIB0005544', bankName: 'Axis Bank', category: 'VENDOR', status: 'FLAGGED', totalPaymentsVolume: 45000, paymentCount: 1, riskRating: 'HIGH', createdAt: '2025-01-10T09:00:00.000Z' },
    ];

    const seedTxs = [
      { id: 'pay_TX9283749281', ref: 'TXN-9283749281', ben: this.beneficiaries[0], amount: 154000, method: 'NEFT' as const, status: 'SUCCESS' as const, region: 'Maharashtra', minsAgo: 8 },
      { id: 'pay_TX9283749282', ref: 'TXN-9283749282', ben: this.beneficiaries[1], amount: 89000, method: 'RTGS' as const, status: 'SUCCESS' as const, region: 'Karnataka', minsAgo: 25 },
      { id: 'pay_TX9283749283', ref: 'TXN-9283749283', ben: this.beneficiaries[2], amount: 745000, method: 'RTGS' as const, status: 'STEP_UP_REQUIRED' as const, region: 'Tamil Nadu', minsAgo: 45 },
      {
        id: 'pay_TX9283749284',
        ref: 'TXN-9283749284',
        ben: this.beneficiaries[3],
        amount: 45000,
        method: 'UPI' as const,
        status: 'PROCESSING' as const,
        region: 'Gujarat',
        minsAgo: 75,
        hasInconsistency: true,
        incidentId: 'INC-2026-9921',
        inconsistencyDetails: {
          type: 'WEBHOOK_PROCESSING_FAILURE',
          rootCause: 'Webhook delivery returned HTTP 500 (DB lock timeout on merchant server)',
          bankStatus: 'DEBITED (Success)',
          bankRef: 'HDFC-UTR-88291024',
          gatewayStatus: 'CAPTURED',
          gatewayRef: 'pay_Rzp99218274',
          webhookStatus: 'FAILED (HTTP 500)',
          webhookError: 'HTTP 500: Internal Server Error on /api/v1/webhooks/razorpay',
          merchantStatus: 'UNPAID',
          merchantError: 'Order state not synced due to dropped webhook',
          finalVerdict: 'PAYMENT SUCCESSFUL — RECONCILIATION REQUIRED',
          confidence: 98,
          explanation: 'Funds of ₹45,000 were debited at HDFC Bank and captured by Razorpay Gateway. The webhook notification timed out at the merchant endpoint, leaving internal order records marked as UNPAID.',
          evidence: [
            'Bank authorization successful with UTR reference HDFC-UTR-88291024',
            'Gateway payment state: CAPTURED with valid cryptographic signature',
            'Webhook event payment.captured dispatched by gateway (3 retries timed out)',
            'Merchant database order state is currently UNPAID'
          ]
        }
      },
      { id: 'pay_TX9283749285', ref: 'TXN-9283749285', ben: this.beneficiaries[4], amount: 985000, method: 'Netbanking' as const, status: 'FLAGGED_HIGH_RISK' as const, region: 'Delhi NCR', minsAgo: 110 },
    ];

    for (const tx of seedTxs) {
      const p: Payment = {
        id: tx.id,
        referenceNumber: tx.ref,
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: tx.ben.id,
        beneficiary: tx.ben,
        amount: tx.amount,
        currency: 'INR',
        method: tx.method,
        purpose: 'Vendor Invoice Settlement',
        status: tx.status,
        gateway: 'Razorpay Enterprise PG',
        region: tx.region,
        hasInconsistency: (tx as any).hasInconsistency,
        incidentId: (tx as any).incidentId,
        inconsistencyDetails: (tx as any).inconsistencyDetails,
        createdAt: new Date(Date.now() - tx.minsAgo * 60000).toISOString(),
        updatedAt: new Date(Date.now() - tx.minsAgo * 60000).toISOString()
      };

      p.riskAssessment = RiskEngine.assess({ payment: p, beneficiary: tx.ben });
      this.payments.push(p);
    }
  }
}
