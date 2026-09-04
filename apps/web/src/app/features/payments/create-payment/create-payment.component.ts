import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../../core/services/payments.service';
import { PaymentMethod } from '@deepaudit/shared-types';

@Component({
  selector: 'app-create-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">💳</span>
            <div>
              <h3 class="text-base font-bold text-slate-900">Initiate Corporate Disbursement</h3>
              <p class="text-[11px] text-slate-400">Maker transfer submission with real-time risk screening.</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form (submit)="onSubmit()" class="space-y-4 text-xs">
          <!-- Beneficiary -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Target Beneficiary / Payee</label>
            <select [(ngModel)]="beneficiaryId" name="beneficiaryId" required
                    class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-800">
              <option *ngFor="let b of paymentsService.beneficiaries()" [value]="b.id">
                {{ b.name }} ({{ b.bankName }} - {{ b.category }})
              </option>
            </select>
          </div>

          <!-- Amount -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Transfer Amount (₹ INR)</label>
            <input type="number" [(ngModel)]="amount" name="amount" required min="1"
                   placeholder="e.g. 250000"
                   class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-extrabold text-slate-900 text-sm"/>
          </div>

          <!-- Rail and Region -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Payment Rail</label>
              <select [(ngModel)]="method" name="method"
                      class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold">
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Netbanking">Netbanking</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Originating Region</label>
              <select [(ngModel)]="region" name="region"
                      class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold">
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>
          </div>

          <!-- Purpose -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Disbursement Purpose / Invoice Reference</label>
            <input type="text" [(ngModel)]="purpose" name="purpose" required
                   placeholder="e.g. Q3 Cloud Infrastructure Invoice"
                   class="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"/>
          </div>

          <div class="flex gap-2 pt-3">
            <button type="submit" [disabled]="paymentsService.isLoading()"
                    class="flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              <span *ngIf="paymentsService.isLoading()">Screening Risk...</span>
              <span *ngIf="!paymentsService.isLoading()">Submit & Screen Fraud Signals</span>
            </button>
            <button type="button" (click)="close.emit()"
                    class="px-4 py-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`:host { display: contents; }`]
})
export class CreatePaymentComponent {
  @Output() close = new EventEmitter<void>();

  beneficiaryId = 'ben_01';
  amount = 150000;
  method: PaymentMethod = 'NEFT';
  region = 'Maharashtra';
  purpose = 'Vendor Contract Settlement';

  constructor(public paymentsService: PaymentsService) {}

  onSubmit() {
    this.paymentsService.createPayment({
      beneficiaryId: this.beneficiaryId,
      amount: Number(this.amount),
      currency: 'INR',
      method: this.method,
      region: this.region,
      purpose: this.purpose
    }).subscribe(() => {
      this.close.emit();
    });
  }
}
