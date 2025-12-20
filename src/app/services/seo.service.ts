import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18nService } from './i18n.service';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly i18nService = inject(I18nService);

  private readonly baseUrl = 'https://vaneybr.com';
  private readonly defaultImage = `${this.baseUrl}/myphoto.webp`;
  private readonly defaultAuthor = 'Vanessa Yebra';

  updateSEO(data: SEOData): void {
    const locale = this.i18nService.getLocale();
    const currentUrl = `${this.baseUrl}${data.url || ''}`;
    const imageUrl = data.image || this.defaultImage;

    // Title
    if (data.title) {
      this.title.setTitle(data.title);
      this.updateMetaTag('property', 'og:title', data.title);
      this.updateMetaTag('name', 'twitter:title', data.title);
    }

    // Description
    if (data.description) {
      this.updateMetaTag('name', 'description', data.description);
      this.updateMetaTag('property', 'og:description', data.description);
      this.updateMetaTag('name', 'twitter:description', data.description);
    }

    // Keywords
    if (data.keywords) {
      this.updateMetaTag('name', 'keywords', data.keywords);
    }

    // Image
    this.updateMetaTag('property', 'og:image', imageUrl);
    this.updateMetaTag('name', 'twitter:image', imageUrl);

    // URL
    this.updateMetaTag('property', 'og:url', currentUrl);
    this.updateMetaTag('property', 'og:type', data.type || 'website');

    // Author
    this.updateMetaTag('name', 'author', data.author || this.defaultAuthor);

    // Twitter Card
    this.updateMetaTag('name', 'twitter:card', 'summary_large_image');
    this.updateMetaTag('name', 'twitter:site', '@vaneybr');

    // Language
    this.updateMetaTag('property', 'og:locale', locale === 'es' ? 'es_ES' : 'en_US');
    this.updateMetaTag('property', 'og:locale:alternate', locale === 'es' ? 'en_US' : 'es_ES');
  }

  private updateMetaTag(attr: 'name' | 'property', selector: string, content: string): void {
    const existingTag = this.meta.getTag(`${attr}="${selector}"`);
    if (existingTag) {
      this.meta.updateTag({ [attr]: selector, content });
    } else {
      this.meta.addTag({ [attr]: selector, content });
    }
  }

  addStructuredData(data: object): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';

    // Remove existing structured data
    const existing = document.getElementById('structured-data');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);
  }
}
