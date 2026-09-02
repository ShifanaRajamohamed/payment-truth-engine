import { Injectable, signal, computed } from '@angular/core';

export type InteractionMode = 'voice' | 'text' | 'tap';
export type ComplexityLevel = 'simple' | 'standard' | 'detailed';

export interface UserPreferences {
  language: string;
  interactionMode: InteractionMode;
  complexityLevel: ComplexityLevel;
  largeText: boolean;
  simpleMode: boolean;
}

const STORAGE_KEY = 'dhwani_prefs';

const DEFAULT_PREFS: UserPreferences = {
  language: 'en',
  interactionMode: 'voice',
  complexityLevel: 'standard',
  largeText: false,
  simpleMode: false,
};

/**
 * UserPreferencesService
 * Persists interaction preferences to localStorage.
 * All components read preferences reactively via signals.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly _prefs = signal<UserPreferences>(this._load());

  readonly prefs = this._prefs.asReadonly();

  readonly language      = computed(() => this._prefs().language);
  readonly interactionMode = computed(() => this._prefs().interactionMode);
  readonly complexityLevel = computed(() => this._prefs().complexityLevel);
  readonly largeText     = computed(() => this._prefs().largeText);
  readonly simpleMode    = computed(() => this._prefs().simpleMode);

  update(partial: Partial<UserPreferences>): void {
    this._prefs.update(p => {
      const next = { ...p, ...partial };
      this._save(next);
      return next;
    });
  }

  toggleSimpleMode(): void {
    this.update({ simpleMode: !this._prefs().simpleMode });
  }

  reset(): void {
    this._prefs.set({ ...DEFAULT_PREFS });
    this._save(DEFAULT_PREFS);
  }

  private _load(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch { /* ignore parse errors */ }
    return { ...DEFAULT_PREFS };
  }

  private _save(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* ignore quota errors */ }
  }
}
