import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../core/services/payments.service';
import { RiskExplanationComponent } from '../risk-explanation/risk-explanation.component';
import { RiskService } from '../../../core/services/risk.service';
import { Payment } from '@deepaudit/shared-types';

@Component({
  selector: 'app-risk-summary',
  standalone: true,
  imports: [CommonModule, RiskExplanationComponent],
  template: `
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-lg">⚡</span>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Deterministic Fraud & Risk Engine</h1>
      </div>
      <p class="text-sm text-slate-500">Multi-signal fraud scoring across volume thresholds, cooling periods, and velocity anomalies.</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Disbursements Analyzed</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ paymentsService.payments().length }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">100% Real-time evaluated</p>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">High / Critical Flags</p>
        <p class="text-2xl font-extrabold text-amber-600">{{ highRiskCount }}</p>
        <p class="text-xs text-amber-600 font-semibold mt-1">Step-up passkey required</p>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cooling Period Payees</p>
        <p class="text-2xl font-extrabold text-indigo-600">{{ coolingCount }}</p>
        <p class="text-xs text-slate-500 mt-1">24-hour statutory hold</p>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Reasoning Engine</p>
        <p class="text-2xl font-extrabold text-indigo-600">Gemini 2.5</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">Audit-Ready Synthesizer</p>
      </div>
    </div>

    <!-- High Risk Review Queue -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Flagged Payments Requiring Investigation</h2>
          <p class="text-xs text-slate-500">Payments exceeding corporate policy thresholds or displaying behavioral anomalies.</p>
        </div>
      </div>

      <div class="space-y-3">
        <div *ngFor="let p of flaggedPayments"
             class="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-xs font-bold text-slate-900">{{ p.referenceNumber }}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    [style]="p.riskAssessment?.level === 'CRITICAL' ? 'background:#fee2e2;color:#991b1b;' : 'background:#fef3c7;color:#92400e;'">
                {{ p.riskAssessment?.level }} RISK ({{ p.riskAssessment?.overallScore }}/100)
              </span>
            </div>
            <p class="text-xs text-slate-600">
              Transfer of <strong class="text-slate-900">{{ p.amount | currency:'INR':'symbol':'1.0-0' }}</strong> to <strong>{{ p.beneficiary.name }}</strong> ({{ p.beneficiary.category }})
            </p>
            <div class="flex flex-wrap gap-1 mt-2">
              <span *ngFor="let s of p.riskAssessment?.signals"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                ⚠️ {{ s.title }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="openAiExplanation(p)"
                    class="px-3.5 py-2 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm">
              <span>💡 Explain with Gemini</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Explanation Modal -->
    <app-risk-explanation *ngIf="selectedPayment"
                          [payment]="selectedPayment"
                          (close)="selectedPayment = null">
    </app-risk-explanation>
  `,
  styles: [`:host { display: block; }`]
})
export class RiskSummaryComponent {
  selectedPayment: Payment | null = null;

  constructor(
    public paymentsService: PaymentsService,
    private riskService: RiskService
  ) {}

  get highRiskCount(): number {
    return this.paymentsService.payments().filter(
      p => p.riskAssessment?.level === 'HIGH' || p.riskAssessment?.level === 'CRITICAL'
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

  openAiExplanation(payment: Payment) {
    this.selectedPayment = payment;
    this.riskService.explainRisk(payment.id).subscribe();
  }
}
