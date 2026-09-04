import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { StepUpAuthComponent } from '../step-up-auth/step-up-auth.component';
import { Payment } from '@deepaudit/shared-types';

@Component({
  selector: 'app-approval-flow',
  standalone: true,
  imports: [CommonModule, StepUpAuthComponent],
  template: `
    <div class="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">⚖️</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Corporate Dual-Control Authorizations</h1>
        </div>
        <p class="text-sm text-slate-500">Maker-Checker dual authorization queue for high-value and fraud-flagged corporate transfers.</p>
      </div>
    </div>

    <!-- Pending Queue -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Awaiting Sign-Off ({{ pendingApprovals.length }})</h2>
      </div>

      <div *ngIf="pendingApprovals.length === 0" class="py-12 text-center">
        <p class="text-sm font-semibold text-slate-700">No pending authorizations</p>
        <p class="text-xs text-slate-400 mt-1">All corporate disbursements are fully verified and processed.</p>
      </div>

      <div class="space-y-3">
        <div *ngFor="let p of pendingApprovals"
             class="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-xs font-bold text-slate-900">{{ p.referenceNumber }}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    [style]="p.status === 'STEP_UP_REQUIRED' ? 'background:#fee2e2;color:#991b1b;' : 'background:#fef3c7;color:#92400e;'">
                {{ p.status.replace('_', ' ') }}
              </span>
            </div>
            <p class="text-xs text-slate-600">
              Disbursement of <strong class="text-slate-900">{{ p.amount | currency:'INR':'symbol':'1.0-0' }}</strong> to <strong>{{ p.beneficiary.name }}</strong>
            </p>
            <p class="text-[11px] text-slate-400 mt-1">Created by: {{ p.creatorName }} • Purpose: {{ p.purpose }}</p>
          </div>

          <div class="flex items-center gap-2">
            <button *ngIf="p.status === 'STEP_UP_REQUIRED'"
                    (click)="selectedStepUpPayment = p"
                    class="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5">
              <span>🔑 Passkey Verify</span>
            </button>

            <button *ngIf="p.status !== 'STEP_UP_REQUIRED'"
                    (click)="approve(p)"
                    class="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all">
              Approve (Checker)
            </button>

            <button (click)="reject(p)"
                    class="px-3 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step-Up Passkey Modal -->
    <app-step-up-auth *ngIf="selectedStepUpPayment"
                      [payment]="selectedStepUpPayment"
                      (close)="selectedStepUpPayment = null"
                      (completed)="onStepUpCompleted()">
    </app-step-up-auth>
  `,
  styles: [`:host { display: block; }`]
})
export class ApprovalFlowComponent {
  selectedStepUpPayment: Payment | null = null;

  constructor(
    public paymentsService: PaymentsService,
    private authz: AuthorizationService
  ) {}

  get pendingApprovals(): Payment[] {
    return this.paymentsService.payments().filter(
      p => p.status === 'STEP_UP_REQUIRED' || p.status === 'PENDING_APPROVAL' || p.status === 'FLAGGED_HIGH_RISK'
    );
  }

  approve(payment: Payment) {
    this.authz.approvePayment(payment.id, 'Approved by Checker').subscribe(() => {
      this.paymentsService.fetchPayments();
    });
  }

  reject(payment: Payment) {
    this.authz.rejectPayment(payment.id, 'Declined during corporate review').subscribe(() => {
      this.paymentsService.fetchPayments();
    });
  }

  onStepUpCompleted() {
    this.paymentsService.fetchPayments();
  }
}
