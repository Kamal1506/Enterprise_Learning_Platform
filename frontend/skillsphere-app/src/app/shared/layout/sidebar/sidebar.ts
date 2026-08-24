import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-brand">
        <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="7" r="1.5" fill="var(--primary-accent)" stroke="none" />
        </svg>
        @if (!collapsed()) {
          <span class="brand-text">
            Enterprise Learning Platform
            <span style="color: var(--primary-accent); display: block; font-size: 11px; font-weight: 500; opacity: 0.85; margin-top: 1px;">with Skill & Career Guidance</span>
          </span>
        }
        <button class="toggle-btn" (click)="toggleCollapse()" aria-label="Toggle Sidebar">
          <svg class="toggle-icon" [class.rotated]="collapsed()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          @if (!collapsed()) {
            <span class="nav-label">Dashboard</span>
          }
        </a>
        
        <a class="nav-item" routerLink="/employees" routerLinkActive="active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          @if (!collapsed()) {
            <span class="nav-label">Employees</span>
          }
        </a>
        
        <a class="nav-item" [routerLink]="authService.role() === 'ADMIN' ? '/learning/courses' : '/learning/dashboard'" routerLinkActive="active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          @if (!collapsed()) {
            <span class="nav-label">Learning</span>
          }
        </a>
        
        <a class="nav-item" routerLink="/certifications" routerLinkActive="active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          @if (!collapsed()) {
            <span class="nav-label">Certifications</span>
          }
        </a>
 
        <a class="nav-item" routerLink="/certifications/compliance" routerLinkActive="active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          @if (!collapsed()) {
            <span class="nav-label">Compliance</span>
          }
        </a>
 
        @if (authService.role() === 'ADMIN') {
          <a class="nav-item" routerLink="/skills" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>
            @if (!collapsed()) {
              <span class="nav-label">Skills</span>
            }
          </a>
        }
        
        @if (authService.employeeId()) {
          <a class="nav-item" routerLink="/career/plan" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            @if (!collapsed()) {
              <span class="nav-label">Career Plan</span>
            }
          </a>

          <a class="nav-item" routerLink="/career/roadmap" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>
            @if (!collapsed()) {
              <span class="nav-label">Roadmap</span>
            }
          </a>

          <a class="nav-item" routerLink="/career/jobs" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            @if (!collapsed()) {
              <span class="nav-label">Internal Jobs</span>
            }
          </a>

          <a class="nav-item" routerLink="/assistant" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            @if (!collapsed()) {
              <span class="nav-label">Levi AI</span>
            }
          </a>

          <a class="nav-item" routerLink="/profile" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            @if (!collapsed()) {
              <span class="nav-label">My Profile</span>
            }
          </a>
        }

        @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
          <a class="nav-item" routerLink="/career/analytics" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            @if (!collapsed()) {
              <span class="nav-label">Career Analytics</span>
            }
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 100;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      border-bottom: 1px solid var(--border-color);
      height: 77px;
    }
    .brand-logo {
      width: 28px;
      height: 28px;
      color: var(--primary-accent);
      flex-shrink: 0;
    }
    .brand-text {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      margin-left: auto;
      
      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
      }
    }
    .toggle-icon {
      width: 16px;
      height: 16px;
      transition: transform 0.3s ease;
    }
    .toggle-icon.rotated {
      transform: rotate(180deg);
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 16px 8px;
      gap: 4px;
      flex-grow: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover:not(.disabled) {
        background-color: var(--bg-hover);
        color: #ffffff;
        box-shadow: inset 3px 0 0 var(--primary-accent);
        transform: translateX(4px);
      }
      
      &.active {
        background-color: rgba(234, 88, 12, 0.1);
        color: var(--primary-light);
        font-weight: 600;
        border: 1px solid rgba(234, 88, 12, 0.15);
        box-shadow: inset 4px 0 0 0 var(--primary-accent);
      }
      
      &.disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Collapsed Sidebar Styles on Desktop */
    @media (min-width: 769px) {
      .sidebar.collapsed {
        width: 76px;
        .brand-text, .nav-label {
          display: none;
        }
        .sidebar-brand {
          justify-content: center;
          padding: 24px 0;
        }
        .toggle-btn {
          margin-left: 0;
        }
        .nav-item {
          justify-content: center;
          padding: 12px;
          &:hover {
            transform: none;
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: 60px;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        border-right: none;
        border-top: 1px solid var(--border-color);
        flex-direction: row;
        box-shadow: 0 -4px 10px rgba(0,0,0,0.3);
      }
      .sidebar-brand {
        display: none;
      }
      .sidebar-nav {
        flex-direction: row;
        width: 100%;
        padding: 0;
        justify-content: space-around;
        align-items: center;
        gap: 0;
      }
      .nav-item {
        flex-direction: column;
        gap: 2px;
        padding: 8px 4px;
        font-size: 10px;
        flex-grow: 1;
        justify-content: center;
        border-radius: 0;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        
        &.active {
          color: var(--primary-light);
        }
      }
      .nav-label {
        font-size: 9px;
      }
    }
  `]
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  readonly collapsed = signal(false);

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }
}
