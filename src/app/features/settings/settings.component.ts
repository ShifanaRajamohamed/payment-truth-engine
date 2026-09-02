import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferencesService, InteractionMode, ComplexityLevel } from '../../core/services/user-preferences.service';
import { LanguageService } from '../../core/language/language.service';
import { TranslationService } from '../../core/language/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { SpeechService } from '../../core/voice/speech/speech.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-lg">⚙️</span>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ i18n.t('settings.title') }}</h1>
      </div>
      <p class="text-sm text-slate-500">Configure accessibility, language, voice, and device security preferences.</p>
    </div>

    <!-- Success toast -->
    <div *ngIf="savedNotice()"
         class="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
      <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ i18n.t('settings.saved') }}</span>
    </div>

    <div class="space-y-6 max-w-4xl">

      <!-- ── Section 1: Accessibility & Display Mode ──────────────────────── -->
      <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-base">👁️</span>
          <h2 class="text-base font-bold text-slate-900">{{ i18n.t('settings.mode.section') }}</h2>
        </div>
        <p class="text-xs text-slate-500 mb-5">Choose how detailed or simple you want the screens and numbers to be.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button type="button" (click)="setComplexity('simple')"
                  class="flex flex-col p-4 rounded-xl border-2 text-left transition-all"
                  [style]="prefs.simpleMode()
                    ? 'border-color:#3b82f6;background:#eff6ff;'
                    : 'border-color:#e2e8f0;background:#f8fafc;'">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xl">✨</span>
              <span *ngIf="prefs.simpleMode()" class="text-xs font-bold text-blue-600">Active</span>
            </div>
            <span class="text-sm font-bold text-slate-900 mb-1">{{ i18n.t('settings.simple_mode') }}</span>
            <span class="text-xs text-slate-500">Large cards, plain numbers, minimal charts. Perfect for quick checks.</span>
          </button>

          <button type="button" (click)="setComplexity('standard')"
                  class="flex flex-col p-4 rounded-xl border-2 text-left transition-all"
                  [style]="!prefs.simpleMode() && prefs.complexityLevel() === 'standard'
                    ? 'border-color:#3b82f6;background:#eff6ff;'
                    : 'border-color:#e2e8f0;background:#f8fafc;'">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xl">📊</span>
              <span *ngIf="!prefs.simpleMode() && prefs.complexityLevel() === 'standard'" class="text-xs font-bold text-blue-600">Active</span>
            </div>
            <span class="text-sm font-bold text-slate-900 mb-1">{{ i18n.t('settings.standard_mode') }}</span>
            <span class="text-xs text-slate-500">Standard business view with summary charts, signals, and ledger.</span>
          </button>

          <button type="button" (click)="setComplexity('detailed')"
                  class="flex flex-col p-4 rounded-xl border-2 text-left transition-all"
                  [style]="!prefs.simpleMode() && prefs.complexityLevel() === 'detailed'
                    ? 'border-color:#3b82f6;background:#eff6ff;'
                    : 'border-color:#e2e8f0;background:#f8fafc;'">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xl">🔬</span>
              <span *ngIf="!prefs.simpleMode() && prefs.complexityLevel() === 'detailed'" class="text-xs font-bold text-blue-600">Active</span>
            </div>
            <span class="text-sm font-bold text-slate-900 mb-1">{{ i18n.t('settings.detailed_mode') }}</span>
            <span class="text-xs text-slate-500">Full telemetry, raw gateway response latencies, and circuit breakers.</span>
          </button>
        </div>

        <!-- Large text toggle -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ i18n.t('settings.large_text') }}</p>
            <p class="text-xs text-slate-500">Increases font size across all dashboards for easier reading.</p>
          </div>
          <button type="button" (click)="toggleLargeText()"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  [style.background]="prefs.largeText() ? '#3b82f6' : '#cbd5e1'">
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  [style.transform]="prefs.largeText() ? 'translateX(20px)' : 'translateX(0)'"></span>
          </button>
        </div>
      </div>

      <!-- ── Section 2: Language & Voice Interaction ──────────────────────── -->
      <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-base">🎙️</span>
          <h2 class="text-base font-bold text-slate-900">{{ i18n.t('settings.language.section') }} & Speech</h2>
        </div>
        <p class="text-xs text-slate-500 mb-5">Select your primary language for voice conversations and system text.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Assistant & UI Language</label>
            <select [value]="lang.currentCode()" (change)="onLanguageChange($event)"
                    class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-blue-400 focus:outline-none font-medium">
              <option *ngFor="let l of lang.supportedLanguages" [value]="l.code">
                {{ l.nativeName }} ({{ l.name }})
              </option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1.5">Dhwani supports 22 official Indian languages with automatic speech recognition.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Preferred Interaction Mode</label>
            <div class="grid grid-cols-3 gap-2">
              <button *ngFor="let m of modes" (click)="setMode(m.key)"
                      class="py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center"
                      [style]="prefs.interactionMode() === m.key
                        ? 'background:#eff6ff;border-color:#3b82f6;color:#1e3a8a;'
                        : 'background:#f8fafc;border-color:#e2e8f0;color:#64748b;'">
                {{ m.icon }}<br>{{ m.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Speech Test & Status -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-slate-700">Voice Synthesis & Recognition Status</p>
              <p class="text-[11px] text-slate-500">Locale: <code class="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{{ lang.sttConfig().locale }}</code></p>
            </div>
            <button type="button" (click)="testVoice()"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              🔊 Test Speech
            </button>
          </div>
          <div class="flex items-center gap-2 text-[11px]">
            <span class="w-2 h-2 rounded-full" [style.background]="speech.isSupported() ? '#10b981' : '#f59e0b'"></span>
            <span class="text-slate-600">
              {{ speech.isSupported() ? 'Web Speech API is fully supported in this browser.' : 'Browser speech recognition limited. Fallback text input active.' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Section 3: Device Security & Passkey ───────────────────────────── -->
      <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-base">🔐</span>
          <h2 class="text-base font-bold text-slate-900">Device Security & Passkey</h2>
        </div>
        <p class="text-xs text-slate-500 mb-5">Sign in seamlessly with your fingerprint, face, or device PIN without typing passwords.</p>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">Platform Authenticator (WebAuthn / Passkey)</p>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ auth.isWebAuthnSupported ? 'Hardware security key & biometrics are ready on this machine.' : 'WebAuthn not supported on this browser.' }}
              </p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                [style]="auth.isWebAuthnSupported ? 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;' : 'background:#fef2f2;color:#dc2626;'">
            <span class="w-1.5 h-1.5 rounded-full" [style.background]="auth.isWebAuthnSupported ? '#16a34a' : '#dc2626'"></span>
            {{ auth.isWebAuthnSupported ? 'Device Ready' : 'Unavailable' }}
          </span>
        </div>
      </div>

      <!-- ── Section 4: Account Details ────────────────────────────────────── -->
      <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-base">👤</span>
          <h2 class="text-base font-bold text-slate-900">Merchant Account Profile</h2>
        </div>
        <p class="text-xs text-slate-500 mb-5">Your merchant registration and platform credentials.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Merchant Name</label>
            <input type="text" [value]="auth.currentUser()?.name || 'Merchant'" disabled
                   class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-600 font-medium"/>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Registered Email</label>
            <input type="email" [value]="auth.currentUser()?.email || 'merchant@dhwani.app'" disabled
                   class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-600 font-medium"/>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex justify-end">
        <button type="button" (click)="saveAll()"
                class="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-md"
                style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);box-shadow:0 4px 14px rgba(59,130,246,0.35);">
          {{ i18n.t('settings.save') }}
        </button>
      </div>

    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class SettingsComponent {
  savedNotice = signal(false);

  modes = [
    { key: 'voice' as InteractionMode, icon: '🎙️', label: 'Voice' },
    { key: 'text'  as InteractionMode, icon: '⌨️', label: 'Type' },
    { key: 'tap'   as InteractionMode, icon: '👆', label: 'Tap' },
  ];

  constructor(
    public prefs:  UserPreferencesService,
    public lang:   LanguageService,
    public i18n:   TranslationService,
    public auth:   AuthService,
    public speech: SpeechService,
  ) {}

  setComplexity(level: ComplexityLevel) {
    this.prefs.update({ complexityLevel: level, simpleMode: level === 'simple' });
  }

  toggleLargeText() {
    this.prefs.update({ largeText: !this.prefs.largeText() });
  }

  setMode(mode: InteractionMode) {
    this.prefs.update({ interactionMode: mode });
  }

  onLanguageChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    this.lang.setLanguage(code);
    this.prefs.update({ language: code });
  }

  testVoice() {
    const greeting = this.i18n.t('dhwani.subtitle');
    this.speech.speak(greeting);
  }

  saveAll() {
    this.savedNotice.set(true);
    setTimeout(() => this.savedNotice.set(false), 3000);
  }
}
