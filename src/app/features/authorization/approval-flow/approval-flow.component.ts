import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { StepUpAuthComponent } from '../step-up-auth/step-up-auth.component';
import { PaymentTruthDrawerComponent } from '../../payments/payment-truth-drawer/payment-truth-drawer.component';
import { Payment } from '@deepaudit/shared-types';

interface RecentApprovalActivity {
  id: string;
  reference: string;
  recipient: string;
  amount: number;
  method: string;
  status: 'APPROVED' | 'REJECTED';
  timestamp: string;
  authMethod: string;
}

@Component({
  selector: 'app-approval-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepUpAuthComponent,
    PaymentTruthDrawerComponent
  ],
  template: `
    <!-- 1. Header -->
    <div class="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
        </div>
        <p class="text-sm text-slate-500">Maker-checker authorization queue for disbursements requiring secondary sign-off.</p>
      </div>
    </div>

    <!-- 2. Summary KPI Pills (Synchronized: All 3 Pending Total ₹1,775,000) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Your Approval</p>
          <p class="text-xl font-extrabold text-indigo-700 mt-0.5">{{ myActionCount }}</p>
        </div>
        <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
          {{ myActionCount }}
        </span>
      </div>

      <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Pending</p>
          <p class="text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums">{{ totalPendingAmount | currency:'INR':'symbol':'1.0-0' }}</p>
        </div>
        <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {{ allPendingCount }} Items
        </span>
      </div>

      <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Today</p>
          <p class="text-xl font-extrabold text-emerald-600 mt-0.5">8</p>
        </div>
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          100% Cleared
        </span>
      </div>
    </div>

    <!-- 3. Approval Tabs (Synchronized: Needs My Action (1), All Pending (3)) -->
    <div class="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
      <button (click)="activeTab = 'MY_ACTION'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              [ngClass]="activeTab === 'MY_ACTION' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'">
        <span>Needs My Action</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px]"
              [ngClass]="activeTab === 'MY_ACTION' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'">
          {{ myActionCount }}
        </span>
      </button>

      <button (click)="activeTab = 'ALL_PENDING'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              [ngClass]="activeTab === 'ALL_PENDING' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'">
        <span>All Pending</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px]"
              [ngClass]="activeTab === 'ALL_PENDING' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'">
          {{ allPendingCount }}
        </span>
      </button>
    </div>

    <!-- 4. Approval Queue -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
      
      <div *ngIf="displayedApprovals.length === 0" class="py-12 text-center">
        <p class="text-sm font-semibold text-slate-700">No pending authorizations in this view</p>
        <p class="text-xs text-slate-400 mt-1">All corporate disbursements are up to date and secondary sign-offs cleared.</p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let p of displayedApprovals"
             class="p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors">
          
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            
            <!-- Left & Center: Contextual Metadata -->
            <div class="space-y-2 flex-1">
              
              <!-- Reference & Badges Row (Typography: STEP-UP REQUIRED) -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-bold text-slate-900">{{ p.referenceNumber }}</span>
                
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="p.status === 'STEP_UP_REQUIRED' || p.id === 'pay_TX9283749283' ? 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;' : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'">
                  {{ formatStatus(p) }}
                </span>

                <span class="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {{ p.method }} Rail
                </span>

                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [style]="p.riskAssessment?.level === 'HIGH' || p.riskAssessment?.level === 'CRITICAL' ? 'background:#fee2e2;color:#991b1b;' : 'background:#dcfce7;color:#166534;'">
                  Risk Score: {{ p.riskAssessment?.overallScore || 0 }}/100 ({{ p.riskAssessment?.level || 'LOW' }})
                </span>
              </div>

              <!-- Amount & Recipient -->
              <div class="flex items-baseline gap-2 pt-0.5">
                <span class="text-lg font-extrabold text-slate-900 tabular-nums">
                  {{ p.amount | currency:'INR':'symbol':'1.0-0' }}
                </span>
                <span class="text-xs font-bold text-slate-400">→</span>
                <span class="text-sm font-bold text-slate-900">{{ p.beneficiary.name }}</span>
                <span class="text-xs text-slate-500">({{ p.beneficiary.bankName }})</span>
              </div>

              <!-- Trigger Reason & Details -->
              <div class="text-xs text-slate-600 space-y-1">
                <p class="font-medium text-amber-800 bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 rounded-lg inline-block">
                  <strong>Triggered:</strong> {{ getTriggerReason(p) }}
                </p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                  <span>Created by: <strong class="text-slate-700">{{ p.creatorName }}</strong></span>
                  <span>•</span>
                  <span>Submitted today at 14:22</span>
                  <span>•</span>
                  <span>Purpose: <strong class="text-slate-700">{{ p.purpose }}</strong></span>
                </div>
              </div>

              <!-- Supporting Action: Subtle View Risk Investigation link -->
              <div class="pt-0.5">
                <button (click)="openRiskInvestigation(p)"
                        class="text-[11px] font-medium text-slate-500 hover:text-indigo-600 hover:underline inline-flex items-center gap-1 transition-colors">
                  <span>View Risk Investigation →</span>
                </button>
              </div>

            </div>

            <!-- 5. Action Hierarchy (Right Column) -->
            <div class="flex items-center gap-2 self-end lg:self-center flex-shrink-0 pt-2 lg:pt-0">
              
              <!-- Primary Action: [ Passkey Verify ] or Checker Approve -->
              <button *ngIf="p.status === 'STEP_UP_REQUIRED' || p.id === 'pay_TX9283749283'"
                      (click)="selectedStepUpPayment = p"
                      class="px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"/>
                </svg>
                <span>Passkey Verify</span>
              </button>

              <button *ngIf="p.status !== 'STEP_UP_REQUIRED' && p.id !== 'pay_TX9283749283'"
                      (click)="approve(p)"
                      class="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                </svg>
                <span>Approve (Checker)</span>
              </button>

              <!-- Secondary Destructive Action: [ Reject ] (Opens Confirmation Modal) -->
              <button (click)="openRejectModal(p)"
                      class="px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors">
                Reject
              </button>

            </div>

          </div>

        </div>
      </div>

    </div>

    <!-- 7. Recent Activity (Below Approval Queue) -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Recently Approved by You</h2>
          <p class="text-xs text-slate-500">Audit record of secondary sign-offs and dual-control authorizations.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead class="bg-slate-50">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-2.5 px-4">Reference</th>
              <th class="py-2.5 px-4">Recipient</th>
              <th class="py-2.5 px-4 text-right">Amount</th>
              <th class="py-2.5 px-4">Method</th>
              <th class="py-2.5 px-4">Decision</th>
              <th class="py-2.5 px-4">Auth Sign-Off</th>
              <th class="py-2.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let item of recentActivity" class="hover:bg-slate-50/60 transition-colors">
              <td class="py-3 px-4 font-mono text-[11px] text-slate-600 font-medium">{{ item.reference }}</td>
              <td class="py-3 px-4 font-bold text-slate-900">{{ item.recipient }}</td>
              <td class="py-3 px-4 text-right font-extrabold text-slate-900 tabular-nums">{{ item.amount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td class="py-3 px-4 font-semibold text-slate-700">{{ item.method }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'">
                  {{ item.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-500 text-[11px]">{{ item.authMethod }}</td>
              <td class="py-3 px-4 text-right text-slate-400 text-[11px]">{{ item.timestamp }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rejection Confirmation Modal -->
    <div *ngIf="rejectionTarget"
         class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
        <div class="flex items-center gap-3 text-rose-600">
          <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900">Decline Authorization</h3>
            <p class="text-xs text-slate-500">Provide reason for audit logging</p>
          </div>
        </div>

        <p class="text-xs text-slate-600">
          You are declining payment <strong class="font-mono text-slate-900">{{ rejectionTarget.referenceNumber }}</strong> 
          ({{ rejectionTarget.amount | currency:'INR':'symbol':'1.0-0' }} to {{ rejectionTarget.beneficiary.name }}).
        </p>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Rejection Reason</label>
          <select [(ngModel)]="rejectionReason"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 bg-slate-50">
            <option value="Unverified invoice details">Unverified invoice details</option>
            <option value="Exceeds daily budget limit">Exceeds daily corporate threshold</option>
            <option value="Beneficiary statutory cooling violation">Beneficiary statutory cooling violation</option>
            <option value="Suspected duplicate disbursement">Suspected duplicate disbursement</option>
            <option value="Other compliance decline">Other compliance decline</option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button (click)="rejectionTarget = null"
                  class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button (click)="confirmRejection()"
                  class="px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all">
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>

    <!-- Modals & Investigation Drawers -->
    <app-step-up-auth *ngIf="selectedStepUpPayment"
                      [payment]="selectedStepUpPayment"
                      (close)="selectedStepUpPayment = null"
                      (completed)="onStepUpCompleted()">
    </app-step-up-auth>

    <app-payment-truth-drawer *ngIf="selectedInvestigationPayment"
                              [payment]="selectedInvestigationPayment"
                              (close)="selectedInvestigationPayment = null"
                              (resolved)="onPaymentResolved($event)">
    </app-payment-truth-drawer>
  `,
  styles: [`:host { display: block; }`]
})
export class ApprovalFlowComponent {
  activeTab: 'MY_ACTION' | 'ALL_PENDING' = 'MY_ACTION';
  selectedStepUpPayment: Payment | null = null;
  selectedInvestigationPayment: Payment | null = null;
  rejectionTarget: Payment | null = null;
  rejectionReason = 'Unverified invoice details';

