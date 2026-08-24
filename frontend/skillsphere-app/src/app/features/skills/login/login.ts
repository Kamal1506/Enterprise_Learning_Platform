import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

interface JourneyNode {
  title: string;
  metric: string;
  desc: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Background Mesh glows -->
      <div class="mesh-light login-mesh-1"></div>
      <div class="mesh-light login-mesh-2"></div>

      <!-- Success Transition Overlay Screen -->
      @if (successTransition()) {
        <div class="success-transition-overlay animate-fade-in">
          <div class="transition-card">
            <!-- Brand Logo -->
            <div class="transition-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="1.5" fill="var(--primary-accent)" stroke="none" />
              </svg>
            </div>
            <h3 style="margin-bottom: 4px;">Enterprise Learning <span class="accent-text">Platform</span></h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 0; margin-bottom: 12px;">with Skill and Career Guidance System</p>
            <p>Initializing your workforce intelligence workspace...</p>
            <div class="glowing-loader">
              <div class="loader-line"></div>
            </div>
          </div>
        </div>
      }

      <div class="login-container animate-fade-in">
        <!-- Left Column: Visual interactive Skill Journey -->
        <div class="journey-hero-panel">
          <div class="matrix-bg"></div>
          <div class="hero-header-brand">
            <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="1.5" fill="var(--primary-accent)" stroke="none" />
            </svg>
            <span style="font-size: 14px; line-height: 1.2; display: flex; flex-direction: column;">
              Enterprise Learning Platform
              <span class="accent-text" style="font-size: 10px; font-weight: 500; opacity: 0.85; margin-top: 1px;">with Skill & Career Guidance</span>
            </span>
          </div>

          <div class="journey-pipeline-container">
            <h2 class="journey-main-title">Your skills are the beginning of your next opportunity.</h2>
            
            <!-- SVG Pipeline Curves -->
            <svg class="journey-svg-lines" viewBox="0 0 400 320" preserveAspectRatio="none">
              <!-- Default Background Path -->
              <path d="M 50 40 Q 250 80 100 130 T 280 220 T 150 300" stroke="rgba(255,255,255,0.04)" stroke-width="3" fill="none" />
              <!-- Highlighted Glowing Path -->
              <path d="M 50 40 Q 250 80 100 130 T 280 220 T 150 300" stroke="var(--primary-accent)" stroke-width="3" fill="none" 
                    class="glowing-path-line" [attr.stroke-dashoffset]="getGlowOffset()" />
            </svg>

