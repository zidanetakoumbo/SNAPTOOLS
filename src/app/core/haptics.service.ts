import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class HapticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Light tap feedback for taps, toggles and navigation. */
  tap(): void {
    this.vibrate(10);
  }

  /** Slightly stronger feedback for a successful action (calculation, copy, etc). */
  success(): void {
    this.vibrate([10, 30, 10]);
  }

  private vibrate(pattern: number | number[]): void {
    if (this.isBrowser && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
