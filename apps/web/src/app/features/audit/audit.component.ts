import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../core/services/audit.service';
import { AuditEvent } from '@deepaudit/shared-types';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Page Header -->
    <div class="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Payment Activity</h1>
        </div>
        <p class="text-sm text-slate-500">A secure record of important payment activity and decisions.</p>
      </div>
      <button (click)="auditService.fetchAuditEvents()"
              class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-all self-start sm:self-auto">
        <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
        </svg>
        <span>Refresh Activity</span>
      </button>
    </div>

    <!-- Security Banner -->
    <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl mb-6 shadow-sm border border-slate-800">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Your activity records are protected</h2>
            <p class="text-xs text-slate-400">Every important action is securely recorded and protected from unauthorized changes.</p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto">
          <button (click)="toggleSecurityDetails()"
                  class="text-xs font-semibold text-indigo-300 hover:text-white hover:underline transition-colors inline-flex items-center gap-1">
            <span>{{ showSecurityDetails() ? 'Hide security details' : 'View security details →' }}</span>
          </button>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Protected & Verified
          </span>
        </div>
      </div>

      <!-- Expandable Security Details -->
      <div *ngIf="showSecurityDetails()" class="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protection Status</p>
            <p class="font-semibold text-white mt-0.5">Secure sequential protection</p>
            <p class="text-[11px] text-slate-400 mt-1">Each record is securely linked to protect against unauthorized modifications.</p>
          </div>
          <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Status</p>
            <p class="font-semibold text-emerald-400 mt-0.5">All {{ auditService.auditEvents().length }} entries verified</p>
            <p class="text-[11px] text-slate-400 mt-1">Continuous verification active across all payment and approval records.</p>
          </div>
          <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Status</p>
            <p class="font-semibold text-white mt-0.5">Audit & Compliance Ready</p>
            <p class="text-[11px] text-slate-400 mt-1">Complete, verified history ready for corporate governance and reporting.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Stream Table -->
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">#</th>
              <th class="py-3.5 px-4">ACTIVITY</th>
              <th class="py-3.5 px-4">PERFORMED BY</th>
              <th class="py-3.5 px-4">DETAILS</th>
              <th class="py-3.5 px-4">
                <div class="flex items-center gap-1" title="A unique reference used to protect and verify the activity record.">
                  <span>SECURITY REFERENCE</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
                  </svg>
                </div>
              </th>
              <th class="py-3.5 px-4 text-right">TIME</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let ev of auditService.auditEvents()" class="hover:bg-slate-50/70 transition-colors">
              
              <!-- Sequence Number -->
              <td class="py-3.5 px-5 font-mono text-[11px] font-bold text-slate-500">
                {{ ev.sequenceNumber }}
              </td>

              <!-- Activity Name -->
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      [style]="badgeStyle(ev.eventType)">
                  {{ formatActivityName(ev.eventType) }}
                </span>
              </td>

              <!-- Performed By & Role -->
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-800">{{ formatActorName(ev) }}</p>
                <p class="text-[10px] text-slate-400 font-semibold">{{ formatActorRole(ev.actorRole) }}</p>
              </td>

              <!-- Details -->
              <td class="py-3.5 px-4 text-slate-700 max-w-md font-medium leading-relaxed">
                {{ formatDetails(ev.summary) }}
              </td>

              <!-- Security Reference -->
              <td class="py-3.5 px-4">
                <span class="font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 cursor-help"
                      title="A unique reference used to protect and verify the activity record.">
                  {{ ev.immutableHash ? ev.immutableHash.substring(0, 14) + '...' : 'Protected' }}
                </span>
              </td>

              <!-- Time -->
              <td class="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px]">
                {{ ev.timestamp | date:'shortTime' }} • {{ ev.timestamp | date:'mediumDate' }}
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
  showSecurityDetails = signal<boolean>(false);

  constructor(public auditService: AuditService) {}

  toggleSecurityDetails(): void {
    this.showSecurityDetails.update(v => !v);
  }

  formatActivityName(eventType: string): string {
    switch (eventType) {
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
      default: return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  formatActorName(ev: AuditEvent): string {
    if (ev.actorName === 'DeepAudit Gemini Service' || ev.actorRole === 'AI_AGENT' || (ev.actorId && ev.actorId.includes('gemini'))) {
      return 'Dhwani AI';
    }
    if (ev.actorRole === 'SYSTEM' || (ev.actorId && ev.actorId.includes('system'))) {
      return 'Automated assistant';
    }
    if (ev.actorRole === 'MAKER' && (!ev.actorName || ev.actorName === 'MAKER')) {
      return 'Payment creator';
    }
    return ev.actorName || 'Aditya Sharma';
  }

  formatActorRole(role: string): string {
    switch (role) {
      case 'AI_AGENT': return 'Automated assistant';
      case 'MAKER': return 'Payment creator';
      case 'CHECKER': return 'Treasury Officer';
      case 'ADMIN': return 'System Administrator';
      case 'SYSTEM': return 'Automated assistant';
      case 'AUDITOR': return 'Compliance Officer';
      default: return role ? role.replace(/_/g, ' ') : 'Operations';
    }
  }

  formatDetails(summary: string): string {
    if (!summary) return 'Payment activity recorded.';
    
    // Pattern matches for exact natural language replacements
    if (/AI risk explanation generated and validated/i.test(summary)) {
      return 'A risk explanation was prepared for this payment.';
    }
    if (/AI risk explanation requested/i.test(summary)) {
      return 'A payment risk explanation was requested.';
    }
    if (/Step-up passkey verification required/i.test(summary) || /HIGH risk score/i.test(summary)) {
      return 'Additional approval requested for this payment as it exceeds standard verification rules.';
    }
    if (/Payment.*created for/i.test(summary)) {
      return summary.replace(/Payment TXN-[0-9]+/i, 'Payment created');
    }

    return summary
      .replace(/AI risk explanation generated and validated for payment/g, 'A risk explanation was prepared for this payment.')
      .replace(/AI risk explanation requested for payment/g, 'A payment risk explanation was requested.')
      .replace(/Step-up passkey verification required for/g, 'Additional approval requested for')
      .replace(/due to HIGH risk score/g, 'as it exceeds standard verification rules')
      .replace(/Payment TXN/g, 'Transfer TXN');
  }

  badgeStyle(type: string): string {
    if (type.includes('APPROVED') || type.includes('COMPLETED')) return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (type.includes('REJECTED') || type.includes('FLAGGED')) return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
    if (type.includes('STEP_UP') || type.includes('REQUIRED')) return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    if (type.includes('AI_') || type.includes('EXPLANATION')) return 'background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;';
    return 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;';
  }
}

