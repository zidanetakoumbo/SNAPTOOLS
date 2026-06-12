import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { ADSENSE_CLIENT_ID, AdsService } from './ads.service';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ads.isOnline()) {
      <aside class="adsense-container" aria-label="Publicité">
        <ins
          class="adsbygoogle"
          style="display:block"
          [attr.data-ad-client]="adClient"
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </aside>
    } @else {
      <aside class="adsense-container adsense-offline" aria-hidden="true"></aside>
    }
  `,
  styles: [
    `
      .adsense-container {
        margin-top: 24px;
        min-height: 50px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: var(--radius-md);
      }

      .adsense-offline {
        min-height: 0;
        margin-top: 0;
        opacity: 0;
        transition: opacity 0.3s ease, min-height 0.3s ease, margin-top 0.3s ease;
      }

      ins.adsbygoogle {
        width: 100%;
        min-height: 50px;
      }
    `
  ]
})
export class AdBannerComponent implements AfterViewInit {
  readonly adClient = ADSENSE_CLIENT_ID;

  constructor(public readonly ads: AdsService) {}

  ngAfterViewInit(): void {
    this.ads.requestAd();
  }
}
