import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';
import { VoiceResolverService } from '../../core/services/voice-resolver.service';
import { PaymentIncident, DeterministicVerificationResult } from '@deepaudit/shared-types';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn" *ngIf="incident(); else notFound">

      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <a routerLink="/app/incidents" class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
          </a>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-indigo-400">{{ incident()?.id }}</span>
              <span [ngClass]="{
                'bg-rose-500/20 text-rose-300 border-rose-500/30': incident()?.severity === 'CRITICAL',
                'bg-amber-500/20 text-amber-300 border-amber-500/30': incident()?.severity === 'HIGH',
                'bg-blue-500/20 text-blue-300 border-blue-500/30': incident()?.severity === 'MEDIUM',
                'bg-slate-500/20 text-slate-300 border-slate-500/30': incident()?.severity === 'LOW'
              }" class="px-2.5 py-0.5 rounded text-[11px] font-bold border">
                {{ incident()?.severity }} PRIORITY
              </span>
              <span *ngIf="incident()?.isRepaired" class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span>STATE REPAIRED</span> ✅
              </span>
            </div>
            <h1 class="text-xl md:text-2xl font-black text-white mt-0.5">
              Incident Investigation: {{ incident()?.aiAnalysis?.summary || 'Multi-System Payment State Inconsistency' }}
            </h1>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button (click)="playSpokenExplanation()"
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all">
            <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75Z"/>
            </svg>
            <span>Play Voice Truth</span>
          </button>
          
          <button (click)="runDeterministicVerification()"
                  [disabled]="isVerifying()"
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <span>{{ isVerifying() ? 'Verifying...' : 'Re-verify Rules' }}</span>
          </button>
        </div>
      </div>

      <!-- Customer Claim Banner -->
      <div class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-bold tracking-wider uppercase text-indigo-400">Customer Claim (Voice / Input)</span>
            <p class="text-sm font-semibold text-white">“{{ incident()?.customerClaim }}”</p>
          </div>
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-indigo-500/20 pt-2 md:pt-0 md:pl-4">
          <div>
            <span class="block text-[10px] text-slate-500">Claimant</span>
            <strong class="text-slate-200">{{ incident()?.customerName }}</strong>
          </div>
          <div>
            <span class="block text-[10px] text-slate-500">Amount</span>
            <strong class="text-emerald-400 font-bold">₹{{ incident()?.amount?.toLocaleString('en-IN') }}</strong>
          </div>
          <div>
            <span class="block text-[10px] text-slate-500">Order Ref</span>
            <strong class="text-slate-200 font-mono">{{ incident()?.orderId }}</strong>
          </div>
        </div>
      </div>

      <!-- SIGNATURE SECTION 1: Cross-System Truth Comparison Matrix -->
      <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-black text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Payment Truth Matrix (Multi-System Discrepancy)
            </h2>
            <p class="text-xs text-slate-400">Side-by-side state comparison across independent payment layers</p>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-indigo-400">
            Ground Truth: {{ incident()?.truthMatrix?.finalTruth?.verdict }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          <!-- Bank Node -->
          <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400">1. Bank Record</span>
              <span *ngIf="incident()?.truthMatrix?.bank?.status === 'DEBITED' || incident()?.truthMatrix?.bank?.status === 'SUCCESS' || incident()?.truthMatrix?.bank?.status === 'CREDITED'" class="text-emerald-400 font-bold text-xs">✅</span>
              <span *ngIf="incident()?.truthMatrix?.bank?.status === 'FAILED'" class="text-rose-400 font-bold text-xs">❌</span>
            </div>
            <div class="text-lg font-black" [ngClass]="{'text-emerald-400': incident()?.truthMatrix?.bank?.status === 'DEBITED' || incident()?.truthMatrix?.bank?.status === 'SUCCESS' || incident()?.truthMatrix?.bank?.status === 'CREDITED', 'text-rose-400': incident()?.truthMatrix?.bank?.status === 'FAILED'}">
              {{ incident()?.truthMatrix?.bank?.status }}
            </div>
            <p class="text-[11px] text-slate-400 leading-tight">
              {{ incident()?.truthMatrix?.bank?.description }}
            </p>
            <div class="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
              Ref: {{ incident()?.truthMatrix?.bank?.reference }}
            </div>
          </div>

          <!-- Gateway Node -->
          <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400">2. Gateway (Razorpay)</span>
              <span *ngIf="incident()?.truthMatrix?.gateway?.status === 'CAPTURED'" class="text-emerald-400 font-bold text-xs">✅</span>
              <span *ngIf="incident()?.truthMatrix?.gateway?.status === 'FAILED'" class="text-rose-400 font-bold text-xs">❌</span>
              <span *ngIf="incident()?.truthMatrix?.gateway?.status === 'REFUNDED'" class="text-amber-400 font-bold text-xs">🔄</span>
            </div>
            <div class="text-lg font-black" [ngClass]="{'text-emerald-400': incident()?.truthMatrix?.gateway?.status === 'CAPTURED', 'text-rose-400': incident()?.truthMatrix?.gateway?.status === 'FAILED', 'text-amber-400': incident()?.truthMatrix?.gateway?.status === 'REFUNDED'}">
              {{ incident()?.truthMatrix?.gateway?.status }}
            </div>
            <p class="text-[11px] text-slate-400 leading-tight">
              Amount: ₹{{ incident()?.truthMatrix?.gateway?.amount?.toLocaleString('en-IN') }} ({{ incident()?.truthMatrix?.gateway?.method }})
            </p>
            <div class="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
              ID: {{ incident()?.truthMatrix?.gateway?.paymentId }}
            </div>
          </div>

          <!-- Webhook Node -->
          <div class="p-4 rounded-xl bg-slate-950/70 border space-y-2 relative overflow-hidden"
               [ngClass]="incident()?.truthMatrix?.webhook?.status === 'FAILED' ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800'">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400">3. Webhook Delivery</span>
              <span *ngIf="incident()?.truthMatrix?.webhook?.status === 'SUCCESS'" class="text-emerald-400 font-bold text-xs">✅</span>
              <span *ngIf="incident()?.truthMatrix?.webhook?.status === 'FAILED'" class="text-rose-400 font-bold text-xs">❌ FAILED</span>
              <span *ngIf="incident()?.truthMatrix?.webhook?.status === 'DELAYED'" class="text-amber-400 font-bold text-xs">⏳ DELAYED</span>
            </div>
            <div class="text-lg font-black" [ngClass]="{'text-rose-400': incident()?.truthMatrix?.webhook?.status === 'FAILED', 'text-amber-400': incident()?.truthMatrix?.webhook?.status === 'DELAYED', 'text-emerald-400': incident()?.truthMatrix?.webhook?.status === 'SUCCESS'}">
              HTTP {{ incident()?.truthMatrix?.webhook?.httpStatusCode }}
            </div>
            <p class="text-[11px] text-slate-400 leading-tight">
              {{ incident()?.truthMatrix?.webhook?.lastError || 'Webhook dispatched successfully' }}
            </p>
            <div class="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
              Retries: {{ incident()?.truthMatrix?.webhook?.attempts }} attempts
            </div>
          </div>

          <!-- Merchant DB Node -->
          <div class="p-4 rounded-xl bg-slate-950/70 border space-y-2 relative overflow-hidden"
               [ngClass]="incident()?.truthMatrix?.merchantDb?.orderStatus === 'UNPAID' ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800'">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400">4. Merchant Database</span>
              <span *ngIf="incident()?.truthMatrix?.merchantDb?.orderStatus === 'PAID'" class="text-emerald-400 font-bold text-xs">✅ PAID</span>
              <span *ngIf="incident()?.truthMatrix?.merchantDb?.orderStatus === 'UNPAID'" class="text-rose-400 font-bold text-xs">❌ UNPAID</span>
              <span *ngIf="incident()?.truthMatrix?.merchantDb?.orderStatus === 'REFUNDED'" class="text-blue-400 font-bold text-xs">REFUNDED</span>
            </div>
            <div class="text-lg font-black" [ngClass]="{'text-rose-400': incident()?.truthMatrix?.merchantDb?.orderStatus === 'UNPAID', 'text-emerald-400': incident()?.truthMatrix?.merchantDb?.orderStatus === 'PAID', 'text-blue-400': incident()?.truthMatrix?.merchantDb?.orderStatus === 'REFUNDED'}">
              {{ incident()?.truthMatrix?.merchantDb?.orderStatus }}
            </div>
            <p class="text-[11px] text-slate-400 leading-tight">
              Current state recorded in order relational table
            </p>
            <div class="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
              Order: {{ incident()?.truthMatrix?.merchantDb?.orderId }}
            </div>
          </div>

          <!-- Final Truth Column -->
          <div class="p-4 rounded-xl bg-gradient-to-br from-indigo-950/70 to-slate-950/90 border border-indigo-500/40 space-y-2 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-indigo-300">5. FINAL TRUTH</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div class="text-sm font-black" [ngClass]="incident()?.truthMatrix?.finalTruth?.isPaymentSuccessful ? 'text-emerald-300' : 'text-rose-300'">
              {{ incident()?.truthMatrix?.finalTruth?.isPaymentSuccessful ? 'PAYMENT SUCCESSFUL ✅' : 'PAYMENT FAILED / ANOMALY ❌' }}
            </div>
            <p class="text-[11px] text-slate-300 leading-tight">
              {{ incident()?.truthMatrix?.finalTruth?.customerAdvice }}
            </p>
            <div class="text-[10px] font-bold text-indigo-400 pt-1 border-t border-indigo-500/30">
              Desync Origin: {{ incident()?.truthMatrix?.finalTruth?.desynchronizationPoint }}
            </div>
          </div>

        </div>
      </div>

      <!-- SIGNATURE SECTION 2: Payment Truth Graph & Visual Topology Map -->
      <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-black text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/>
              </svg>
              Payment Flow Topology Map
            </h2>
            <p class="text-xs text-slate-400">Visual system topology highlighting exact failure origin node</p>
          </div>
          <span class="text-xs font-semibold text-slate-400">Failure Node: <strong class="text-rose-400 font-mono">{{ incident()?.truthMatrix?.finalTruth?.desynchronizationPoint }}</strong></span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
          <div *ngFor="let node of incident()?.graphNodes; let i = index"
               class="p-4 rounded-xl border relative transition-all"
               [ngClass]="{
                 'bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500': node.isFailureOrigin || node.status === 'failed',
                 'bg-amber-950/20 border-amber-500/50': node.status === 'delayed' || node.status === 'warning',
                 'bg-slate-950/70 border-slate-800': node.status === 'healthy'
               }">
            
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono text-slate-500">Step {{ i + 1 }}</span>
              <span *ngIf="node.status === 'healthy'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span *ngIf="node.status === 'failed' || node.isFailureOrigin" class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span *ngIf="node.status === 'warning' || node.status === 'delayed'" class="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>

            <div class="mt-2 font-bold text-sm text-white">{{ node.label }}</div>
            <div class="text-[11px] mt-0.5 font-medium"
                 [ngClass]="{
                   'text-rose-400': node.status === 'failed' || node.isFailureOrigin,
                   'text-amber-400': node.status === 'delayed' || node.status === 'warning',
                   'text-emerald-400': node.status === 'healthy'
                 }">
              {{ node.subtext }}
            </div>

            <span *ngIf="node.isFailureOrigin"
                  class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow">
              Failure Origin
            </span>
          </div>
        </div>
      </div>

      <!-- 2 Columns: Left AI Root Cause & Deterministic Verification | Right Chronological Timeline -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Left Col: AI Root Cause & Verification & Safe Repair -->
        <div class="space-y-6">

          <!-- AI Root Cause Analysis -->
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
                </svg>
                AI Root Cause Analysis (Gemini 2.5 / Pro)
              </h3>
              <span class="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300">
                {{ incident()?.aiAnalysis?.confidence || 98 }}% AI Confidence
              </span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Root Cause Category</span>
              <p class="text-sm font-black text-indigo-300">{{ incident()?.aiAnalysis?.category }}</p>
              <p class="text-xs text-slate-300 leading-relaxed">{{ incident()?.aiAnalysis?.detailedExplanation }}</p>
            </div>

            <!-- Evidence Checklist -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Discovered Evidence</span>
              <ul class="space-y-1.5 text-xs text-slate-300">
                <li *ngFor="let ev of incident()?.aiAnalysis?.evidence" class="flex items-start gap-2">
                  <span class="text-indigo-400 font-bold">•</span>
                  <span>{{ ev }}</span>
                </li>
              </ul>
            </div>

            <!-- Customer Risk Guidance -->
            <div class="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
              <strong class="font-bold block text-amber-400 mb-0.5">Customer Risk Assessment:</strong>
              {{ incident()?.aiAnalysis?.customerRisk }}
            </div>
          </div>

          <!-- Deterministic Verification Layer -->
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-black text-white flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
                  </svg>
                  Deterministic Verification Layer
                </h3>
                <p class="text-xs text-slate-400">Strict rule-based invariant checks (Zero LLM reliance for execution)</p>
              </div>
              <span *ngIf="incident()?.verification?.isVerified" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ALL INVARIANTS PASSED ✅
              </span>
            </div>

            <!-- Verification Checklist Items -->
            <div class="space-y-2">
              <div *ngFor="let chk of incident()?.verification?.checks"
                   class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-white block">{{ chk.name }}</span>
                  <span class="text-[11px] text-slate-400">{{ chk.details }}</span>
                </div>
                <span *ngIf="chk.status === 'PASSED'" class="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <span>PASSED</span> ✅
                </span>
                <span *ngIf="chk.status === 'FAILED'" class="text-rose-400 font-bold text-xs flex items-center gap-1">
                  <span>FAILED</span> ❌
                </span>
                <span *ngIf="chk.status === 'SKIPPED'" class="text-slate-500 font-bold text-xs">
                  SKIPPED
                </span>
              </div>
            </div>

            <!-- Safe State Repair Action Box -->
            <div class="p-4 rounded-xl border space-y-3"
                 [ngClass]="incident()?.verification?.canSafeRepair ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-slate-950/60 border-slate-800'">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Recommended Safe Action</span>
                  <span class="text-sm font-black text-white">{{ incident()?.verification?.repairActionType || 'ESCALATE_MANUAL_REVIEW' }}</span>
                </div>
                <span *ngIf="incident()?.verification?.verificationToken" class="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                  Token: {{ incident()?.verification?.verificationToken?.slice(0, 18) }}...
                </span>
              </div>

              <div *ngIf="incident()?.verification?.targetStateUpdate as delta" class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
                <span>{{ delta.entity }} {{ delta.id }}:</span>
                <span class="text-rose-400 line-through">{{ delta.from }}</span>
                <span class="text-slate-500">→</span>
                <span class="text-emerald-400 font-bold">{{ delta.to }}</span>
              </div>

              <div *ngIf="!incident()?.isRepaired && incident()?.verification?.canSafeRepair">
                <button (click)="executeRepairAction()"
                        [disabled]="isRepairing()"
                        class="w-full py-3 rounded-xl font-bold text-sm text-white transition-all transform active:scale-98 flex items-center justify-center gap-2 shadow-lg"
                        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.67 2.67 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.092.58.07 1.193-.094 1.743"/>
                  </svg>
                  <span>{{ isRepairing() ? 'Synchronizing State...' : 'Authorize & Execute State Repair' }}</span>
                </button>
              </div>

              <div *ngIf="incident()?.isRepaired" class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <span>✅</span>
                <span>State repair successfully committed at {{ incident()?.repairedAt | date:'shortTime' }} by {{ incident()?.repairedBy }}.</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Col: Unified Chronological Multi-System Timeline -->
        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                Unified Payment Timeline
              </h3>
              <p class="text-xs text-slate-400">Chronologically correlated event stream across all 5 distributed systems</p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-400">{{ incident()?.timeline?.length }} events</span>
          </div>

          <!-- Timeline Event Stream -->
          <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            <div *ngFor="let ev of incident()?.timeline" class="relative group">
              <!-- Node icon on timeline -->
              <span class="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
                    [ngClass]="{
                      'bg-emerald-400 ring-4 ring-emerald-500/20': ev.status === 'SUCCESS',
                      'bg-rose-500 ring-4 ring-rose-500/30 animate-ping': ev.isFailurePoint || ev.status === 'FAILED',
                      'bg-amber-400 ring-4 ring-amber-500/20': ev.status === 'WARNING' || ev.status === 'PENDING',
                      'bg-indigo-400': ev.status === 'INFO'
                    }">
              </span>

              <div class="p-3.5 rounded-xl border transition-all"
                   [ngClass]="{
                     'bg-rose-950/30 border-rose-500/50': ev.isFailurePoint,
                     'bg-slate-950/70 border-slate-800/80': !ev.isFailurePoint
                   }">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {{ ev.source }}
                    </span>
                    <span class="text-xs font-bold text-white">{{ ev.title }}</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-500">{{ ev.relativeTime }}</span>
                </div>

                <p class="text-xs text-slate-300 mt-1.5">{{ ev.description }}</p>

                <div *ngIf="ev.isFailurePoint" class="mt-2 text-[10px] font-black uppercase text-rose-400 flex items-center gap-1">
                  <span>⚠️ Desynchronization Point Detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Not Found State -->
    <ng-template #notFound>
      <div class="p-12 text-center space-y-4">
        <p class="text-slate-400 text-sm">Incident not found or loading...</p>
        <a routerLink="/app/incidents" class="text-xs font-bold text-indigo-400 hover:underline">← Back to Incidents</a>
      </div>
    </ng-template>
  `
})
export class IncidentDetailComponent implements OnInit {
  incident = computed(() => this.truthService.selectedIncident());
  isVerifying = signal<boolean>(false);
  isRepairing = signal<boolean>(false);

  constructor(
    public truthService: TruthIncidentService,
    private voiceResolver: VoiceResolverService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const found = this.truthService.incidents().find(i => i.id === id);
        if (found) {
          this.truthService.selectIncident(found);
        } else {
          this.truthService.loadIncidents();
        }
      }
    });
  }

  async runDeterministicVerification() {
    const inc = this.incident();
    if (!inc) return;
    this.isVerifying.set(true);
    try {
      await this.truthService.verifyIncident(inc.id);
    } finally {
      this.isVerifying.set(false);
    }
  }

  async executeRepairAction() {
    const inc = this.incident();
    if (!inc) return;
    this.isRepairing.set(true);
    try {
      await this.truthService.executeSafeRepair({
        incidentId: inc.id,
        verificationToken: inc.verification?.verificationToken,
        operatorName: 'Fintech Ops Admin',
      });
    } finally {
      this.isRepairing.set(false);
    }
  }

  playSpokenExplanation() {
    const inc = this.incident();
    if (!inc || !inc.aiAnalysis?.voiceScript) return;
    const currentLang = this.voiceResolver.currentLanguage().code;
    let script = inc.aiAnalysis.voiceScript.english;
    if (currentLang === 'ta-IN') script = inc.aiAnalysis.voiceScript.tamil;
    else if (currentLang === 'tanglish') script = inc.aiAnalysis.voiceScript.tanglish;
    else if (currentLang === 'hi-IN') script = inc.aiAnalysis.voiceScript.hindi;

    this.voiceResolver.speakText(script, currentLang);
  }
}
