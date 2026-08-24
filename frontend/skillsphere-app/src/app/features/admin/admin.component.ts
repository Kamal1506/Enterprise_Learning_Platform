import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillApiService, PendingApprovalDTO, AdminStats } from '../../core/services/skill-api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Panel</h1>
          <p class="page-subtitle">User management and platform statistics</p>
        </div>
      </div>

      <!-- Admin Stats -->
      <div class="stats-grid" *ngIf="adminStats()">
        <div class="stat-card card--glow animate-fade-in-up">
          <div class="stat-icon" style="background:rgba(108,99,255,0.15)">
            <span class="material-icons" style="color:var(--color-primary)">people</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" style="color:var(--color-primary)">{{ adminStats()!.employeeCount }}</div>
            <div class="stat-label">Total Employees</div>
          </div>
        </div>
        <div class="stat-card card--glow animate-fade-in-up" style="animation-delay:80ms">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)">
            <span class="material-icons" style="color:var(--color-warning)">manage_accounts</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" style="color:var(--color-warning)">{{ adminStats()!.hrManagerCount }}</div>
            <div class="stat-label">HR Managers</div>
          </div>
        </div>
        <div class="stat-card card--glow animate-fade-in-up" style="animation-delay:160ms">
          <div class="stat-icon" style="background:rgba(0,212,255,0.1)">
            <span class="material-icons" style="color:var(--color-accent)">psychology</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" style="color:var(--color-accent)">{{ adminStats()!.skillsTrackedCount }}</div>
            <div class="stat-label">Skills Tracked</div>
          </div>
        </div>
        <div class="stat-card card--glow animate-fade-in-up" style="animation-delay:240ms">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1)">
            <span class="material-icons" style="color:var(--color-danger)">pending</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" style="color:var(--color-danger)">{{ adminStats()!.pendingApprovals }}</div>
            <div class="stat-label">Pending Approvals</div>
          </div>
        </div>
      </div>

      <!-- Pending Approvals -->
      <div class="card" style="margin-top:8px; padding:0; overflow:hidden">
        <div class="approvals-header">
          <h2 style="font-size:1rem">
            <span class="material-icons" style="color:var(--color-warning);font-size:20px;vertical-align:middle">pending_actions</span>
            Pending User Approvals
          </h2>
          <span *ngIf="pendingUsers().length" class="badge badge-warning">{{ pendingUsers().length }}</span>
        </div>

        <div *ngIf="loading()" class="empty-state" style="padding:32px">
          <div class="spinner" style="margin:0 auto"></div>
        </div>

        <div *ngIf="!loading() && pendingUsers().length===0" class="empty-state" style="padding:40px">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">check_circle</span></div>
          <div class="empty-title">No pending approvals</div>
          <div class="empty-desc">All users have been reviewed</div>
        </div>

        <table class="data-table" *ngIf="!loading() && pendingUsers().length">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role Requested</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of pendingUsers()">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-av">{{ user.email.slice(0,2).toUpperCase() }}</div>
                  {{ user.email }}
                </div>
              </td>
              <td>
                <span class="badge badge-primary">{{ user.role }}</span>
              </td>
              <td class="text-muted">{{ user.createdAt | date:'medium' }}</td>
              <td>
                <div class="flex gap-sm">
                  <button class="btn btn-success btn-sm" (click)="approve(user)" [disabled]="processing()===user.id">
                    <span *ngIf="processing()===user.id" class="spinner" style="width:12px;height:12px"></span>
                    <span class="material-icons" style="font-size:14px" *ngIf="processing()!==user.id">check</span>
                    Approve
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="reject(user)" [disabled]="processing()===user.id">
                    <span class="material-icons" style="font-size:14px">close</span>
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .approvals-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .user-av {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.625rem; font-weight: 600; flex-shrink: 0;
    }
  `]
})
export class AdminComponent implements OnInit {
  pendingUsers = signal<PendingApprovalDTO[]>([]);
  adminStats = signal<AdminStats | null>(null);
  loading = signal(true);
  processing = signal<string | null>(null);

  constructor(private skillApi: SkillApiService) {}

  ngOnInit(): void {
    forkJoin({
      pending: this.skillApi.getPendingApprovals().pipe(catchError(() => of([]))),
      stats:   this.skillApi.getAdminStats().pipe(catchError(() => of(null))),
    }).subscribe(({ pending, stats }) => {
      this.pendingUsers.set(pending);
      this.adminStats.set(stats);
      this.loading.set(false);
    });
  }

  approve(user: PendingApprovalDTO): void {
    this.processing.set(user.id);
    this.skillApi.approveUser(user.id).subscribe({
      next: () => { this.pendingUsers.update(l => l.filter(u => u.id !== user.id)); this.processing.set(null); },
      error: () => this.processing.set(null)
    });
  }

  reject(user: PendingApprovalDTO): void {
    if (!confirm(`Reject registration for ${user.email}?`)) return;
    this.processing.set(user.id);
    this.skillApi.rejectUser(user.id).subscribe({
      next: () => { this.pendingUsers.update(l => l.filter(u => u.id !== user.id)); this.processing.set(null); },
      error: () => this.processing.set(null)
    });
  }
}
