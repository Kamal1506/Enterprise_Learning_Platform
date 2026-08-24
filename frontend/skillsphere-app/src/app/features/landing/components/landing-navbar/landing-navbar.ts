import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="landing-nav" [class.nav-scrolled]="isScrolled()">
      <div class="nav-container">
        <!-- Logo -->
        <a routerLink="/" class="nav-logo" (click)="scrollToTop($event)">
          <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="7" r="1.5" fill="var(--primary-accent)" stroke="none" />
            <circle cx="7" cy="14.5" r="1" fill="var(--secondary-light)" stroke="none" />
            <circle cx="17" cy="14.5" r="1" fill="var(--secondary-light)" stroke="none" />
          </svg>
          <span class="logo-text" style="font-size: 14px; line-height: 1.2; display: flex; flex-direction: column;">
            Enterprise Learning Platform
            <span class="logo-highlight" style="font-size: 10px; font-weight: 500; opacity: 0.85; margin-top: 1px;">with Skill & Career Guidance</span>
          </span>
        </a>

        <!-- Desktop Menu -->
        <div class="nav-links">
          <a href="#platform" class="nav-link" (click)="scrollTo($event, 'platform')">Platform</a>
          <a href="#skills" class="nav-link" (click)="scrollTo($event, 'skills')">Skills</a>
          <a href="#learning" class="nav-link" (click)="scrollTo($event, 'learning')">Learning</a>
          <a href="#certifications" class="nav-link" (click)="scrollTo($event, 'certifications')">Certifications</a>
          <a href="#career" class="nav-link" (click)="scrollTo($event, 'career')">Career</a>
          <a href="#organizations" class="nav-link" (click)="scrollTo($event, 'organizations')">For Organizations</a>
        </div>

        <!-- CTA Buttons -->
        <div class="nav-ctas">
          @if (authService.isLoggedIn()) {
            <a routerLink="/dashboard" class="btn btn-primary btn-sm">Go to Dashboard</a>
          } @else {
            <a routerLink="/login" class="nav-link-login">Sign In</a>
            <a routerLink="/login" class="btn btn-primary btn-sm">Get Started</a>
          }
        </div>

        <!-- Mobile Menu Toggle Button -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" [class.active]="isMobileMenuOpen()" aria-label="Toggle menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>

      <!-- Mobile Menu Overlay -->
      <div class="mobile-menu" [class.mobile-menu-active]="isMobileMenuOpen()">
        <div class="mobile-menu-links">
          <a href="#platform" class="mobile-link" (click)="scrollTo($event, 'platform')">Platform</a>
          <a href="#skills" class="mobile-link" (click)="scrollTo($event, 'skills')">Skills</a>
          <a href="#learning" class="mobile-link" (click)="scrollTo($event, 'learning')">Learning</a>
          <a href="#certifications" class="mobile-link" (click)="scrollTo($event, 'certifications')">Certifications</a>
          <a href="#career" class="mobile-link" (click)="scrollTo($event, 'career')">Career</a>
          <a href="#organizations" class="mobile-link" (click)="scrollTo($event, 'organizations')">For Organizations</a>
          
          <div class="mobile-ctas">
            @if (authService.isLoggedIn()) {
              <a routerLink="/dashboard" class="btn btn-primary btn-block" (click)="closeMobileMenu()">Go to Dashboard</a>
            } @else {
              <a routerLink="/login" class="btn btn-outline btn-block" (click)="closeMobileMenu()">Sign In</a>
              <a routerLink="/login" class="btn btn-primary btn-block" (click)="closeMobileMenu()">Get Started</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class LandingNavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(val => !val);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  scrollToTop(event: Event) {
    event.preventDefault();
    this.closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  scrollTo(event: Event, targetId: string) {
    event.preventDefault();
    this.closeMobileMenu();
    const el = document.getElementById(targetId);
    if (el) {
      const navHeight = 80;
      const rect = el.getBoundingClientRect();
      const targetScroll = rect.top + window.scrollY - navHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }
}
