import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '@deepaudit/shared-types';
import { AuthorizationService } from '../../../core/services/authorization.service';

@Component({
  selector: 'app-step-up-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="payment"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
        
        <!-- Passkey Icon -->
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
          </svg>
        </div>

        <h3 class="text-lg font-bold text-slate-900 mb-1">Step-Up Passkey Authorization</h3>
        <p class="text-xs text-slate-500 mb-4">
          Hardware biometric sign-off required for high-risk corporate disbursement <strong>{{ payment.referenceNumber }}</strong>.
        </p>

        <!-- Payment details card -->
        <div class="p-3 bg-slate-50 rounded-xl text-left text-xs mb-4 border border-slate-200/80 space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Amount:</span>
            <span class="font-bold text-slate-900">{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Beneficiary:</span>
            <span class="font-semibold text-slate-800">{{ payment.beneficiary.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Risk Assessment:</span>
            <span class="font-bold text-amber-600">{{ payment.riskAssessment?.level }} ({{ payment.riskAssessment?.overallScore }}/100)</span>
          </div>
        </div>

        <!-- Biometrics Trigger Button -->
        <div class="space-y-2">
          <button (click)="verifyPasskey()"
                  [disabled]="authz.isAuthenticating()"
                  class="w-full py-3 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2"
                  style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
            <svg *ngIf="!authz.isAuthenticating()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565m-9.714 3.504a15.672 15.672 0 0 1-1.4-3.069m19.128-1.903c.162.88.25 1.79.25 2.721a11.196 11.196 0 0 1-.097 1.467m-1.75 3.607a15.65 15.65 0 0 1-5.184 3.29"/>
            </svg>
            <span *ngIf="authz.isAuthenticating()">Prompting Platform Biometrics...</span>
            <span *ngIf="!authz.isAuthenticating()">Authorize with TouchID / FaceID / Passkey</span>
          </button>

          <button (click)="close.emit()"
                  class="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
            Cancel Authorization
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: contents; }`]
})
export class StepUpAuthComponent {
  @Input() payment: Payment | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  constructor(public authz: AuthorizationService) {}

  async verifyPasskey() {
    if (!this.payment) return;
    const success = await this.authz.triggerPasskeyStepUp(this.payment);
    if (success) {
      this.completed.emit();
      this.close.emit();
    }
  }
}