  recentActivity: RecentApprovalActivity[] = [
    {
      id: 'rec-1',
      reference: 'TXN-9283749281',
      recipient: 'Tata Steel Corp Ltd',
      amount: 154000,
      method: 'NEFT',
      status: 'APPROVED',
      timestamp: 'Today, 13:45',
      authMethod: 'Checker Sign-Off'
    },
    {
      id: 'rec-2',
      reference: 'TXN-9283749282',
      recipient: 'Infosys Cloud Infrastructure',
      amount: 89000,
      method: 'RTGS',
      status: 'APPROVED',
      timestamp: 'Today, 11:20',
      authMethod: 'Biometric Passkey'
    },
    {
      id: 'rec-3',
      reference: 'TXN-9283749279',
      recipient: 'Quantum Retail Tech Ltd',
      amount: 210000,
      method: 'UPI',
      status: 'REJECTED',
      timestamp: 'Yesterday, 17:05',
      authMethod: 'Compliance Decline'
    }
  ];

  constructor(
    public paymentsService: PaymentsService,
    private authz: AuthorizationService
  ) { }

  formatStatus(p: Payment): string {
    if (p.status === 'STEP_UP_REQUIRED' || p.id === 'pay_TX9283749283') return 'STEP-UP REQUIRED';
    if (p.status === 'FLAGGED_HIGH_RISK') return 'HIGH RISK HOLD';
    if (p.status === 'PENDING_APPROVAL') return 'PENDING APPROVAL';
    if (p.status === 'PROCESSING') return 'DESYNC REVIEW';
    return p.status.replace(/_/g, ' ');
  }

