import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TransitionData {
  fromRole: string;
  toRole: string;
  gaps: { skill: string; gapAmount: string; current: number; target: number }[];
  recommendations: { title: string; duration: string; rating: string }[];
}

@Component({
  selector: 'app-skill-gaps-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="skill-gaps-section" id="gaps">
      <div class="container">
        <div class="gaps-grid">
          <!-- Left: Visual interactive simulation card -->
          <div class="gaps-visual animate-on-scroll">
            <div class="gap-card-wrapper">
              <!-- Simulator controls -->
              <div class="sim-header">
                <span class="pulse-indicator"></span>
                <span>Role Transition Simulator</span>
              </div>
              
              <div class="roles-flow">
                <div class="role-box">
                  <span class="role-lbl">Current Role</span>
                  <div class="role-title-box">{{ currentTransition().fromRole }}</div>
                </div>
                
                <div class="flow-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-svg">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>

                <div class="role-box">
                  <span class="role-lbl">Target Role</span>
                  <div class="role-title-box target-glow">{{ currentTransition().toRole }}</div>
                </div>
              </div>

              <!-- Computed Skill Gaps -->
              <div class="computed-gaps-list">
                <h4>Computed Skill Deficits</h4>
                @for (gap of currentTransition().gaps; track gap.skill) {
                  <div class="gap-item-row">
                    <div class="gap-meta">
                      <span class="gap-skill-name">{{ gap.skill }}</span>
                      <span class="gap-badge">Required: +{{ gap.gapAmount }}</span>
                    </div>
                    <div class="double-slider-track">
                      <!-- Current Level -->
                      <div class="slider-fill current-fill" [style.width]="(gap.current * 10) + '%'"></div>
                      <!-- Target Level -->
                      <div class="slider-fill target-fill" [style.width]="(gap.target * 10) + '%'"></div>
                    </div>
                    <div class="ticks-lbl">
                      <span>Current: {{ gap.current }}/10</span>
                      <span>Target: {{ gap.target }}/10</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Dynamic Course Recommendations -->
              <div class="recommended-courses">
                <h4>Recommended Course Bridge</h4>
                <div class="recs-grid">
                  @for (rec of currentTransition().recommendations; track rec.title) {
                    <div class="rec-course-card">
                      <div class="rec-course-meta">
                        <span class="rec-duration">{{ rec.duration }}</span>
                        <span class="rec-rating">★ {{ rec.rating }}</span>
                      </div>
                      <h5>{{ rec.title }}</h5>
                      <button class="btn btn-outline btn-xs">Auto-Enroll</button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Description -->
          <div class="gaps-content animate-on-scroll">
            <span class="section-tag">Gap Analysis</span>
            <h2 class="section-title">Discover skill gaps. Automate learning paths.</h2>
            <p class="section-desc">
              Enterprise Learning Platform with Skill and Career Guidance System calculates the exact distance between your employees' current profile and their next career milestone. It automatically bridges the gap by suggesting target learning modules and tracking completions.
            </p>

            <div class="transition-selectors-container">
              <p class="selector-heading">Simulate alternative growth paths:</p>
              <div class="path-buttons-list">
                @for (path of transitions; track path.toRole; let idx = $index) {
                  <button 
                    class="path-select-btn" 
                    [class.active]="selectedPathIdx() === idx"
                    (click)="selectedPathIdx.set(idx)"
                  >
                    {{ path.fromRole }} → {{ path.toRole }}
                  </button>
                }
              </div>
            </div>

            <div class="benefits-row-gaps">
              <div class="benefit-col">
                <h5>Target Alignment</h5>
                <p>Ensure every learning hour is aligned directly to a real business progression need.</p>
              </div>
              <div class="benefit-col">
                <h5>Proactive Hiring</h5>
                <p>Identify missing skill clusters before they trigger hiring cycles or delay launch dates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class SkillGapsSectionComponent {
  selectedPathIdx = signal(0);

  transitions: TransitionData[] = [
    {
      fromRole: 'Developer',
      toRole: 'Tech Lead',
      gaps: [
        { skill: 'Angular Web App', gapAmount: '3 Levels', current: 5, target: 8 },
        { skill: 'Leadership & Mentorship', gapAmount: '2 Levels', current: 4, target: 6 }
      ],
      recommendations: [
        { title: 'Angular Advanced Patterns', duration: '12 hrs', rating: '4.9' },
        { title: 'Engineering Leadership 101', duration: '8 hrs', rating: '4.8' }
      ]
    },
    {
      fromRole: 'Backend Engineer',
      toRole: 'Cloud Architect',
      gaps: [
        { skill: 'AWS Solution Architecture', gapAmount: '4 Levels', current: 4, target: 8 },
        { skill: 'Infrastructure as Code', gapAmount: '3 Levels', current: 3, target: 6 }
      ],
      recommendations: [
        { title: 'AWS Architect Associate Prep', duration: '24 hrs', rating: '4.9' },
        { title: 'Terraform Masterclass', duration: '10 hrs', rating: '4.7' }
      ]
    },
    {
      fromRole: 'Data Engineer',
      toRole: 'AI Engineer',
      gaps: [
        { skill: 'Deep Learning & PyTorch', gapAmount: '5 Levels', current: 3, target: 8 },
        { skill: 'LLM Fine-tuning', gapAmount: '4 Levels', current: 2, target: 6 }
      ],
      recommendations: [
        { title: 'Machine Learning Specialization', duration: '32 hrs', rating: '4.9' },
        { title: 'Prompting and Fine-tuning LLMs', duration: '14 hrs', rating: '4.8' }
      ]
    }
  ];

  currentTransition = computed(() => this.transitions[this.selectedPathIdx()]);
}
