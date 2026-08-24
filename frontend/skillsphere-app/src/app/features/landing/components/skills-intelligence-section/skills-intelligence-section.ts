import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SkillItem {
  name: string;
  rating: number;
  pct: number;
}

interface ProfileDataset {
  role: string;
  name: string;
  avatar: string;
  coverage: number;
  assessment: number;
  competency: number;
  skills: SkillItem[];
}

@Component({
  selector: 'app-skills-intelligence-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="skills-intelligence-section" id="skills">
      <div class="container">
        <div class="intelligence-grid">
          <!-- Left side: Narrative/Intro -->
          <div class="intel-content animate-on-scroll">
            <span class="section-tag">Workforce Capability</span>
            <h2 class="section-title">Know the capabilities of your workforce.</h2>
            <p class="section-desc">
              Understand skills at a granular level. Track competency models, measure assessment scores, and map skill coverage across departments. Real time analytics that show exactly what your people are capable of doing.
            </p>
            
            <div class="intel-features">
              <div class="intel-feat-item">
                <div class="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h4>Verified Skill Assessments</h4>
                  <p>Eliminate self-bias through double-blind peer, manager, and exam validations.</p>
                </div>
              </div>

              <div class="intel-feat-item">
                <div class="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div>
                  <h4>Competency Mapping</h4>
                  <p>Map raw skills directly to roles, compliance standards, and seniority level benchmarks.</p>
                </div>
              </div>
            </div>

            <!-- Tab Selectors to show versatility -->
            <div class="profile-selectors">
              <span class="selector-lbl">Inspect profiles:</span>
              <div class="selectors-row">
                @for (roleName of rolesList; track roleName; let idx = $index) {
                  <button 
                    class="selector-btn" 
                    [class.active]="selectedRoleIdx() === idx"
                    (click)="selectedRoleIdx.set(idx)"
                  >
                    {{ roleName }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Right side: Dynamic Employee Profile Visualizer -->
          <div class="intel-visual animate-on-scroll">
            <div class="profile-showcase-card">
              <!-- Card Header -->
              <div class="showcase-header">
                <div class="avatar-large">{{ currentProfile().avatar }}</div>
                <div class="showcase-user-details">
                  <h3>{{ currentProfile().name }}</h3>
                  <p class="user-role">{{ currentProfile().role }}</p>
                  <div class="verified-seal">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="seal-icon">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Verified Capabilities</span>
                  </div>
                </div>
              </div>

              <!-- Metrics Row (Coverage, Assessment, Competency) -->
              <div class="showcase-metrics-grid">
                <div class="metric-block">
                  <div class="metric-gauge">
                    <svg viewBox="0 0 36 36" class="gauge-svg">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" stroke-width="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--primary-accent)" stroke-width="3" 
                              [attr.stroke-dasharray]="currentProfile().coverage + ', 100'" stroke-linecap="round" />
                    </svg>
                    <span class="gauge-txt">{{ currentProfile().coverage }}%</span>
                  </div>
                  <span class="metric-lbl">Skill Coverage</span>
                </div>

                <div class="metric-block">
                  <div class="metric-gauge">
                    <svg viewBox="0 0 36 36" class="gauge-svg">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" stroke-width="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--secondary-light)" stroke-width="3" 
                              [attr.stroke-dasharray]="currentProfile().assessment + ', 100'" stroke-linecap="round" />
                    </svg>
                    <span class="gauge-txt">{{ currentProfile().assessment }}%</span>
                  </div>
                  <span class="metric-lbl">Assessment Score</span>
                </div>

                <div class="metric-block">
                  <div class="metric-gauge">
                    <svg viewBox="0 0 36 36" class="gauge-svg">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" stroke-width="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#a855f7" stroke-width="3" 
                              [attr.stroke-dasharray]="currentProfile().competency + ', 100'" stroke-linecap="round" />
                    </svg>
                    <span class="gauge-txt">{{ currentProfile().competency }}%</span>
                  </div>
                  <span class="metric-lbl">Competency Score</span>
                </div>
              </div>

              <!-- Skills breakdown -->
              <div class="showcase-skills">
                <h4>Primary Competency Breakdown</h4>
                <div class="skills-bars-container">
                  @for (skill of currentProfile().skills; track skill.name) {
                    <div class="skill-bar-row">
                      <div class="skill-meta">
                        <span class="skill-name">{{ skill.name }}</span>
                        <span class="skill-rating">{{ skill.rating }}/10</span>
                      </div>
                      <div class="skill-track-bg">
                        <div class="skill-track-fill" [style.width]="skill.pct + '%'"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class SkillsIntelligenceSectionComponent {
  rolesList = ['Backend Engineer', 'Frontend Engineer', 'Cloud Architect'];
  selectedRoleIdx = signal(0);

  profilesData: ProfileDataset[] = [
    {
      role: 'Backend Developer',
      name: 'John Smith',
      avatar: 'JS',
      coverage: 87,
      assessment: 87,
      competency: 82,
      skills: [
        { name: 'Java', rating: 8, pct: 80 },
        { name: 'Spring Boot', rating: 7, pct: 70 },
        { name: 'AWS Cloud', rating: 6, pct: 60 }
      ]
    },
    {
      role: 'Frontend Developer',
      name: 'Sarah Jenkins',
      avatar: 'SJ',
      coverage: 92,
      assessment: 94,
      competency: 90,
      skills: [
        { name: 'Angular 20 / TypeScript', rating: 9, pct: 90 },
        { name: 'CSS Grid & Flexbox', rating: 9, pct: 90 },
        { name: 'RxJS & State Signals', rating: 8, pct: 80 }
      ]
    },
    {
      role: 'Cloud Solutions Architect',
      name: 'Marcus Vance',
      avatar: 'MV',
      coverage: 84,
      assessment: 88,
      competency: 85,
      skills: [
        { name: 'Terraform & IaC', rating: 8, pct: 80 },
        { name: 'Docker / Kubernetes', rating: 9, pct: 90 },
        { name: 'AWS Services Suite', rating: 8, pct: 80 }
      ]
    }
  ];

  currentProfile() {
    return this.profilesData[this.selectedRoleIdx()];
  }
}
