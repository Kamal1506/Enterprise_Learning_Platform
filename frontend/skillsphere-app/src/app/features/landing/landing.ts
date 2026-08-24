import { Component, OnInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingNavbarComponent } from './components/landing-navbar/landing-navbar';
import { HeroSectionComponent } from './components/hero-section/hero-section';
import { WorkforceStorySectionComponent } from './components/workforce-story-section/workforce-story-section';
import { ConnectedJourneySectionComponent } from './components/connected-journey-section/connected-journey-section';
import { SkillsIntelligenceSectionComponent } from './components/skills-intelligence-section/skills-intelligence-section';
import { SkillGapsSectionComponent } from './components/skill-gaps-section/skill-gaps-section';
import { LearningJourneySectionComponent } from './components/learning-journey-section/learning-journey-section';
import { CertificationsSectionComponent } from './components/certifications-section/certifications-section';
import { CareerGrowthSectionComponent } from './components/career-growth-section/career-growth-section';
import { HrLeadersSectionComponent } from './components/hr-leaders-section/hr-leaders-section';
import { RoleValueSectionComponent } from './components/role-value-section/role-value-section';
import { LandingFooterComponent } from './components/landing-footer/landing-footer';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    LandingNavbarComponent,
    HeroSectionComponent,
    WorkforceStorySectionComponent,
    ConnectedJourneySectionComponent,
    SkillsIntelligenceSectionComponent,
    SkillGapsSectionComponent,
    LearningJourneySectionComponent,
    CertificationsSectionComponent,
    CareerGrowthSectionComponent,
    HrLeadersSectionComponent,
    RoleValueSectionComponent,
    LandingFooterComponent
  ],
  template: `
    <div class="landing-page-wrapper">
      <!-- Background Decorative Lights -->
      <div class="ambient-mesh-light mesh-1"></div>
      <div class="ambient-mesh-light mesh-2"></div>
      <div class="ambient-mesh-light mesh-3"></div>

      <!-- Navigation Header -->
      <app-landing-navbar />

      <!-- Section Modules -->
      <app-hero-section />
      <app-workforce-story-section />
      <app-connected-journey-section />
      <app-skills-intelligence-section />
      <app-skill-gaps-section />
      <app-learning-journey-section />
      <app-certifications-section />
      <app-career-growth-section />
      <app-hr-leaders-section />
      <app-role-value-section />
      
      <!-- Footer & Final CTA -->
      <app-landing-footer />
    </div>
  `
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private observer: IntersectionObserver | null = null;

  ngOnInit() {
    this.setupScrollAnimations();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupScrollAnimations() {
    // Check if Reduced Motion is preferred
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Use IntersectionObserver to add classes when items enter viewport
    const options = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Once visible, we can stop observing it
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    // Query all elements with animation classes
    setTimeout(() => {
      const animatedEls = this.elementRef.nativeElement.querySelectorAll('.animate-on-scroll');
      animatedEls.forEach((el: Element) => {
        this.observer?.observe(el);
      });
    }, 500);
  }
}
