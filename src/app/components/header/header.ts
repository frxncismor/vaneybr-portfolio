import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenubarModule } from 'primeng/menubar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { I18nService } from '@services/i18n.service';
import { ThemeService } from '@services/theme.service';
import { CommonModule } from '@angular/common';
import { RouterLinkWithHref } from "@angular/router";

@Component({
  selector: 'app-header',
  imports: [MenubarModule, SelectButtonModule, CommonModule, FormsModule, RouterLinkWithHref],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly i18nService = inject(I18nService);
  private readonly themeService = inject(ThemeService);

  readonly translate = this.i18nService.t;
  readonly currentLocale = this.i18nService.locale;

  private navBar = document.querySelector("nav");
  private navLinks = document.querySelector("nav ul");
  private sideMenu = document.querySelector('#sideMenu');

  readonly items = computed(() => [
    { label: this.translate()('header.nav.home'), 
      routerLink: '/' 
    },
    {
      label: this.translate()('header.nav.blog'),
      routerLink: '/blog',
    },
  ]);

  toggleLanguage() {
    const newLocale = this.currentLocale() === 'en' ? 'es' : 'en';
    this.i18nService.setLocale(newLocale);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  openMenu() {
    if (this.sideMenu) {
      // this.sideMenu.classList.remove('-right-64');
      // this.sideMenu.classList.add('right-0');
      (this.sideMenu as HTMLElement).style.transform = 'translateX(0)';
    }
  }

   closeMenu(){
     (this.sideMenu as HTMLElement)?.style?.setProperty('transform', 'translateX(16rem)');
   }
}
