import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LearningService, Enrollment, LearningStats } from '../learning.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';

@Component({
  selector: 'app-learning-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Learning Dashboard" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Statistics Neon Counter Cards -->
          <div class="stats-row animate-fade-in">
            <div class="stat-card blue-glow">
              <div class="stat-icon-wrapper blue-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </div>
              <div class="stat-data">
                <span class="stat-num">{{ stats().activeEnrollmentsCount }}</span>
                <span class="stat-label">Active Enrollments</span>
              </div>
            </div>

            <div class="stat-card green-glow">
              <div class="stat-icon-wrapper green-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="stat-data">
                <span class="stat-num">{{ stats().completedCoursesCount }}</span>
                <span class="stat-label">Courses Completed</span>
              </div>
            </div>

            <div class="stat-card purple-glow">
              <div class="stat-icon-wrapper purple-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              </div>
              <div class="stat-data">
                <span class="stat-num">{{ stats().completedLearningPathsCount }}</span>
                <span class="stat-label">Paths Mapped</span>
              </div>
            </div>
          </div>

          <!-- Main Splits Layout -->
          <div class="dashboard-split mt-24 animate-fade-in" style="animation-delay: 0.1s">
            <!-- Left Side: Active Enrollments -->
            <div class="split-left">
              <div class="section-card">
                <h2>Registered Curriculums</h2>
                
                @if (loading()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading active enrollments...</p>
                  </div>
                } @else if (activeEnrollments().length === 0) {
                  <div class="empty-state-inner">
                    <p>You have no active enrollments right now. Explore the course list to enroll!</p>
                    <a routerLink="/learning/courses" class="btn btn-primary mt-12 btn-sm">Browse Catalog</a>
                  </div>
                } @else {
                  <div class="enrollment-list">
                    @for (e of activeEnrollments(); track e.id) {
                      <div class="enrollment-card">
                        <div class="enrollment-header">
                          <div>
                            <span class="badge-type" [class]="e.courseId ? 'course' : 'path'">
                              {{ e.courseId ? 'COURSE' : 'LEARNING PATH' }}
                            </span>
                            <h3>
                              @if (e.courseId) {
                                <a [routerLink]="['/learning/courses', e.courseId]" style="color: var(--primary-light); text-decoration: underline; font-weight: 600;">
                                  {{ e.courseTitle }}
                                </a>
                              } @else {
                                {{ e.learningPathTitle }}
                              }
                            </h3>
                          </div>
                          <span class="enrolled-date">Enrolled {{ e.enrolledAt | date:'mediumDate' }}</span>
                        </div>

                        @if (e.learningSourceUrl) {
                          <div style="margin-top: 10px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; font-size: 13px; background: rgba(234, 88, 12, 0.08); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(234, 88, 12, 0.15); width: fit-content;">
                            <span style="color: var(--primary-accent); display: inline-flex; align-items: center;">
                              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            </span>
                            <span style="color: var(--text-secondary);">Course Material:</span>
                            <a [href]="e.learningSourceUrl" target="_blank" style="color: var(--primary-light); font-weight: 600; text-decoration: underline;">
                              Go to study source
                            </a>
                          </div>
                        }

                        @if (e.progressPercent === 100 && e.status !== 'COMPLETED' && e.courseId) {
                          <div class="quiz-notice-box animate-scale-in" style="margin-top: 10px; margin-bottom: 14px; background: linear-gradient(135deg, rgba(234,88,12,0.1), rgba(234,88,12,0.05)); border: 1px solid var(--primary-accent); padding: 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <span style="color: var(--primary-accent); display: inline-flex; align-items: center;">
                                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              </span>
                              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Course Assessment Required</span>
                            </div>
                            <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
                              To complete this course and request certification, you must pass the course assessment quiz.
                            </p>
                            <a [routerLink]="['/learning/courses', e.courseId]" class="btn btn-primary btn-sm" style="width: fit-content; margin-top: 6px;">
                              Go to Quiz Classroom
                            </a>
                          </div>
                        }

                        <!-- Progress slider tracker -->
                        <div class="progress-tracker">
                          <div class="slider-header">
                            <span class="progress-lbl">Academic Progress:</span>
                            <span class="progress-pct">{{ sliderValues[e.id] }}%</span>
                          </div>
                          
                          <div class="slider-row">
                            <input 
                              type="range" 
                              class="progress-slider" 
                              min="0" 
                              max="100" 
                              step="5"
                              [(ngModel)]="sliderValues[e.id]"
                            />
                            <button 
                              class="btn btn-secondary btn-xs" 
                              (click)="saveProgress(e.id, sliderValues[e.id])"
                            >Save</button>
                          </div>

                          <div class="progress-bar-bg">
                            <div class="progress-bar-fill" [style.width.%]="e.progressPercent"></div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Right Side: Fast Navigation and Finished completions -->
            <div class="split-right">
              <!-- Explorer Navigation Card -->
              <div class="section-card explore-card">
                <h3>Curriculum Operations</h3>
                <p class="explore-p">Select a pathway or course to mapping additional competencies.</p>
                <div class="actions-stack">
                  <a routerLink="/learning/courses" class="explore-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Explore All Courses
                  </a>
                  <a routerLink="/learning/paths" class="explore-btn mt-8">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>
                    Curated Learning Paths
                  </a>
                </div>
              </div>

              <!-- Finished completions Card -->
              <div class="section-card mt-24">
                <h3>Completed Achievements</h3>
                @if (completedEnrollments().length === 0) {
                  <div class="empty-state-inner dashed-border">
                    <p>No completions logged on file yet. Keep studying!</p>
                  </div>
                } @else {
                  <div class="completions-list">
                    @for (ce of completedEnrollments(); track ce.id) {
                      <div class="completion-item">
                        <div class="completion-meta">
                          <span class="checked-circle">✓</span>
                          <div>
                            <span class="completion-title">{{ ce.courseTitle || ce.learningPathTitle }}</span>
                            <span class="completion-date">Finished {{ ce.completedAt | date:'mediumDate' }}</span>
                          </div>
                        </div>
                        <span class="completion-status-badge">Completed</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .content-wrapper {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-main);
      overflow-x: hidden;
    }
    .main-content {
      padding: 32px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    /* Stats Neon Counters */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    .stat-card {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
      
      &.blue-glow:hover {
        border-color: var(--secondary-accent);
        box-shadow: 0 0 15px rgba(2, 132, 199, 0.25);
      }
      &.green-glow:hover {
        border-color: #10b981;
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
      }
      &.purple-glow:hover {
        border-color: var(--primary-accent);
        box-shadow: 0 0 15px rgba(234, 88, 12, 0.25);
      }
    }
    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      svg {
        width: 24px;
        height: 24px;
      }
      
      &.blue-icon {
        background-color: rgba(2, 132, 199, 0.12);
        color: var(--secondary-light);
      }
      &.green-icon {
        background-color: rgba(16, 185, 129, 0.12);
        color: #34d399;
      }
      &.purple-icon {
        background-color: rgba(234, 88, 12, 0.12);
        color: var(--primary-light);
      }
    }
    .stat-data {
      display: flex;
      flex-direction: column;
    }
    .stat-num {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Outfit', sans-serif;
      line-height: 1;
    }
    .stat-label {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Splits Layout */
    .dashboard-split {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
    }
    .section-card {
      padding: 24px;
      
      h2 {
        font-size: 18px;
        color: var(--text-primary);
        margin-bottom: 20px;
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
      }
      h3 {
        font-size: 15px;
        color: var(--text-primary);
        margin-bottom: 14px;
        font-weight: 600;
      }
    }
    .explore-card {
      background: linear-gradient(180deg, var(--bg-card), var(--bg-sidebar));
    }
    .explore-p {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .actions-stack {
      display: flex;
      flex-direction: column;
    }
    .explore-btn {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
      
      svg {
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
      }
      
      &:hover {
        border-color: var(--primary-accent);
        color: var(--primary-light);
        
        svg {
          color: var(--primary-light);
        }
      }
    }

    /* Active Enrollments Styling */
    .enrollment-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .enrollment-card {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }
    .enrollment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 10px;
      
      h3 {
        font-size: 15px !important;
        margin-bottom: 0 !important;
        margin-top: 4px;
      }
    }
    .badge-type {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      
      &.course {
        background-color: rgba(2, 132, 199, 0.12);
        color: var(--secondary-light);
      }
      &.path {
        background-color: rgba(234, 88, 12, 0.12);
        color: var(--primary-light);
      }
    }
    .enrolled-date {
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .progress-tracker {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .progress-lbl {
      color: var(--text-secondary);
    }
    .progress-pct {
      font-weight: 700;
      color: var(--text-primary);
    }
    .slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .btn {
        flex-shrink: 0;
      }
    }
    .progress-slider {
      flex-grow: 1;
      accent-color: var(--primary-accent);
      height: 6px;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }
    .progress-bar-bg {
      background-color: var(--bg-card);
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-bar-fill {
      background-color: var(--primary-accent);
      height: 100%;
      border-radius: 2px;
      box-shadow: 0 0 6px var(--primary-accent);
    }

    /* Completions Log */
    .completions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .completion-item {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .completion-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 75%;
    }
    .checked-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
    .completion-title {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 500;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .completion-date {
      font-size: 10px;
      color: var(--text-muted);
      display: block;
    }
    .completion-status-badge {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .empty-state-inner {
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      font-size: 13px;
      
      &.dashed-border {
        border: 1px dashed var(--border-color);
        border-radius: 8px;
        padding: 16px;
        font-size: 12px;
      }
    }
    .mt-8 { margin-top: 8px; }
    .mt-24 { margin-top: 24px; }
    .mt-12 { margin-top: 12px; }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-secondary);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(234, 88, 12, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-accent);
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LearningDashboardComponent implements OnInit {
  protected readonly learningService = inject(LearningService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly activeEnrollments = signal<Enrollment[]>([]);
  readonly completedEnrollments = signal<Enrollment[]>([]);
  readonly loading = signal(true);
  readonly stats = signal<LearningStats>({
    activeEnrollmentsCount: 0,
    completedCoursesCount: 0,
    completedLearningPathsCount: 0
  });

  // Slider state dictionary
  sliderValues: { [key: string]: number } = {};

  ngOnInit() {
    if (this.authService.role() === 'ADMIN') {
      this.router.navigate(['/learning/courses']);
      return;
    }
    this.refreshDashboard();
  }

  refreshDashboard() {
    const empId = this.authService.employeeId();
    if (!empId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    
    // Load enrollments
    this.learningService.getEnrollmentsByEmployee(empId).subscribe({
      next: (res) => {
        const active: Enrollment[] = [];
        const completed: Enrollment[] = [];
        
        res.forEach(e => {
          this.sliderValues[e.id] = e.progressPercent;
          if (e.status === 'COMPLETED') {
            completed.push(e);
          } else {
            active.push(e);
          }
        });
        
        this.activeEnrollments.set(active);
        this.completedEnrollments.set(completed);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Load stats
    this.learningService.getStatsByEmployee(empId).subscribe({
      next: (res) => this.stats.set(res)
    });
  }

  saveProgress(enrollmentId: string, progress: number) {
    this.learningService.updateProgress(enrollmentId, Number(progress)).subscribe({
      next: () => {
        this.refreshDashboard();
        this.notificationService.success('Progress Saved', 'Progress updated successfully!');
      },
      error: () => this.notificationService.error('Error', 'Failed to update progress')
    });
  }
}
