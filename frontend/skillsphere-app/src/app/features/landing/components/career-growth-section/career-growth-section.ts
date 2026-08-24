import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CareerMilestone {
  title: string;
  progress: number;
  skillsCompleted: number;
  gapsRemaining: number;
  learningProgress: number;
  certificationsActive: number;
  requiredSkills: string[];
  recommendedLearning: string;
  status: 'CURRENT' | 'IN_PROGRESS' | 'FUTURE';
}

@Component({
  selector: 'app-career-growth-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="career-growth-section" id="career">
      <div class="container">
        <div class="career-grid">
          <!-- Left: Interactive visual career roadmap -->
          <div class="career-visual animate-on-scroll">
            <div class="roadmap-card-wrapper">
              <div class="roadmap-header">
                <span class="pulsing-radar"></span>
                <span>Active Career Blueprint</span>
              </div>

              <!-- Roadmap path milestones -->
              <div class="roadmap-milestones">
                @for (m of milestones; track m.title; let idx = $index) {
                  <div 
                    class="roadmap-step" 
                    [class.active-step]="selectedMilestoneIdx() === idx"
                    [class.current-step]="m.status === 'CURRENT'"
                    (click)="selectedMilestoneIdx.set(idx)"
                  >
                    <div class="step-indicator">
                      @if (m.status === 'CURRENT') {
                        <span class="step-dot-fill current-dot"></span>
                      } @else if (idx < selectedMilestoneIdx()) {
                        <span class="step-dot-fill completed-dot">✓</span>
                      } @else {
                        <span class="step-dot-fill future-dot"></span>
                      }
                    </div>
                    <div class="step-details-summary">
                      <h4>{{ m.title }}</h4>
                      <span class="step-badge" [ngClass]="statusClass(m.status)">
                        {{ m.status }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Details of selected milestone -->
              <div class="milestone-blueprint-details animate-fade-in">
                <div class="bp-progress-row">
                  <span class="bp-lbl">Overall Readiness</span>
                  <span class="bp-val">{{ currentMilestone().progress }}%</span>
                </div>
                <div class="bp-bar-bg"><div class="bp-bar-fill" [style.width]="currentMilestone().progress + '%'"></div></div>

                <div class="bp-stats-grid">
                  <div class="bp-stat">
                    <span class="v">{{ currentMilestone().skillsCompleted }}</span>
                    <span class="l">Skills Completed</span>
                  </div>
                  <div class="bp-stat">
                    <span class="v" [class.red-val]="currentMilestone().gapsRemaining > 0">{{ currentMilestone().gapsRemaining }}</span>
                    <span class="l">Skills Gaps</span>
                  </div>
                  <div class="bp-stat">
                    <span class="v">{{ currentMilestone().learningProgress }}%</span>
                    <span class="l">Learning Path</span>
                  </div>
                  <div class="bp-stat">
                    <span class="v">{{ currentMilestone().certificationsActive }}</span>
                    <span class="l">Active Certs</span>
                  </div>
                </div>

                <div class="bp-list-details">
                  <div class="bp-list-col">
                    <h5>Key Skill Targets</h5>
                    <ul class="bp-bullets">
                      @for (s of currentMilestone().requiredSkills; track s) {
                        <li>• {{ s }}</li>
                      }
                    </ul>
                  </div>
                  
                  <div class="bp-list-col">
                    <h5>Recommended Bridge</h5>
                    <p class="bridge-txt">{{ currentMilestone().recommendedLearning }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Description -->
          <div class="career-content animate-on-scroll">
            <span class="section-tag">Career Acceleration</span>
            <h2 class="section-title">Support transparent career growth.</h2>
            <p class="section-desc">
              Retain top talent by establishing transparent promotion pathways. Enterprise Learning Platform with Skill and Career Guidance System allows managers to define clear skill benchmarks for every seniority level, and maps individual developer journeys directly to them.
            </p>

            <div class="career-features">
              <div class="cf-item">
                <div class="cf-icon">✓</div>
                <div>
                  <h4>No more mystery promotions</h4>
                  <p>Employees know exactly what skills they need to demonstrate and what learning to complete to qualify for the next rank.</p>
                </div>
              </div>

              <div class="cf-item">
                <div class="cf-icon">✓</div>
                <div>
                  <h4>Democratized Mentorship</h4>
                  <p>Automatically match aspiring Tech Leads with mentors who already hold the target skill levels.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CareerGrowthSectionComponent {
  selectedMilestoneIdx = signal(1);

  milestones: CareerMilestone[] = [
    {
      title: 'Developer',
      progress: 100,
      skillsCompleted: 12,
      gapsRemaining: 0,
      learningProgress: 100,
      certificationsActive: 2,
      requiredSkills: ['Java Fundamentals', 'Spring Boot Core', 'Git Basics'],
      recommendedLearning: 'Developer foundation pathway fully completed.',
      status: 'CURRENT'
    },
    {
      title: 'Senior Developer',
      progress: 67,
      skillsCompleted: 8,
      gapsRemaining: 3,
      learningProgress: 67,
      certificationsActive: 4,
      requiredSkills: ['Microservices Design', 'RxJS Signals', 'AWS Architecture', 'SQL Performance'],
      recommendedLearning: 'Spring Boot Microservices & JWT Security Modules',
      status: 'IN_PROGRESS'
    },
    {
      title: 'Tech Lead',
      progress: 25,
      skillsCompleted: 3,
      gapsRemaining: 7,
      learningProgress: 12,
      certificationsActive: 1,
      requiredSkills: ['Engineering Leadership', 'Advanced System Design', 'DevOps Automations', 'Enterprise Compliance'],
      recommendedLearning: 'Leadership Mentorship & System Architecture Pathways',
      status: 'FUTURE'
    }
  ];

  currentMilestone = computed(() => this.milestones[this.selectedMilestoneIdx()]);

  statusClass(status: string) {
    if (status === 'CURRENT') return 'badge-current';
    if (status === 'IN_PROGRESS') return 'badge-progress';
    return 'badge-future';
  }
}
