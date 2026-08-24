import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Persona {
  id: 'employees' | 'hr' | 'leaders';
  tabTitle: string;
  title: string;
  subtitle: string;
  benefits: string[];
  mockTitle: string;
  mockItems: { label: string; value: string; color: string }[];
}

@Component({
  selector: 'app-role-value-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="role-value-section" id="roles">
      <div class="container">
        <div class="section-header-centered animate-on-scroll">
          <span class="section-tag">Value Proposition</span>
          <h2 class="section-title-lg">Tailored value for every role.</h2>
          <p class="section-subtitle">
            Whether you are a developer growing your skills, an HR manager tracking compliance, or an executive leader mapping capacity, Enterprise Learning Platform with Skill and Career Guidance System is customized for your objectives.
          </p>
        </div>

        <div class="persona-tabs-container animate-on-scroll">
          <!-- Switcher Buttons -->
          <div class="persona-buttons-row">
            @for (persona of personas; track persona.id; let idx = $index) {
              <button 
                class="persona-btn" 
                [class.active]="selectedIdx() === idx"
                (click)="selectedIdx.set(idx)"
              >
                {{ persona.tabTitle }}
              </button>
            }
          </div>

          <!-- Persona Details Layout -->
          <div class="persona-details-grid">
            <!-- Left: Value Points -->
            <div class="persona-copy-col">
              <h3>{{ activePersona().title }}</h3>
              <p class="persona-sub">{{ activePersona().subtitle }}</p>
              
              <ul class="persona-benefits-list">
                @for (benefit of activePersona().benefits; track benefit) {
                  <li class="benefit-item">
                    <span class="check-icon">✓</span>
                    <span>{{ benefit }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Right: Tailored Dashboard Widget Mockup -->
            <div class="persona-mockup-col">
              <div class="mockup-frame">
                <div class="mockup-header-row">
                  <span class="mockup-dot red"></span>
                  <span class="mockup-dot yellow"></span>
                  <span class="mockup-dot green"></span>
                  <span class="mockup-title-bar">{{ activePersona().mockTitle }}</span>
                </div>
                
                <div class="mockup-body">
                  @if (activePersona().id === 'employees') {
                    <!-- Employee Preview Widget -->
                    <div class="employee-mockup-details">
                      <div class="user-strip">
                        <div class="u-avatar">JS</div>
                        <div>
                          <h5>John Smith</h5>
                          <span>Developer</span>
                        </div>
                      </div>
                      <div class="skill-meter-rows">
                        <div class="sm-item">
                          <span>Java Core</span>
                          <div class="m-track"><div class="m-fill bg-orange" style="width: 80%"></div></div>
                        </div>
                        <div class="sm-item">
                          <span>Spring Framework</span>
                          <div class="m-track"><div class="m-fill bg-cyan" style="width: 70%"></div></div>
                        </div>
                        <div class="sm-item">
                          <span>Target Ready (Tech Lead)</span>
                          <div class="m-track"><div class="m-fill bg-purple" style="width: 67%"></div></div>
                        </div>
                      </div>
                    </div>
                  } @else if (activePersona().id === 'hr') {
                    <!-- HR Preview Widget -->
                    <div class="hr-mockup-details">
                      <div class="hr-header-stat">
                        <span class="metric-val text-green">94.2%</span>
                        <span class="metric-lbl">Total Compliance Rate</span>
                      </div>
                      
                      <div class="alert-strip text-yellow">
                        <span class="icon">⚠️</span>
                        <span>12 Certifications expiring in 30 days</span>
                      </div>
                      
                      <div class="action-logs">
                        <div class="log-item">
                          <span class="log-dot bg-green"></span>
                          <span>Auto-renewal triggered for 4 AWS certs</span>
                        </div>
                        <div class="log-item">
                          <span class="log-dot bg-blue"></span>
                          <span>Audit report generated for compliance team</span>
                        </div>
                      </div>
                    </div>
                  } @else if (activePersona().id === 'leaders') {
                    <!-- Leaders Preview Widget -->
                    <div class="leaders-mockup-details">
                      <div class="workforce-readiness-row">
                        <h5>Readiness Map</h5>
                        <span>Quarterly target Q3</span>
                      </div>
                      
                      <div class="readiness-bars">
                        <div class="r-bar-item">
                          <div class="r-lbl">Cloud Migration Project Team</div>
                          <div class="r-track-bg">
                            <div class="r-track-fill bg-green" style="width: 95%"></div>
                          </div>
                          <span class="r-pct">95% Ready</span>
                        </div>

                        <div class="r-bar-item">
                          <div class="r-lbl">GenAI Implementation Group</div>
                          <div class="r-track-bg">
                            <div class="r-track-fill bg-yellow" style="width: 62%"></div>
                          </div>
                          <span class="r-pct">62% Ready</span>
                        </div>
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
export class RoleValueSectionComponent {
  selectedIdx = signal(0);

  personas: Persona[] = [
    {
      id: 'employees',
      tabTitle: 'For Employees',
      title: 'Accelerate your professional growth.',
      subtitle: 'Take ownership of your career trajectory with data-driven recommendations tailored to your goals.',
      benefits: [
        'Understand your skills through peer and manager assessments.',
        'Discover skill gaps between your current role and your target position.',
        'Follow personalized learning paths automatically mapped to milestones.',
        'Track valid certifications and prepare for upcoming expirations.',
        'Build a transparent, verified career roadmap for promotions.'
      ],
      mockTitle: 'Employee Center — Enterprise Learning Platform',
      mockItems: []
    },
    {
      id: 'hr',
      tabTitle: 'For HR Managers',
      title: 'Simplify tracking and compliance.',
      subtitle: 'Eliminate manual spreadsheets. Maintain continuous organizational readiness and credential tracking.',
      benefits: [
        'Manage employee skill inventories and competency models in one hub.',
        'Track developer assessments and approve verification workflows.',
        'Monitor active, expiring, and renewal-pending certifications.',
        'Locate critical skill gaps preventing key project assignments.',
        'Automate compliance audit reports for SOC2 or ISO requirements.'
      ],
      mockTitle: 'HR Compliance Console — Enterprise Learning Platform',
      mockItems: []
    },
    {
      id: 'leaders',
      tabTitle: 'For Executives & Leaders',
      title: 'Map capabilities to execution.',
      subtitle: 'Get high-level organizational intelligence to guide business-critical decisions.',
      benefits: [
        'Understand overall workforce capabilities at a glance.',
        'Identify expertise gaps and missing skill clusters before they trigger hiring.',
        'Track training ROI and department competency development rates.',
        'Deploy the right people to client assignments based on verified skills.',
        'Ensure continuous innovation capacity for future milestones.'
      ],
      mockTitle: 'Executive Intelligence Matrix — Enterprise Learning Platform',
      mockItems: []
    }
  ];

  activePersona() {
    return this.personas[this.selectedIdx()];
  }
}
