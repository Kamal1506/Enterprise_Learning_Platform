import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="grid-lines"></div>
      </div>

      <div class="auth-container animate-fade-in-up">
        <div class="auth-logo">
          <div class="logo-mark-lg">◈</div>
          <div>
            <h1 class="auth-brand">SkillSphere <span>Nexus</span></h1>
            <p class="auth-tagline">Request workspace access</p>
          </div>
        </div>

        <div class="auth-card glass">

          <!-- Success state -->
          <div *ngIf="success()" class="success-state">
            <div class="success-icon">
              <span class="material-icons">check_circle</span>
            </div>
            <h3>Registration Submitted</h3>
            <p>Your request is pending admin approval. You'll be notified once approved.</p>
            <a routerLink="/auth/login" class="btn btn-primary" style="margin-top:16px; display:inline-flex; justify-content:center; width:100%">
              <span class="material-icons">arrow_back</span>
              Back to Login
            </a>
          </div>

          <ng-container *ngIf="!success()">
            <div class="auth-card-header">
              <h2>Create Account</h2>
              <p>Fill in your details to request access</p>
            </div>

            <div *ngIf="error()" class="alert alert-error">
              <span class="material-icons" style="font-size:18px">error_outline</span>
              {{ error() }}
            </div>

            <form (ngSubmit)="onRegister()" #regForm="ngForm">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <div class="input-with-icon">
                  <span class="material-icons input-icon">mail_outline</span>
                  <input class="form-control" type="email" name="email"
                         [(ngModel)]="email" required placeholder="you@company.com"/>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-with-icon">
                  <span class="material-icons input-icon">lock_outline</span>
                  <input class="form-control" type="password" name="password"
                         [(ngModel)]="password" required minlength="8"
                         placeholder="Min. 8 characters"/>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Role</label>
                <div class="input-with-icon">
                  <span class="material-icons input-icon">badge</span>
                  <select class="form-control" name="role" [(ngModel)]="role" required>
                    <option value="">Select your role</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="TRAINING_MANAGER">Training Manager</option>
                  </select>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg full-width"
                      [disabled]="loading() || !email || !password || !role">
                <span *ngIf="loading()" class="spinner" style="width:16px;height:16px"></span>
                <span class="material-icons" *ngIf="!loading()">person_add</span>
                {{ loading() ? 'Submitting...' : 'Request Access' }}
              </button>
            </form>

            <div class="auth-footer">
              <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: var(--bg-page);
    }
    .auth-bg { position: absolute; inset: 0; pointer-events: none; }
    .bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
    .orb-1 { width: 500px; height: 500px; background: var(--color-primary); top: -100px; right: -100px; }
    .orb-2 { width: 400px; height: 400px; background: var(--color-accent); bottom: -80px; left: -80px; }
    .grid-lines {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(108,99,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(108,99,255,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .auth-container {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      align-items: center; gap: 32px;
      width: 100%; max-width: 440px; padding: 24px;
    }

    .auth-logo { display: flex; align-items: center; gap: 16px; }
    .logo-mark-lg {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: #fff; flex-shrink: 0;
      box-shadow: 0 0 30px rgba(108,99,255,0.4);
    }
    .auth-brand { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); span { color: var(--color-accent); } }
    .auth-tagline { font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px; }

    .auth-card { width: 100%; border-radius: var(--radius-xl); padding: 36px; }
    .auth-card-header { margin-bottom: 28px; h2 { font-size: 1.375rem; font-weight: 700; } p { color: var(--text-muted); font-size: 0.875rem; margin-top: 4px; } }

    .input-with-icon { position: relative;
      .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; pointer-events: none; }
      .form-control { padding-left: 40px; }
    }

    .full-width { width: 100%; justify-content: center; margin-top: 8px; }
    .auth-footer { text-align: center; margin-top: 20px; font-size: 0.8125rem; color: var(--text-muted);
      a { color: var(--color-primary); font-weight: 500; }
    }

    .success-state {
      text-align: center; padding: 24px 0;
      .success-icon { font-size: 3.5rem; color: var(--color-success); margin-bottom: 16px; .material-icons { font-size: inherit; } }
      h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
      p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; }
    }
  `]
})
export class RegisterComponent {
  email = '';
  password = '';
  role = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  constructor(private auth: AuthService) {}

  onRegister(): void {
    if (!this.email || !this.password || !this.role) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.register({ email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
      }
    });
  }
}
