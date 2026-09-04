import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../core/services/payments.service';
import { RiskService } from '../../core/services/risk.service';
import { VoiceService } from '../../core/services/voice.service';
import { CreatePaymentComponent } from './create-payment/create-payment.component';
import { RiskExplanationComponent } from '../risk/risk-explanation/risk-explanation.component';
import { StepUpAuthComponent } from '../authorization/step-up-auth/step-up-auth.component';
import { Payment } from '@deepaudit/shared-types';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, CreatePaymentComponent, RiskExplanationComponent, StepUpAuthComponent],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">💳</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Corporate Payments Ledger</h1>
        </div>
        <p class="text-sm text-slate-500">Corporate disbursements, real-time deterministic fraud scores, and dual-control status.</p>
      </div>

      <div class="mt-4 sm:mt-0 flex items-center gap-2.5">
        <button (click)="showCreateModal = true"
                class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all"
                style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          <span>Initiate Payment (Maker)</span>
        </button>

        <button (click)="askAgent()"
                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
          <span>Ask Dhwani AI</span>
        </button>
      </div>
    </div>

    <!-- Summary KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Corporate Volume</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ totalVolume | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">↑ +14.2% verified this month</p>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Rail Health</p>
        <p class="text-2xl font-extrabold text-emerald-600">99.2%</p>
        <p class="text-xs text-slate-500 mt-1">Razorpay Enterprise & Banking Rails</p>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Hold & Step-Up</p>
        <p class="text-2xl font-extrabold text-amber-600">{{ flaggedCount }} transfers</p>
        <p class="text-xs text-slate-500 mt-1">Awaiting Passkey biometric verify</p>
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
                 placeholder="Search by payee, TXN reference, city…"
                 class="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-slate-50"/>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select [(ngModel)]="selectedStatus" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Completed (Success)</option>
          <option value="STEP_UP_REQUIRED">Step-Up Required</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
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
          <thead class="bg-slate-50">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">Reference</th>
              <th class="py-3.5 px-4">Beneficiary</th>
              <th class="py-3.5 px-4">Amount</th>
              <th class="py-3.5 px-4">Method & Gateway</th>
              <th class="py-3.5 px-4">Fraud Risk Score</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let p of filteredPayments" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-5 font-mono text-[11px] text-slate-700 font-bold">
                {{ p.referenceNumber }}
              </td>
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-900">{{ p.beneficiary.name }}</p>
                <p class="text-[10px] text-slate-400">{{ p.beneficiary.bankName }} ({{ p.beneficiary.category }})</p>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-extrabold text-sm text-slate-900">{{ p.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-semibold text-slate-800">{{ p.method }}</span>
                <span class="text-[10px] text-slate-400 block">{{ p.gateway }}</span>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [style]="riskBadgeStyle(p.riskAssessment?.level)">
                    {{ p.riskAssessment?.overallScore || 0 }}/100 ({{ p.riskAssessment?.level || 'LOW' }})
                  </span>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="statusBadgeStyle(p.status)">
                  {{ p.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right space-x-1">
                <button (click)="explainPayment(p)"
                        class="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                  Explain 💡
                </button>
                <button *ngIf="p.status === 'STEP_UP_REQUIRED'"
                        (click)="selectedStepUp = p"
                        class="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
                  Passkey 🔑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <app-create-payment *ngIf="showCreateModal" (close)="showCreateModal = false"></app-create-payment>
    <app-risk-explanation *ngIf="selectedExplainPayment" [payment]="selectedExplainPayment" (close)="selectedExplainPayment = null"></app-risk-explanation>
    <app-step-up-auth *ngIf="selectedStepUp" [payment]="selectedStepUp" (close)="selectedStepUp = null" (completed)="onStepUpDone()"></app-step-up-auth>
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

  constructor(
    public paymentsService: PaymentsService,
    private riskService: RiskService,
    private voice: VoiceService
  ) {}

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

  explainPayment(payment: Payment) {
    this.selectedExplainPayment = payment;
    this.riskService.explainRisk(payment.id).subscribe();
  }

  askAgent() {
    this.voice.setDrawerOpen(true);
  }

  onStepUpDone() {
    this.paymentsService.fetchPayments();
  }
}
