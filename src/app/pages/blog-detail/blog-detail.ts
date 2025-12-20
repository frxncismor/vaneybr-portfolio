import { Component, OnInit, signal, ViewEncapsulation, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../services/blog.service';
import { I18nService } from '../../services/i18n.service';
import { SEOService } from '../../services/seo.service';
import { BlogPost } from '../../interfaces/blog-post.interface';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogDetail implements OnInit {
  post = signal<BlogPost | null>(null);
  loading = signal<boolean>(true);
  safeContent = signal<SafeHtml>('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly blogService: BlogService,
    private readonly i18nService: I18nService,
    private readonly seoService: SEOService,
    private readonly sanitizer: DomSanitizer,
  ) {
    // Update SEO when post changes
    effect(() => {
      const currentPost = this.post();
      if (currentPost) {
        this.updateSEO(currentPost);
      }
    });
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    }
  }

  private loadPost(slug: string) {
    const language = this.i18nService.getLocale();
    this.blogService.getPostBySlug(slug, language).subscribe((post) => {
      if (post) {
        this.post.set(post);
        this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(post.content));
        this.updateSEO(post);
      }
      this.loading.set(false);
    });
  }

  private updateSEO(post: BlogPost) {
    const locale = this.i18nService.getLocale();
    const imageUrl = this.blogService.getPostImage(post);
    const postUrl = `/blog/${post.slug}`;
    const keywords =
      post.tags.join(', ') +
      (locale === 'en'
        ? ', web development, frontend development, programming'
        : ', desarrollo web, desarrollo frontend, programación');

    this.seoService.updateSEO({
      title: `${post.title} | Vanessa Yebra - Blog`,
      description: post.description,
      keywords,
      url: postUrl,
      type: 'article',
      image: imageUrl,
      author: post.author || 'Vanessa Yebra',
    });

    // Add structured data for Article
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: imageUrl,
      datePublished: post.date.toISOString(),
      dateModified: post.date.toISOString(),
      author: {
        '@type': 'Person',
        name: post.author || 'Vanessa Yebra',
        url: 'https://vaneybr.com',
      },
      publisher: {
        '@type': 'Person',
        name: 'Vanessa Yebra',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://vaneybr.com${postUrl}`,
      },
      keywords: post.tags.join(', '),
      articleSection: 'Web Development',
      inLanguage: locale === 'en' ? 'en-US' : 'es-ES',
      ...(post.readingTime && {
        timeRequired: `PT${post.readingTime}M`,
      }),
    };

    this.seoService.addStructuredData(structuredData);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.i18nService.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
