import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSense publisher ID. Replace with the real ca-pub- identifier before deploying.
 */
export const ADSENSE_CLIENT_ID = 'ca-pub-0000000000000000';

@Injectable({ providedIn: 'root' })
export class AdsService {
  readonly isOnline = signal(true);
  private scriptLoaded = false;
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object, @Inject(DOCUMENT) private readonly document: Document) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.isOnline.set(navigator.onLine);
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => this.isOnline.set(false));
    }
  }

  loadAdSenseScript(): void {
    if (!this.isBrowser || this.scriptLoaded || !this.isOnline()) {
      return;
    }

    if (this.document.querySelector('script[data-snaptools-ads]')) {
      this.scriptLoaded = true;
      return;
    }

    const script = this.document.createElement('script');
    script.setAttribute('data-snaptools-ads', 'true');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    this.document.head.appendChild(script);
    this.scriptLoaded = true;
  }

  requestAd(): void {
    if (!this.isBrowser || !this.isOnline()) {
      return;
    }

    this.loadAdSenseScript();

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense script not ready yet; the unit will stay empty until next paint. */
    }
  }
}
