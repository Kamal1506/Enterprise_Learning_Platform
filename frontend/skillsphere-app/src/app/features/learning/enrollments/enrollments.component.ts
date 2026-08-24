import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LearningApiService, EnrollmentDTO, CourseDTO } from '../../../core/services/learning-api.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Learning</h1>
          <p class="page-subtitle">Track your enrolled courses and progress</p>
        </div>
        <button class="btn btn-primary" (click)="openEnrollDialog()">
          <span class="material-icons">add</span> Enroll in Course
        </button>
      </div>

      <!-- Stats Row -->
      <div class="enrollment-stats" *ngIf="stats()">
        <div class="enroll-stat-card">
          <span class="stat-num" style="color:var(--color-primary)">{{ stats()?.['totalEnrollments'] ?? 0 }}</span>
          <span class="stat-lbl">Total Enrolled</span>
        </div>
        <div class="enroll-stat-card">
          <span class="stat-num" style="color:var(--color-success)">{{ stats()?.['completed'] ?? 0 }}</span>
          <span class="stat-lbl">Completed</span>
        </div>
        <div class="enroll-stat-card">
          <span class="stat-num" style="color:var(--color-warning)">{{ stats()?.['inProgress'] ?? 0 }}</span>
          <span class="stat-lbl">In Progress</span>
        </div>
        <div class="enroll-stat-card">
          <span class="stat-num" style="color:var(--color-accent)">{{ stats()?.['avgProgress'] ?? 0 }}%</span>
          <span class="stat-lbl">Avg Progress</span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="empty-state">
        <div class="spinner" style="margin:0 auto"></div>
      </div>

      <!-- Enrollments -->
      <div class="enrollments-list" *ngIf="!loading()">
        <div *ngIf="enrollments().length===0" class="empty-state">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">auto_stories</span></div>
          <div class="empty-title">No enrollments yet</div>
          <div class="empty-desc">Enroll in a course to start your learning journey</div>
        </div>

        <div *ngFor="let enr of enrollments(); let i=index"
             class="enrollment-card card card--glow animate-fade-in-up"
             [style.animation-delay]="(i*50)+'ms'">
          <div class="enr-header">
            <div class="enr-course-info">
              <div class="course-icon-sm" [class]="'status-'+enr.status.toLowerCase()">
                <span class="material-icons">{{ getStatusIcon(enr.status) }}</span>
              </div>
              <div>
                <div class="enr-title">{{ enr.courseTitle ?? enr.courseId }}</div>
                <div class="enr-date text-muted">Enrolled {{ enr.enrolledAt | date:'mediumDate' }}</div>
              </div>
            </div>
            <span class="badge" [class]="getStatusBadge(enr.status)">{{ enr.status }}</span>
          </div>

          <!-- Progress -->
          <div class="enr-progress">
            <div class="flex justify-between" style="margin-bottom:6px">
              <span class="text-secondary" style="font-size:0.8125rem">Progress</span>
              <span style="font-size:0.8125rem; font-weight:600">{{ enr.progressPercent }}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" [style.width]="enr.progressPercent+'%'"
                   [style.background]="enr.status==='COMPLETED'?'var(--color-success)':'linear-gradient(90deg,var(--color-primary),var(--color-accent))'"></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="enr-actions" *ngIf="enr.status !== 'COMPLETED'">
            <div class="progress-input">
              <label class="text-muted" style="font-size:0.75rem">Update Progress:</label>
              <input type="range" min="0" max="100" [(ngModel)]="progressValues[enr.id!]"
                     class="progress-slider"/>
              <button class="btn btn-secondary btn-sm" (click)="updateProgress(enr)">
                <span class="material-icons" style="font-size:14px">sync</span> Update
              </button>
            </div>
            <button class="btn btn-success btn-sm" (click)="markComplete(enr)">
              <span class="material-icons" style="font-size:14px">check_circle</span> Mark Complete
            </button>
          </div>

          <div class="enr-complete" *ngIf="enr.status==='COMPLETED'">
            <span class="material-icons" style="color:var(--color-success); font-size:16px">check_circle</span>
            <span class="text-secondary" style="font-size:0.8125rem">
              Completed {{ enr.completedAt | date:'mediumDate' }}
              <ng-container *ngIf="enr.score"> · Score: {{ enr.score }}%</ng-container>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enroll Dialog -->
    <div *ngIf="showEnrollDialog()" class="dialog-overlay" (click)="showEnrollDialog.set(false)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>Enroll in Course</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showEnrollDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div *ngIf="enrollError()" class="alert alert-error">{{ enrollError() }}</div>
        <div class="form-group">
          <label class="form-label">Select Course *</label>
          <select class="form-control" [(ngModel)]="selectedCourseId">
            <option value="">Choose a course...</option>
            <option *ngFor="let c of allCourses()" [value]="c.id">{{ c.title }} ({{ c.category }})</option>
          </select>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showEnrollDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="enroll()" [disabled]="enrolling() || !selectedCourseId">
            <span *ngIf="enrolling()" class="spinner" style="width:14px;height:14px"></span>
            {{ enrolling() ? 'Enrolling...' : 'Enroll Now' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enrollment-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px,1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .enroll-stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      text-align: center;
    }
    .stat-num { display: block; font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; }
    .stat-lbl { font-size: 0.75rem; color: var(--text-muted); }

    .enrollments-list { display: flex; flex-direction: column; gap: 12px; }
    .enrollment-card { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .enr-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .enr-course-info { display: flex; align-items: center; gap: 12px; }
    .course-icon-sm {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      .material-icons { font-size: 18px; }
    }
    .status-enrolled    { background: rgba(108,99,255,0.12); .material-icons { color: var(--color-primary); } }
    .status-in_progress { background: rgba(245,158,11,0.12); .material-icons { color: var(--color-warning); } }
    .status-completed   { background: rgba(16,185,129,0.12); .material-icons { color: var(--color-success); } }

    .enr-title { font-weight: 600; font-size: 0.9375rem; }
    .enr-date  { font-size: 0.75rem; margin-top: 2px; }
    .enr-progress { }
    .enr-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .progress-input { display: flex; align-items: center; gap: 10px; flex: 1; }
    .progress-slider {
      flex: 1; accent-color: var(--color-primary);
      height: 4px; cursor: pointer;
    }
    .enr-complete { display: flex; align-items: center; gap: 8px; }
    .progress-bar-container { height: 6px; background: var(--bg-surface-3); border-radius: 9999px; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s; }
  `]
})
export class EnrollmentsComponent implements OnInit {
  enrollments = signal<EnrollmentDTO[]>([]);
  allCourses = signal<CourseDTO[]>([]);
  stats = signal<Record<string, any> | null>(null);
  loading = signal(true);
  showEnrollDialog = signal(false);
  enrolling = signal(false);
  enrollError = signal<string | null>(null);
  selectedCourseId = '';
  progressValues: Record<string, number> = {};
  private employeeId!: string;

  constructor(private learningApi: LearningApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.employeeId = this.auth.currentUser()?.employeeId ?? this.auth.currentUser()?.id ?? '';
    this.load();
    this.learningApi.getAllCoursesList().subscribe(c => this.allCourses.set(c));
    if (this.employeeId) {
      this.learningApi.getDashboardStats(this.employeeId).subscribe(s => this.stats.set(s));
    }
  }

  load(): void {
    if (!this.employeeId) { this.loading.set(false); return; }
    this.learningApi.getEnrollmentsByEmployee(this.employeeId).subscribe({
      next: (data) => {
        this.enrollments.set(data);
        data.forEach(e => { if (e.id) this.progressValues[e.id] = e.progressPercent; });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openEnrollDialog(): void { this.selectedCourseId = ''; this.enrollError.set(null); this.showEnrollDialog.set(true); }

  enroll(): void {
    this.enrolling.set(true);
    this.learningApi.createEnrollment(this.employeeId, { courseId: this.selectedCourseId }).subscribe({
      next: (e) => { this.enrollments.update(l => [...l, e]); this.enrolling.set(false); this.showEnrollDialog.set(false); },
      error: (err) => { this.enrolling.set(false); this.enrollError.set(err.error?.message ?? 'Enrollment failed'); }
    });
  }

  updateProgress(enr: EnrollmentDTO): void {
    const pct = this.progressValues[enr.id!] ?? enr.progressPercent;
    this.learningApi.updateProgress(enr.id!, pct).subscribe(updated =>
      this.enrollments.update(l => l.map(e => e.id === updated.id ? updated : e))
    );
  }

  markComplete(enr: EnrollmentDTO): void {
    this.learningApi.completeEnrollment(enr.id!).subscribe(updated =>
      this.enrollments.update(l => l.map(e => e.id === updated.id ? updated : e))
    );
  }

  getStatusIcon(status: string): string {
    const m: Record<string,string> = { ENROLLED:'schedule', IN_PROGRESS:'play_circle', COMPLETED:'check_circle' };
    return m[status] ?? 'help';
  }

  getStatusBadge(status: string): string {
    const m: Record<string,string> = { ENROLLED:'badge-primary', IN_PROGRESS:'badge-warning', COMPLETED:'badge-success' };
    return m[status] ?? 'badge-muted';
  }
}
