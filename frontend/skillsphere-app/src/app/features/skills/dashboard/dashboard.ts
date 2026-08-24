import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { AuthService } from '../../../core/auth.service';
import { EmployeeService, Skill, EmployeeSkill, Employee } from '../employee.service';
import { LearningService } from '../../learning/learning.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
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
          title="Dashboard" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- ==================== ADMIN DASHBOARD ==================== -->
          @if (authService.role() === 'ADMIN') {
            <div class="dashboard-section animate-fade-in">
              <h2 class="section-title">System Administration</h2>
              
              <!-- Admin Stats Grid -->
              <div class="stats-grid">
                <app-stat-card 
                  title="Total Employees" 
                  [value]="adminStats().employeesCount" 
                  icon="users"
                />
                <app-stat-card 
                  title="HR Managers" 
                  [value]="adminStats().hrManagersCount" 
                  icon="users"
                />
                <app-stat-card 
                  title="Skills Tracked" 
                  [value]="adminStats().skillsCount" 
                  icon="activity"
                />
                <app-stat-card 
                  title="Pending Approvals" 
                  [value]="adminStats().pendingApprovalsCount" 
                  icon="award"
                />
              </div>

              <!-- Pending Approvals Section -->
              <div class="dashboard-card-full">
                <div class="card-header">
                  <h3>Requests Pending Approval</h3>
                  <span class="badge badge-pending">{{ pendingRequests().length }} pending</span>
                </div>
                
                @if (loadingPending()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading requests...</p>
                  </div>
                } @else if (pendingRequests().length === 0) {
                  <div class="empty-state-dashed">
                    <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 12h8"></path>
                    </svg>
                    <p class="empty-text">No pending registration requests.</p>
                  </div>
                } @else {
                  <div class="table-container">
                    <table class="dense-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Email Address</th>
                          <th>Requested Role</th>
                          <th>Request Date</th>
                          <th class="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (req of pendingRequests(); track req.userId) {
                          <tr>
                            <td class="font-medium text-white">{{ req.name || 'Unnamed Applicant' }}</td>
                            <td>{{ req.email }}</td>
                            <td>
                              <span class="badge" [ngClass]="req.role === 'HR_MANAGER' ? 'badge-hr' : 'badge-emp'">
                                {{ req.role === 'HR_MANAGER' ? 'HR Manager' : 'Employee' }}
                              </span>
                            </td>
                            <td>{{ req.createdAt | date:'short' }}</td>
                            <td class="text-right actions-cell">
                              <button class="btn-action btn-approve" (click)="approveUser(req.userId)">
                                Approve
                              </button>
                              <button class="btn-action btn-reject" (click)="rejectUser(req.userId)">
                                Reject
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ==================== HR MANAGER DASHBOARD ==================== -->
          @if (authService.role() === 'HR_MANAGER') {
            <div class="dashboard-section animate-fade-in">
              <h2 class="section-title">Workforce Overview</h2>
              
              <!-- HR Stats Grid -->
              <div class="stats-grid">
                <app-stat-card 
                  title="Employees" 
                  [value]="hrStats().employeesCount" 
                  icon="users"
                />
                <app-stat-card 
                  title="Skills Tracked" 
                  [value]="hrStats().skillsTrackedCount" 
                  icon="activity"
                />
                <app-stat-card 
                  title="Assessments This Month" 
                  [value]="hrStats().assessmentsThisMonthCount" 
                  icon="award"
                />
              </div>

              <!-- Shortcut actions & Recent employees -->
              <div class="hr-grid-layout">
                <!-- Action Panels -->
                <div class="dashboard-card">
                  <h3>Quick Actions</h3>
                  <div class="quick-actions-list">
                    <a routerLink="/employees" class="action-link">
                      <div class="action-icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="link-svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                      </div>
                      <div class="action-details">
                        <span class="action-title-text">Workforce Directory</span>
                        <span class="action-desc-text">Manage employees and view skill profiles</span>
                      </div>
                    </a>
                    
                    <a routerLink="/learning/courses" class="action-link">
                      <div class="action-icon-box box-purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="link-svg"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      </div>
                      <div class="action-details">
                        <span class="action-title-text">Course Catalog</span>
                        <span class="action-desc-text">Create and configure training courses</span>
                      </div>
                    </a>

                    <a routerLink="/learning/paths" class="action-link">
                      <div class="action-icon-box box-blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="link-svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>
                      </div>
                      <div class="action-details">
                        <span class="action-title-text">Learning Paths</span>
                        <span class="action-desc-text">Design curricula for career advancement</span>
                      </div>
                    </a>
                  </div>
                </div>

                <!-- Recent Employees List -->
                <div class="dashboard-card">
                  <h3>Recent Team Members</h3>
                  @if (loadingEmployees()) {
                    <div class="loading-state">
                      <div class="spinner"></div>
                    </div>
                  } @else if (recentEmployees().length === 0) {
                    <div class="empty-state-dashed">
                      <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
                      </svg>
                      <p class="empty-text">No team members registered yet.</p>
                    </div>
                  } @else {
                    <div class="recent-list">
                      @for (emp of recentEmployees(); track emp.id) {
                        <div class="recent-item">
                          <div class="emp-avatar">
                            <svg class="avatar-icon-svg-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </div>
                          <div class="emp-info">
                            <span class="emp-name text-white">{{ emp.name }}</span>
                            <span class="emp-role-title">{{ emp.roleTitle }} &bull; {{ emp.department }}</span>
                          </div>
                          <div class="emp-badge">
                            <span class="rating-pill">{{ emp.rating }} ★</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- ==================== EMPLOYEE DASHBOARD ==================== -->
          @if (authService.role() === 'EMPLOYEE') {
            <div class="dashboard-section animate-fade-in">
              <!-- Employee Header Card -->
              <div class="employee-profile-card">
                <div class="avatar-large">
                  <svg class="avatar-icon-svg-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="profile-summary">
                  <h2>Welcome back, {{ employeeProfile()?.name }}!</h2>
                  <p class="role-subtitle">{{ employeeProfile()?.roleTitle }} &bull; {{ employeeProfile()?.department }}</p>
                  <div class="experience-bar">
                    <span class="exp-text">{{ employeeProfile()?.experienceYears }} Years Experience</span>
                    <span class="divider">|</span>
                    <span class="rating-text">Rating: {{ employeeProfile()?.rating }} ★</span>
                  </div>
                </div>
                <div class="profile-actions">
                  <a routerLink="/profile" class="btn btn-secondary">Edit Profile</a>
                </div>
              </div>

              <!-- Employee Stats -->
              <div class="stats-grid">
                <app-stat-card 
                  title="My Skills" 
                  [value]="mySkills().length" 
                  icon="activity"
                />
                <app-stat-card 
                  title="Active Courses" 
                  [value]="learningStats().activeEnrollmentsCount" 
                  icon="users"
                />
                <app-stat-card 
                  title="Completed Courses" 
                  [value]="learningStats().completedCoursesCount" 
                  icon="award"
                />
              </div>

              <!-- Connected Growth Journey Pipeline -->
              <div class="dashboard-card-full glass-card animate-fade-in" style="margin-bottom: 24px;">
                <h3>Your Growth Journey Loop</h3>
                <div class="connected-journey-row">
                  <!-- Node 1: Skills -->
                  <div class="journey-node" style="border-left: 3px solid var(--primary-accent);">
                    <span style="font-size: 10px; font-weight: bold; color: var(--primary-accent);">CAPABILITY</span>
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">{{ mySkills().length }} Mapped Skills</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Self-reported & Verified</span>
                  </div>
                  
                  <!-- Arrow 1 -->
                  <div style="color: var(--text-muted); font-size: 18px;">➜</div>
                  
                  <!-- Node 2: Learning -->
                  <div class="journey-node" style="border-left: 3px solid #a855f7;">
                    <span style="font-size: 10px; font-weight: bold; color: #a855f7;">DEVELOPMENT</span>
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">{{ learningStats().activeEnrollmentsCount }} Active Courses</span>
                    <span style="font-size: 11px; color: var(--text-muted);">{{ learningStats().completedCoursesCount }} Completed</span>
                  </div>
                  
                  <!-- Arrow 2 -->
                  <div style="color: var(--text-muted); font-size: 18px;">➜</div>
                  
                  <!-- Node 3: Validation (Certifications) -->
                  <div class="journey-node" style="border-left: 3px solid #10b981;">
                    <span style="font-size: 10px; font-weight: bold; color: #10b981;">VALIDATION</span>
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">Certifications</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Active & Verified</span>
                  </div>
                  
                  <!-- Arrow 3 -->
                  <div style="color: var(--text-muted); font-size: 18px;">➜</div>
                  
                  <!-- Node 4: Career Growth -->
                  <div class="journey-node" style="border-left: 3px solid #3b82f6;">
                    <span style="font-size: 10px; font-weight: bold; color: #3b82f6;">GROWTH</span>
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">{{ employeeProfile()?.roleTitle || 'Developer' }}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Target progression track</span>
                  </div>
                </div>
              </div>

              <!-- Skill Mapping and Course List -->
              <div class="employee-dashboard-grid">
                <!-- My Skills Column -->
                <div class="dashboard-card">
                  <div class="card-header">
                    <h3>My Skills</h3>
                    <button class="btn btn-primary btn-sm" (click)="toggleSkillForm()">
                      {{ showSkillForm() ? 'Cancel' : '+ Map Skill' }}
                    </button>
                  </div>

                  <!-- Quick Skill Mapping Form -->
                  @if (showSkillForm()) {
                    <form (ngSubmit)="onMapSkill()" class="quick-form animate-slide-down">
                      <div class="form-group">
                        <label for="skillSelect">Select Skill</label>
                        <div class="select-wrapper">
                          <select id="skillSelect" [(ngModel)]="newSkillId" name="newSkillId" required class="form-control select-input">
                            <option value="">Choose a skill...</option>
                            @for (sk of availableSkills(); track sk.id) {
                              <option [value]="sk.id">{{ sk.name }} ({{ sk.category }})</option>
                            }
                          </select>
                        </div>
                      </div>
                      
                      <div class="form-group">
                        <label for="proficiency">Proficiency Level (1 - 10)</label>
                        <input 
                          type="number" 
                          id="proficiency" 
                          [(ngModel)]="newSkillProficiency" 
                          name="newSkillProficiency" 
                          min="1" 
                          max="10" 
                          required 
                          class="form-control"
                        />
                      </div>

                      <button type="submit" class="btn btn-primary btn-block" [disabled]="!newSkillId || newSkillProficiency < 1 || newSkillProficiency > 10">
                        Add to Profile
                      </button>
                    </form>
                  }

                  <!-- Mapped Skills List -->
                  @if (mySkills().length === 0) {
                    <div class="empty-state-dashed">
                      <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline>
                      </svg>
                      <p class="empty-text">No skills mapped yet. Add a skill to build your competency profile!</p>
                    </div>
                  } @else {
                    <div class="skills-list">
                      @for (sk of mySkills(); track sk.skillId) {
                        <div class="skill-item">
                          <div class="skill-info-row">
                            <span class="skill-name text-white">{{ sk.skillName }}</span>
                            <span class="skill-category-badge">{{ sk.category }}</span>
                          </div>
                          
                          <div class="skill-progress-container">
                            <div class="progress-bar-bg">
                              <div class="progress-bar-fill" [style.width.%]="sk.proficiency * 10"></div>
                            </div>
                            <span class="proficiency-value">{{ sk.proficiency }}/10</span>
                          </div>

                          <div class="skill-footer-row">
                            @if (sk.verified) {
                              <span class="badge-verified">✓ Verified</span>
                            } @else {
                              <span class="badge-pending">Pending Verification</span>
                            }
                            <span class="update-time">Updated {{ sk.updatedAt | date:'shortDate' }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Learning Section Column -->
                <div class="dashboard-card">
                  <h3>Active Learning Enrollments</h3>
                  @if (myEnrollments().length === 0) {
                    <div class="empty-state-dashed">
                      <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                      </svg>
                      <p class="empty-text">No active course enrollments.</p>
                      <a routerLink="/learning/courses" class="btn btn-secondary btn-sm" style="margin-top: 8px; width: fit-content; align-self: center;">Browse Courses</a>
                    </div>
                  } @else {
                    <div class="enrollment-list">
                      @for (enr of myEnrollments(); track enr.id) {
                        <div class="enrollment-item">
                          <div class="enr-header">
                            <span class="enr-title text-white">{{ enr.courseTitle || enr.learningPathTitle }}</span>
                            <span class="enr-type">{{ enr.courseTitle ? 'Course' : 'Learning Path' }}</span>
                          </div>
                          <div class="progress-container">
                            <div class="progress-bar-bg">
                              <div class="progress-bar-fill fill-purple" [style.width.%]="enr.progressPercent"></div>
                            </div>
                            <span class="progress-percent">{{ enr.progressPercent }}%</span>
                          </div>
                          <div class="enr-footer">
                            <span class="enr-status">Status: {{ enr.status }}</span>
                            <button class="btn-progress" (click)="incrementProgress(enr)">Update Progress</button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .dashboard-card-full, .dashboard-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        color: var(--text-primary);
        margin: 0;
      }
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 100px;
    }
    .badge-pending {
      background-color: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-hr {
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
      border: 1px solid rgba(234, 88, 12, 0.2);
    }
    .badge-emp {
      background-color: rgba(14, 165, 233, 0.1);
      color: var(--secondary-light);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }
    .badge-verified {
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
    }
    .empty-state-dashed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      text-align: center;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      color: var(--text-muted);
      gap: 12px;
      width: 100%;
    }
    .empty-icon-subtle {
      width: 32px;
      height: 32px;
      color: #4b5563;
    }
    .empty-text {
      font-size: 13px;
      margin: 0;
      color: var(--text-secondary);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      
      th {
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
      }
      
      td {
        color: var(--text-secondary);
        font-size: 14px;
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
      }
    }
    .text-right { text-align: right; }
    .text-white { color: var(--text-primary); }
    .font-medium { font-weight: 500; }
    
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn-action {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-approve {
      background-color: #10b981;
      color: white;
      &:hover { background-color: #059669; }
    }
    .btn-reject {
      background-color: #ef4444;
      color: white;
      &:hover { background-color: #dc2626; }
    }
    
    /* HR Grid */
    .hr-grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }
    .quick-actions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .action-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.3s;
      
      &:hover {
        border-color: var(--primary-accent);
        background-color: #1e293b;
      }
    }
    .action-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
      flex-shrink: 0;
      
      &.box-purple { background-color: rgba(234, 88, 12, 0.1); color: var(--primary-light); }
      &.box-blue { background-color: rgba(14, 165, 233, 0.1); color: var(--secondary-light); }
    }
    .link-svg {
      width: 20px;
      height: 20px;
    }
    .action-details {
      display: flex;
      flex-direction: column;
    }
    .action-title-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .action-desc-text {
      font-size: 12px;
      color: var(--text-muted);
    }
    
    /* Recent Employees */
    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .recent-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background-color: var(--bg-main);
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    .emp-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-icon-svg-small {
      width: 18px;
      height: 18px;
      color: var(--text-primary);
    }
    .emp-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .emp-name {
      font-size: 14px;
      font-weight: 600;
    }
    .emp-role-title {
      font-size: 12px;
      color: var(--text-muted);
    }
    .rating-pill {
      font-size: 12px;
      font-weight: 600;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    /* Employee Card */
    .employee-profile-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 28px;
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      
      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
      }
    }
    .avatar-large {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(234, 88, 12, 0.4);
    }
    .avatar-icon-svg-large {
      width: 36px;
      height: 36px;
      color: var(--text-primary);
    }
    .profile-summary {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      h2 {
        font-family: 'Outfit', sans-serif;
        color: var(--text-primary);
        margin: 0;
        font-size: 22px;
      }
    }
    .role-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0;
    }
    .experience-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 6px;
      
      @media (max-width: 768px) {
        justify-content: center;
      }
    }
    .rating-text {
      color: #fbbf24;
      font-weight: 600;
    }
    .profile-actions {
      flex-shrink: 0;
    }
    
    .employee-dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }
    
    /* Skills */
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .skill-item {
      background-color: var(--bg-main);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .skill-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .skill-name {
      font-size: 15px;
      font-weight: 600;
    }
    .skill-category-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .skill-progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-bar-bg {
      flex-grow: 1;
      height: 6px;
      background-color: #1e293b;
      border-radius: 100px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background-color: #10b981;
      border-radius: 100px;
    }
    .fill-purple {
      background-color: var(--primary-accent);
    }
    .proficiency-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      width: 32px;
      text-align: right;
    }
    .skill-footer-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
    }
    
    /* Enrollments */
    .enrollment-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .enrollment-item {
      background-color: var(--bg-main);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .enr-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .enr-title {
      font-size: 15px;
      font-weight: 600;
    }
    .enr-type {
      font-size: 11px;
      color: var(--primary-accent);
      background-color: rgba(234, 88, 12, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-percent {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .enr-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
    }
    .btn-progress {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: rgba(234, 88, 12, 0.1);
        color: var(--primary-light);
        border-color: var(--primary-accent);
      }
    }
    
    /* Alerts */
    .alert-banner {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      animation: slideDown 0.3s ease-out;
    }
    .alert-success {
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .alert-close-btn {
      background: none;
      border: none;
      color: inherit;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    
    /* Quick mapping form */
    .quick-form {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .btn-block { width: 100%; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly learningService = inject(LearningService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // States
  readonly adminStats = signal<any>({ employeesCount: 0, hrManagersCount: 0, skillsCount: 0, pendingApprovalsCount: 0 });
  readonly pendingRequests = signal<any[]>([]);
  readonly loadingPending = signal(false);

  readonly hrStats = signal<any>({ employeesCount: 0, skillsTrackedCount: 0, assessmentsThisMonthCount: 0 });
  readonly recentEmployees = signal<Employee[]>([]);
  readonly loadingEmployees = signal(false);

  readonly employeeProfile = signal<Employee | null>(null);
  readonly mySkills = signal<EmployeeSkill[]>([]);
  readonly myEnrollments = signal<any[]>([]);
  readonly learningStats = signal<any>({ activeEnrollmentsCount: 0, completedCoursesCount: 0, completedLearningPathsCount: 0 });

  // Skill Mapping State
  readonly showSkillForm = signal(false);
  readonly availableSkills = signal<Skill[]>([]);
  newSkillId = '';
  newSkillProficiency = 5;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const role = this.authService.role();
    
    if (role === 'ADMIN') {
      this.loadAdminDashboard();
    } else if (role === 'HR_MANAGER') {
      this.loadHrDashboard();
    } else if (role === 'EMPLOYEE') {
      this.loadEmployeeDashboard();
    }
  }

  // --- ADMIN METHODS ---
  loadAdminDashboard() {
    this.employeeService.getAdminStats().subscribe({
      next: stats => this.adminStats.set(stats),
      error: () => this.showFeedback('Failed to load administrative stats.', 'danger')
    });

    this.loadingPending.set(true);
    this.employeeService.getPendingApprovals().subscribe({
      next: list => {
        this.pendingRequests.set(list);
        this.loadingPending.set(false);
      },
      error: () => {
        this.showFeedback('Failed to load pending registration requests.', 'danger');
        this.loadingPending.set(false);
      }
    });
  }

  approveUser(userId: string) {
    this.employeeService.approveUser(userId).subscribe({
      next: () => {
        this.showFeedback('Registration request approved successfully.', 'success');
        this.loadAdminDashboard();
      },
      error: () => this.showFeedback('Failed to approve registration request.', 'danger')
    });
  }

  rejectUser(userId: string) {
    this.employeeService.rejectUser(userId).subscribe({
      next: () => {
        this.showFeedback('Registration request rejected and deleted.', 'success');
        this.loadAdminDashboard();
      },
      error: () => this.showFeedback('Failed to reject registration request.', 'danger')
    });
  }

  // --- HR MANAGER METHODS ---
  loadHrDashboard() {
    this.employeeService.getDashboardStats().subscribe({
      next: stats => this.hrStats.set(stats),
      error: () => this.showFeedback('Failed to load workforce statistics.', 'danger')
    });

    this.loadingEmployees.set(true);
    this.employeeService.getEmployees(undefined, 0, 5).subscribe({
      next: page => {
        this.recentEmployees.set(page.content);
        this.loadingEmployees.set(false);
      },
      error: () => {
        this.showFeedback('Failed to load recent employee records.', 'danger');
        this.loadingEmployees.set(false);
      }
    });
  }

  // --- EMPLOYEE METHODS ---
  loadEmployeeDashboard() {
    const empId = this.authService.employeeId();
    if (!empId) {
      this.showFeedback('No profile ID associated with your account.', 'danger');
      return;
    }

    this.employeeService.getEmployeeById(empId).subscribe({
      next: profile => this.employeeProfile.set(profile),
      error: () => this.showFeedback('Failed to load your employee profile details.', 'danger')
    });

    this.employeeService.getEmployeeSkills(empId).subscribe({
      next: skills => this.mySkills.set(skills),
      error: () => this.showFeedback('Failed to load your skill profile.', 'danger')
    });

    this.learningService.getEnrollmentsByEmployee(empId).subscribe({
      next: list => {
        // filter down to current non-completed enrollments
        this.myEnrollments.set(list.filter(e => e.status !== 'COMPLETED'));
      },
      error: () => this.showFeedback('Failed to load learning enrollments.', 'danger')
    });

    this.learningService.getStatsByEmployee(empId).subscribe({
      next: stats => this.learningStats.set(stats),
      error: () => this.showFeedback('Failed to retrieve course completion statistics.', 'danger')
    });

    // Load available skills for mapping
    this.employeeService.getAllSkills().subscribe({
      next: skills => {
        this.availableSkills.set(skills);
      }
    });
  }

  toggleSkillForm() {
    this.showSkillForm.set(!this.showSkillForm());
    this.newSkillId = '';
    this.newSkillProficiency = 5;
  }

  onMapSkill() {
    const empId = this.authService.employeeId();
    if (!empId || !this.newSkillId) return;

    this.employeeService.mapEmployeeSkill(empId, {
      skillId: this.newSkillId,
      proficiency: this.newSkillProficiency,
      verified: false
    }).subscribe({
      next: () => {
        this.showFeedback('Skill mapped successfully! Verification is pending.', 'success');
        this.toggleSkillForm();
        this.loadEmployeeDashboard(); // Refresh skills
      },
      error: () => this.showFeedback('Failed to map skill to profile.', 'danger')
    });
  }

  incrementProgress(enrollment: any) {
    const nextProgress = Math.min(enrollment.progressPercent + 10, 100);
    
    if (nextProgress === 100) {
      // Trigger completion
      this.learningService.completeEnrollment(enrollment.id, 90).subscribe({
        next: () => {
          this.showFeedback(`Congratulations! You completed: ${enrollment.courseTitle || enrollment.learningPathTitle}`, 'success');
          this.loadEmployeeDashboard();
        },
        error: () => this.showFeedback('Failed to mark course as completed.', 'danger')
      });
    } else {
      this.learningService.updateProgress(enrollment.id, nextProgress).subscribe({
        next: () => {
          this.showFeedback('Course progress updated.', 'success');
          this.loadEmployeeDashboard();
        },
        error: () => this.showFeedback('Failed to update course progress.', 'danger')
      });
    }
  }

  // --- GENERAL FEEDBACK HELPERS ---
  showFeedback(message: string, type: 'success' | 'danger') {
    if (type === 'success') {
      this.notificationService.success('Success', message);
    } else {
      this.notificationService.error('Error', message);
    }
  }
}
