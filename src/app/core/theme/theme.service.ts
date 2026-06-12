import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'snaptools.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly mode = signal<ThemeMode>(this.restore());
  private readonly systemPrefersDark = signal(this.getSystemPreference());

  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const mode = this.mode();
    return mode === 'system' ? (this.systemPrefersDark() ? 'dark' : 'light') : mode;
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));

    effect(() => {
      document.documentElement.setAttribute('data-theme', this.resolvedTheme());
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  cycle(): void {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.mode()) + 1) % order.length];
    this.setMode(next);
  }

  private restore(): ThemeMode {
    if (!this.isBrowser) {
      return 'system';
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  }

  private getSystemPreference(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
