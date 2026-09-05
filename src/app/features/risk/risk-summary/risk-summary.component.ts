import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../core/services/payments.service';
import { RiskExplanationComponent } from '../risk-explanation/risk-explanation.component';
import { RiskService } from '../../../core/services/risk.service';
import { StepUpAuthComponent } from '../../authorization/step-up-auth/step-up-auth.component';
import { PaymentTruthDrawerComponent } from '../../payments/payment-truth-drawer/payment-truth-drawer.component';
import { Payment } from '@deepaudit/shared-types';

interface LiveRiskActivity {
  id: string;
  type: 'FLAGGED' | 'PASSKEY_REQUESTED' | 'POLICY_ENFORCED' | 'AUTO_RESOLVED' | 'AUTO_CLEARED';
  title: string;
  reference: string;
  details: string;
  timeAgo: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

@Component({
  selector: 'app-risk-summary',
  standalone: true,
  imports: [
    CommonModule,
    RiskExplanationComponent,
    StepUpAuthComponent,
    PaymentTruthDrawerComponent
  ],
  template: `
    <!-- Page Header -->
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Fraud Protection</h1>
      </div>
      <p class="text-sm text-slate-500">Multi-signal monitoring across volume thresholds, cooling periods, and velocity spikes.</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <!-- 1. Disbursements Analyzed -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Disbursements Analyzed</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ paymentsService.payments().length }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">100% Real-time evaluated</p>
      </div>

      <!-- 2. High / Critical Flags -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-amber-500 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High / Critical Flags</p>
          <span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
            Review Queue
          </span>
        </div>
        <p class="text-2xl font-extrabold text-amber-700">{{ highRiskCount }}</p>
        <p class="text-xs text-slate-500 mt-1">Step-up passkey required</p>
      </div>

      <!-- 3. Cooling Period Payees -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cooling Period Payees</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ coolingCount }}</p>
        <p class="text-xs text-slate-500 mt-1">24-hour statutory hold</p>
      </div>

      <!-- 4. Auto-Resolved Cases (Requested replacement for Gemini card) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Auto-Resolved Cases</p>
        <p class="text-2xl font-extrabold text-emerald-600">94%</p>
        <p class="text-xs text-slate-500 mt-1">Resolved without manual intervention.</p>
      </div>
    </div>

    <!-- High / Critical Risk Review Queue -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Flagged Payments Requiring Investigation</h2>
          <p class="text-xs text-slate-500">Payments exceeding corporate policy thresholds, cooling periods, or behavioral patterns.</p>
        </div>
        <span class="text-xs font-semibold text-slate-400">
          {{ flaggedPayments.length }} transactions in queue
        </span>
      </div>

      <div class="space-y-3.5">
        <div *ngFor="let p of flaggedPayments"
             class="p-4 rounded-xl border transition-all"
             [ngClass]="p.riskAssessment?.level === 'CRITICAL' 
               ? 'bg-rose-50/20 border-rose-200 border-l-4 border-l-rose-600' 
               : 'bg-amber-50/20 border-amber-200/80 border-l-4 border-l-amber-500'">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <!-- Left: Transaction Info & Signals -->
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-bold text-slate-900">{{ p.referenceNumber }}</span>
                
                <!-- Risk Badge -->
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="p.riskAssessment?.level === 'CRITICAL' 
                        ? 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;' 
                        : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'">
                  {{ p.riskAssessment?.level }} RISK ({{ p.riskAssessment?.overallScore }}/100)
                </span>

                <!-- Critical Explicit Review Indicator -->
                <span *ngIf="p.riskAssessment?.level === 'CRITICAL'"
                      class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  Immediate review required
                </span>
              </div>

              <!-- Recipient and Amount -->
              <p class="text-xs text-slate-600">
                Disbursement of <strong class="text-slate-900 font-extrabold">{{ p.amount | currency:'INR':'symbol':'1.0-0' }}</strong> 
                via <span class="font-semibold text-slate-800">{{ p.method }}</span> to 
                <strong class="text-slate-900">{{ p.beneficiary.name }}</strong> ({{ p.beneficiary.category }})
              </p>

              <!-- Signals Pills -->
              <div class="flex flex-wrap gap-1.5 pt-0.5">
                <span *ngFor="let s of p.riskAssessment?.signals"
                      class="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-xs inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full" 
                        [ngClass]="p.riskAssessment?.level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'"></span>
                  <span>{{ s.title }}</span>
                  <span class="text-slate-400 font-bold">+{{ s.scoreContribution }}</span>
                </span>
              </div>
            </div>

            <!-- Right: Context-Aware Actions -->
            <div class="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              
              <!-- Investigate Button (Primary for both High & Critical) -->
              <button (click)="investigatePayment(p)"
                      class="px-3 py-1.5 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all inline-flex items-center gap-1.5 shadow-xs">
                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                </svg>
                <span>Investigate</span>
              </button>

              <!-- Request Passkey for Critical Risk Cases -->
              <button *ngIf="p.riskAssessment?.level === 'CRITICAL' || p.status === 'STEP_UP_REQUIRED'"
                      (click)="requestPasskey(p)"
                      class="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all inline-flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"/>
                </svg>
                <span>Request Passkey</span>
              </button>

              <!-- Secondary Menu for High Risk Cases -->
              <button *ngIf="p.riskAssessment?.level !== 'CRITICAL' && p.status !== 'STEP_UP_REQUIRED'"
                      (click)="openExplanation(p)"
                      class="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                Details
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>

    <!-- Live Risk Activity Section (Utilizes Lower Space Cleanly) -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Live Risk Activity</h2>
          <p class="text-xs text-slate-500">Real-time operational stream of triggered policies, risk evaluations, and biometric authorizations.</p>
        </div>
        <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Stream Active
        </span>
      </div>

      <div class="divide-y divide-slate-100 text-xs">
        <div *ngFor="let item of liveActivity"
             class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
          
          <div class="flex items-start sm:items-center gap-3">
            <!-- Event Dot -->
            <span class="w-2 h-2 rounded-full mt-1.5 sm:mt-0 flex-shrink-0"
                  [ngClass]="{
                    'bg-rose-500': item.severity === 'CRITICAL',
                    'bg-amber-500': item.severity === 'HIGH',
                    'bg-indigo-500': item.severity === 'MEDIUM',
                    'bg-emerald-500': item.severity === 'LOW'
                  }"></span>

            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900">{{ item.title }}</span>
                <span class="font-mono text-[11px] text-slate-500 font-medium">{{ item.reference }}</span>
              </div>
              <p class="text-[11px] text-slate-500">{{ item.details }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:text-right pl-5 sm:pl-0">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  [ngClass]="{
                    'bg-rose-50 text-rose-700 border border-rose-200': item.severity === 'CRITICAL',
                    'bg-amber-50 text-amber-700 border border-amber-200': item.severity === 'HIGH',
                    'bg-indigo-50 text-indigo-700 border border-indigo-200': item.severity === 'MEDIUM',
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': item.severity === 'LOW'
                  }">
              {{ item.type.replace('_', ' ') }}
            </span>
            <span class="text-[11px] text-slate-400 font-medium whitespace-nowrap">{{ item.timeAgo }}</span>
          </div>

        </div>
      </div>
    </div>

    <!-- Modals & Investigation Drawers -->
    <app-payment-truth-drawer *ngIf="selectedInvestigationPayment"
                              [payment]="selectedInvestigationPayment"
                              (close)="selectedInvestigationPayment = null"
                              (resolved)="onPaymentResolved($event)">
    </app-payment-truth-drawer>

    <app-risk-explanation *ngIf="selectedPayment"
                          [payment]="selectedPayment"
                          (close)="selectedPayment = null">
    </app-risk-explanation>

    <app-step-up-auth *ngIf="selectedStepUpPayment"
                      [payment]="selectedStepUpPayment"
                      (close)="selectedStepUpPayment = null"
                      (completed)="onPasskeyCompleted()">
    </app-step-up-auth>
  `,
  styles: [`:host { display: block; }`]
})
export class RiskSummaryComponent {
  selectedPayment: Payment | null = null;
  selectedInvestigationPayment: Payment | null = null;
  selectedStepUpPayment: Payment | null = null;

