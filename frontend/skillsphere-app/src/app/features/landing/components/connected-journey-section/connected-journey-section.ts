import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface JourneyStage {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  stat: string;
}

@Component({
  selector: 'app-connected-journey-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="connected-journey-section" id="journey">
      <div class="container">
        <div class="section-header-centered animate-on-scroll">
          <span class="section-tag">Platform Pipeline</span>
          <h2 class="section-title-lg">One Connected Workforce Journey</h2>
          <p class="section-subtitle">
            An integrated workflow that bridges the gap between hiring, skill development, compliance, and internal career mobility. Hover or click each stage to inspect the intelligence loop.
          </p>
        </div>

        <div class="journey-interactive-container">
          <!-- Interactive Node Pipeline -->
          <div class="pipeline-nodes-wrapper">
            <!-- Connecting SVG Lines -->
            <svg class="pipeline-svg-lines" viewBox="0 0 900 100" preserveAspectRatio="none">
              <!-- Background dim line -->
              <path d="M 50 50 L 850 50" stroke="#1f2937" stroke-width="4" />
              <!-- Highlighted glowing line up to the active index -->
              <path [attr.d]="glowingLinePath()" stroke="url(#glowingGradient)" stroke-width="4" class="glowing-pipeline" />
              
              <!-- Gradient definitions -->
              <defs>
                <linearGradient id="glowingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--primary-accent)" />
                  <stop offset="100%" stop-color="var(--secondary-light)" />
                </linearGradient>
              </defs>
            </svg>

            <!-- Nodes -->
            <div class="pipeline-nodes">
              @for (stage of stages; track stage.id; let idx = $index) {
                <div 
                  class="pipeline-node-item" 
                  [class.active]="activeIdx() === idx"
                  [class.completed]="idx < activeIdx()"
                  (mouseenter)="setActiveIndex(idx)"
                  (click)="setActiveIndex(idx)"
                >
                  <div class="node-circle" [style.border-color]="activeIdx() >= idx ? stage.color : '#1f2937'">
                    <span class="node-number">{{ idx + 1 }}</span>
                    <!-- Node Icon -->
                    <div class="node-icon-inner" [style.color]="stage.color">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-svg-icon">
                        <path [attr.d]="stage.icon"></path>
                      </svg>
                    </div>
                  </div>
                  <span class="node-label">{{ stage.shortLabel }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Central Details Board -->
          <div class="journey-details-board animate-fade-in" [style.border-top-color]="activeStage().color">
            <div class="board-header">
              <div class="board-badge" [style.background-color]="activeStage().color + '15'" [style.color]="activeStage().color">
                {{ activeStage().name }}
              </div>
              <span class="board-stat">{{ activeStage().stat }}</span>
            </div>
            
            <h3 class="board-title">Connecting {{ activeStage().name }} to the loop</h3>
            <p class="board-desc">{{ activeStage().description }}</p>
            
            <div class="board-visual-preview">
              @if (activeStage().id === 'employee') {
                <div class="preview-item">
                  <span class="preview-label">Active Users Tracked</span>
                  <div class="preview-metric">98.4% Engagement Rate</div>
                </div>
              } @else if (activeStage().id === 'skills') {
                <div class="preview-item">
                  <span class="preview-label">Core Skills Taxonomy</span>
                  <div class="preview-metric">2,847 skills classified</div>
                </div>
              } @else if (activeStage().id === 'assessments') {
                <div class="preview-item">
                  <span class="preview-label">Assessment Validity</span>
                  <div class="preview-metric">Verified by manager review</div>
                </div>
              } @else if (activeStage().id === 'learning') {
                <div class="preview-item">
                  <span class="preview-label">Course Completions</span>
                  <div class="preview-metric">87% completion rate</div>
                </div>
              } @else if (activeStage().id === 'certifications') {
                <div class="preview-item">
                  <span class="preview-label">Compliance Shield</span>
                  <div class="preview-metric">Automatic renewal alert workflows</div>
                </div>
              } @else if (activeStage().id === 'career') {
                <div class="preview-item">
                  <span class="preview-label">Career Progression</span>
                  <div class="preview-metric">Internal promotions matching gaps</div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ConnectedJourneySectionComponent {
  stages: JourneyStage[] = [
    {
      id: 'employee',
      name: 'Employee Core',
      shortLabel: 'Employee',
      description: 'Start with individual talents, profiles, role configurations, and professional development aspirations.',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      color: '#ff7f50',
      stat: 'Step 1'
    },
    {
      id: 'skills',
      name: 'Skills Inventory',
      shortLabel: 'Skills',
      description: 'Understand employee capabilities and inventory skills automatically, mapped against organizational architectures.',
      icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      color: '#ea580c',
      stat: 'Step 2'
    },
    {
      id: 'assessments',
      name: 'Skill Assessments',
      shortLabel: 'Assessments',
      description: 'Verify proficiency levels through structured peer reviews, developer assessments, and manager approvals.',
      icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
      color: '#a855f7',
      stat: 'Step 3'
    },
    {
      id: 'learning',
      name: 'Learning Paths',
      shortLabel: 'Learning',
      description: 'Build the skills needed for what comes next with curated course lists, learning pathways, and module tracking.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: '#06b6d4',
      stat: 'Step 4'
    },
    {
      id: 'certifications',
      name: 'Certifications',
      shortLabel: 'Certifications',
      description: 'Validate expertise, track renewal dates, issue verification links, and maintain compliance standards.',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      color: '#10b981',
      stat: 'Step 5'
    },
    {
      id: 'career',
      name: 'Career Growth',
      shortLabel: 'Career',
      description: 'Turn professional development into clear promotion pathways, leadership benchmarks, and organizational readiness.',
      icon: 'M13 17h8m-8-5h8m-8-5h8M3 17h.01M3 12h.01M3 7h.01',
      color: '#3b82f6',
      stat: 'Step 6'
    }
  ];

  activeIdx = signal(0);

  activeStage() {
    return this.stages[this.activeIdx()];
  }

  setActiveIndex(idx: number) {
    this.activeIdx.set(idx);
  }

  glowingLinePath() {
    // Generate the path to draw based on current index
    // Max width 900
    const segmentWidth = 800 / 5;
    const currentPos = 50 + (this.activeIdx() * segmentWidth);
    return `M 50 50 L ${currentPos} 50`;
  }
}
