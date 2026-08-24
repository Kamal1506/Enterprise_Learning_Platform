import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero-section" id="hero">
      <div class="hero-bg-effects">
        <div class="hero-glow-1"></div>
        <div class="hero-glow-2"></div>
      </div>
      
      <div class="hero-container">
        <!-- Hero Text -->
        <div class="hero-content animate-fade-in-up">
          <div class="badge-new">
            <span class="badge-dot"></span>
            <span>Version 2.0: Connected Workforce Intelligence</span>
          </div>
          
          <h1 class="hero-title">
            Turn Workforce Skills <br>
            Into <span class="gradient-text">Career Growth</span>.
          </h1>
          
          <p class="hero-description">
            Understand what your people know, develop the skills they need, and build the workforce your organization needs next in one intelligent system.
          </p>
          
          <div class="hero-ctas">
            <button (click)="scrollTo('platform')" class="btn btn-primary btn-lg">Explore the Platform</button>
            <button (click)="scrollTo('journey')" class="btn btn-outline btn-lg">See How It Works</button>
          </div>
          
          <div class="hero-social-proof">
            <p class="proof-text">Trusted by engineering-driven organizations worldwide</p>
            <div class="proof-logos">
              <span>NEXUS CORP</span>
              <span>APEX TECH</span>
              <span>SYNAPSE LABS</span>
              <span>VIBYADERANT CO</span>
            </div>
          </div>
        </div>
        
        <!-- Hero Visual (Right Side) -->
        <div class="hero-visual animate-fade-in-right">
          <div class="floating-container">
            <!-- Background Matrix Pattern -->
            <div class="matrix-grid"></div>

            <!-- Card 1: Skill Profile -->
            <div class="visual-card card-skill float-1">
              <div class="visual-card-header">
                <div class="avatar-dot">JS</div>
                <div>
                  <h4 class="card-name">John Smith</h4>
                  <p class="card-subtitle">Developer → Tech Lead Track</p>
                </div>
              </div>
              <div class="visual-card-body">
                <div class="skill-row">
                  <span>Java</span>
                  <div class="skill-level">8/10</div>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: 80%"></div>
                </div>
              </div>
            </div>

            <!-- Connecting Arrow/Line 1 -->
            <div class="node-connection connection-1">
              <svg viewBox="0 0 100 100" fill="none" class="connection-svg">
                <path d="M 0 50 Q 50 20 100 50" stroke="var(--primary-accent)" stroke-width="2" stroke-dasharray="4 4" class="dash-path" />
                <path d="M 0 50 Q 50 20 100 50" stroke="var(--primary-accent)" stroke-width="2" class="glowing-path" />
              </svg>
            </div>

            <!-- Card 2: Learning Progress -->
            <div class="visual-card card-learning float-2">
              <div class="card-icon-pill icon-learning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Learning Path</span>
              </div>
              <div class="visual-card-body">
                <h4 class="card-title">Spring Boot & Microservices</h4>
                <div class="progress-row">
                  <span class="progress-pct">67% Complete</span>
                  <span class="progress-score">Score: 92%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill progress-learning" style="width: 67%"></div>
                </div>
              </div>
            </div>

            <!-- Connecting Arrow/Line 2 -->
            <div class="node-connection connection-2">
              <svg viewBox="0 0 100 100" fill="none" class="connection-svg">
                <path d="M 0 50 Q 50 80 100 50" stroke="var(--secondary-light)" stroke-width="2" stroke-dasharray="4 4" class="dash-path" />
                <path d="M 0 50 Q 50 80 100 50" stroke="var(--secondary-light)" stroke-width="2" class="glowing-path" />
              </svg>
            </div>

            <!-- Card 3: Certification Active -->
            <div class="visual-card card-cert float-3">
              <div class="visual-card-header">
                <div class="badge-cert-status">ACTIVE</div>
                <h4 class="card-title-cert">AWS Solutions Architect</h4>
              </div>
              <div class="visual-card-body">
                <div class="cert-meta">
                  <span class="lbl">ID: AWS-SAA-9021</span>
                  <span class="status-dot green"></span>
                </div>
                <p class="cert-expiry">Valid until 15-Mar-2028</p>
              </div>
            </div>

            <!-- Connecting Arrow/Line 3 -->
            <div class="node-connection connection-3">
              <svg viewBox="0 0 100 100" fill="none" class="connection-svg">
                <path d="M 0 50 Q 50 30 100 50" stroke="var(--status-success)" stroke-width="2" stroke-dasharray="4 4" class="dash-path" />
                <path d="M 0 50 Q 50 30 100 50" stroke="var(--status-success)" stroke-width="2" class="glowing-path" />
              </svg>
            </div>

            <!-- Card 4: Career Progression -->
            <div class="visual-card card-career float-4">
              <div class="visual-card-header">
                <h4 class="card-title-career">Next Target Role: Tech Lead</h4>
                <div class="career-progress">67% Ready</div>
              </div>
              <div class="visual-card-body">
                <div class="career-metrics">
                  <div class="metric">
                    <span class="m-val">8</span>
                    <span class="m-lbl">Skills Completed</span>
                  </div>
                  <div class="metric">
                    <span class="m-val red-txt">3</span>
                    <span class="m-lbl">Gaps Remaining</span>
                  </div>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill progress-career" style="width: 67%"></div>
                </div>
              </div>
            </div>

            <!-- Dynamic Floating Data Orb -->
            <div class="glowing-orb-visual"></div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {
  private readonly router = inject(Router);

  scrollTo(targetId: string) {
    const el = document.getElementById(targetId);
    if (el) {
      const navHeight = 80;
      const rect = el.getBoundingClientRect();
      const targetScroll = rect.top + window.scrollY - navHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }
}
