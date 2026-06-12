import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  schemaType?: 'WebApplication' | 'SoftwareApplication';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = 'https://snaptools.app';
  private jsonLdScript: HTMLScriptElement | null = null;

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  update(page: PageSeo): void {
    const fullTitle = page.title;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'keywords', content: page.keywords ?? '' });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: `${this.baseUrl}${page.path}` });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });

    this.updateCanonical(page.path);
    this.updateJsonLd(page);
  }

  private updateCanonical(path: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', `${this.baseUrl}${path}`);
  }

  private updateJsonLd(page: PageSeo): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': page.schemaType ?? 'WebApplication',
      name: page.title,
      url: `${this.baseUrl}${page.path}`,
      description: page.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
      }
    };

    if (!this.jsonLdScript) {
      this.jsonLdScript = this.document.createElement('script');
      this.jsonLdScript.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(this.jsonLdScript);
    }
    this.jsonLdScript.textContent = JSON.stringify(schema);
  }
}
