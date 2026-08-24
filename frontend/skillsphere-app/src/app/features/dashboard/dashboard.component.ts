import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillApiService, DashboardStats, AdminStats } from '../../core/services/skill-api.service';
import { LearningApiService, CourseStatsDTO } from '../../core/services/learning-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  trend?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ greeting }}, {{ userEmail() }} — Here's your overview</p>
        </div>
        <div class="header-date">
          <span class="material-icons">today</span>
          {{ today }}
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="stats-grid">
        <div *ngFor="let _ of [1,2,3,4,5]" class="stat-card skeleton" style="height:100px"></div>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid" *ngIf="!loading()">
        <div *ngFor="let card of statCards(); let i = index"
             class="stat-card card--glow animate-fade-in-up"
             [style.animation-delay]="(i * 80) + 'ms'">
          <div class="stat-icon" [style.background]="card.bgColor">
            <span class="material-icons" [style.color]="card.color">{{ card.icon }}</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" [style.color]="card.color">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
            <div *ngIf="card.trend" class="stat-trend" style="color: var(--color-success)">
              <span class="material-icons" style="font-size:12px">trending_up</span>
              {{ card.trend }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <h2 class="section-title">Quick Actions</h2>
      <div class="quick-actions-grid">
        <a *ngFor="let action of quickActions" [routerLink]="action.route"
           class="action-card card card--glow">
          <div class="action-icon" [style.background]="action.bg">
            <span class="material-icons" [style.color]="action.color">{{ action.icon }}</span>
          </div>
          <div class="action-content">
            <div class="action-title">{{ action.title }}</div>
            <div class="action-desc">{{ action.desc }}</div>
          </div>
          <span class="material-icons action-arrow">arrow_forward</span>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .header-date {
      display: flex; align-items: center; gap: 8px;
      color: var(--text-muted); font-size: 0.875rem;
      .material-icons { font-size: 18px; color: var(--color-accent); }
    }

    .section-title {
      font-size: 1rem; font-weight: 600;
      color: var(--text-secondary); margin-bottom: 16px;
      text-transform: uppercase; letter-spacing: 0.05em;
      font-size: 0.75rem;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-md);
    }

    .action-card {
      display: flex; align-items: center; gap: 16px;
      cursor: pointer; text-decoration: none;
      transition: all var(--transition-normal);
      &:hover {
        border-color: var(--border-accent);
        box-shadow: var(--shadow-glow);
        transform: translateY(-2px);
        .action-arrow { color: var(--color-primary); transform: translateX(4px); }
      }
    }
    .action-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 22px; }
    }
    .action-content { flex: 1; min-width: 0; }
    .action-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
    .action-desc  { font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px; }
    .action-arrow { color: var(--text-muted); transition: all var(--transition-fast); }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  statCards = signal<StatCard[]>([]);
  userEmail = signal('');

  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  greeting = this.getGreeting();

  readonly quickActions = [
    { title: 'Manage Employees', desc: 'View, add & update employee profiles', icon: 'people', route: '/employees', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' },
    { title: 'Skills Directory', desc: 'Browse and assign skills to employees', icon: 'psychology', route: '/skills', color: '#00D4FF', bg: 'rgba(0,212,255,0.1)' },
    { title: 'Course Catalog', desc: 'Explore and manage training courses', icon: 'school', route: '/courses', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { title: 'Learning Paths', desc: 'Design structured learning journeys', icon: 'route', route: '/learning-paths', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { title: 'My Learning', desc: 'Track your enrolled courses and progress', icon: 'auto_stories', route: '/my-learning', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    { title: 'Competency Gaps', desc: 'Identify and bridge skill gaps', icon: 'verified', route: '/competency', color: '#8B85FF', bg: 'rgba(139,133,255,0.1)' },
  ];

  constructor(
    private skillApi: SkillApiService,
    private learningApi: LearningApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.userEmail.set(this.auth.currentUser()?.email ?? '');
    forkJoin({
      skill: this.skillApi.getDashboardStats().pipe(catchError(() => of(null))),
      course: this.learningApi.getCourseStats().pipe(catchError(() => of(null))),
    }).subscribe(({ skill, course }) => {
      const cards: StatCard[] = [
        { label: 'Total Employees', value: skill?.employeesCount ?? '—', icon: 'people', color: '#6C63FF', bgColor: 'rgba(108,99,255,0.15)' },
        { label: 'Skills Tracked', value: skill?.skillsTrackedCount ?? '—', icon: 'psychology', color: '#00D4FF', bgColor: 'rgba(0,212,255,0.1)' },
        { label: 'Assessments This Month', value: skill?.assessmentsThisMonthCount ?? '—', icon: 'assignment_turned_in', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)' },
        { label: 'Total Courses', value: course?.totalCourses ?? '—', icon: 'school', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)' },
        { label: 'Total Enrollments', value: course?.totalEnrollments ?? '—', icon: 'how_to_reg', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)' },
      ];
      this.statCards.set(cards);
      this.loading.set(false);
    });
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
