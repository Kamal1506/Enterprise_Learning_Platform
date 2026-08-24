import { Component, OnInit, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DepartmentData {
  name: string;
  employees: number;
  skillsCount: number;
  coverage: number;
  growth: string;
}

@Component({
  selector: 'app-hr-leaders-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hr-leaders-section" id="organizations">
      <div class="container">
        <div class="section-header-centered animate-on-scroll">
          <span class="section-tag">Enterprise Analytics</span>
          <h2 class="section-title-lg">See the capabilities of your entire organization.</h2>
          <p class="section-subtitle">
            Gain full visibility into aggregate skill matrices, department comparisons, and credential health. Make data-driven hiring and workforce allocation decisions.
          </p>
        </div>

        <!-- Metric counter cards -->
        <div class="analytics-metrics-grid">
          <div class="stat-card animate-on-scroll">
            <span class="stat-lbl">Total Employees</span>
            <div class="stat-num">{{ activeEmployees() }}</div>
            <div class="stat-trend trend-up">
              <span>+8.2% YoY</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trend-icon">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>

          <div class="stat-card animate-on-scroll">
            <span class="stat-lbl">Skills Tracked</span>
            <div class="stat-num">{{ activeSkills() }}</div>
            <div class="stat-trend trend-up">
              <span>+14.2% YoY</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trend-icon">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>

          <div class="stat-card animate-on-scroll">
            <span class="stat-lbl">Active Certifications</span>
            <div class="stat-num">{{ activeCerts() }}</div>
            <div class="stat-trend trend-neutral">
              <span>Stable</span>
            </div>
          </div>

          <div class="stat-card animate-on-scroll">
            <span class="stat-lbl">Skill Coverage</span>
            <div class="stat-num">{{ activeCoverage() }}%</div>
            <div class="stat-trend trend-up">
              <span>+5.1% QoQ</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trend-icon">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Department capability table and comparison graph -->
        <div class="analytics-detail-grid">
          <!-- Left: Department comparison list -->
          <div class="dept-comparison-panel animate-on-scroll">
            <h3>Department Breakdown</h3>
            <div class="dept-table-wrapper">
              <table class="dept-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Skills Tracked</th>
                    <th>Skill Coverage</th>
                    <th class="text-right">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  @for (dept of departments; track dept.name) {
                    <tr>
                      <td class="dept-name">{{ dept.name }}</td>
                      <td>{{ dept.employees }}</td>
                      <td>{{ dept.skillsCount }}</td>
                      <td>
                        <div class="table-coverage-row">
                          <span class="cov-pct">{{ dept.coverage }}%</span>
                          <div class="t-cov-bar"><div class="t-cov-fill" [style.width]="dept.coverage + '%'"></div></div>
                        </div>
                      </td>
                      <td class="text-right dept-growth">{{ dept.growth }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right: Visual skill taxonomy distribution map -->
          <div class="taxonomy-distribution animate-on-scroll">
            <h3>Workforce Competency Distribution</h3>
            <p class="taxonomy-subtitle">Top 5 active skills sectors across all active employees</p>
            
            <div class="distribution-bars">
              <div class="dist-item">
                <div class="dist-lbl-row">
                  <span>Backend Development (Java/Spring Boot)</span>
                  <span>42% of workforce</span>
                </div>
                <div class="dist-bar"><div class="dist-fill bar-backend" style="width: 84%"></div></div>
              </div>

              <div class="dist-item">
                <div class="dist-lbl-row">
                  <span>Frontend Engineering (Angular/React)</span>
                  <span>28% of workforce</span>
                </div>
                <div class="dist-bar"><div class="dist-fill bar-frontend" style="width: 56%"></div></div>
              </div>

              <div class="dist-item">
                <div class="dist-lbl-row">
                  <span>Cloud Infrastructure & Security (AWS/GCP)</span>
                  <span>18% of workforce</span>
                </div>
                <div class="dist-bar"><div class="dist-fill bar-cloud" style="width: 36%"></div></div>
              </div>

              <div class="dist-item">
                <div class="dist-lbl-row">
                  <span>Data Engineering & AI Models (SQL/Python)</span>
                  <span>9% of workforce</span>
                </div>
                <div class="dist-bar"><div class="dist-fill bar-data" style="width: 18%"></div></div>
              </div>

              <div class="dist-item">
                <div class="dist-lbl-row">
                  <span>Product Management & QA Automation</span>
                  <span>3% of workforce</span>
                </div>
                <div class="dist-bar"><div class="dist-fill bar-product" style="width: 6%"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HrLeadersSectionComponent implements OnInit {
  private readonly el = inject(ElementRef);

  activeEmployees = signal('0');
  activeSkills = signal('0');
  activeCerts = signal('0');
  activeCoverage = signal('0');

  departments: DepartmentData[] = [
    { name: 'Engineering', employees: 4200, skillsCount: 1420, coverage: 92, growth: '+12.4%' },
    { name: 'Product Management', employees: 850, skillsCount: 310, coverage: 87, growth: '+6.2%' },
    { name: 'Quality Assurance', employees: 1200, skillsCount: 410, coverage: 84, growth: '+4.1%' },
    { name: 'Cloud Operations', employees: 640, skillsCount: 220, coverage: 89, growth: '+8.9%' },
    { name: 'Data Architecture', orientation: 'vertical', employees: 1100, skillsCount: 487, coverage: 83, growth: '+11.2%' } as any
  ];

  ngOnInit() {
    this.runCounters();
  }

  runCounters() {
    // Simple mock counter animations
    setTimeout(() => {
      this.animateValue(0, 12400, 1500, (v) => this.activeEmployees.set(this.formatNumber(v)));
      this.animateValue(0, 2847, 1500, (v) => this.activeSkills.set(this.formatNumber(v)));
      this.animateValue(0, 8400, 1500, (v) => this.activeCerts.set(this.formatNumber(v)));
      this.animateValue(0, 87, 1500, (v) => this.activeCoverage.set(Math.floor(v).toString()));
    }, 200);
  }

  animateValue(start: number, end: number, duration: number, callback: (v: number) => void) {
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const value = start + (end - start) * (progress * (2 - progress));
      callback(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        callback(end);
      }
    };
    requestAnimationFrame(step);
  }

  formatNumber(num: number): string {
    const rounded = Math.floor(num);
    if (rounded >= 1000) {
      return (rounded / 1000).toFixed(1) + 'K';
    }
    return rounded.toString();
  }
}
