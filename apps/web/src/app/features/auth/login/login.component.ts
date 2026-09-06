import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LogoComponent],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#eef2f9] font-sans"
         style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

      <!-- ── Main Card Container ─────────────────────────────────────────── -->
      <div class="w-full max-w-[1040px] bg-white rounded-[32px] shadow-[0_25px_65px_-12px_rgba(45,25,95,0.14),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white/90 flex flex-col md:flex-row overflow-hidden relative min-h-[600px]">

        <!-- ── Left Side: Clean Login Form ───────────────────────────────── -->
        <div class="w-full md:w-[48%] p-8 sm:p-12 lg:p-14 flex flex-col justify-between z-10 bg-white">
          
          <!-- Unified Brand Header -->
          <div class="mb-8">
            <app-logo [iconSizeClass]="'w-8 h-8'"
                      [titleClass]="'text-lg font-extrabold text-slate-900'"
                      [textColor]="'#0f172a'"
                      [subtitleColor]="'#64748b'"
                      [badgeText]="'Enterprise'"
                      [subtitle]="'Access Portal'">
            </app-logo>
          </div>

          <!-- Main Form Area -->
          <div class="w-full max-w-sm my-auto">
            <h1 class="text-3xl font-extrabold text-[#1a162b] tracking-tight mb-2">
              Welcome back!
            </h1>
            <p class="text-xs sm:text-sm text-[#8c93a4] mb-8">
              Sign in to continue to your corporate account
            </p>

            <!-- Error banner -->
            <div *ngIf="loginError()" class="flex items-start gap-2.5 p-3 mb-5 rounded-2xl text-xs bg-red-50 border border-red-200 text-red-700">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <span>{{ loginError() }}</span>
            </div>

            <form [formGroup]="loginForm" (submit)="onSubmit()" class="space-y-4">
              <!-- Username / Email Input -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input id="email" type="email" formControlName="email"
                       placeholder="aditya.sharma@dhwani.app"
                       class="w-full pl-11 pr-4 py-3 bg-[#fafbfe] text-[#2d2750] placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-[0_2px_6px_rgba(0,0,0,0.02)] outline-none transition-all focus:border-[#4f46e5] focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/15" />
                <p *ngIf="emailInvalid" class="text-red-500 text-[11px] mt-1 pl-3">Please enter a valid corporate email.</p>
              </div>

              <!-- Password Input -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       placeholder="••••••••••••"
                       class="w-full pl-11 pr-11 py-3 bg-[#fafbfe] text-[#2d2750] placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-[0_2px_6px_rgba(0,0,0,0.02)] outline-none transition-all focus:border-[#4f46e5] focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/15" />
                <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none">
                  <svg *ngIf="!showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                </button>
                <p *ngIf="passwordInvalid" class="text-red-500 text-[11px] mt-1 pl-3">Minimum 6 characters required.</p>
              </div>

              <!-- Remember Me & Forgot Password Row -->
              <div class="flex items-center justify-between text-xs pt-1 px-1">
                <label class="flex items-center gap-2 text-[#646c80] cursor-pointer select-none font-medium">
                  <input type="checkbox" formControlName="rememberMe" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600" />
                  <span>Remember session</span>
                </label>
                <a href="javascript:void(0)" (click)="onForgotPassword()" class="text-indigo-600 hover:underline font-medium">Forgot Password?</a>
              </div>

              <!-- Buttons Row -->
              <div class="flex items-center gap-4 pt-3">
                <button type="submit" id="login-submit-btn"
                        [disabled]="loginForm.invalid"
                        class="px-9 py-2.5 rounded-full text-white font-semibold text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] shadow-[0_8px_22px_rgba(79,70,229,0.38)] active:scale-[0.98]">
                  Sign in
                </button>

                <a routerLink="/signup" class="text-xs sm:text-sm font-medium text-[#646c80] hover:text-indigo-600 transition-colors py-2 px-2">
                  Request access
                </a>
              </div>
            </form>

            <!-- Subtle Divider -->
            <div class="flex items-center gap-3 my-6">
              <div class="flex-1 h-px bg-slate-200/80"></div>
              <span class="text-[11px] text-slate-400 uppercase tracking-wider font-medium">or</span>
              <div class="flex-1 h-px bg-slate-200/80"></div>
            </div>

            <!-- Social / Quick Sign-In Icons -->
            <div class="flex items-center gap-3">
              <!-- Device Biometric / Quick Demo Trigger -->
              <button type="button" (click)="loginWithPasskey()" [disabled]="isPasskeyLoading()"
                      title="Device biometric / Quick sign in"
                      class="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center gap-2 shadow-sm transition-all">
                <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
                </svg>
                <span>{{ isPasskeyLoading() ? 'Verifying Device…' : 'One-Touch Passkey / Demo' }}</span>
              </button>
            </div>
          </div>

          <!-- Bottom spacing -->
          <div class="mt-4 text-[11px] text-slate-400">
            Dhwani Access / Enterprise Security Core v3.2
          </div>
        </div>

        <!-- ── Right Side: 3D Fintech Composition & 3-Column Highlights ─── -->
        <div class="hidden md:flex md:w-[52%] flex-col justify-between p-8 lg:p-10 relative overflow-hidden bg-white select-none">
          
          <!-- Background Wave Curve SVG -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 650" preserveAspectRatio="none" fill="none">
            <path d="M 120 0 
                     C 60 140, 15 250, 48 380 
                     C 78 510, 10 580, -30 650 
                     L 500 650 
                     L 500 0 Z" 
                  fill="url(#fintechPurpleGrad)" />

            <defs>
              <linearGradient id="fintechPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4f46e5" />
                <stop offset="50%" stop-color="#4338ca" />
                <stop offset="100%" stop-color="#312e81" />
              </linearGradient>
            </defs>
          </svg>

          <!-- Subtle Dotted Grid in Top Right -->
          <div class="absolute top-6 right-6 grid grid-cols-6 gap-2 opacity-20 pointer-events-none">
            <div *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]" 
                 class="w-1 h-1 rounded-full bg-white"></div>
          </div>

          <!-- ── 3D Fintech Visual Centerpiece ────────────────────────────── -->
          <div class="relative z-10 my-auto flex items-center justify-center pt-1 pb-4">
            
            <div class="relative w-[360px] h-[310px]">
              
              <!-- 1. 3D Shield (Behind Phone on Right) -->
              <div class="absolute right-2 top-8 w-32 h-44 rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#312e81] p-0.5 shadow-[0_15px_35px_rgba(20,5,50,0.45)] transform rotate-6 scale-95 flex items-center justify-center border border-white/20">
                <div class="w-full h-full rounded-3xl bg-gradient-to-b from-[#4f46e5] to-[#2e1065] flex items-center justify-center">
                  <!-- Lock Icon on Shield -->
                  <div class="w-12 h-16 rounded-xl border-2 border-white/25 flex flex-col items-center justify-center p-1 bg-white/5 backdrop-blur-sm">
                    <div class="w-5 h-6 rounded-t-full border-2 border-white/40 mb-0.5"></div>
                    <div class="w-8 h-7 bg-white/25 rounded-md flex items-center justify-center">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Phone Device Frame -->
              <div class="absolute left-20 top-0 w-[205px] h-[285px] bg-[#0f172a] rounded-[34px] p-2.5 shadow-[0_22px_50px_rgba(15,4,40,0.6)] border-2 border-[#6366f1] transform -rotate-1">
                <!-- Phone Screen Content -->
                <div class="w-full h-full rounded-[26px] bg-gradient-to-b from-[#3730a3] to-[#1e1b4b] p-4 flex flex-col items-center justify-between text-center relative overflow-hidden border border-white/10">
                  
                  <!-- Top Speaker Notch -->
                  <div class="w-12 h-1.5 bg-black/40 rounded-full"></div>
                  
                  <!-- Payment Amount & Status -->
                  <div class="pt-2">
                    <div class="text-white font-extrabold text-[19px] tracking-tight leading-none mb-1">
                      ₹ 1,25,000
                    </div>
                    <div class="text-indigo-200/90 text-[10px] font-medium tracking-wide">
                      Authorized & Cleared
                    </div>
                  </div>

                  <!-- Verified Green Checkmark Badge -->
                  <div class="w-12 h-12 rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.3)] flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div class="h-1"></div>
                </div>
              </div>

              <!-- 3. Floating Dhwani Access Corporate Card (Overlapping Left) -->
              <div class="absolute -left-6 top-28 w-[195px] h-[122px] rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#3730a3] to-[#1e1b4b] p-3.5 shadow-[0_20px_45px_rgba(10,2,30,0.7)] border border-white/30 transform -rotate-6 transition-transform hover:scale-105 duration-300 z-20">
                <!-- Card Dhwani Brand -->
                <div class="flex items-center justify-between mb-2.5">
                  <div class="flex items-center gap-1.5">
                    <div class="w-3.5 h-3.5 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold text-white">D</div>
                    <span class="text-white text-[11px] font-bold tracking-tight">Dhwani Access</span>
                  </div>
                  <!-- EMV Chip -->
                  <div class="w-6 h-4.5 rounded bg-gradient-to-tr from-[#d4af37] to-[#ffd700] border border-amber-300 shadow-sm opacity-90"></div>
                </div>

                <!-- Card Number -->
                <div class="text-white/95 font-mono text-[10px] tracking-widest my-2">
                  **** **** **** 4567
                </div>

                <!-- Card Footer: VISA -->
                <div class="flex justify-end items-end">
                  <span class="text-white font-black text-[13px] italic tracking-wider">VISA</span>
                </div>
              </div>

              <!-- 4. 3D Stack of Gold Rupee Coins (Foreground Right) -->
              <div class="absolute right-5 bottom-0 flex flex-col items-center z-20">
                <div class="relative w-15 h-15 rounded-full bg-gradient-to-br from-[#ffd56b] via-[#e6a836] to-[#b37517] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.45)] border-2 border-[#ffe899] flex items-center justify-center transform -rotate-12">
                  <div class="w-13 h-13 rounded-full border border-amber-700/30 flex items-center justify-center bg-gradient-to-tr from-[#e5a530] to-[#ffd97a]">
                    <span class="text-amber-950 font-black text-xl select-none leading-none">₹</span>
                  </div>
                </div>
                <div class="w-14 h-3 bg-gradient-to-r from-[#b37517] via-[#f7be4d] to-[#995f0e] rounded-full -mt-2 shadow-sm border-b border-amber-950/40"></div>
                <div class="w-14 h-3.5 bg-gradient-to-r from-[#b37517] via-[#f7be4d] to-[#995f0e] rounded-full -mt-1.5 shadow-sm border-b border-amber-950/40"></div>
              </div>

            </div>

          </div>

          <!-- ── Bottom 3-Column Highlights Row ───────────────────────────── -->
          <div class="relative z-10 grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-white">
            
            <!-- 1. Instant -->
            <div class="flex items-start gap-2">
              <div class="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <div class="font-bold text-xs leading-tight">Instant</div>
                <div class="text-[10px] text-indigo-200/80 leading-tight">Lightning fast payments</div>
              </div>
            </div>

            <!-- 2. Secure -->
            <div class="flex items-start gap-2">
              <div class="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <div>
                <div class="font-bold text-xs leading-tight">Secure</div>
                <div class="text-[10px] text-indigo-200/80 leading-tight">Bank-grade security</div>
              </div>
            </div>

            <!-- 3. Reliable -->
            <div class="flex items-start gap-2">
              <div class="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M4 9h4v11H4zm6-5h4v16h-4zm6 8h4v8h-4z"/>
                </svg>
              </div>
              <div>
                <div class="font-bold text-xs leading-tight">Reliable</div>
                <div class="text-[10px] text-indigo-200/80 leading-tight">Trusted by millions</div>
              </div>
            </div>

          </div>

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
  readonly loginError = signal<string>('');
  readonly isPasskeyLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email:      ['aditya.sharma@dhwani.app', [Validators.required, Validators.email]],
          password:   ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true],
    });
  }

  get emailInvalid()    { const c = this.loginForm.get('email');    return !!(c?.invalid && (c.dirty || c.touched)); }
  get passwordInvalid() { const c = this.loginForm.get('password'); return !!(c?.invalid && (c.dirty || c.touched)); }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async loginWithPasskey() {
    this.loginError.set('');
    this.isPasskeyLoading.set(true);
    try {
      const ok = await this.auth.loginWithPasskey();
      if (ok) {
        this.router.navigate(['/app']);
      } else if (this.auth.passkeyState() === 'unsupported') {
        if (this.auth.login('aditya.sharma@dhwani.app', crypto.randomUUID())) {
          this.router.navigate(['/app']);
        }
      } else if (this.auth.passkeyState() === 'error') {
        this.loginError.set('Device sign-in failed. Please use email & password.');
      }
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

  onForgotPassword() {
    alert('Please contact your Dhwani Access system administrator to reset your password.');
  }
}