            <!-- Interactive Nodes List -->
            <div class="nodes-list">
              @for (node of journeyNodes; track node.title; let idx = $index) {
                <div 
                  class="journey-node-card float-card-{{ idx + 1 }}"
                  [class.active-node]="hoverIndex() === idx"
                  (mouseenter)="hoverIndex.set(idx)"
                  (mouseleave)="hoverIndex.set(null)"
                >
                  <div class="node-icon-wrapper" [style.color]="node.color">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-icon">
                      <path [attr.d]="node.icon"></path>
                    </svg>
                  </div>
                  <div class="node-details">
                    <div class="node-header-row">
                      <h4>{{ node.title }}</h4>
                      <span class="node-metric">{{ node.metric }}</span>
                    </div>
                    <p class="node-desc">{{ node.desc }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Central detail popover tag -->
            <div class="journey-storytelling-box">
              @if (hoverIndex() !== null) {
                <div class="tag-banner animate-slide-down">
                  <span class="bullet" [style.background-color]="journeyNodes[hoverIndex()!].color"></span>
                  <span>{{ getTagline(hoverIndex()!) }}</span>
                </div>
              } @else {
                <div class="tag-banner-idle">
                  <span>Hover over stages to inspect loop progression</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column: Authentication Card Form -->
        <div class="login-form-panel">
          <div class="form-card-container">
            <div class="form-header">
              <h3>{{ isSignUp() ? 'Create Employee Account' : 'Sign In to Workspace' }}</h3>
              <p>{{ isSignUp() ? 'Register your email to request competency mapping.' : 'Sign in to access your skills inventory and learning paths.' }}</p>
            </div>

            @if (errorMessage()) {
              <div class="error-banner" role="alert">
                <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            @if (successMessage()) {
              <div class="success-banner" role="alert">
                <svg class="success-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>{{ successMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()" #authForm="ngForm" class="auth-fields-form">
              @if (isSignUp()) {
                <div class="form-group animate-slide-down">
                  <label for="fullName">Full Name</label>
                  <input 
                    type="text" 
                    id="fullName" 
                    name="fullName" 
                    [(ngModel)]="fullName" 
                    required 
                    class="form-control" 
                    placeholder="Sarah Jenkins"
                    [disabled]="loading()"
                  />
                </div>
              }

              <div class="form-group">
                <label for="email">Work Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="email" 
                  required 
                  email
                  class="form-control" 
                  placeholder="employee@skillsphere.com"
                  [disabled]="loading()"
                  autocomplete="email"
                />
              </div>
              
              <div class="form-group">
                <label for="password">Password</label>
                <div class="password-field-wrapper">
                  <input 
                    [type]="showPassword() ? 'text' : 'password'" 
                    id="password" 
                    name="password" 
                    [(ngModel)]="password" 
                    required 
                    class="form-control password-input" 
                    placeholder="••••••••"
                    [disabled]="loading()"
                    autocomplete="current-password"
                  />
                  <!-- Toggle Visibility Button -->
                  <button 
                    type="button" 
                    class="btn-toggle-password" 
                    (click)="togglePasswordVisibility()" 
                    [disabled]="loading()"
                    aria-label="Toggle password visibility"
                  >
                    @if (showPassword()) {
                      <!-- Eye Off Icon -->
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="eye-icon">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <!-- Eye Icon -->
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              @if (isSignUp()) {
                <div class="form-group animate-slide-down">
                  <label for="role">Requested Role</label>
                  <div class="select-wrapper">
                    <select 
                      id="role" 
                      name="role" 
                      [(ngModel)]="role" 
                      required 
                      class="form-control select-input"
                      [disabled]="loading()"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_MANAGER">HR Manager</option>
                    </select>
                  </div>
                </div>
              }
              
              <button type="submit" class="btn btn-primary login-btn" [disabled]="!authForm.form.valid || loading()">
                @if (loading()) {
                  <span class="spinner"></span> Processing...
                } @else {
                  {{ isSignUp() ? 'Request Access' : 'Sign In' }}
                }
              </button>
            </form>

            <div class="toggle-mode">
              @if (isSignUp()) {
                <p>Already have an account? <span class="toggle-link" (click)="toggleMode(false)">Sign In</span></p>
              } @else {
                <p>Don't have an account? <span class="toggle-link" (click)="toggleMode(true)">Request Access</span></p>
              }
            </div>

            <!-- Demo Credentials Helper -->
            <div class="demo-helpers-container">
              <span class="helper-heading">Demo Sandbox Credentials</span>
              <div class="helpers-grid">
                <div class="helper-col" (click)="fillDemo('admin@skillsphere.com')">
                  <span>Admin</span>
                  <strong>admin&#64;skillsphere.com</strong>
                </div>
                <div class="helper-col" (click)="fillDemo('hr@skillsphere.com')">
                  <span>HR Manager</span>
                  <strong>hr&#64;skillsphere.com</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  fullName = '';
  role = 'EMPLOYEE';
  
  readonly isSignUp = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // New visual state signals
  readonly showPassword = signal(false);
  readonly successTransition = signal(false);
  readonly hoverIndex = signal<number | null>(null);

  journeyNodes: JourneyNode[] = [
    {
      title: 'Skills Registry',
      metric: 'Java 8/10',
      desc: 'Understand capabilities at a granular competency level.',
      icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      color: '#ea580c'
    },
    {
      title: 'Target Development',
      metric: 'Learning 67%',
      desc: 'Autobridge mapped gaps using targeted pathways.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13',
      color: '#a855f7'
    },
    {
      title: 'Compliance Validation',
      metric: 'AWS SAA ✓',
      desc: 'Validate expertise and manage renewal alerts.',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77',
      color: '#10b981'
    },
    {
      title: 'Mobility Growth',
      metric: 'Career ready',
      desc: 'Establish transparent benchmarks for promotion.',
      icon: 'M13 17h8m-8-5h8m-8-5h8M3 17h.01 M3 12h.01',
      color: '#3b82f6'
    }
  ];

  toggleMode(signUp: boolean) {
    this.isSignUp.set(signUp);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.password = '';
  }

  togglePasswordVisibility() {
    this.showPassword.update(show => !show);
  }

  getGlowOffset() {
    const active = this.hoverIndex();
    if (active === null) return '600';
    // Slowly fill glows on hover index
    return (600 - (active * 150)).toString();
  }

  getTagline(idx: number): string {
    const taglines = [
      'Capability: Map core competencies and self-reported skills.',
      'Development: Enroll in curated course path modules.',
      'Validation: Track certified milestones and compliance.',
      'Growth: Qualify for senior roles with verified readiness.'
    ];
    return taglines[idx];
  }

  fillDemo(demoEmail: string) {
    this.email = demoEmail;
    this.password = 'password';
  }

  onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    if (this.isSignUp()) {
      if (!this.email || !this.password || !this.fullName || !this.role) return;
      this.loading.set(true);

      const requestPayload = {
        email: this.email,
        password: this.password,
        role: this.role,
        name: this.fullName
      };

      this.authService.register(requestPayload).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Registration request submitted! Wait for the admin to approve.');
          this.toggleMode(false); // Switch to sign in mode
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 409) {
            this.errorMessage.set('This email address is already registered.');
          } else if (err.error && err.error.message) {
            this.errorMessage.set(err.error.message);
          } else {
            this.errorMessage.set('Registration failed. Please verify credentials and try again.');
          }
        }
      });
    } else {
      if (!this.email || !this.password) return;
      this.loading.set(true);

      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: () => {
          this.loading.set(false);
          // Redesign Success Transition Delay
          this.successTransition.set(true);
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1200);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.error && err.error.message) {
            this.errorMessage.set(err.error.message);
          } else if (err.status === 401) {
            this.errorMessage.set('Invalid credentials. Check email and password.');
          } else if (err.status === 403) {
            this.errorMessage.set('Your account is pending approval by the Admin.');
          } else {
            this.errorMessage.set('Could not connect to authentication server. Please try again.');
          }
        }
      });
    }
  }
}
