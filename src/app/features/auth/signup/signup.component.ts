import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      <!-- Left Panel -->
      <div class="md:w-1/2 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-16 border-r border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            P
          </div>
          <span class="text-sm font-bold tracking-tight uppercase">Payment Intel</span>
        </div>

        <div class="my-auto max-w-sm py-12 md:py-0">
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Start optimizing checkout flows in minutes.
          </h1>
          <p class="text-slate-400 text-xs leading-relaxed">
            Create an operator account to monitor gateway health, configure route logic thresholds, and simulate payments using telemetry twins.
          </p>
        </div>

        <div class="text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span>SECURE GATEWAY ENCRYPTION</span>
          <span>v1.2.0</span>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white">
        <div class="w-full max-w-sm space-y-6">
          <div>
            <h2 class="text-lg font-bold tracking-tight text-slate-900">Create your operator workspace</h2>
            <p class="text-xs text-slate-500 mt-1">Register details below to spin up your platform sandbox.</p>
          </div>

          <form [formGroup]="signupForm" (submit)="onSubmit()" class="space-y-4 text-xs text-slate-700">
            <!-- Full Name -->
            <div>
              <label for="name" class="block font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="E.g., Emma Brown"
              />
              <div *ngIf="nameInvalid" class="text-red-600 mt-1 text-[11px]">
                Full name is required.
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block font-semibold text-slate-500 uppercase tracking-wider mb-1">Work Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="name@company.com"
              />
              <div *ngIf="emailInvalid" class="text-red-600 mt-1 text-[11px]">
                Please enter a valid email address.
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="Minimum 6 characters"
              />
              <div *ngIf="passwordInvalid" class="text-red-600 mt-1 text-[11px]">
                Password is required (minimum 6 characters).
              </div>
            </div>

            <!-- Consent -->
            <div class="flex items-start">
              <input
                id="terms"
                type="checkbox"
                formControlName="terms"
                class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer mt-0.5"
              />
              <label for="terms" class="ml-2 text-slate-500 cursor-pointer leading-relaxed text-[11px]">
                I represent a business and agree to the platform's terms of service and developer access rules.
              </label>
            </div>

            <!-- Action -->
            <button
              type="submit"
              [disabled]="signupForm.invalid"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Register Workspace
            </button>
          </form>

          <div class="relative flex items-center justify-center my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <span class="relative bg-white px-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Or register with</span>
          </div>

          <!-- Google Integration -->
          <button
            type="button"
            (click)="continueWithGoogle()"
            class="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-slate-250 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Google Account</span>
          </button>

          <div class="text-center pt-2">
            <p class="text-xs text-slate-500">
              Already have an account?
              <a routerLink="/login" class="font-semibold text-brand-600 hover:text-brand-700">Sign in instead</a>
            </p>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: []
})
export class SignupComponent {
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  get nameInvalid(): boolean {
    const control = this.signupForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get emailInvalid(): boolean {
    const control = this.signupForm.get('email');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get passwordInvalid(): boolean {
    const control = this.signupForm.get('password');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const { name, email, password } = this.signupForm.value;
      const success = this.authService.signup(name, email, password);
      if (success) {
        this.router.navigate(['/app']);
      }
    }
  }

  continueWithGoogle() {
    this.authService.login('emma.brown@company.com', 'google-oauth-password');
    this.router.navigate(['/app']);
  }
}