  liveActivity: LiveRiskActivity[] = [
    {
      id: 'act-1',
      type: 'FLAGGED',
      title: 'Payment Flagged for Review',
      reference: 'TXN-9283749285',
      details: 'Offshore unverified vendor risk & high velocity anomaly (+50 score).',
      timeAgo: '4m ago',
      severity: 'CRITICAL'
    },
    {
      id: 'act-2',
      type: 'PASSKEY_REQUESTED',
      title: 'Biometric Passkey Requested',
      reference: 'TXN-9283749283',
      details: 'Disbursement of ₹7,45,000 exceeds single limit; hardware passkey step-up required.',
      timeAgo: '12m ago',
      severity: 'HIGH'
    },
    {
      id: 'act-3',
      type: 'POLICY_ENFORCED',
      title: 'Statutory 24h Cooling Period',
      reference: 'BEN-03 Apex Logistics',
      details: 'Cooling period policy enforced; outgoing disbursements placed in queue.',
      timeAgo: '28m ago',
      severity: 'MEDIUM'
    },
    {
      id: 'act-4',
      type: 'AUTO_RESOLVED',
      title: 'Payment Truth Auto-Reconciled',
      reference: 'TXN-9283749284',
      details: 'Merchant webhook timeout diagnosed with 98% certainty; state synchronized.',
      timeAgo: '45m ago',
      severity: 'LOW'
    },
    {
      id: 'act-5',
      type: 'AUTO_CLEARED',
      title: 'Disbursement Auto-Cleared',
      reference: 'TXN-9283749281',
      details: 'Verified vendor disbursement of ₹1,54,000 cleared with low score (12/100).',
      timeAgo: '1h ago',
      severity: 'LOW'
    }
  ];

  constructor(
    public paymentsService: PaymentsService,
    private riskService: RiskService
  ) {}

  get highRiskCount(): number {
    return this.paymentsService.payments().filter(
      p => p.riskAssessment?.level === 'HIGH' || p.riskAssessment?.level === 'CRITICAL' || p.status === 'STEP_UP_REQUIRED'
    ).length;
  }

  get coolingCount(): number {
    return this.paymentsService.beneficiaries().filter(b => b.status === 'NEW_COOLING_PERIOD').length;
  }

  get flaggedPayments(): Payment[] {
    return this.paymentsService.payments().filter(
      p => p.riskAssessment?.level === 'HIGH' || p.riskAssessment?.level === 'CRITICAL' || p.status === 'STEP_UP_REQUIRED'
    );
  }

  investigatePayment(payment: Payment) {
    this.selectedInvestigationPayment = payment;
  }

  requestPasskey(payment: Payment) {
    this.selectedStepUpPayment = payment;
  }

  openExplanation(payment: Payment) {
    this.selectedPayment = payment;
    this.riskService.explainRisk(payment.id).subscribe();
  }

  onPaymentResolved(payment: Payment) {
    this.paymentsService.fetchPayments();
    this.selectedInvestigationPayment = null;
  }

  onPasskeyCompleted() {
    this.paymentsService.fetchPayments();
    this.selectedStepUpPayment = null;
  }
}
