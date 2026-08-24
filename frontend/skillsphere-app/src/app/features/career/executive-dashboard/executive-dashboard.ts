import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CareerService } from '../career.service';
import { AuthService } from '../../../core/auth.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    StatCardComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Career &amp; Analytics Dashboard" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Aggregating platform career analytics...</p>
            </div>
          } @else {
            <div class="dashboard-sections animate-fade-in">
              <!-- Stats Cards Row -->
              <div class="stats-grid">
                <app-stat-card 
                  title="Total Career Blueprints" 
                  [value]="stats()?.totalCareerPlans || 0" 
                  icon="users"
                />
                <app-stat-card 
                  title="Promotion Ready Employees" 
                  [value]="stats()?.promotionReadyEmployees || 0" 
                  icon="award"
                  [trend]="stats()?.promotionReadyPercentage + '% of total'"
                />
                <app-stat-card 
                  title="Average Skill Coverage" 
                  [value]="(stats()?.averageSkillCoverage || 0) + '%'" 
                  icon="activity"
                />
                <app-stat-card 
                  title="Active Internal Applications" 
                  [value]="stats()?.internalApplicationsCount || 0" 
                  icon="users"
                />
              </div>

              <!-- Reports & Export Options Panel -->
              <div class="export-banner-card">
                <div class="export-text">
                  <h3>Executive Reports &amp; Intelligence</h3>
                  <p>Download structured PDF summaries and CSV worksheets of company career plans, promotion readys, and internal job portals.</p>
                </div>
                <div class="export-actions-grid">
                  <div class="export-btn-group">
                    <span class="export-label">Career Plans</span>
                    <button class="btn btn-secondary btn-sm" (click)="downloadReport('plans', 'PDF')">Export PDF</button>
                    <button class="btn btn-secondary btn-sm" (click)="downloadReport('plans', 'CSV')">Export Excel/CSV</button>
                  </div>
                  <div class="export-btn-group">
                    <span class="export-label">Job Applications</span>
                    <button class="btn btn-secondary btn-sm" (click)="downloadReport('applications', 'PDF')">Export PDF</button>
                    <button class="btn btn-secondary btn-sm" (click)="downloadReport('applications', 'CSV')">Export Excel/CSV</button>
                  </div>
                </div>
              </div>

              <!-- Charts Grid -->
              <div class="charts-row">
                <!-- Bar Chart: Department Skill Gaps -->
                <div class="chart-card">
                  <h3>Average Skill Gap % by Department</h3>
                  <div class="chart-container-svg">
                    <svg viewBox="0 0 400 220" class="chart-svg">
                      <!-- Grid lines -->
                      <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border-color)" stroke-width="0.5" />
                      
                      <!-- Bars -->
                      @for (gap of getDeptGapsArray(); track gap.key; let idx = $index) {
                        <!-- Bar -->
                        <rect 
                          [attr.x]="60 + (idx * 110)" 
                          [attr.y]="170 - (gap.value * 1.5)" 
                          width="50" 
                          [attr.height]="gap.value * 1.5" 
                          fill="url(#barGradient)" 
                          rx="4"
                        />
                        
                        <!-- Value label -->
                        <text 
                          [attr.x]="85 + (idx * 110)" 
                          [attr.y]="160 - (gap.value * 1.5)" 
                          text-anchor="middle" 
                          fill="var(--text-primary)" 
                          font-size="11" 
                          font-weight="700"
                        >
                          {{ gap.value }}%
                        </text>
                        
                        <!-- Name label -->
                        <text 
                          [attr.x]="85 + (idx * 110)" 
                          y="190" 
                          text-anchor="middle" 
                          fill="var(--text-secondary)" 
                          font-size="11" 
                          font-weight="600"
                        >
                          {{ gap.key }}
                        </text>
                      }
                      
                      <!-- Bottom border -->
                      <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border-color)" stroke-width="1.5" />
                      
                      <!-- Gradients -->
                      <defs>
                        <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stop-color="rgba(234, 88, 12, 0.2)" />
                          <stop offset="100%" stop-color="var(--primary-accent)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <!-- Line Chart: Promotion Readiness Trend -->
                <div class="chart-card">
                  <h3>Promotion Readiness Trend</h3>
                  <div class="chart-container-svg">
                    <svg viewBox="0 0 400 220" class="chart-svg">
                      <!-- Grid lines -->
                      <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border-color)" stroke-width="0.5" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border-color)" stroke-width="0.5" />

                      <!-- Trend Line Path -->
                      <path 
                        [attr.d]="getTrendLinePath()" 
                        fill="none" 
                        stroke="var(--status-success)" 
                        stroke-width="3"
                        stroke-linecap="round"
                        filter="url(#glow)"
                      />

                      <!-- Dots on line -->
                      @for (p of stats()?.promotionTrends; track p.month; let idx = $index) {
                        <circle 
                          [attr.cx]="50 + (idx * 60)" 
                          [attr.cy]="170 - (p.readyCount * 25)" 
                          r="5" 
                          fill="var(--status-success)"
                          stroke="var(--bg-card)"
                          stroke-width="1.5"
                        />
                        <text 
                          [attr.x]="50 + (idx * 60)" 
                          [attr.y]="155 - (p.readyCount * 25)" 
                          text-anchor="middle" 
                          fill="var(--text-primary)" 
                          font-size="10" 
                          font-weight="700"
                        >
                          {{ p.readyCount }}
                        </text>
                        <text 
                          [attr.x]="50 + (idx * 60)" 
                          y="190" 
                          text-anchor="middle" 
                          fill="var(--text-secondary)" 
                          font-size="10" 
                          font-weight="600"
                        >
                          {{ p.month }}
                        </text>
                      }

                      <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="var(--status-success)" flood-opacity="0.3" />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Top Roles & Popular Recommendations -->
              <div class="details-row">
                <!-- Top Target Roles -->
                <div class="details-card">
                  <h3>Top Career Target Roles</h3>
                  <div class="goals-list">
                    @for (goal of stats()?.topCareerGoals; track goal; let idx = $index) {
                      <div class="goal-item">
                        <span class="goal-number">#{{ idx + 1 }}</span>
                        <span class="goal-name">{{ goal }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Popular course recommendations -->
                <div class="details-card">
                  <h3>Top Recommended Courses</h3>
                  <div class="course-recs-list">
                    @for (item of getTopCoursesArray(); track item.key) {
                      <div class="course-rec-row">
                        <span class="course-title">{{ item.key }}</span>
                        <span class="rec-count-badge">{{ item.value }} recommendations</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-sections {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .export-banner-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .export-text {
      flex: 1;
      min-width: 300px;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--text-primary); margin-bottom: 4px; }
      p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    }

    .export-actions-grid {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .export-btn-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .export-label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--text-muted);
        font-weight: 700;
      }
      
      .btn {
        font-size: 11px;
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .chart-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 16px; color: var(--text-primary); margin-bottom: 16px; }
    }

    .chart-container-svg {
      width: 100%;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .details-row {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 20px;
    }

    .details-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 16px; color: var(--text-primary); margin-bottom: 16px; }
    }

    .goals-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .goal-item {
      display: flex;
      align-items: center;
      gap: 16px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
    }

    .goal-number {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-accent);
    }

    .goal-name {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .course-recs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .course-rec-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
    }

    .course-title {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .rec-count-badge {
      font-size: 11px;
      background-color: rgba(234, 88, 12, 0.15);
      color: var(--primary-accent);
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(234, 88, 12, 0.2);
    }

    .highlight-orange { color: var(--primary-accent); }

    @media (max-width: 992px) {
      .charts-row, .details-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ExecutiveDashboardComponent implements OnInit {
  private readonly careerService = inject(CareerService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(true);
  readonly stats = signal<any | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.careerService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching dashboard stats', err);
        this.loading.set(false);
      }
    });
  }

  getDeptGapsArray() {
    const s = this.stats();
    if (!s || !s.departmentSkillGaps) return [];
    return Object.keys(s.departmentSkillGaps).map(key => ({
      key,
      value: s.departmentSkillGaps[key]
    }));
  }

  getTopCoursesArray() {
    const s = this.stats();
    if (!s || !s.topRecommendedCourses) return [];
    return Object.keys(s.topRecommendedCourses).map(key => ({
      key,
      value: s.topRecommendedCourses[key]
    }));
  }

  getTrendLinePath(): string {
    const s = this.stats();
    if (!s || !s.promotionTrends || s.promotionTrends.length === 0) return '';
    // Generate coordinate pairs based on trends array index
    // e.g. Feb=1 -> y=145, Mar=2 -> y=120
    const points = s.promotionTrends.map((p: any, idx: number) => {
      const x = 50 + (idx * 60);
      const y = 170 - (p.readyCount * 25);
      return `${x},${y}`;
    });
    return 'M' + points.join(' L');
  }

  downloadReport(type: string, format: string) {
    this.careerService.exportReport(type, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type.toUpperCase()}_Report.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Success', `Report downloaded successfully in ${format} format.`);
      },
      error: () => this.notificationService.error('Error', 'Failed to export report.')
    });
  }
}
