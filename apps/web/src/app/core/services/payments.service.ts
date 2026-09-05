import { Injectable, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { Payment, CreatePaymentDto, Beneficiary } from '@deepaudit/shared-types';
import { catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  readonly payments = signal<Payment[]>([]);
  readonly beneficiaries = signal<Beneficiary[]>([]);
  readonly selectedPayment = signal<Payment | null>(null);
  readonly isLoading = signal<boolean>(false);

  constructor(private api: ApiClientService) {
    this.fetchPayments();
    this.fetchBeneficiaries();
  }

  fetchPayments() {
    this.isLoading.set(true);
    this.api.get<Payment[]>('/payments').pipe(
      catchError(err => {
        console.warn('API unavailable, falling back to local corporate payments ledger:', err);
        return of(this.getMockPayments());
      }),
      tap(data => {
        this.payments.set(data);
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  fetchBeneficiaries() {
    this.api.get<Beneficiary[]>('/payments/beneficiaries').pipe(
      catchError(() => of(this.getMockBeneficiaries())),
      tap(data => this.beneficiaries.set(data))
    ).subscribe();
  }

  createPayment(dto: CreatePaymentDto) {
    this.isLoading.set(true);
    return this.api.post<Payment>('/payments', dto).pipe(
      tap(newPayment => {
        this.payments.update(list => [newPayment, ...list]);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  private getMockBeneficiaries(): Beneficiary[] {
    return [
      { id: 'ben_01', name: 'Tata Steel Corp Ltd', accountNumber: '00298374921', ifscCode: 'SBIN0001234', bankName: 'State Bank of India', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 4850000, paymentCount: 32, riskRating: 'LOW', createdAt: '2024-01-10T10:00:00.000Z' },
      { id: 'ben_02', name: 'Infosys Cloud Infrastructure', accountNumber: '91827364512', ifscCode: 'HDFC0004321', bankName: 'HDFC Bank', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 3200000, paymentCount: 18, riskRating: 'LOW', createdAt: '2024-02-15T11:00:00.000Z' },
      { id: 'ben_03', name: 'Apex Logistics Mumbai', accountNumber: '55667788990', ifscCode: 'ICIC0009876', bankName: 'ICICI Bank', category: 'VENDOR', status: 'NEW_COOLING_PERIOD', coolingPeriodExpiresAt: new Date(Date.now() + 18 * 3600000).toISOString(), totalPaymentsVolume: 0, paymentCount: 0, riskRating: 'HIGH', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: 'ben_04', name: 'Reliance Retail Wholesale', accountNumber: '11223344556', ifscCode: 'KKBK0001122', bankName: 'Kotak Bank', category: 'VENDOR', status: 'VERIFIED', totalPaymentsVolume: 615000, paymentCount: 8, riskRating: 'LOW', createdAt: '2024-05-12T14:30:00.000Z' },
      { id: 'ben_05', name: 'Unverified Offshore Vendor LLC', accountNumber: '77889900112', ifscCode: 'UTIB0005544', bankName: 'Axis Bank', category: 'VENDOR', status: 'FLAGGED', totalPaymentsVolume: 45000, paymentCount: 1, riskRating: 'HIGH', createdAt: '2025-01-10T09:00:00.000Z' },
    ];
  }

  private getMockPayments(): Payment[] {
    const bens = this.getMockBeneficiaries();
    return [
      {
        id: 'pay_TX9283749281',
        referenceNumber: 'TXN-9283749281',
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: bens[0].id,
        beneficiary: bens[0],
        amount: 154000,
        currency: 'INR',
        method: 'NEFT',
        purpose: 'Monthly Raw Material Supply',
        status: 'SUCCESS',
        gateway: 'Razorpay Enterprise PG',
        region: 'Maharashtra',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        riskAssessment: {
          id: 'risk_01',
          paymentId: 'pay_TX9283749281',
          overallScore: 12,
          level: 'LOW',
          actionRequired: 'ALLOW',
          signals: [],
          calculatedAt: new Date().toISOString()
        }
      },
      {
        id: 'pay_TX9283749282',
        referenceNumber: 'TXN-9283749282',
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: bens[1].id,
        beneficiary: bens[1],
        amount: 89000,
        currency: 'INR',
        method: 'RTGS',
        purpose: 'Cloud Servers Q3 Disbursement',
        status: 'SUCCESS',
        gateway: 'Razorpay Enterprise PG',
        region: 'Karnataka',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        riskAssessment: {
          id: 'risk_02',
          paymentId: 'pay_TX9283749282',
          overallScore: 18,
          level: 'LOW',
          actionRequired: 'ALLOW',
          signals: [],
          calculatedAt: new Date().toISOString()
        }
      },
      {
        id: 'pay_TX9283749283',
        referenceNumber: 'TXN-9283749283',
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: bens[2].id,
        beneficiary: bens[2],
        amount: 745000,
        currency: 'INR',
        method: 'RTGS',
        purpose: 'Fleet Expansion Advance',
        status: 'STEP_UP_REQUIRED',
        gateway: 'Razorpay Enterprise PG',
        region: 'Tamil Nadu',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        riskAssessment: {
          id: 'risk_03',
          paymentId: 'pay_TX9283749283',
          overallScore: 65,
          level: 'HIGH',
          actionRequired: 'STEP_UP_AUTH',
          signals: [
            {
              id: 'sig_01',
              type: 'AMOUNT_THRESHOLD_EXCEEDED',
              severity: 'HIGH',
              weight: 35,
              scoreContribution: 35,
              title: 'Transfer Exceeds Single Limit',
              description: 'Payment of ₹7,45,000 exceeds single transaction limit of ₹5,00,000.',
              detectedAt: new Date().toISOString()
            },
            {
              id: 'sig_02',
              type: 'BENEFICIARY_NEW_COOLING_PERIOD',
              severity: 'HIGH',
              weight: 30,
              scoreContribution: 30,
              title: 'Beneficiary In Cooling Period',
              description: 'Apex Logistics Mumbai was added recently and is in statutory 24h cooling.',
              detectedAt: new Date().toISOString()
            }
          ],
          calculatedAt: new Date().toISOString()
        },
        authorization: {
          id: 'auth_03',
          paymentId: 'pay_TX9283749283',
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
        }
      },
      {
        id: 'pay_TX9283749284',
        referenceNumber: 'TXN-9283749284',
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: bens[3].id,
        beneficiary: bens[3],
        amount: 45000,
        currency: 'INR',
        method: 'UPI',
        purpose: 'Inventory Restock Payout',
        status: 'PROCESSING',
        gateway: 'Razorpay Enterprise PG',
        region: 'Gujarat',
        createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 75 * 60000).toISOString(),
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
        },
        riskAssessment: {
          id: 'risk_04',
          paymentId: 'pay_TX9283749284',
          overallScore: 24,
          level: 'LOW',
          actionRequired: 'ALLOW',
          signals: [],
          calculatedAt: new Date().toISOString()
        }
      },
      {
        id: 'pay_TX9283749285',
        referenceNumber: 'TXN-9283749285',
        creatorId: 'usr_corp_maker_01',
        creatorName: 'Aditya Sharma',
        orgId: 'org_acme_corp',
        beneficiaryId: bens[4].id,
        beneficiary: bens[4],
        amount: 985000,
        currency: 'INR',
        method: 'Netbanking',
        purpose: 'Cross-border Advisory Retainer',
        status: 'FLAGGED_HIGH_RISK',
        gateway: 'Razorpay Enterprise PG',
        region: 'Delhi NCR',
        createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 110 * 60000).toISOString(),
        riskAssessment: {
          id: 'risk_05',
          paymentId: 'pay_TX9283749285',
          overallScore: 88,
          level: 'CRITICAL',
          actionRequired: 'BLOCK',
          signals: [
            {
              id: 'sig_03',
              type: 'BENEFICIARY_NAME_MISMATCH',
              severity: 'CRITICAL',
              weight: 50,
              scoreContribution: 50,
              title: 'Unverified Entity & Name Mismatch',
              description: 'Offshore vendor account not verified by corporate compliance.',
              detectedAt: new Date().toISOString()
            }
          ],
          calculatedAt: new Date().toISOString()
        }
      }
    ];
  }
}
