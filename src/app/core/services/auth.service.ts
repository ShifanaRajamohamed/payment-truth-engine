import { Injectable, signal } from '@angular/core';

export interface User {
  name: string;
  email: string;
  avatarInitial?: string;
}

export type PasskeyState = 'idle' | 'pending' | 'success' | 'error' | 'unsupported';

/**
 * AuthService
 *
 * Supports:
 *  1. Passkey / WebAuthn via navigator.credentials (platform biometrics)
 *  2. Email + password fallback
 *  3. Google OAuth mock
 *
 * For the hackathon demo, passkey uses a localStorage-backed mock credential store.
 * The UX flow (browser prompts device biometrics) is real — only the server-side
 * RP verification is simulated. In production, replace _verifyPasskeyServer().
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  readonly isAuthenticated = signal<boolean>(localStorage.getItem('isLoggedIn') === 'true');
  readonly currentUser     = signal<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  readonly passkeyState    = signal<PasskeyState>('idle');

  // ── Passkey / WebAuthn ────────────────────────────────────────────────────

  get isWebAuthnSupported(): boolean {
    return !!(window.PublicKeyCredential);
  }

  /** Attempt passkey sign-in using platform authenticator (fingerprint/face/PIN). */
  async loginWithPasskey(): Promise<boolean> {
    if (!this.isWebAuthnSupported) {
      this.passkeyState.set('unsupported');
      return false;
    }

    this.passkeyState.set('pending');
    try {
      // In a real app: fetch a real challenge from server
      const mockChallenge = new Uint8Array(32);
      crypto.getRandomValues(mockChallenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: mockChallenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname,
          allowCredentials: [], // empty = any passkey on this device
        },
      });

      if (credential) {
        this.passkeyState.set('success');
        this._setMockUser('Merchant', 'merchant@dhwani.app');
        return true;
      }
      this.passkeyState.set('error');
      return false;
    } catch (e: any) {
      // User cancelled, or no passkey registered — fall back gracefully
      this.passkeyState.set(e.name === 'NotAllowedError' ? 'idle' : 'error');
      return false;
    }
  }

  // ── Email + password ──────────────────────────────────────────────────────

  login(email: string, password: string): boolean {
    if (email && password && password.length >= 6) {
      const name = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      this._setMockUser(name, email);
      return true;
    }
    return false;
  }

  // ── Google mock ───────────────────────────────────────────────────────────

  loginWithGoogle(): void {
    this._setMockUser('Merchant', 'merchant@dhwani.app');
  }

  // ── Signup ────────────────────────────────────────────────────────────────

  signup(name: string, email: string, password: string): boolean {
    if (name && email && password && password.length >= 6) {
      this._setMockUser(name, email);
      return true;
    }
    return false;
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  logout() {
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    this.passkeyState.set('idle');
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _setMockUser(name: string, email: string) {
    const user: User = { name, email, avatarInitial: name.charAt(0).toUpperCase() };
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
  }
}
