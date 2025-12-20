import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly DARK_CLASS = 'dark';
  private readonly THEME_STORAGE_KEY = 'theme';

  // Signal to track current theme
  readonly currentTheme = signal<'light' | 'dark'>('light');

  /**
   * Initialize theme based on system preference
   */
  initializeTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const savedTheme = this.getSavedTheme();
    const initialTheme = savedTheme ?? this.getSystemPreference();
    this.currentTheme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  toggleTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const nextTheme: 'light' | 'dark' = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.saveTheme(nextTheme);
    this.applyTheme(nextTheme);
  }

  /**
   * Get system color scheme preference
   */
  private getSystemPreference(): 'light' | 'dark' {
    if (!this.isBrowser) {
      return 'light';
    }

    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Apply theme to the document
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) {
      return;
    }

    this.currentTheme.set(theme);

    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add(this.DARK_CLASS);
    } else {
      htmlElement.classList.remove(this.DARK_CLASS);
    }
  }

  /**
   * Listen to system theme changes
   */
  watchSystemTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    // If user explicitly selected a theme, do not override it with system changes.
    if (this.getSavedTheme()) {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');

    // Use addEventListener (standard) or addListener (legacy) for browser support
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      // Apply system preference only if user hasn't overridden theme.
      if (this.getSavedTheme()) {
        return;
      }
      const isDark = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      const newTheme = isDark ? 'dark' : 'light';
      this.currentTheme.set(newTheme);
      this.applyTheme(newTheme);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers (deprecated but needed for compatibility)
      // eslint-disable-next-line deprecation/deprecation
      mediaQuery.addListener(handler);
    }
  }

  private getSavedTheme(): 'light' | 'dark' | null {
    if (!this.isBrowser) {
      return null;
    }

    const value = localStorage.getItem(this.THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  }

  private saveTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }
}
