import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NewsItem {
  id: string;
  category: 'Regulatory & Compliance' | 'Fraud Alerts & Security Bulletins' | 'Market Trends & FX';
  categoryPillBg: string;
  categoryPillText: string;
  categoryBorder: string;
  priority: 'Urgent' | 'Advisory' | 'Standard';
  headline: string;
  summary: string;
  timestamp: string;
  source: string;
  readTime: string;
  impactSummary: string;
  actionItems: string[];
}

@Component({
  selector: 'app-news-intelligence-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80">
      
      <!-- Component Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Market & Regulatory News Intelligence</h2>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Real-time global compliance bulletins, AML directives & fraud alerts</p>
        </div>

        <!-- Filter tabs -->
        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold select-none">
          <button (click)="filterCategory.set('ALL')"
                  class="px-3 py-1.5 rounded-lg transition-all"
                  [ngClass]="filterCategory() === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'">
            All Feeds
          </button>
          <button (click)="filterCategory.set('Regulatory & Compliance')"
                  class="px-3 py-1.5 rounded-lg transition-all"
                  [ngClass]="filterCategory() === 'Regulatory & Compliance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'">
            Regulatory
          </button>
          <button (click)="filterCategory.set('Fraud Alerts & Security Bulletins')"
                  class="px-3 py-1.5 rounded-lg transition-all"
                  [ngClass]="filterCategory() === 'Fraud Alerts & Security Bulletins' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'">
            Fraud & Security
          </button>
          <button (click)="filterCategory.set('Market Trends & FX')"
                  class="px-3 py-1.5 rounded-lg transition-all"
                  [ngClass]="filterCategory() === 'Market Trends & FX' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'">
            FX & Markets
          </button>
        </div>
      </div>

      <!-- News Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-5">
        <div *ngFor="let item of filteredNews()"
             class="group rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between bg-[#fbfcfe] hover:bg-white"
             [style.borderColor]="item.categoryBorder">
          
          <div>
            <!-- Top Badges Row -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <!-- Category Pill -->
              <span class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    [style.background]="item.categoryPillBg"
                    [style.color]="item.categoryPillText">
                {{ item.category }}
              </span>

              <!-- Priority / Severity Badge -->
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"
                    [ngClass]="{
                      'bg-red-50 text-red-700 border border-red-200': item.priority === 'Urgent',
                      'bg-amber-50 text-amber-700 border border-amber-200': item.priority === 'Advisory',
                      'bg-blue-50 text-blue-700 border border-blue-200': item.priority === 'Standard'
                    }">
                <span class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="{
                        'bg-red-500': item.priority === 'Urgent',
                        'bg-amber-500': item.priority === 'Advisory',
                        'bg-blue-500': item.priority === 'Standard'
                      }"></span>
                {{ item.priority }}
              </span>
            </div>

            <!-- Headline -->
            <h3 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
              {{ item.headline }}
            </h3>

            <!-- 2-line Summary -->
            <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
              {{ item.summary }}
            </p>
          </div>

          <!-- Metadata & Actions Row -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>{{ item.source }}</span>
              <span>•</span>
              <span>{{ item.timestamp }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button (click)="openBriefModal(item)"
                      class="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                Read Brief →
              </button>
              <button (click)="shareWithOps(item)" title="Share with Ops"
                      class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Toast Feedback -->
      <div *ngIf="toastMessage()"
           class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
        <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
        </svg>
        <span>{{ toastMessage() }}</span>
      </div>

      <!-- ── Read Full Brief Modal ────────────────────────────────────────── -->
      <div *ngIf="selectedItem()"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
          
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                      [style.background]="selectedItem()!.categoryPillBg"
                      [style.color]="selectedItem()!.categoryPillText">
                  {{ selectedItem()!.category }}
                </span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                      [ngClass]="{
                        'bg-red-50 text-red-700': selectedItem()!.priority === 'Urgent',
                        'bg-amber-50 text-amber-700': selectedItem()!.priority === 'Advisory',
                        'bg-blue-50 text-blue-700': selectedItem()!.priority === 'Standard'
                      }">
                  {{ selectedItem()!.priority }} Priority
                </span>
              </div>
              <h2 class="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {{ selectedItem()!.headline }}
              </h2>
              <div class="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                <span>Source: <strong>{{ selectedItem()!.source }}</strong></span>
                <span>•</span>
                <span>{{ selectedItem()!.timestamp }}</span>
                <span>•</span>
                <span>{{ selectedItem()!.readTime }}</span>
              </div>
            </div>

            <button (click)="closeBriefModal()" class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Impact Analysis Box -->
          <div class="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Executive Impact Analysis</h4>
            <p class="text-xs text-indigo-800 leading-relaxed">{{ selectedItem()!.impactSummary }}</p>
          </div>

          <!-- Actionable Compliance Items -->
          <div>
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Recommended Operational Actions</h4>
            <ul class="space-y-2">
              <li *ngFor="let action of selectedItem()!.actionItems" class="flex items-start gap-2.5 text-xs text-slate-700">
                <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                  </svg>
                </div>
                <span>{{ action }}</span>
              </li>
            </ul>
          </div>

          <!-- Modal Footer -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button (click)="shareWithOps(selectedItem()!)"
                    class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Share Brief with Ops
            </button>
            <button (click)="closeBriefModal()"
                    class="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors">
              Acknowledge & Close
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fadeIn { animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
  `]
})
export class NewsIntelligenceFeedComponent {
  readonly filterCategory = signal<string>('ALL');
  readonly selectedItem = signal<NewsItem | null>(null);
  readonly toastMessage = signal<string>('');

  newsItems: NewsItem[] = [
    {
      id: 'news-1',
      category: 'Regulatory & Compliance',
      categoryPillBg: 'rgba(79, 70, 229, 0.1)',
      categoryPillText: '#4338ca',
      categoryBorder: 'rgba(79, 70, 229, 0.2)',
      priority: 'Urgent',
      headline: 'Central Bank Mandates Stricter Dual-Key Authorization for Cross-Border FX Above $50K',
      summary: 'New financial integrity guidelines require dual biometric quorum for outbound corporate remittances exceeding $50,000 threshold starting Q4.',
      timestamp: '12m ago',
      source: 'FinCEN Bulletin',
      readTime: '3 min read',
      impactSummary: 'Affects corporate Treasury dual-approval workflows. DeepAudit policy rules have been synchronized with the updated threshold.',
      actionItems: [
        'Review corporate authorization limits in Policy Sandbox.',
        'Ensure all tier-2 makers/checkers have active device passkey registered.',
        'Export updated audit logs for central banking compliance filing.'
      ]
    },
    {
      id: 'news-2',
      category: 'Fraud Alerts & Security Bulletins',
      categoryPillBg: 'rgba(239, 68, 68, 0.1)',
      categoryPillText: '#b91c1c',
      categoryBorder: 'rgba(239, 68, 68, 0.2)',
      priority: 'Urgent',
      headline: 'Emerging Synthetic ID Ring Detected Targeting Corporate Virtual Account Settlements',
      summary: 'Global intelligence network flags velocity bursts in merchant onboarding with randomized tax IDs and spoofed device signatures.',
      timestamp: '45m ago',
      source: 'Interpol CyberFin',
      readTime: '4 min read',
      impactSummary: 'Dhwani AI scoring models updated to assign +28 risk weight on first-time high-velocity payout transactions.',
      actionItems: [
        'Inspect the Fraud Protection queue for flagged velocity anomalies.',
        'Enable biometric step-up for newly attached beneficiary accounts.',
        'Run simulated attack vectors in Policy Sandbox to test rule resilience.'
      ]
    },
    {
      id: 'news-3',
      category: 'Market Trends & FX',
      categoryPillBg: 'rgba(16, 185, 129, 0.1)',
      categoryPillText: '#047857',
      categoryBorder: 'rgba(16, 185, 129, 0.2)',
      priority: 'Standard',
      headline: 'Cross-Border Real-Time Gross Settlement (RTGS) Volume Expands 24% Across APAC Corridor',
      summary: 'Instant settlement rails between India, Singapore, and UAE record peak transaction liquidity, lowering counterparty settlement risk.',
      timestamp: '1h ago',
      source: 'Reuters Financial',
      readTime: '2 min read',
      impactSummary: 'Beneficiary settlement latency lowered from T+1 to under 4.2 seconds across active Singapore/UAE corridors.',
      actionItems: [
        'Verify instant corridor routing in Global Activity map view.',
        'Check currency spread optimizations on EUR/INR and USD/INR pairs.'
      ]
    },
    {
      id: 'news-4',
      category: 'Regulatory & Compliance',
      categoryPillBg: 'rgba(79, 70, 229, 0.1)',
      categoryPillText: '#4338ca',
      categoryBorder: 'rgba(79, 70, 229, 0.2)',
      priority: 'Advisory',
      headline: 'ISO 20022 Enhanced Rich-Data Messaging Migration Enters Phase 3 Final Certification',
      summary: 'Financial institutions must ensure structured remittance data fields, ultimate debtor tags, and purpose codes are fully populated.',
      timestamp: '2h ago',
      source: 'SWIFT Bulletin',
      readTime: '5 min read',
      impactSummary: 'DeepAudit ledger schemas are already ISO 20022 compliant with complete XML/JSON envelope parity.',
      actionItems: [
        'Audit recent batch transaction exports for ISO 20022 message validity.',
        'Notify enterprise enterprise resource planning (ERP) team on tag standards.'
      ]
    },
    {
      id: 'news-5',
      category: 'Fraud Alerts & Security Bulletins',
      categoryPillBg: 'rgba(239, 68, 68, 0.1)',
      categoryPillText: '#b91c1c',
      categoryBorder: 'rgba(239, 68, 68, 0.2)',
      priority: 'Advisory',
      headline: 'SMS OTP Interception Alert: Urgent Migration to Device Passkeys & WebAuthn Advised',
      summary: 'SS7 and SIM-swap vulnerabilities observed across telecom networks compromising legacy SMS-based one-time-passwords.',
      timestamp: '3h ago',
      source: 'CISA Advisory',
      readTime: '3 min read',
      impactSummary: 'Dhwani Access enforces FIDO2 / WebAuthn biometric passkeys, isolating authentication from telco SMS channels.',
      actionItems: [
        'Disable SMS fallbacks for Treasury admins in Portal Settings.',
        'Encourage all authorizers to authenticate via device hardware token.'
      ]
    },
    {
      id: 'news-6',
      category: 'Market Trends & FX',
      categoryPillBg: 'rgba(16, 185, 129, 0.1)',
      categoryPillText: '#047857',
      categoryBorder: 'rgba(16, 185, 129, 0.2)',
      priority: 'Standard',
      headline: 'Central Banks Announce Synchronized Overnight Liquidity Window Expansion',
      summary: 'Overnight clearing facilities extended to 24/7 continuous operations, mitigating weekend settlement overhangs for corporate treasuries.',
      timestamp: '5h ago',
      source: 'Bloomberg Markets',
      readTime: '2 min read',
      impactSummary: 'Continuous clearing allows instant merchant disbursements without weekend buffer holding requirements.',
      actionItems: [
        'Adjust overnight cash sweep parameters in Treasury Settings.',
        'Verify weekend limit tolerances.'
      ]
    }
  ];

  filteredNews(): NewsItem[] {
    const filter = this.filterCategory();
    if (filter === 'ALL') return this.newsItems;
    return this.newsItems.filter(item => item.category === filter);
  }

  openBriefModal(item: NewsItem) {
    this.selectedItem.set(item);
  }

  closeBriefModal() {
    this.selectedItem.set(null);
  }

  shareWithOps(item: NewsItem) {
    this.toastMessage.set(`Intelligence brief "${item.headline.slice(0, 35)}…" copied & shared with Ops team!`);
    setTimeout(() => this.toastMessage.set(''), 3500);
  }
}
