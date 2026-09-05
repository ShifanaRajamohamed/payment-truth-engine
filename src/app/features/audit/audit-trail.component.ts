import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';
import { AuditEntry } from '@deepaudit/shared-types';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Payment Activity
            </span>
            <span class="text-xs text-slate-400">Protected & Verified Records</span>
          </div>
          <h1 class="text-2xl font-black text-white mt-1">Payment Activity</h1>
          <p class="text-xs text-slate-400">
            A secure record of important payment activity and decisions.
          </p>
        </div>

        <button (click)="loadLogs()" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white transition-all flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          <span>Refresh Activity</span>
        </button>
      </div>

      <!-- Audit Entries Table -->
      <div class="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-4">ACTIVITY</th>
                <th class="p-4">PERFORMED BY</th>
                <th class="p-4">DETAILS</th>
                <th class="p-4">SECURITY REFERENCE</th>
                <th class="p-4 text-right">TIME</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr *ngFor="let entry of auditLogs()" class="hover:bg-slate-950/40 transition-colors">
                <td class="p-4 font-bold text-white whitespace-nowrap">
                  {{ formatAction(entry.action) }}
                </td>
                <td class="p-4 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                    {{ entry.actor === 'AI_AGENT' ? 'Automated assistant' : (entry.actorName || 'Payment creator') }}
                  </span>
                  <span class="block text-[10px] text-slate-500 mt-0.5">{{ entry.actor === 'AI_AGENT' ? 'Dhwani AI' : 'Payment creator' }}</span>
                </td>
                <td class="p-4 text-slate-300 max-w-xs leading-relaxed">
                  {{ formatDetails(entry.details) }}
                </td>
                <td class="p-4 font-mono text-[10px] text-emerald-400 whitespace-nowrap cursor-help" title="A unique reference used to protect and verify the activity record.">
                  {{ entry.cryptographicSignature ? entry.cryptographicSignature.substring(0, 16) + '...' : 'Protected' }}
                </td>
                <td class="p-4 font-mono text-slate-400 whitespace-nowrap text-right">
                  {{ entry.timestamp | date:'short' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class AuditTrailComponent implements OnInit {
  auditLogs = signal<AuditEntry[]>([]);

  constructor(public truthService: TruthIncidentService) {}

  ngOnInit() {
    this.loadLogs();
  }

  async loadLogs() {
    try {
      const logs = await this.truthService.loadAuditLogs();
      this.auditLogs.set(logs);
    } catch (e) {
      // Collect local audit logs from active incidents
      const logs: AuditEntry[] = [];
      this.truthService.incidents().forEach(i => {
        if (i.auditTrail) logs.push(...i.auditTrail);
      });
      this.auditLogs.set(logs);
    }
  }

  formatAction(action: string): string {
    switch (action) {
      case 'AI_EXPLANATION_GENERATED': return 'Risk explanation ready';
      case 'AI_EXPLANATION_REQUESTED': return 'Risk explanation requested';
      case 'PAYMENT_CREATED': return 'Payment created';
      case 'STEP_UP_AUTH_REQUIRED':
      case 'STEP_UP_REQUESTED': return 'Approval requested';
      case 'STEP_UP_COMPLETED': return 'Payment verified & approved';
      case 'PAYMENT_APPROVED': return 'Payment approved';
      case 'PAYMENT_REJECTED': return 'Payment declined';
      case 'PAYMENT_FLAGGED': return 'Payment flagged for review';
      case 'PAYMENT_RESOLVED': return 'Payment synchronized';
      default: return (action || 'Payment update').replace(/_/g, ' ');
    }
  }

  formatDetails(details: string): string {
    if (!details) return 'Action recorded and secured.';
    if (/AI risk explanation generated and validated/i.test(details)) {
      return 'A risk explanation was prepared for this payment.';
    }
    if (/AI risk explanation requested/i.test(details)) {
      return 'A payment risk explanation was requested.';
    }
    return details
      .replace(/AI risk explanation generated and validated for payment/g, 'A risk explanation was prepared for this payment.')
      .replace(/AI risk explanation requested for payment/g, 'A payment risk explanation was requested.')
      .replace(/Step-up passkey verification required for/g, 'Additional approval requested for')
      .replace(/due to HIGH risk score/g, 'as it exceeds standard verification rules');
  }
}
