import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BlogService } from '@services/blog.service';
import { I18nService } from '@services/i18n.service';
import { SEOService } from '@services/seo.service';
import { BlogPost } from '@interfaces/blog-post.interface';
import { TranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-blog',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslatePipe,
    CardModule,
    ButtonModule,
    NgOptimizedImage,
  ],
  templateUrl: './blog.html',
  styleUrl: './blog.css',
})
export class Blog implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly i18nService = inject(I18nService);
  private readonly seoService = inject(SEOService);
  private isLoading = false;
  private currentLanguage: 'en' | 'es' | null = null;

  posts = signal<BlogPost[]>([]);
  searchQuery = signal<string>('');
  selectedTag = signal<string>('');

  filteredPosts = computed(() => {
    let result = this.posts();
    const query = this.searchQuery().toLowerCase();
    const tag = this.selectedTag();

    if (query) {
      result = this.blogService.searchPosts(result, query);
    }

    if (tag) {
      result = this.blogService.filterByTag(result, tag);
    }

    return result;
  });

  // Posts with pre-calculated images to avoid recalculating on every change detection
  postsWithImages = computed(() => {
    return this.filteredPosts().map((post) => ({
      ...post,
      headerImage: this.blogService.getPostImage(post),
    }));
  });

  allTags = computed(() => {
    return this.blogService.getAllTags(this.posts());
  });

  constructor() {
    // Only reload posts when locale actually changes, not on every read
    effect(() => {
      const newLocale = this.i18nService.locale();
      const language = newLocale === 'en' ? 'en' : 'es';

      // Only load if language changed and we're not already loading
      if (this.currentLanguage !== language && !this.isLoading) {
        this.currentLanguage = language;
        this.loadPosts();
      }
    });
  }

  ngOnInit() {
    // Load posts on initialization only if not already loaded
    if (!this.isLoading && this.posts().length === 0) {
      this.currentLanguage = this.i18nService.getLocale() === 'en' ? 'en' : 'es';
      this.loadPosts();
    }
    this.updateSEO();
  }

  private loadPosts() {
    // Prevent multiple simultaneous loads
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    const language = this.i18nService.getLocale();

    this.blogService.getPosts(language).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.isLoading = false;
        this.updateSEO();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private updateSEO() {
    const locale = this.i18nService.getLocale();
    const isEnglish = locale === 'en';

    const title = isEnglish
      ? 'Blog - Vanessa Yebra | Portfolio'
      : 'Blog - Vanessa Yebra | Portafolio';

    const description = isEnglish
      ? 'Thoughts about data analysis, business intelligence, and technology insights from a Data Analyst perspective.'
      : 'Pensamientos sobre análisis de datos, inteligencia de negocios e insights tecnológicos desde la perspectiva de un Analista de Datos.';

    const keywords = isEnglish
      ? 'blog, data analysis, business intelligence, data visualization, Power BI, Python, R, SQL, technology insights, Vanessa Yebra'
      : 'blog, análisis de datos, inteligencia de negocios, visualización de datos, Power BI, Python, R, SQL, insights tecnológicos, Vanessa Yebra';

    this.seoService.updateSEO({
      title,
      description,
      keywords,
      url: '/blog',
      type: 'website',
    });

    // Add structured data for Blog
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: title,
      description,
      url: 'https://vaneybr.com/blog',
      author: {
        '@type': 'Person',
        name: 'Vanessa Yebra',
        url: 'https://vaneybr.com',
      },
      publisher: {
        '@type': 'Person',
        name: 'Vanessa Yebra',
      },
      inLanguage: locale === 'en' ? 'en-US' : 'es-ES',
    };

    this.seoService.addStructuredData(structuredData);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  selectTag(tag: string) {
    this.selectedTag.set(this.selectedTag() === tag ? '' : tag);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedTag.set('');
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.i18nService.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
