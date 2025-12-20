import {
  Component,
  computed,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { I18nService } from '@services/i18n.service';
import { TranslatePipe } from '@pipes/translate.pipe';
import { Currency, QuoteCalculation } from '@interfaces/quote';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PdfGeneratorService } from '@services/pdf-generator.service';
import { SEOService } from '@services/seo.service';

@Component({
  selector: 'app-price-quote-generation',
  imports: [
    TranslatePipe,
    ToggleSwitchModule,
    InputNumberModule,
    ButtonModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './price-quote-generation.html',
  styleUrl: './price-quote-generation.css',
})
export class PriceQuoteGeneration implements OnInit, AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;
  private readonly i18nService = inject(I18nService);
  private readonly seoService = inject(SEOService);
  readonly translate = this.i18nService.t;

  readonly selectedProjectType = signal<string | null>(null);
  readonly modulesCount = signal<number>(1);
  readonly selectedEnhancements = signal<Set<string>>(new Set());

  // Initialize currency based on user's locale
  currency = signal<Currency>(this.getDefaultCurrency());

  readonly isUSD = computed(() => this.currency() === 'USD');

  private getDefaultCurrency(): Currency {
    const locale = this.i18nService.getLocale();
    return locale === 'en' ? 'USD' : 'MXN';
  }

  toggleCurrency(): void {
    this.currency.set(this.currency() === 'USD' ? 'MXN' : 'USD');
  }

  readonly exchangeRate = 17;

  readonly projectTypes = computed(() => {
    const t = this.translate();
    return [
      {
        id: 'landing',
        name: t('quote.projectTypes.landing.name'),
        description: t('quote.projectTypes.landing.description'),
        icon: 'pi pi-globe',
        basePriceUSD: 320,
        unitPriceUSD: 20,
      },
      {
        id: 'ecommerce',
        name: t('quote.projectTypes.ecommerce.name'),
        description: t('quote.projectTypes.ecommerce.description'),
        icon: 'pi pi-shopping-cart',
        basePriceUSD: 950,
        unitPriceUSD: 60,
      },
      {
        id: 'saas',
        name: t('quote.projectTypes.saas.name'),
        description: t('quote.projectTypes.saas.description'),
        icon: 'pi pi-building',
        basePriceUSD: 1800,
        unitPriceUSD: 180,
      },
    ];
  });

  readonly enhancements = computed(() => {
    const t = this.translate();
    const curr = this.currency();
    const exchangeRate = this.exchangeRate;

    const enhancementsUSD = [
      {
        id: 'database',
        name: t('quote.enhancements.database.name'),
        icon: 'pi pi-database',
        priceUSD: 180,
      },
      {
        id: 'adminPanel',
        name: t('quote.enhancements.adminPanel.name'),
        icon: 'pi pi-cog',
        priceUSD: 430,
      },
      {
        id: 'mobileFirst',
        name: t('quote.enhancements.mobileFirst.name'),
        icon: 'pi pi-mobile',
        priceUSD: 125,
      },
      {
        id: 'seo',
        name: t('quote.enhancements.seo.name'),
        icon: 'pi pi-search',
        priceUSD: 157,
      },
      {
        id: 'auth',
        name: t('quote.enhancements.auth.name'),
        icon: 'pi pi-shield',
        priceUSD: 260,
      },
      {
        id: 'api',
        name: t('quote.enhancements.api.name'),
        icon: 'pi pi-link',
        priceUSD: 430,
      },
      {
        id: 'premium',
        name: t('quote.enhancements.premium.name'),
        icon: 'pi pi-star',
        priceUSD: 210,
      },
      {
        id: 'performance',
        name: t('quote.enhancements.performance.name'),
        icon: 'pi pi-bolt',
        priceUSD: 105,
      },
      {
        id: 'custom',
        name: t('quote.enhancements.custom.name'),
        icon: 'pi pi-code',
        priceUSD: 210,
      },
    ];

    return enhancementsUSD.map((enh) => ({
      ...enh,
      price: curr === 'USD' ? enh.priceUSD : enh.priceUSD * exchangeRate,
    }));
  });

  readonly calculation = computed((): QuoteCalculation => {
    const projectType = this.projectTypes().find((p) => p.id === this.selectedProjectType());
    if (!projectType) {
      return {
        basePrice: 0,
        modulesPrice: 0,
        enhancementsPrice: 0,
        subtotal: 0,
        deliveryDays: 0,
      };
    }

    const curr = this.currency();
    const exchangeRate = this.exchangeRate;

    const basePriceUSD = projectType.basePriceUSD;
    const basePrice = curr === 'USD' ? basePriceUSD : basePriceUSD * exchangeRate;

    const unitPriceUSD = projectType.unitPriceUSD;
    const unitPriceMXN = unitPriceUSD * exchangeRate;
    const unitPrice = curr === 'USD' ? unitPriceUSD : unitPriceMXN;

    const modulesPrice = unitPrice * this.modulesCount();

    const enhancementsPrice = Array.from(this.selectedEnhancements()).reduce((total, id) => {
      const enhancement = this.enhancements().find((e) => e.id === id);
      return total + (enhancement?.price || 0);
    }, 0);

    const subtotal = basePrice + modulesPrice + enhancementsPrice;

    let baseDays = 0;
    const sectionsCount = this.modulesCount();

    if (projectType.id === 'landing') {
      if (sectionsCount === 1) {
        baseDays = 9;
      } else if (sectionsCount === 2) {
        baseDays = 10;
      } else if (sectionsCount === 3) {
        baseDays = 12;
      } else {
        baseDays = 12 + (sectionsCount - 3) * 2;
      }
    } else if (projectType.id === 'ecommerce') {
      baseDays = 22 + (sectionsCount - 1) * 3;
    } else if (projectType.id === 'saas') {
      baseDays = 42 + (sectionsCount - 1) * 3;
    }

    const enhancementDaysMap: Record<string, number> = {
      database: 5,
      adminPanel: 10,
      mobileFirst: 3,
      seo: 3,
      auth: 6,
      api: 6,
      premium: 6,
      performance: 2,
      custom: 7,
    };

    const additionalDays = Array.from(this.selectedEnhancements()).reduce((total, id) => {
      return total + (enhancementDaysMap[id] || 0);
    }, 0);

    const deliveryDays = baseDays + additionalDays;

    return {
      basePrice,
      modulesPrice,
      enhancementsPrice,
      subtotal,
      deliveryDays,
    };
  });

  readonly formattedTotal = computed(() => {
    const calc = this.calculation();
    const total = calc.subtotal;
    const curr = this.currency();

    if (curr === 'USD') {
      return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`;
    }

    return `$${total.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
  });

  readonly formattedBasePrice = computed(() => {
    const calc = this.calculation();
    const price = calc.basePrice;
    const curr = this.currency();

    if (curr === 'USD') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`;
    }

    return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
  });

  readonly formattedModulesPrice = computed(() => {
    const calc = this.calculation();
    const price = calc.modulesPrice;
    const curr = this.currency();

    if (curr === 'USD') {
      return `+ $${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`;
    }

    return `+ $${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
  });

  readonly selectedEnhancementsArray = computed(() => {
    return Array.from(this.selectedEnhancements());
  });

  getEnhancementById(id: string) {
    return this.enhancements().find((e) => e.id === id);
  }

  selectProjectType(typeId: string): void {
    this.selectedProjectType.set(typeId);
  }

  toggleEnhancement(enhancementId: string): void {
    const current = this.selectedEnhancements();
    const newSet = new Set(current);

    if (newSet.has(enhancementId)) {
      newSet.delete(enhancementId);
    } else {
      newSet.add(enhancementId);
    }

    this.selectedEnhancements.set(newSet);
  }

  isEnhancementSelected(enhancementId: string): boolean {
    return this.selectedEnhancements().has(enhancementId);
  }

  formatEnhancementPrice(price: number): string {
    const curr = this.currency();

    if (curr === 'USD') {
      return `+$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    return `+$${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getProjectTypePriceLabel(
    projectTypeId: string,
    basePriceUSD: number,
    unitPriceUSD: number,
  ): string {
    const curr = this.currency();
    const exchangeRate = this.exchangeRate;

    if (basePriceUSD > 0) {
      const basePrice = curr === 'USD' ? basePriceUSD : basePriceUSD * exchangeRate;
      const unitPriceMXN = unitPriceUSD * exchangeRate;
      const unitPrice = curr === 'USD' ? unitPriceUSD : unitPriceMXN;

      if (curr === 'USD') {
        return `$${basePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + $${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/${this.getUnitLabel(projectTypeId)} USD`;
      }

      return `$${basePrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + $${unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/${this.getUnitLabel(projectTypeId)} MXN`;
    }

    const unitPriceMXN = unitPriceUSD * exchangeRate;
    const unitPrice = curr === 'USD' ? unitPriceUSD : unitPriceMXN;

    if (curr === 'USD') {
      return `$${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/${this.getUnitLabel(projectTypeId)} USD`;
    }

    return `$${unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/${this.getUnitLabel(projectTypeId)} MXN`;
  }

  getUnitLabel(projectTypeId: string): string {
    const t = this.translate();
    if (projectTypeId === 'landing') {
      return t('quote.units.section') || 'sección';
    } else if (projectTypeId === 'ecommerce') {
      return t('quote.units.product') || 'producto';
    } else {
      return t('quote.units.module') || 'módulo';
    }
  }

  decrementModules(): void {
    this.modulesCount.update((count) => Math.max(1, count - 1));
  }

  incrementModules(): void {
    this.modulesCount.update((count) => count + 1);
  }

  scheduleConsultation(): void {
    const locale = this.i18nService.getLocale();
    const url =
      locale === 'en'
        ? 'https://calendly.com/vaneybr/30min'
        : 'https://calendly.com/vaneybr/tell-me-your-idea-clone';
    window.open(url, '_blank');
  }

  private readonly pdfGeneratorService = inject(PdfGeneratorService);

  generatePDF(): void {
    const calc = this.calculation();
    const projectType = this.projectTypes().find((p) => p.id === this.selectedProjectType());

    if (!projectType) return;

    const selectedEnhancementsInfo = Array.from(this.selectedEnhancements())
      .map((id) => this.getEnhancementById(id))
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .map((e) => ({ id: e.id, name: e.name, price: e.price }));

    this.pdfGeneratorService.generateQuotePDF({
      projectType: {
        id: projectType.id,
        name: projectType.name,
        description: projectType.description,
      },
      modulesCount: this.modulesCount(),
      unitLabel: this.getUnitLabel(projectType.id),
      selectedEnhancements: selectedEnhancementsInfo,
      calculation: calc,
      currency: this.currency(),
      formattedBasePrice: this.formattedBasePrice(),
      formattedModulesPrice: this.formattedModulesPrice(),
      formattedTotal: this.formattedTotal(),
    });
  }

  ngOnInit(): void {
    const locale = this.i18nService.getLocale();

    this.seoService.updateSEO({
      title:
        locale === 'es'
          ? 'Generador de Cotizaciones - Vanessa Yebra | Portfolio'
          : 'Price Quote Generator - Vanessa Yebra | Portfolio',
      description:
        locale === 'es'
          ? 'Genera cotizaciones personalizadas para proyectos web. Calcula precios y tiempos de entrega para Landing Pages, E-commerce y aplicaciones SaaS.'
          : 'Generate custom quotes for web projects. Calculate prices and delivery times for Landing Pages, E-commerce and SaaS applications.',
      keywords:
        'Price Quote Generator, Web Development Pricing, Project Calculator, Landing Page Pricing, E-commerce Pricing, SaaS Pricing, Web Development Cost Calculator, developer en monterrey, developer en woodlands, developer in woodlands, developer near woodlands, desarrollador cerca de monterrey, desarrollador en monterrey',
      url: '/price-quote-generator',
      type: 'website',
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      threshold: 0.01,
      rootMargin: '0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    setTimeout(() => {
      const elementsToObserve = [
        '.quote-header',
        '.quote-currency-toggle',
        '.quote-project-types',
        '.quote-scope',
        '.quote-enhancements',
        '.quote-summary',
        '.project-type-item',
        '.enhancement-item',
      ];

      elementsToObserve.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

          if (isVisible) {
            el.classList.add('animate-in');
          } else {
            this.observer?.observe(el);
          }
        });
      });
    }, 100);
  }
}
