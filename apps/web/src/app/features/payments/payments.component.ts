import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../core/services/payments.service';
import { RiskService } from '../../core/services/risk.service';
import { CreatePaymentComponent } from './create-payment/create-payment.component';
import { RiskExplanationComponent } from '../risk/risk-explanation/risk-explanation.component';
import { StepUpAuthComponent } from '../authorization/step-up-auth/step-up-auth.component';
import { PaymentTruthDrawerComponent } from './payment-truth-drawer/payment-truth-drawer.component';
import { Payment } from '@deepaudit/shared-types';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreatePaymentComponent,
    RiskExplanationComponent,
    StepUpAuthComponent,
    PaymentTruthDrawerComponent
  ],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Corporate Payments Ledger</h1>
        </div>
        <p class="text-sm text-slate-500">Real-time corporate disbursements, fraud scoring, and dual-control status.</p>
      </div>

      <div class="mt-4 sm:mt-0 flex items-center gap-2.5">
        <button (click)="showCreateModal = true"
                class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all"
                style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          <span>Initiate Payment</span>
        </button>
      </div>
    </div>

    <!-- Summary KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- 1. Total Corporate Volume (Informational) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Corporate Volume</p>
        <p class="text-2xl font-extrabold text-slate-900 tabular-nums">{{ totalVolume | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">↑ +14.2% verified this month</p>
      </div>

      <!-- 2. Active Rail Health (Informational) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Rail Health</p>
        <p class="text-2xl font-extrabold text-emerald-600">99.2%</p>
        <p class="text-xs text-slate-500 mt-1">Razorpay Enterprise & Banking Rails</p>
      </div>

      <!-- 3. Risk Hold & Step-Up (Action Required / Restrained Enterprise Style) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-amber-500 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Hold & Step-Up</p>
          <span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
            Action Required
          </span>
        </div>
        <p class="text-2xl font-extrabold text-amber-700">{{ flaggedCount }} transfers</p>
        <p class="text-xs text-slate-500 mt-1">Awaiting Passkey biometric verification</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-100 shadow-sm">
      <div class="flex-1 max-w-sm">
        <div class="relative">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery"
                 placeholder="Search by recipient, TXN reference, city…"
                 class="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 bg-slate-50/70"/>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select [(ngModel)]="selectedStatus" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Completed (Success)</option>
          <option value="STEP_UP_REQUIRED">Step-Up Required</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="PROCESSING">Processing / Desync</option>
          <option value="FLAGGED_HIGH_RISK">Flagged High Risk</option>
        </select>

        <select [(ngModel)]="selectedMethod" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="ALL">All Payment Rails</option>
          <option value="NEFT">NEFT</option>
          <option value="RTGS">RTGS</option>
          <option value="UPI">UPI</option>
          <option value="Netbanking">Netbanking</option>
        </select>
      </div>
    </div>

    <!-- Payments Ledger Table -->
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50/80">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">Reference</th>
              <th class="py-3.5 px-4">Recipient</th>
              <th class="py-3.5 px-4 text-right">Amount</th>
              <th class="py-3.5 px-4">Method & Gateway</th>
              <th class="py-3.5 px-4">Fraud Risk Score</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let p of filteredPayments" class="hover:bg-slate-50/70 transition-colors">
              
              <!-- 1. Reference (Monospace System Identifier) -->
              <td class="py-3.5 px-5">
                <span class="font-mono text-xs text-slate-500 font-medium tracking-tight">
                  {{ p.referenceNumber }}
                </span>
              </td>

              <!-- 2. Recipient -->
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-900">{{ p.beneficiary.name }}</p>
                <p class="text-[10px] text-slate-400">{{ p.beneficiary.bankName }} ({{ p.beneficiary.category }})</p>
              </td>

              <!-- 3. Amount (Strictly Right Aligned) -->
              <td class="py-3.5 px-4 text-right">
                <span class="font-extrabold text-sm text-slate-900 tabular-nums">
                  {{ p.amount | currency:'INR':'symbol':'1.0-0' }}
                </span>
              </td>

              <!-- 4. Method & Gateway -->
              <td class="py-3.5 px-4">
                <span class="font-semibold text-slate-800">{{ p.method }}</span>
                <span class="text-[10px] text-slate-400 block">{{ p.gateway }}</span>
              </td>

              <!-- 5. Fraud Risk Score -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [style]="riskBadgeStyle(p.riskAssessment?.level)">
                    {{ p.riskAssessment?.overallScore || 0 }}/100 ({{ p.riskAssessment?.level || 'LOW' }})
                  </span>
                </div>
              </td>

              <!-- 6. Status -->
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="statusBadgeStyle(p.status)">
                  {{ p.status.replace('_', ' ') }}
                </span>
              </td>

              <!-- 7. Actions (Context-Aware) -->
              <td class="py-3.5 px-5 text-right">
                
                <!-- A. High Priority Passkey Biometric Action -->
                <button *ngIf="p.status === 'STEP_UP_REQUIRED'"
                        (click)="selectedStepUp = p"
                        class="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"/>
                  </svg>
                  <span>Verify Passkey</span>
                </button>

                <!-- B. Payment Truth Anomaly / Inconsistency Action -->
                <button *ngIf="isPaymentInconsistent(p) && p.status !== 'STEP_UP_REQUIRED'"
                        (click)="selectedInvestigatePayment = p"
                        class="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                  </svg>
                  <span>Investigate</span>
                </button>

                <!-- C. Normal Subtle Details Action -->
                <button *ngIf="!isPaymentInconsistent(p) && p.status !== 'STEP_UP_REQUIRED'"
                        (click)="viewDetails(p)"
                        class="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                  Details
                </button>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals & Drawers -->
    <app-create-payment *ngIf="showCreateModal" (close)="showCreateModal = false"></app-create-payment>
    <app-risk-explanation *ngIf="selectedExplainPayment" [payment]="selectedExplainPayment" (close)="selectedExplainPayment = null"></app-risk-explanation>
    <app-step-up-auth *ngIf="selectedStepUp" [payment]="selectedStepUp" (close)="selectedStepUp = null" (completed)="onStepUpDone()"></app-step-up-auth>
    <app-payment-truth-drawer *ngIf="selectedInvestigatePayment" [payment]="selectedInvestigatePayment" (close)="selectedInvestigatePayment = null" (resolved)="onIncidentResolved($event)"></app-payment-truth-drawer>
  `,
  styles: [`:host { display:block; }`]
})
export class PaymentsComponent {
  searchQuery = '';
  selectedStatus = 'ALL';
  selectedMethod = 'ALL';

  showCreateModal = false;
  selectedExplainPayment: Payment | null = null;
  selectedStepUp: Payment | null = null;
  selectedInvestigatePayment: Payment | null = null;

  constructor(
    public paymentsService: PaymentsService,
    private riskService: RiskService
  ) { }

  isPaymentInconsistent(p: Payment): boolean {
    return !!p.hasInconsistency || p.referenceNumber === 'TXN-9283749284' || p.status === 'PROCESSING' || !!p.incidentId;
  }

  get filteredPayments(): Payment[] {
    return this.paymentsService.payments().filter(p => {
      const matchQuery = !this.searchQuery.trim() ||
        p.referenceNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.beneficiary.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.selectedStatus === 'ALL' || p.status === this.selectedStatus;
      const matchMethod = this.selectedMethod === 'ALL' || p.method === this.selectedMethod;
      return matchQuery && matchStatus && matchMethod;
    });
  }

  get totalVolume(): number {
    return this.paymentsService.payments().reduce((sum, p) => sum + p.amount, 0);
  }

  get flaggedCount(): number {
    return this.paymentsService.payments().filter(p => p.status === 'STEP_UP_REQUIRED' || p.status === 'FLAGGED_HIGH_RISK').length;
  }

  statusBadgeStyle(status: string): string {
    if (status === 'SUCCESS' || status === 'APPROVED') return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (status === 'STEP_UP_REQUIRED') return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    if (status === 'FLAGGED_HIGH_RISK' || status === 'REJECTED' || status === 'FAILED') return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
    return 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;';
  }

  riskBadgeStyle(level?: string): string {
    if (level === 'CRITICAL' || level === 'HIGH') return 'background:#fee2e2;color:#991b1b;';
    if (level === 'MEDIUM') return 'background:#fef3c7;color:#92400e;';
    return 'background:#dcfce7;color:#166534;';
  }

  viewDetails(payment: Payment) {
    this.selectedExplainPayment = payment;
    this.riskService.explainRisk(payment.id).subscribe();
  }

  onStepUpDone() {
    this.paymentsService.fetchPayments();
  }

  onIncidentResolved(payment: Payment) {
    this.paymentsService.fetchPayments();
  }
}