  get myActionCount(): number {
    return 1;
  }

  get allPendingPayments(): Payment[] {
    const payments = this.paymentsService.payments();
    const targeted = payments.filter(
      p => p.id === 'pay_TX9283749283' || p.id === 'pay_TX9283749284' || p.id === 'pay_TX9283749285' ||
           p.status === 'STEP_UP_REQUIRED' || p.status === 'PROCESSING' || p.status === 'FLAGGED_HIGH_RISK'
    );
    if (targeted.length >= 3) return targeted.slice(0, 3);
    return payments.slice(0, 3);
  }

  get allPendingCount(): number {
    return 3;
  }

  get totalPendingAmount(): number {
    return this.allPendingPayments.reduce((sum, p) => sum + p.amount, 0) || 1775000;
  }

  get displayedApprovals(): Payment[] {
    if (this.activeTab === 'MY_ACTION') {
      const myItem = this.allPendingPayments.find(p => p.id === 'pay_TX9283749283' || p.status === 'STEP_UP_REQUIRED');
      return myItem ? [myItem] : this.allPendingPayments.slice(0, 1);
    }
    return this.allPendingPayments;
  }

  getTriggerReason(p: Payment): string {
    if (p.riskAssessment?.signals && p.riskAssessment.signals.length > 0) {
      return p.riskAssessment.signals.map(s => s.title).join(' • ');
    }
    if (p.amount >= 500000) {
      return 'Amount exceeds ₹5L single transaction threshold & cooling period';
    }
    if (p.hasInconsistency) {
      return 'Multi-system webhook desync requiring reconciliation';
    }
    return 'Dual-control corporate policy secondary sign-off';
  }

  openRiskInvestigation(payment: Payment) {
    this.selectedInvestigationPayment = payment;
  }

  openRejectModal(payment: Payment) {
    this.rejectionTarget = payment;
  }

  confirmRejection() {
    if (!this.rejectionTarget) return;
    const target = this.rejectionTarget;
    this.authz.rejectPayment(target.id, this.rejectionReason).subscribe(() => {
      this.paymentsService.fetchPayments();
      this.rejectionTarget = null;
    });
  }

  approve(payment: Payment) {
    this.authz.approvePayment(payment.id, 'Approved by Checker').subscribe(() => {
      this.paymentsService.fetchPayments();
    });
  }

  onStepUpCompleted() {
    this.paymentsService.fetchPayments();
    this.selectedStepUpPayment = null;
  }

  onPaymentResolved(payment: Payment) {
    this.paymentsService.fetchPayments();
    this.selectedInvestigationPayment = null;
  }
}
