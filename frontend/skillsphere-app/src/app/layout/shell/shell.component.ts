import { Component, computed, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">

      <!-- ===== SIDEBAR ===== -->
      <aside class="sidebar">
        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-mark">
            <span class="logo-icon">◈</span>
          </div>
          <div class="logo-text" *ngIf="!sidebarCollapsed()">
            <span class="logo-name">SkillSphere</span>
            <span class="logo-sub">Nexus</span>
          </div>
        </div>

        <!-- User Badge -->
        <div class="user-badge" *ngIf="!sidebarCollapsed()">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-email">{{ currentUser()?.email }}</div>
            <div class="user-role" [class]="'role-' + (currentUser()?.role?.toLowerCase() ?? '')">
              {{ formatRole(currentUser()?.role) }}
            </div>
          </div>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <div class="nav-section-label" *ngIf="!sidebarCollapsed()">MAIN</div>
          <ng-container *ngFor="let item of visibleNav()">
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
               [title]="sidebarCollapsed() ? item.label : ''">
              <span class="material-icons nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
            </a>
          </ng-container>

          <div class="nav-section-label" *ngIf="!sidebarCollapsed() && isHrOrAdmin()">ADMIN</div>
          <a class="nav-item" routerLink="/admin" routerLinkActive="active"
             *ngIf="isHrOrAdmin()"
             [title]="sidebarCollapsed() ? 'Admin Panel' : ''">
            <span class="material-icons nav-icon">admin_panel_settings</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Admin Panel</span>
          </a>
        </nav>

        <!-- Collapse Toggle -->
        <button class="sidebar-toggle" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
          <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </aside>

      <!-- ===== MAIN AREA ===== -->
      <div class="main-area">

        <!-- Header -->
        <header class="top-header">
          <div class="header-left">
            <div class="page-breadcrumb">
              <span class="material-icons breadcrumb-icon">hub</span>
              <span class="breadcrumb-text">SkillSphere Nexus</span>
            </div>
          </div>
          <div class="header-right">
            <div class="header-chip">
              <span class="material-icons" style="font-size:16px; color: var(--color-accent)">fiber_manual_record</span>
              <span>Live</span>
            </div>
            <button class="header-btn logout-btn" (click)="logout()" title="Logout">
              <span class="material-icons">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* === SIDEBAR === */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-normal);
      flex-shrink: 0;
      position: relative;
      z-index: 100;
    }

    .shell.sidebar-collapsed .sidebar { width: 64px; }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon { color: #fff; font-size: 18px; line-height: 1; }
    .logo-text { display: flex; flex-direction: column; overflow: hidden; }
    .logo-name { font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
    .logo-sub  { font-size: 0.6875rem; color: var(--color-accent); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }
    .user-avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .user-info { overflow: hidden; }
    .user-email { font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .role-admin { color: var(--color-accent); }
    .role-hr_manager { color: var(--color-warning); }
    .role-training_manager { color: var(--color-success); }
    .role-employee { color: var(--color-primary-light); }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-section-label {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 12px 10px 6px;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(108,99,255,0.15);
        color: var(--color-primary-light);
        border: 1px solid rgba(108,99,255,0.2);
        .nav-icon { color: var(--color-primary); }
      }
    }

    .nav-icon { font-size: 20px; flex-shrink: 0; color: inherit; }
    .nav-label { font-size: 0.875rem; font-weight: 500; }

    .sidebar-toggle {
      position: absolute;
      bottom: 20px;
      right: -12px;
      width: 24px; height: 24px;
      background: var(--bg-surface-2);
      border: 1px solid var(--border-moderate);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      color: var(--text-muted);
      z-index: 10;
      .material-icons { font-size: 16px; }
      &:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    }

    /* === MAIN AREA === */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* === HEADER === */
    .top-header {
      height: var(--header-height);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-xl);
      flex-shrink: 0;
    }

    .header-left { display: flex; align-items: center; gap: var(--space-md); }
    .header-right { display: flex; align-items: center; gap: var(--space-md); }

    .page-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
    }
    .breadcrumb-icon { font-size: 18px; color: var(--color-primary); }

    .header-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(0,212,255,0.08);
      border: 1px solid rgba(0,212,255,0.2);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      color: var(--color-accent);
      font-weight: 500;
    }

    .header-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-moderate);
      background: none;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      .material-icons { font-size: 16px; }
      &:hover { color: var(--color-danger); border-color: var(--color-danger); background: rgba(239,68,68,0.08); }
    }

    /* === CONTENT === */
    .content-area {
      flex: 1;
      overflow-y: auto;
      background: var(--bg-page);
    }
  `]
})
export class ShellComponent {
  private auth = inject(AuthService);
  sidebarCollapsed = signal(false);

  currentUser = this.auth.currentUser;
  isHrOrAdmin = this.auth.isHrOrAdmin;

  initials = computed(() => {
    const email = this.currentUser()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  private readonly NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',     route: '/dashboard' },
    { label: 'Employees',     icon: 'people',        route: '/employees' },
    { label: 'Skills',        icon: 'psychology',    route: '/skills' },
    { label: 'Competency',    icon: 'verified',      route: '/competency' },
    { label: 'Courses',       icon: 'school',        route: '/courses' },
    { label: 'Learning Paths',icon: 'route',         route: '/learning-paths' },
    { label: 'My Learning',   icon: 'auto_stories',  route: '/my-learning' },
  ];

  visibleNav = computed(() => {
    const role = this.currentUser()?.role;
    return this.NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role ?? ''));
  });

  formatRole(role?: string): string {
    const map: Record<string, string> = {
      ADMIN: 'Administrator',
      HR_MANAGER: 'HR Manager',
      TRAINING_MANAGER: 'Training Manager',
      EMPLOYEE: 'Employee',
    };
    return map[role ?? ''] ?? role ?? '';
  }

  logout(): void { this.auth.logout(); }
}
