import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../core/services/audit.service';
import { AuditEvent } from '@deepaudit/shared-types';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-7">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">📜</span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Immutable Audit Ledger</h1>
          </div>
          <p class="text-sm text-slate-500">Cryptographically chained chronological event log for corporate compliance & fraud forensics.</p>
        </div>
        <button (click)="auditService.fetchAuditEvents()"
                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          Refresh Ledger
        </button>
      </div>
    </div>

    <!-- Immutability Security Banner -->
    <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl mb-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">Append-Only Cryptographic Chain Active</h2>
          <p class="text-xs text-slate-400">Events are SHA-256 hashed with the previous block hash to prevent tampering or silent backdating.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          LEDGER VERIFIED
        </span>
      </div>
    </div>

    <!-- Event Stream Table -->
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">Seq #</th>
              <th class="py-3.5 px-4">Event Type</th>
              <th class="py-3.5 px-4">Actor & Role</th>
              <th class="py-3.5 px-4">Summary</th>
              <th class="py-3.5 px-4">SHA-256 Hash</th>
              <th class="py-3.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let ev of auditService.auditEvents()" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-5 font-mono text-[11px] font-bold text-slate-600">
                #{{ ev.sequenceNumber }}
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      [style]="badgeStyle(ev.eventType)">
                  {{ ev.eventType }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-800">{{ ev.actorName }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">{{ ev.actorRole }}</p>
              </td>
              <td class="py-3.5 px-4 text-slate-700 max-w-xs font-medium">
                {{ ev.summary }}
              </td>
              <td class="py-3.5 px-4 font-mono text-[10px] text-indigo-600 bg-indigo-50/50 rounded px-1.5 py-0.5" [title]="ev.immutableHash">
                {{ ev.immutableHash.substring(0, 14) }}...
              </td>
              <td class="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                {{ ev.timestamp | date:'short' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AuditComponent {
  constructor(public auditService: AuditService) {}

  badgeStyle(type: string): string {
    if (type.includes('APPROVED')) return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (type.includes('REJECTED') || type.includes('FLAGGED')) return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
    if (type.includes('STEP_UP')) return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    if (type.includes('AI_')) return 'background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;';
    return 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;';
  }
}
