import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../core/services/payments.service';
import { Beneficiary } from '@deepaudit/shared-types';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Approved Beneficiaries & Payees</h1>
        </div>
        <p class="text-sm text-slate-500">Manage corporate vendors, payroll accounts, and verified payees subject to fraud cooling periods.</p>
      </div>
    </div>

    <!-- Beneficiaries Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div *ngFor="let b of paymentsService.beneficiaries()"
           class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                {{ b.category }}
              </span>
              <h3 class="text-base font-bold text-slate-900 mt-1.5 leading-snug">{{ b.name }}</h3>
            </div>
            <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  [style]="vettingBadgeStyle(b.status)">
              {{ b.status.replace('_', ' ') }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4 border border-slate-100">
            <div class="flex justify-between">
              <span class="text-slate-400">Bank:</span>
              <span class="font-semibold text-slate-800">{{ b.bankName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Account:</span>
              <span class="font-mono font-medium text-slate-800">•••• {{ b.accountNumber.slice(-4) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">IFSC:</span>
              <span class="font-mono text-slate-700">{{ b.ifscCode }}</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Volume Settled</span>
            <span class="font-extrabold text-slate-900">{{ b.totalPaymentsVolume | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded font-bold"
                [style]="b.riskRating === 'LOW' ? 'background:#f0fdf4;color:#15803d;' : 'background:#fef2f2;color:#b91c1c;'">
            {{ b.riskRating }} RISK
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class BeneficiariesComponent {
  constructor(public paymentsService: PaymentsService) {}

  vettingBadgeStyle(status: string): string {
    if (status === 'VERIFIED') return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (status === 'NEW_COOLING_PERIOD') return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
  }
}
