import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex bg-white font-sans" style="font-family:'Inter',system-ui,sans-serif;">

      <!-- ── Left panel: Brand story ─────────────────────────────────── -->
      <div class="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style="background: linear-gradient(145deg, #0f1629 0%, #1a2744 50%, #0f2c52 100%);">

        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px);background-size:40px 40px;"></div>

        <!-- Logo -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background:linear-gradient(135deg,#3b82f6,#6366f1);">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
          </div>
          <div>
            <span class="text-white font-bold text-lg tracking-tight">Dhwani</span>
            <span class="text-blue-400 text-xs font-medium ml-2">by Razorpay</span>
          </div>
        </div>

        <!-- Main statement -->
        <div class="relative z-10 my-auto">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
               style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span class="text-blue-300 text-xs font-semibold tracking-wider uppercase">Voice-first · Multilingual · Accessible</span>
          </div>

          <h1 class="text-white text-4xl font-extrabold leading-tight tracking-tight mb-6">
            Just talk to your<br>
            payment system.
          </h1>

          <p class="text-slate-400 text-sm leading-relaxed mb-10 max-w-xs">
            Ask in any Indian language. Understand your business without learning software.
            Dhwani listens, explains, and helps you decide.
          </p>

          <!-- Feature list -->
          <div class="space-y-3">
            <div *ngFor="let f of features" class="flex items-center gap-3">
              <span class="text-base">{{ f.icon }}</span>
              <span class="text-slate-300 text-sm">{{ f.text }}</span>
            </div>
          </div>
        </div>

        <!-- Language ticker at bottom -->
        <div class="relative z-10 flex flex-wrap gap-2">
          <span *ngFor="let lang of langPills"
                class="px-2.5 py-1 rounded-full text-[10px] font-medium"
                style="background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);">
            {{ lang }}
          </span>
        </div>
      </div>

      <!-- ── Right panel: Sign in ─────────────────────────────────────── -->
      <div class="w-full md:w-1/2 flex items-center justify-center p-8 md:p-14 bg-white">
        <div class="w-full max-w-sm">

          <!-- Mobile logo -->
          <div class="md:hidden flex items-center gap-2 mb-8">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,#3b82f6,#6366f1);">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
              </svg>
            </div>
            <span class="font-bold text-slate-900">Dhwani</span>
          </div>

          <h2 class="text-2xl font-bold text-slate-900 tracking-tight mb-1">Sign in</h2>
          <p class="text-sm text-slate-500 mb-8">to your merchant account</p>

          <!-- Error banner -->
          <div *ngIf="loginError()" class="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl text-xs"
               style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <span>{{ loginError() }}</span>
          </div>

          <!-- ── Passkey primary CTA ── -->
          <button id="passkey-btn" type="button" (click)="loginWithPasskey()"
                  [disabled]="isPasskeyLoading()"
                  class="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl mb-4 font-semibold text-sm transition-all"
                  style="background:linear-gradient(135deg,#2f62f5,#598dff);color:#fff;box-shadow:0 4px 16px rgba(47,98,245,0.35);">
            <span *ngIf="!isPasskeyLoading()">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
              </svg>
            </span>
            <svg *ngIf="isPasskeyLoading()" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ isPasskeyLoading() ? 'Verifying…' : 'Sign in with device (Passkey / Biometric)' }}
          </button>
          <p class="text-center text-xs text-slate-400 mb-5">Use your fingerprint, face, or device PIN</p>

          <!-- Divider -->
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs text-slate-400 font-medium">or sign in with password</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <!-- Email + password form -->
          <form [formGroup]="loginForm" (submit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input id="email" type="email" formControlName="email"
                     class="block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                     style="border-color:#e2e8f0;background:#f8fafc;"
                     placeholder="name@business.com"
                     onfocus="this.style.borderColor='#2f62f5';this.style.boxShadow='0 0 0 3px rgba(47,98,245,0.12)'"
                     onblur="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'"/>
              <p *ngIf="emailInvalid" class="text-red-600 text-xs mt-1">Enter a valid email address.</p>
            </div>

            <div>
              <div class="flex justify-between mb-1.5">
                <label for="password" class="text-xs font-semibold text-slate-600">Password</label>
                <a href="#" class="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot?</a>
              </div>
              <input id="password" type="password" formControlName="password"
                     class="block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                     style="border-color:#e2e8f0;background:#f8fafc;"
                     placeholder="••••••••"
                     onfocus="this.style.borderColor='#2f62f5';this.style.boxShadow='0 0 0 3px rgba(47,98,245,0.12)'"
                     onblur="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'"/>
              <p *ngIf="passwordInvalid" class="text-red-600 text-xs mt-1">Minimum 6 characters.</p>
            </div>

            <button type="submit" id="signin-btn"
                    [disabled]="loginForm.invalid"
                    class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style="background: linear-gradient(135deg, #2f62f5, #598dff); box-shadow: 0 4px 12px rgba(47,98,245,0.3);">
              Sign in
            </button>
          </form>

          <!-- Google -->
          <button type="button" id="google-btn" (click)="loginWithGoogle()"
                  class="w-full mt-3 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  style="border-color:#e2e8f0;">
            <svg class="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p class="text-center text-xs text-slate-500 mt-6">
            Don't have an account?
            <a routerLink="/signup" class="font-semibold text-blue-600 hover:text-blue-700">Create account</a>
          </p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  readonly loginError    = signal<string>('');
  readonly isPasskeyLoading = signal<boolean>(false);

  features = [
    { icon: '🎙', text: 'Ask in Tamil, Hindi, or any Indian language' },
    { icon: '📍', text: 'See where your business is growing on a map' },
    { icon: '💡', text: 'Get plain-language insights, not jargon' },
    { icon: '🔮', text: 'Test business decisions before you make them' },
  ];

  langPills = ['தமிழ்', 'हिंदी', 'বাংলা', 'తెలుగు', 'ਪੰਜਾਬੀ', 'ગુજરાતી', 'मराठी', 'English', 'ಕನ್ನಡ', 'മലയാളം'];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get emailInvalid()    { const c = this.loginForm.get('email');    return !!(c?.invalid && (c.dirty || c.touched)); }
  get passwordInvalid() { const c = this.loginForm.get('password'); return !!(c?.invalid && (c.dirty || c.touched)); }

  async loginWithPasskey() {
    this.loginError.set('');
    this.isPasskeyLoading.set(true);
    try {
      const ok = await this.auth.loginWithPasskey();
      if (ok) {
        this.router.navigate(['/app']);
      } else if (this.auth.passkeyState() === 'unsupported') {
        this.loginError.set('Device sign-in is not available in this browser. Please use the form below.');
      } else if (this.auth.passkeyState() === 'error') {
        this.loginError.set('Device sign-in failed. Please try again or use your email and password.');
      }
      // 'idle' = user cancelled → no error message
    } finally {
      this.isPasskeyLoading.set(false);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (this.auth.login(email, password)) {
        this.loginError.set('');
        this.router.navigate(['/app']);
      } else {
        this.loginError.set('Authentication failed. Please check your email and password.');
      }
    }
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle();
    this.router.navigate(['/app']);
  }
}
