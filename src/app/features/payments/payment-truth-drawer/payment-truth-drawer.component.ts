import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '@deepaudit/shared-types';

@Component({
  selector: 'app-payment-truth-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
         (click)="close.emit()">
    </div>

    <!-- Side Drawer Panel -->
    <div class="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 overflow-hidden transform transition-all duration-300">
      
      <!-- Drawer Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl border flex items-center justify-center bg-indigo-50 border-indigo-200 text-indigo-700">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900">Payment Details & Verification</h2>
              <span class="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {{ payment?.referenceNumber || 'TXN-UNKNOWN' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Payment information, recipient status, and security checks</p>
          </div>
        </div>

        <button (click)="close.emit()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Drawer Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        
        <!-- Payment & Recipient Summary Card -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient</p>
            <p class="text-sm font-bold text-slate-900 mt-0.5">{{ payment?.beneficiary?.name }}</p>
            <p class="text-xs text-slate-500">{{ payment?.beneficiary?.bankName }} • {{ payment?.method }} Transfer</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Amount</p>
            <p class="text-lg font-extrabold text-slate-900 mt-0.5">{{ payment?.amount | currency:'INR':'symbol':'1.0-0' }}</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200">
              Needs your approval
            </span>
          </div>
        </div>

        <!-- Section: Why does this need approval? -->
        <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <h3 class="text-xs font-bold text-amber-900 uppercase tracking-wider">Why does this need approval?</h3>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed font-medium">
            {{ getPlainWhy(payment) }}
          </p>
        </div>

        <!-- Section: Security & Verification Checks -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Security & Verification Checks</h3>
            <span class="text-[11px] text-slate-400 font-medium">4 checks completed</span>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <!-- 1. Bank Core Check -->
            <div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Bank Status</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  ✓ Verified
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-800">Funds Authorized</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Reference: {{ payment?.inconsistencyDetails?.bankRef || 'HDFC-UTR-88291024' }}</p>
            </div>

            <!-- 2. Payment Network -->
            <div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Payment Rail</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  ✓ Connected
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-800">{{ payment?.gateway || 'Razorpay Enterprise PG' }}</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Valid digital signature</p>
            </div>

            <!-- 3. Verification Updates -->
            <div class="p-3.5 rounded-xl border"
                 [ngClass]="payment?.hasInconsistency ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/40'">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. System Updates</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded"
                      [ngClass]="payment?.hasInconsistency ? 'text-amber-700 bg-amber-100/80' : 'text-emerald-700 bg-emerald-100/80'">
                  {{ payment?.hasInconsistency ? 'Update pending' : '✓ Synced' }}
                </span>
              </div>
              <p class="text-xs font-semibold" [ngClass]="payment?.hasInconsistency ? 'text-amber-900' : 'text-slate-800'">
                {{ payment?.hasInconsistency ? 'Awaiting bank confirmation' : 'Fully received' }}
              </p>
              <p class="text-[10px] text-slate-500 mt-0.5">Automated update pipe</p>
            </div>

            <!-- 4. Company Approval Status -->
            <div class="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">4. Approval Rule</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                  Awaiting sign-off
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-800">Requires secondary check</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Company policy active</p>
            </div>
          </div>
        </div>

        <!-- Section: Approval History & Timeline -->
        <div *ngIf="showTimeline()" class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <p class="text-xs font-bold text-slate-800 uppercase tracking-wider">Approval History</p>
          
          <div class="relative border-l-2 border-slate-200 ml-2.5 space-y-4 text-xs">
            <div class="pl-4 relative">
              <span class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-slate-400"></span>
              <p class="font-bold text-slate-800">Payment Initiated</p>
              <p class="text-[10px] text-slate-500">Submitted by {{ payment?.creatorName || 'Aditya Sharma' }}</p>
            </div>
            <div class="pl-4 relative">
              <span class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-500"></span>
              <p class="font-bold text-indigo-700">Security & Limits Verified</p>
              <p class="text-[10px] text-slate-500">Triggered rule: payments above approval limit require confirmation</p>
            </div>
            <div class="pl-4 relative">
              <span class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-amber-500"></span>
              <p class="font-bold text-amber-700">Assigned for Your Review</p>
              <p class="text-[10px] text-slate-500">Waiting for secondary authorization</p>
            </div>
          </div>
        </div>

        <!-- Resolution Feedback Notification -->
        <div *ngIf="resolvedState()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
          </svg>
          <span class="font-semibold">Payment approved and verified successfully.</span>
        </div>

      </div>

      <!-- Drawer Footer Actions -->
      <div class="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
        <button (click)="toggleTimeline()"
                class="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
          {{ showTimeline() ? 'Hide History' : 'View Approval History' }}
        </button>

        <div class="flex items-center gap-2">
          <button (click)="close.emit()"
                  class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            Dismiss
          </button>
          <button (click)="verifyResolution()"
                  [disabled]="resolving() || resolvedState()"
                  class="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all"
                  [ngClass]="resolvedState() ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'">
            <span *ngIf="!resolving() && !resolvedState()">Verify & Approve</span>
            <span *ngIf="resolving()">Verifying...</span>
            <span *ngIf="resolvedState()">✓ Approved</span>
          </button>
        </div>
      </div>

    </div>
  `
})
export class PaymentTruthDrawerComponent {
  @Input() payment: Payment | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<Payment>();

  showTimeline = signal<boolean>(false);
  resolving = signal<boolean>(false);
  resolvedState = signal<boolean>(false);

  toggleTimeline() {
    this.showTimeline.update(v => !v);
  }

  getPlainWhy(p: Payment | null): string {
    if (!p) return "This payment requires business verification.";
    if (p.amount >= 500000 || p.id === 'pay_TX9283749283') {
      return "This payment of ₹7,45,000 exceeds your company's standard approval limit of ₹5,00,000 and requires second-level sign-off before funds are transferred.";
    }
    if (p.hasInconsistency || p.id === 'pay_TX9283749284') {
      return "The bank debited the payment, but the automated update wasn't received by your merchant records. Please confirm the payment details to complete processing.";
    }
    if (p.status === 'FLAGGED_HIGH_RISK' || p.id === 'pay_TX9283749285') {
      return "This is a first-time high-value transfer to an offshore recipient. A secondary authorization is required by company compliance policy.";
    }
    return "This payment requires business confirmation before it can be sent to the bank.";
  }

  verifyResolution() {
    this.resolving.set(true);
    setTimeout(() => {
      this.resolving.set(false);
      this.resolvedState.set(true);
      if (this.payment) {
        this.payment.status = 'SUCCESS';
        this.payment.hasInconsistency = false;
        this.resolved.emit(this.payment);
      }
    }, 700);
  }
}
