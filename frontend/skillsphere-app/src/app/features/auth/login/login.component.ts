import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Animated background -->
      <div class="auth-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
        <div class="grid-lines"></div>
      </div>

      <div class="auth-container animate-fade-in-up">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="logo-mark-lg">◈</div>
          <div>
            <h1 class="auth-brand">SkillSphere <span>Nexus</span></h1>
            <p class="auth-tagline">Enterprise Learning & Development Platform</p>
          </div>
        </div>

        <!-- Card -->
        <div class="auth-card glass">
          <div class="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your workspace</p>
          </div>

          <div *ngIf="error()" class="alert alert-error">
            <span class="material-icons" style="font-size:18px">error_outline</span>
            {{ error() }}
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <div class="input-with-icon">
                <span class="material-icons input-icon">mail_outline</span>
                <input class="form-control" type="email" name="email"
                       [(ngModel)]="email" required
                       placeholder="you@company.com" autocomplete="email"/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-with-icon">
                <span class="material-icons input-icon">lock_outline</span>
                <input class="form-control" [type]="showPwd() ? 'text' : 'password'"
                       name="password" [(ngModel)]="password" required
                       placeholder="••••••••" autocomplete="current-password"/>
                <button type="button" class="pwd-toggle" (click)="showPwd.set(!showPwd())">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg full-width"
                    [disabled]="loading() || !email || !password">
              <span *ngIf="loading()" class="spinner" style="width:16px;height:16px"></span>
              <span class="material-icons" *ngIf="!loading()">login</span>
              {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-footer">
            <p>Don't have an account? <a routerLink="/auth/register">Request access</a></p>
          </div>
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

    /* Animated background */
    .auth-bg { position: absolute; inset: 0; pointer-events: none; }
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      animation: float 8s ease-in-out infinite;
    }
    .orb-1 { width: 500px; height: 500px; background: var(--color-primary); top: -100px; left: -100px; animation-delay: 0s; }
    .orb-2 { width: 400px; height: 400px; background: var(--color-accent); bottom: -80px; right: -80px; animation-delay: 3s; }
    .orb-3 { width: 300px; height: 300px; background: var(--color-primary-dark); top: 50%; left: 50%; animation-delay: 6s; }

    @keyframes float {
      0%, 100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(20px,20px) scale(1.05); }
    }

    .grid-lines {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(108,99,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(108,99,255,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .auth-container {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      width: 100%;
      max-width: 440px;
      padding: 24px;
    }

    .auth-logo {
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
    }
    .logo-mark-lg {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 0 30px rgba(108,99,255,0.4);
    }
    .auth-brand {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      span { color: var(--color-accent); }
    }
    .auth-tagline { font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px; }

    .auth-card {
      width: 100%;
      border-radius: var(--radius-xl);
      padding: 36px;
    }

    .auth-card-header {
      margin-bottom: 28px;
      h2 { font-size: 1.375rem; font-weight: 700; }
      p  { color: var(--text-muted); font-size: 0.875rem; margin-top: 4px; }
    }

    .input-with-icon {
      position: relative;
      .input-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 18px;
        pointer-events: none;
      }
      .form-control { padding-left: 40px; }
    }

    .pwd-toggle {
      position: absolute;
      right: 10px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: var(--text-muted); cursor: pointer;
      padding: 4px;
      .material-icons { font-size: 18px; }
      &:hover { color: var(--text-primary); }
    }

    .full-width { width: 100%; justify-content: center; margin-top: 8px; }

    .auth-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      a { color: var(--color-primary); font-weight: 500; &:hover { color: var(--color-primary-light); } }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Invalid credentials. Please try again.');
      },
      complete: () => this.loading.set(false)
    });
  }
}
