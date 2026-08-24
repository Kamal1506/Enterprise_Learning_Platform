import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="landing-footer" id="footer">
      <!-- Section 11: Final CTA Banner -->
      <div class="cta-banner-wrapper animate-on-scroll">
        <div class="cta-banner-content">
          <h2 class="cta-title">Build the workforce your organization needs next.</h2>
          <p class="cta-desc">
            From skills inventory to targeted learning paths, compliance tracking, and transparent career milestones. Connect every step of employee development in one intelligent platform.
          </p>
          <div class="cta-buttons">
            <a routerLink="/login" class="btn btn-primary btn-lg">Explore the Platform</a>
            <a href="#hero" (click)="scrollToTop($event)" class="btn btn-outline btn-lg">Back to Top</a>
          </div>
        </div>
      </div>

      <!-- Links and Copyright footer -->
      <div class="footer-links-container">
        <div class="footer-grid">
          <!-- Col 1: Logo & Tagline -->
          <div class="footer-brand-col">
            <a routerLink="/" class="footer-logo" (click)="scrollToTop($event)">
              <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="1.5" fill="var(--primary-accent)" stroke="none" />
                <circle cx="7" cy="14.5" r="1" fill="var(--secondary-light)" stroke="none" />
                <circle cx="17" cy="14.5" r="1" fill="var(--secondary-light)" stroke="none" />
              </svg>
              <span style="font-size: 14px; line-height: 1.2; display: flex; flex-direction: column;">
                Enterprise Learning Platform
                <span class="logo-highlight" style="font-size: 10px; font-weight: 500; opacity: 0.85; margin-top: 1px;">with Skill & Career Guidance</span>
              </span>
            </a>
            <p class="brand-tagline">
              Connecting employee potential, skills tracking, certification compliance, and career paths in a single, unified enterprise system.
            </p>
            <div class="system-status-indicator">
              <span class="status-dot green"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          <!-- Col 2: Platform Modules -->
          <div class="footer-links-col">
            <h4>Platform</h4>
            <ul>
              <li><a routerLink="/login">Skills Inventory</a></li>
              <li><a routerLink="/login">Assessments</a></li>
              <li><a routerLink="/login">Learning Modules</a></li>
              <li><a routerLink="/login">Certifications</a></li>
              <li><a routerLink="/login">Career Blueprint</a></li>
            </ul>
          </div>

          <!-- Col 3: Company -->
          <div class="footer-links-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#" (click)="$event.preventDefault()">About Us</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Customer Stories</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Security & Trust</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Careers</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Partners</a></li>
            </ul>
          </div>

          <!-- Col 4: Resources & Legal -->
          <div class="footer-links-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#" (click)="$event.preventDefault()">Documentation</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Help Center</a></li>
              <li><a href="#" (click)="$event.preventDefault()">API Reference</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Privacy Policy</a></li>
              <li><a href="#" (click)="$event.preventDefault()">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <!-- Copyright Row -->
        <div class="footer-bottom-row">
          <p>© 2026 Enterprise Learning Platform with Skill and Career Guidance System. All rights reserved. Built as an internal employee growth architecture.</p>
          <div class="social-links">
            <a href="#" (click)="$event.preventDefault()">Twitter</a>
            <a href="#" (click)="$event.preventDefault()">LinkedIn</a>
            <a href="#" (click)="$event.preventDefault()">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class LandingFooterComponent {
  private readonly router = inject(Router);

  scrollToTop(event: Event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }
}
