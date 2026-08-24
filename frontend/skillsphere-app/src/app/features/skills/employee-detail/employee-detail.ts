import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  EmployeeService, 
  Employee, 
  EmployeeSkill, 
  Assessment, 
  SkillGap, 
  Skill 
} from '../employee.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { HexGaugeComponent } from '../../../shared/hex-gauge/hex-gauge';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    HexGaugeComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          [title]="pageTitle()" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <div class="back-link">
            <a routerLink="/employees" class="back-btn">
              <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to workforce list
            </a>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading profile details...</p>
            </div>
          } @else if (employee() === null) {
            <div class="empty-state">
              <h3>Profile not found</h3>
              <p>The requested employee profile does not exist or has been removed.</p>
            </div>
          } @else {
            <!-- Profile Header Card -->
            <div class="profile-header-card animate-fade-in">
              <div class="profile-identity">
                <div class="avatar-stub">
                  {{ getInitials(employee()?.name) }}
                </div>
                <div class="identity-info">
                  <h2>{{ employee()?.name }}</h2>
                  <p class="role-title">{{ employee()?.roleTitle }}</p>
                  <div class="badge-row">
                    <span class="info-badge">{{ employee()?.department }}</span>
                    <span class="info-badge font-secondary">{{ employee()?.experienceYears }} Yrs Exp</span>
                  </div>
                  @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                      <a 
                        [routerLink]="['/career/plan']" 
                        [queryParams]="{ employeeId: employee()?.id }" 
                        class="btn btn-primary btn-xs"
                        style="text-decoration: none; font-size: 11px; padding: 4px 8px; line-height: 1;"
                      >
                        Manage Career Plan
                      </a>
                      <a 
                        [routerLink]="['/career/roadmap']" 
                        [queryParams]="{ employeeId: employee()?.id }" 
                        class="btn btn-secondary btn-xs"
                        style="text-decoration: none; font-size: 11px; padding: 4px 8px; line-height: 1;"
                      >
                        View Roadmap
                      </a>
                    </div>
                  }
                </div>
              </div>
              
              <div class="profile-stats">
                <div class="rating-box">
                  @if (isEditingRating()) {
                    <div class="rating-edit-container">
                      <div class="rating-edit-row">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1.0" 
                          max="5.0" 
                          [(ngModel)]="tempRating" 
                          class="rating-number-input"
                          aria-label="Edit Rating"
                        />
                        <div class="edit-action-btns">
                          <button class="btn btn-primary btn-xs" (click)="saveRating()" title="Save Rating" aria-label="Save Rating">✓</button>
                          <button class="btn btn-secondary btn-xs" (click)="cancelEditRating()" title="Cancel Edit" aria-label="Cancel Edit">&times;</button>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div style="display: flex; align-items: center;">
                      <span class="rating-value">{{ employee()?.rating | number:'1.1-2' }}</span>
                      @if (canEditRating()) {
                        <button class="btn-edit-rating" (click)="startEditRating()" title="Edit Rating" aria-label="Edit Rating">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                      }
                    </div>
                  }
                  <div class="rating-stars">
                    <svg class="star-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Performance Rating</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Layout Details Split -->
            <div class="details-layout animate-fade-in" style="animation-delay: 0.1s">
              <!-- Left Column: Skills & Assessments -->
              <div class="details-left">
                <!-- Skill Profile Section -->
                <div class="section-card">
                  <div class="card-header">
                    <h2>Tracked Competencies</h2>
                    @if (canMapOrAssess()) {
                      <button class="btn btn-secondary btn-sm" (click)="showAddSkillForm.set(!showAddSkillForm())">
                        {{ showAddSkillForm() ? 'Cancel' : 'Map Skill' }}
                      </button>
                    }
                  </div>
                  
                  <!-- Add Skill Inline Form -->
                  @if (showAddSkillForm()) {
                    <div class="inline-form-card">
                      <h3>Map Skill to Profile</h3>
                      <div class="inline-form-grid">
                        <div class="form-group">
                          <label for="selectSkill">Select Skill</label>
                          <select id="selectSkill" class="form-control" [(ngModel)]="newSkillId">
                            <option value="">Choose skill...</option>
                            @for (sk of allAvailableSkills(); track sk.id) {
                              <option [value]="sk.id">{{ sk.name }} ({{ sk.category }})</option>
                            }
                          </select>
                        </div>
                        <div class="form-group">
                          <label for="selectProf">Proficiency Level (0-10)</label>
                          <select id="selectProf" class="form-control" [(ngModel)]="newSkillProf">
                            @for (l of [0,1,2,3,4,5,6,7,8,9,10]; track l) {
                              <option [value]="l">Level {{ l }}</option>
                            }
                          </select>
                        </div>
                      </div>
                      <div class="inline-form-actions">
                        <button class="btn btn-primary btn-sm" (click)="saveMappedSkill()">Save Mapping</button>
                      </div>
                    </div>
                  }
                  
                  @if (skills().length === 0) {
                    <div class="empty-section">
                      <p>No competencies currently mapped on file. Map a skill above to start tracking proficiency.</p>
                    </div>
                  } @else {
                    <div class="skills-grid">
                      @for (es of skills(); track es.skillId) {
                        <div class="skill-profile-card">
                          <app-hex-gauge [value]="es.proficiency" />
                          <div class="skill-card-info">
                            <span class="skill-name">{{ es.skillName }}</span>
                            <span class="skill-cat">{{ es.category }}</span>
                            <div class="skill-meta">
                              @if (es.verified) {
                                <span class="text-success-light">✓ Verified</span>
                              } @else {
                                <span class="text-muted-light">Self-assessed</span>
                              }
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Assessments History Log -->
                <div class="section-card">
                  <div class="card-header">
                    <h2>Assessments History</h2>
                    @if (canMapOrAssess()) {
                      <button class="btn btn-secondary btn-sm" (click)="showAssessmentForm.set(!showAssessmentForm())">
                        {{ showAssessmentForm() ? 'Cancel' : 'Assess Skill' }}
                      </button>
                    }
                  </div>
                  
                  <!-- Add Assessment Inline Form -->
                  @if (showAssessmentForm()) {
                    <div class="inline-form-card">
                      <h3>Log Assessment Result</h3>
                      <div class="inline-form-grid">
                        <div class="form-group">
                          <label for="topic">Assessment / Topic Name</label>
                          <input type="text" id="topic" class="form-control" [(ngModel)]="assessTopic" placeholder="e.g. Java Advanced Concepts" />
                        </div>
                        <div class="form-group">
                          <label for="score">Score (0-100)</label>
                          <input type="number" id="score" class="form-control" [(ngModel)]="assessScore" min="0" max="100" />
                        </div>
                      </div>
                      <div class="inline-form-actions">
                        <button class="btn btn-primary btn-sm" (click)="saveAssessment()">Submit Assessment</button>
                      </div>
                    </div>
                  }

                  @if (assessments().length === 0) {
                    <div class="empty-section">
                      <p>No verified assessments taken yet. Add one above to register score.</p>
                    </div>
                  } @else {
                    <div class="table-container">
                      <table class="dense-table" role="grid" aria-label="Assessments History">
                        <thead>
                          <tr>
                            <th>Topic / Subject</th>
                            <th>Taken On</th>
                            <th>Score</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (a of assessments(); track a.id) {
                            <tr>
                              <td class="font-semibold">{{ a.skillOrTopic }}</td>
                              <td>{{ a.takenAt | date:'mediumDate' }}</td>
                              <td>{{ a.score }}%</td>
                              <td>
                                <app-status-badge [status]="a.passed" />
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </div>

              <!-- Right Column: Framework Gaps & Milestone Stubs -->
              <div class="details-right">
                <!-- Competency Gaps Frame -->
                <div class="section-card">
                  <div class="card-header">
                    <h2>Target Role Gaps</h2>
                    <span class="target-role-label">Role: {{ employee()?.roleTitle }}</span>
                  </div>
                  
                  @if (gaps().length === 0) {
                    <div class="empty-section">
                      <p>No framework guidelines mapped for this target role: "{{ employee()?.roleTitle }}".</p>
                    </div>
                  } @else {
                    <div class="table-container">
                      <table class="dense-table" role="grid" aria-label="Competency Gaps">
                        <thead>
                          <tr>
                            <th>Skill</th>
                            <th>Req. Level</th>
                            <th>Actual</th>
                            <th>Gap Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (g of gaps(); track g.skillId) {
                            <tr>
                              <td class="font-semibold">{{ g.skillName }}</td>
                              <td>Level {{ g.requiredLevel }}</td>
                              <td>Level {{ g.actualLevel }}</td>
                              <td>
                                @if (g.gap === 0) {
                                  <app-status-badge status="valid" />
                                } @else {
                                  <span class="gap-danger-badge">-{{ g.gap }} Levels</span>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>

                <!-- Stub Modules Quick Actions -->
                <div class="section-card actions-card">
                  <h2>Future Learning & Growth</h2>
                  <p class="actions-p">These planning tools sync with future milestone development services.</p>
                  
                  <div class="stub-button-stack">
                    <button class="btn btn-secondary w-full stub-btn" (click)="onStubAlert('Learning Paths (Milestone 2)')">
                      <svg class="stub-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                      Course & Learning Paths
                    </button>
                    
                    <a class="btn btn-secondary w-full stub-btn" [routerLink]="['/certifications/list']" [queryParams]="{ employeeId: employee()?.id }">
                      <svg class="stub-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      Manage Certifications
                    </a>
                    
                    <button class="btn btn-secondary w-full stub-btn" (click)="onStubAlert('Career Mapping & Internal Postings (Milestone 4)')">
                      <svg class="stub-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                      Career Plans & Promotions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
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
      margin-bottom: 60px;
    }
    @media (min-width: 769px) {
      .content-wrapper {
        margin-bottom: 0;
      }
    }
    .main-content {
      padding: 32px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    .back-link {
      margin-bottom: 20px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.3s ease;
      
      &:hover {
        color: var(--primary-accent);
      }
    }
    .back-icon {
      width: 16px;
      height: 16px;
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(234, 88, 12, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-accent);
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Profile identity header */
    .profile-header-card {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .profile-identity {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .avatar-stub {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
    }
    .identity-info {
      h2 {
        font-size: 22px;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .role-title {
        color: var(--text-secondary);
        font-size: 14px;
        margin-bottom: 8px;
      }
    }
    .badge-row {
      display: flex;
      gap: 8px;
    }
    .info-badge {
      background-color: rgba(2, 132, 199, 0.1);
      color: var(--secondary-light);
      border: 1px solid rgba(2, 132, 199, 0.25);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      
      &.font-secondary {
        background-color: rgba(234, 88, 12, 0.1);
        color: var(--primary-light);
        border-color: rgba(234, 88, 12, 0.25);
      }
    }
    
    .rating-box {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .rating-value {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    /* Rating Edit Container styles */
    .rating-edit-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .rating-edit-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rating-number-input {
      width: 60px;
      padding: 4px 6px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      outline: none;
      
      &:focus {
        border-color: var(--primary-accent);
      }
    }
    .btn-edit-rating {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      margin-left: 8px;
      
      &:hover {
        background-color: rgba(234, 88, 12, 0.1);
        color: var(--primary-light);
      }
      
      svg {
        width: 14px;
        height: 14px;
      }
    }
    .edit-action-btns {
      display: flex;
      gap: 4px;
      
      .btn-xs {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
    .rating-stars {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
      
      .star-icon {
        width: 14px;
        height: 14px;
        color: #fbbf24;
      }
    }

    /* Details splits */
    .details-layout {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .details-layout {
        grid-template-columns: 1fr;
      }
    }
    .section-card {
      padding: 24px;
      margin-bottom: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h2 {
        font-size: 18px;
        color: var(--text-primary);
      }
    }
    
    /* Inline form styles */
    .inline-form-card {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      
      h3 {
        font-size: 14px;
        color: var(--text-primary);
        margin-bottom: 12px;
      }
    }
    .inline-form-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .inline-form-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Tracked competencies list */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .skill-profile-card {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: border-color 0.3s ease;
      
      &:hover {
        border-color: var(--primary-accent);
      }
    }
    .skill-card-info {
      display: flex;
      flex-direction: column;
    }
    .skill-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }
    .skill-cat {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.02em;
      margin-bottom: 6px;
    }
    .skill-meta {
      font-size: 11px;
    }
    .text-success-light {
      color: #34d399;
      font-weight: 500;
    }
    .text-muted-light {
      color: var(--text-muted);
    }
    .empty-section {
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
      background-color: var(--bg-main);
      border: 1px dashed var(--border-color);
      border-radius: 8px;
    }
    
    .target-role-label {
      background-color: rgba(234, 88, 12, 0.12);
      color: var(--primary-light);
      border: 1px solid rgba(234, 88, 12, 0.2);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .gap-danger-badge {
      background-color: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      display: inline-block;
    }
    
    .actions-card {
      background: linear-gradient(180deg, var(--bg-card), var(--bg-sidebar));
    }
    .actions-p {
      color: var(--text-secondary);
      font-size: 13px;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .stub-button-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .stub-btn {
      width: 100%;
      justify-content: flex-start;
      gap: 12px;
      font-size: 13px;
      border-color: var(--border-color);
      height: 42px;
      
      &:hover {
        border-color: var(--primary-accent);
        color: var(--primary-light);
      }
    }
    .stub-icon {
      width: 18px;
      height: 18px;
      color: var(--text-muted);
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  protected readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // Signals
  readonly employee = signal<Employee | null>(null);
  readonly skills = signal<EmployeeSkill[]>([]);
  readonly assessments = signal<Assessment[]>([]);
  readonly gaps = signal<SkillGap[]>([]);
  
  readonly allAvailableSkills = signal<Skill[]>([]);
  readonly loading = signal(true);
  
  readonly pageTitle = signal<string>('Employee Detail');

  // Inline forms
  readonly showAddSkillForm = signal(false);
  newSkillId = '';
  newSkillProf = 5;

  readonly showAssessmentForm = signal(false);
  assessTopic = '';
  assessScore = 80;

  // Rating editing
  readonly isEditingRating = signal(false);
  tempRating = 5.0;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProfile(id);
      } else {
        this.router.navigate(['/employees']);
      }
    });
    
    // Pre-load all available skills for the map dropdown
    this.employeeService.getAllSkills().subscribe({
      next: (res) => this.allAvailableSkills.set(res),
      error: () => {}
    });
  }

  loadProfile(id: string) {
    this.loading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (emp) => {
        this.employee.set(emp);
        this.pageTitle.set(`${emp.name}'s Competencies`);
        
        // Parallel load related records
        this.loadSkills(id);
        this.loadAssessments(id);
        this.loadGaps(id);
        
        this.loading.set(false);
      },
      error: () => {
        this.employee.set(null);
        this.loading.set(false);
      }
    });
  }

  loadSkills(id: string) {
    this.employeeService.getEmployeeSkills(id).subscribe(res => this.skills.set(res));
  }

  loadAssessments(id: string) {
    this.employeeService.getEmployeeAssessments(id).subscribe(res => this.assessments.set(res));
  }

  loadGaps(id: string) {
    this.employeeService.getEmployeeSkillGaps(id).subscribe(res => this.gaps.set(res));
  }

  saveMappedSkill() {
    const id = this.employee()?.id;
    if (!id || !this.newSkillId) return;

    this.employeeService.mapEmployeeSkill(id, {
      skillId: this.newSkillId,
      proficiency: Number(this.newSkillProf),
      verified: this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER'
    }).subscribe({
      next: () => {
        this.loadSkills(id);
        this.loadGaps(id);
        this.showAddSkillForm.set(false);
        this.newSkillId = '';
        this.newSkillProf = 5;
      },
      error: () => {
        this.notificationService.error('Mapping Failed', 'Failed to map skill to profile');
      }
    });
  }

  saveAssessment() {
    const id = this.employee()?.id;
    if (!id || !this.assessTopic.trim()) return;

    this.employeeService.addEmployeeAssessment(id, {
      skillOrTopic: this.assessTopic,
      score: this.assessScore
    }).subscribe({
      next: () => {
        this.loadAssessments(id);
        this.showAssessmentForm.set(false);
        this.assessTopic = '';
        this.assessScore = 80;
      },
      error: () => {
        this.notificationService.error('Submission Failed', 'Failed to submit assessment results');
      }
    });
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'EE';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onStubAlert(feature: string) {
    this.notificationService.info(
      'Locked Feature',
      `This action triggers the ${feature} microservice. It is currently locked during Milestone 1.`
    );
  }

  canEditRating(): boolean {
    const userRole = this.authService.role();
    if (userRole === 'ADMIN') {
      return true;
    }
    if (userRole === 'HR_MANAGER') {
      const emp = this.employee();
      if (!emp) return false;
      const targetRoleTitle = emp.roleTitle.toLowerCase();
      // HR can edit rating of standard employees, not other HR managers or admin
      return !targetRoleTitle.includes('admin') && !targetRoleTitle.includes('hr manager') && !targetRoleTitle.includes('hr_manager');
    }
    return false;
  }

  canMapOrAssess(): boolean {
    const role = this.authService.role();
    if (role === 'ADMIN' || role === 'HR_MANAGER' || role === 'TRAINING_MANAGER') {
      return true;
    }
    const profileId = this.employee()?.id;
    const currentUserId = this.authService.employeeId();
    return !!profileId && profileId === currentUserId;
  }

  startEditRating() {
    this.tempRating = this.employee()?.rating || 5.0;
    this.isEditingRating.set(true);
  }

  cancelEditRating() {
    this.isEditingRating.set(false);
  }

  saveRating() {
    const emp = this.employee();
    if (!emp) return;

    const rate = Number(this.tempRating);
    if (isNaN(rate) || rate < 1.0 || rate > 5.0) {
      this.notificationService.warning('Invalid Rating', 'Please enter a valid rating between 1.0 and 5.0');
      return;
    }

    const updatedEmployee: Employee = {
      ...emp,
      rating: rate
    };

    this.employeeService.updateEmployee(emp.id, updatedEmployee).subscribe({
      next: (res) => {
        this.employee.set(res);
        this.isEditingRating.set(false);
        this.notificationService.success('Rating Updated', 'Performance rating updated successfully!');
      },
      error: () => {
        this.notificationService.error('Update Failed', 'Failed to update performance rating');
      }
    });
  }
}
