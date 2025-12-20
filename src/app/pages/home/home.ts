import { Component, OnInit, inject } from '@angular/core';
import { Hero } from '@components/hero/hero';
import { TechStack } from '@components/tech-stack/tech-stack';
import { ProfessionalExperience } from '@components/professional-experience/professional-experience';
import { Projects } from '@components/projects/projects';
import { AboutMe } from '@components/about-me/about-me';
import { SEOService } from '@services/seo.service';
import { I18nService } from '@services/i18n.service';

@Component({
  selector: 'app-home',
  imports: [Hero, TechStack, ProfessionalExperience, Projects, AboutMe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly i18nService = inject(I18nService);

  ngOnInit(): void {
    const locale = this.i18nService.getLocale();

    this.seoService.updateSEO({
      title: 'Vanessa Yebra - Data Analyst & Visualization Specialist | Portfolio',
      description:
        locale === 'es'
          ? 'Analista de datos y especialista en visualización con experiencia en Python, SQL, Power BI y Tableau. Portfolio profesional de Vanessa Yebra.'
          : 'Data analyst and visualization specialist with experience in Python, SQL, Power BI and Tableau. Professional portfolio of Vanessa Yebra.',
      keywords:
        'Vanessa Yebra, analyst, data visualization, Power BI, Tableau, Python, SQL, data analyst portfolio, data analysis, business intelligence, dashboard, reporting',
      url: '/home',
      type: 'website',
    });

    // Add structured data (Person/Portfolio)
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Vanessa Yebra',
      jobTitle: 'Data Analyst & Visualization Specialist',
      url: 'https://vaneybr.com',
      sameAs: ['https://www.linkedin.com/in/vanessayebra/', 'https://github.com/ZokieYbr'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Monterrey',
        addressRegion: 'NL',
        addressCountry: 'MX',
      },
      knowsAbout: [
        'Data Analysis',
        'Data Visualization',
        'Power BI',
        'Tableau',
        'Python',
        'SQL',
        'Excel',
        'Business Intelligence',
        'Statistical Analysis',
        'Data Reporting',
        'Data Cleaning',
      ],
    });
  }
}
