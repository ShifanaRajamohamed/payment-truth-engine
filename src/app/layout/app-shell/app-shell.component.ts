import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { VoiceService } from '../../core/services/voice.service';
import { LanguageService } from '../../core/language/language.service';
import { TranslationService } from '../../core/language/translation.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden" [class.large-text]="prefs.largeText()" style="background:#f1f5f9;">

      <!-- Sidebar -->
      <app-sidebar class="flex-shrink-0"></app-sidebar>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-topbar></app-topbar>
        <main class="flex-1 overflow-y-auto p-6 md:p-7">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- ── Dhwani Voice Drawer ─────────────────────────────────────────── -->
      <!-- Backdrop -->
      <div *ngIf="voice.isDrawerOpen()"
           (click)="voice.setDrawerOpen(false)"
           class="fixed inset-0 z-40 transition-opacity"
           style="background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);">
      </div>

      <!-- Drawer panel -->
      <div class="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 shadow-2xl"
           [style]="voice.isDrawerOpen() ? 'width:400px;transform:translateX(0)' : 'width:400px;transform:translateX(100%)'"
           style="background:#fff;border-left:1px solid rgba(0,0,0,0.08);">

        <!-- Drawer header -->
        <div class="flex items-center justify-between px-5 py-4"
             style="border-bottom:1px solid #f1f5f9;">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,#3b82f6,#6366f1);">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900 leading-tight">Ask Dhwani</p>
              <p class="text-[10px] text-slate-500">{{ i18n.t('dhwani.subtitle') }}</p>
            </div>
          </div>
          <button (click)="voice.setDrawerOpen(false)"
                  class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Language selector -->
        <div class="px-5 py-3" style="border-bottom:1px solid #f1f5f9;">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ i18n.t('language.selector.label') }}</span>
            <select [value]="lang.currentCode()" (change)="onLanguageChange($event)"
                    class="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer">
              <option *ngFor="let l of lang.supportedLanguages" [value]="l.code">
                {{ l.nativeName }} — {{ l.name }}
              </option>
            </select>
          </div>
          <!-- STT warning for non-translated languages -->
          <div *ngIf="!lang.hasTranslations(lang.currentCode())"
               class="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
            <span>{{ lang.currentLanguage().name }} responses will be in English until full translations are available.</span>
          </div>
        </div>

        <!-- Voice state indicator -->
        <div *ngIf="voice.voiceState() !== 'idle'"
             class="mx-5 mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
             [style]="stateStyle()">
          <!-- Animated dots for listening/processing/speaking -->
          <div class="flex gap-1">
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="animation-delay:0ms" [style.background]="stateColor()"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="animation-delay:150ms" [style.background]="stateColor()"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="animation-delay:300ms" [style.background]="stateColor()"></span>
          </div>
          <span>{{ stateLabel() }}</span>
          <!-- Live transcript while listening -->
          <span *ngIf="voice.voiceState() === 'listening' && voice.transcript()"
                class="truncate text-slate-500 font-normal italic ml-1">
            "{{ voice.transcript() }}"
          </span>
        </div>

        <!-- Error state -->
        <div *ngIf="voice.voiceState() === 'error' && voice.errorCode()"
             class="mx-5 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
             style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;">
          <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Conversation log -->
        <div #chatLog class="flex-1 overflow-y-auto px-5 py-4 space-y-3 flex flex-col">

          <!-- Empty state -->
          <div *ngIf="voice.conversations().length === 0"
               class="flex flex-col items-center justify-center h-full text-center py-8">
            <!-- Big mic icon -->
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                 style="background:linear-gradient(135deg,#eff6ff,#eef2ff);">
              <svg class="w-8 h-8" style="color:#3b82f6;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-slate-700 mb-1">{{ i18n.t('dhwani.no_logs') }}</p>
            <p class="text-xs text-slate-400">{{ i18n.t('dhwani.no_logs_hint') }}</p>
          </div>

          <!-- Messages -->
          <div *ngFor="let msg of voice.conversations()"
               class="flex flex-col"
               [class.items-end]="msg.sender === 'user'"
               [class.items-start]="msg.sender !== 'user'">
            <div class="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                 [style]="msg.sender === 'user'
                   ? 'background:#1e3a8a;color:#fff;border-bottom-right-radius:4px;'
                   : 'background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px;'">
              <p class="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-60">
                {{ msg.sender === 'user' ? i18n.t('dhwani.sender.user') : i18n.t('dhwani.sender.dhwani') }}
              </p>
              <p class="whitespace-pre-line">{{ msg.text }}</p>
            </div>
            <span class="text-[9px] text-slate-400 mt-1 px-1">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
        </div>

        <!-- Quick suggestions -->
        <div class="px-5 pb-3" style="border-top:1px solid #f1f5f9;">
          <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider py-2">Quick questions</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button *ngFor="let s of voice.getSuggestions()"
                    (click)="voice.processCommand(s)"
                    class="text-left px-2.5 py-2 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Footer: mic + text input -->
        <div class="px-5 pb-5 space-y-3">

          <!-- Interaction mode tabs -->
          <div class="flex gap-1 p-1 rounded-xl" style="background:#f1f5f9;">
            <button *ngFor="let mode of interactionModes"
                    (click)="setMode(mode.key)"
                    class="flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all"
                    [style]="activeMode() === mode.key
                      ? 'background:#fff;color:#1e293b;box-shadow:0 1px 4px rgba(0,0,0,0.08);'
                      : 'color:#94a3b8;'">
              {{ mode.icon }} {{ mode.label }}
            </button>
          </div>

          <!-- Voice mode -->
          <div *ngIf="activeMode() === 'voice'" class="flex gap-2">
            <button id="mic-btn" type="button" (click)="toggleListening()"
                    class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    [style]="voice.isListening()
                      ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'
                      : 'background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;box-shadow:0 4px 14px rgba(59,130,246,0.35);'">
              <svg class="h-4 w-4" [class.animate-pulse]="voice.isListening()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
              </svg>
              {{ voice.isListening() ? i18n.t('dhwani.listening') : i18n.t('dhwani.hold_to_speak') }}
            </button>
            <button *ngIf="voice.conversations().length > 0"
                    (click)="voice.clearConversation()"
                    class="p-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </button>
          </div>

          <!-- Text mode -->
          <div *ngIf="activeMode() === 'text'" class="flex gap-2">
            <input #textInput type="text" [(ngModel)]="textQuery"
                   (keydown.enter)="sendText()"
                   [placeholder]="i18n.t('dhwani.type_placeholder')"
                   class="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-slate-50"/>
            <button (click)="sendText()"
                    class="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              {{ i18n.t('dhwani.send') }}
            </button>
          </div>

          <!-- Tap mode -->
          <div *ngIf="activeMode() === 'tap'" class="grid grid-cols-2 gap-2">
            <button *ngFor="let tap of tapOptions" (click)="voice.processCommand(tap.cmd)"
                    class="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-center">
              <span class="text-xl">{{ tap.icon }}</span>
              <span class="text-[10px] font-semibold text-slate-700">{{ i18n.t(tap.labelKey) }}</span>
            </button>
          </div>

          <!-- STT locale info -->
          <div class="flex items-center gap-1.5 text-[9px] text-slate-400">
            <span>STT:</span>
            <code class="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{{ lang.sttConfig().locale }}</code>
            <span class="ml-1">Supported:</span>
            <code class="font-mono px-1.5 py-0.5 rounded"
                  [style]="voice.isSpeechSupported() ? 'background:#f0fdf4;color:#16a34a;' : 'background:#fef2f2;color:#dc2626;'">
              {{ voice.isSpeechSupported() ? 'Yes (Chrome/Edge)' : 'No — text mode recommended' }}
            </code>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AppShellComponent implements AfterViewChecked {
  @ViewChild('chatLog') chatLog!: ElementRef;
  @ViewChild('textInput') textInput!: ElementRef;

  textQuery = '';
  readonly activeMode = signal<'voice' | 'text' | 'tap'>('voice');

  interactionModes = [
    { key: 'voice' as const, icon: '🎙', label: 'Voice' },
    { key: 'text'  as const, icon: '⌨️', label: 'Type' },
    { key: 'tap'   as const, icon: '👆', label: 'Tap' },
  ];

  tapOptions = [
    { icon: '💰', labelKey: 'home.tap.money',   cmd: 'How much money did I receive?' },
    { icon: '🛒', labelKey: 'home.tap.orders',  cmd: 'How many orders did I get?' },
    { icon: '📍', labelKey: 'home.tap.where',   cmd: 'Which city is doing best?' },
    { icon: '⚠️', labelKey: 'home.tap.problem', cmd: 'Are there any problems?' },
    { icon: '💡', labelKey: 'home.tap.advice',  cmd: 'What should I do to improve?' },
    { icon: '👥', labelKey: 'nav.customers',    cmd: 'Tell me about my customers' },
  ];

  constructor(
    public voice: VoiceService,
    public lang:  LanguageService,
    public i18n:  TranslationService,
    public prefs: UserPreferencesService,
  ) {}

  ngAfterViewChecked() {
    // Auto-scroll chat to bottom
    if (this.chatLog?.nativeElement) {
      const el = this.chatLog.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  onLanguageChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    this.voice.setLanguage(code);
    this.prefs.update({ language: code });
  }

  setMode(mode: 'voice' | 'text' | 'tap') {
    this.activeMode.set(mode);
  }

  toggleListening() {
    if (this.voice.isListening()) {
      this.voice.stopListening();
    } else {
      this.voice.startListening();
    }
  }

  sendText() {
    if (this.textQuery.trim()) {
      this.voice.processText(this.textQuery.trim());
      this.textQuery = '';
    }
  }

  stateLabel(): string {
    switch (this.voice.voiceState()) {
      case 'listening':  return this.i18n.t('dhwani.listening');
      case 'processing': return this.i18n.t('dhwani.processing');
      case 'speaking':   return this.i18n.t('dhwani.speaking');
      default:           return '';
    }
  }

  stateColor(): string {
    switch (this.voice.voiceState()) {
      case 'listening':  return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'speaking':   return '#10b981';
      default:           return '#94a3b8';
    }
  }

  stateStyle(): string {
    switch (this.voice.voiceState()) {
      case 'listening':  return 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;';
      case 'processing': return 'background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;';
      case 'speaking':   return 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;';
      default:           return '';
    }
  }

  errorMessage(): string {
    switch (this.voice.errorCode()) {
      case 'MIC_DENIED':    return this.i18n.t('dhwani.error.mic');
      case 'NOT_SUPPORTED': return this.i18n.t('dhwani.error.unsupported');
      case 'NO_SPEECH':     return this.i18n.t('dhwani.error.no_speech');
      default:              return 'Something went wrong. Please try again.';
    }
  }
}
