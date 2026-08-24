import { Injectable, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<'dark' | 'light'>('dark');

  constructor(private router: Router) {
    // Listen to route changes to force dark theme on login/register/root
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      if (url.includes('/login') || url.includes('/register') || url === '/') {
        this.setTheme('dark');
      }
    });

    // Synchronize theme with body classes
    effect(() => {
      const theme = this.currentTheme();
      const body = document.body;
      if (theme === 'light') {
        body.classList.add('theme-light');
        body.classList.remove('theme-dark');
      } else {
        body.classList.add('theme-dark');
        body.classList.remove('theme-light');
      }
    });
  }

  toggleTheme() {
    this.currentTheme.set(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: 'dark' | 'light') {
    this.currentTheme.set(theme);
  }
}
