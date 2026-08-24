import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CareerService, CareerPlanDetail, Mentor } from '../career.service';
import { AuthService } from '../../../core/auth.service';
import { EmployeeService, Employee } from '../../skills/employee.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { HexGaugeComponent } from '../../../shared/hex-gauge/hex-gauge';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-career-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    HexGaugeComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Career Blueprint" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
            <div class="employee-selector-bar glass-card" style="padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; border-radius: 8px;">
              <label style="font-weight: 600; font-size: 14px; color: var(--text-secondary);">Select Employee to Manage Plan:</label>
              <select class="form-input" style="max-width: 300px; background-color: var(--bg-main); border: 1px solid var(--border-color); color: white; padding: 8px 12px; border-radius: 6px;" [(ngModel)]="selectedEmployeeId" (change)="onEmployeeChange()">
                <option value="">-- Choose Employee --</option>
                @for (emp of employeesList(); track emp.id) {
                  <option [value]="emp.id">{{ emp.name }} ({{ emp.department }})</option>
                }
              </select>
            </div>
          }

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Fetching career blueprint...</p>
            </div>
          } @else if (!planDetail()) {
            <!-- No active career plan screen -->
            <div class="empty-state-dashed animate-fade-in" style="max-width: 600px; margin: 40px auto;">
              <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <h3>{{ authService.role() === 'EMPLOYEE' ? 'No Career Plan Configured' : 'Select an Employee' }}</h3>
              <p class="empty-text" style="margin-bottom: 24px;">
                {{ authService.role() === 'EMPLOYEE' 
                  ? 'You do not have an active career path configured in the system. Please contact HR or your manager to establish a target role and training plan.' 
                  : 'Choose an employee from the dropdown list above to audit or initialize their career blueprint plan.' }}
              </p>
              @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                @if (selectedEmployeeId) {
                  <button class="btn btn-primary" (click)="showCreateModal = true">
                    Initialize Career Plan
                  </button>
                }
              }
            </div>
          } @else {
            <div class="career-grid animate-fade-in">
              <!-- Top Row: Summary & Readiness -->
              <div class="career-main-card">
                <div class="plan-header">
                  <div>
                    <span class="blueprint-tag">Active Career Path</span>
                    <h1 class="plan-title">{{ planDetail()?.plan?.currentRole }} &rarr; {{ planDetail()?.plan?.targetRole }}</h1>
                    <p class="goal-text">"{{ planDetail()?.plan?.careerGoal || 'No career goals specified yet.' }}"</p>
                  </div>
                  @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                    <button class="btn btn-secondary btn-sm" (click)="openEditModal()">Edit Plan</button>
                  }
                </div>
                
                <hr class="card-divider" />
                
                <div class="plan-metadata-grid">
                  <div class="meta-item">
                    <span class="meta-label">Timeline Target</span>
                    <span class="meta-value">{{ planDetail()?.plan?.timeline }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Expected Promotion</span>
                    <span class="meta-value">{{ planDetail()?.plan?.expectedPromotionDate ? (planDetail()?.plan?.expectedPromotionDate | date:'mediumDate') : 'TBD' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Skill Coverage</span>
                    <span class="meta-value highlight-orange">{{ planDetail()?.skillCoveragePercent }}%</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span class="badge" [ngClass]="planDetail()?.plan?.status === 'ACTIVE' ? 'badge-hr' : 'badge-pending'">
                      {{ planDetail()?.plan?.status }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Promotion Readiness Evaluation Card -->
              <div class="readiness-card">
                <h3>Promotion Readiness</h3>
                <div class="readiness-gauge-box">
                  <div style="transform: scale(1.6); margin-bottom: 20px;">
                    <app-hex-gauge [value]="(planDetail()?.promotionReadiness?.readinessPercent || 0) / 10" />
                  </div>
                  <div class="readiness-summary">
                    <span class="readiness-tag" [ngClass]="getReadinessStatusClass(planDetail()?.promotionReadiness?.status)">
                      {{ planDetail()?.promotionReadiness?.status }}
                    </span>
                    <span class="readiness-pct">{{ planDetail()?.promotionReadiness?.readinessPercent }}% Complete</span>
                  </div>
                </div>
                
                <div class="readiness-checklist">
                  <div class="check-item">
                    <span class="check-icon" [ngClass]="planDetail()?.promotionReadiness?.skillsMet ? 'icon-success' : 'icon-fail'">
                      {{ planDetail()?.promotionReadiness?.skillsMet ? '✓' : '✗' }}
                    </span>
                    <div class="check-label">
                      <strong>Skills Framework</strong>
                      <span>Requires &ge; 90% competency coverage</span>
                    </div>
                  </div>
                  <div class="check-item">
                    <span class="check-icon" [ngClass]="planDetail()?.promotionReadiness?.coursesMet ? 'icon-success' : 'icon-fail'">
                      {{ planDetail()?.promotionReadiness?.coursesMet ? '✓' : '✗' }}
                    </span>
                    <div class="check-label">
                      <strong>Learning Courses</strong>
                      <span>Requires completion of target courses</span>
                    </div>
                  </div>
                  <div class="check-item">
                    <span class="check-icon" [ngClass]="planDetail()?.promotionReadiness?.certificationsMet ? 'icon-success' : 'icon-fail'">
                      {{ planDetail()?.promotionReadiness?.certificationsMet ? '✓' : '✗' }}
                    </span>
                    <div class="check-label">
                      <strong>Certifications</strong>
                      <span>Requires validated professional certs</span>
                    </div>
                  </div>
                  <div class="check-item">
                    <span class="check-icon" [ngClass]="planDetail()?.promotionReadiness?.experienceMet ? 'icon-success' : 'icon-fail'">
                      {{ planDetail()?.promotionReadiness?.experienceMet ? '✓' : '✗' }}
                    </span>
                    <div class="check-label">
                      <strong>Time-in-Role Experience</strong>
                      <span>Meets target role duration requirements</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mentor Section -->
              <div class="mentor-card">
                <h3>Assigned Mentor</h3>
                @if (planDetail()?.plan?.mentor) {
                  <div class="mentor-profile animate-fade-in">
                    <div class="mentor-avatar">
                      {{ planDetail()?.plan?.mentor?.name?.substring(0, 2) | uppercase }}
                    </div>
                    <div class="mentor-info">
                      <h4>{{ planDetail()?.plan?.mentor?.name }}</h4>
                      <p class="mentor-dept">{{ planDetail()?.plan?.mentor?.department }} &bull; {{ planDetail()?.plan?.mentor?.experienceYears }} Yrs Exp</p>
                      @if (planDetail()?.plan?.meetingSchedule) {
                        <p class="mentor-schedule">
                          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {{ planDetail()?.plan?.meetingSchedule }}
                        </p>
                      }
                    </div>
                  </div>
                  <div class="mentor-guidance">
                    <h5>Mentor Guidance Notes</h5>
                    <p>{{ planDetail()?.plan?.guidanceNotes || 'No guidance notes shared yet.' }}</p>
                  </div>
                } @else {
                  <div class="empty-state-dashed" style="padding: 24px;">
                    <p class="empty-text" style="margin-bottom: 12px;">No mentor has been assigned to this path.</p>
                    @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                      <button class="btn btn-secondary btn-sm" (click)="openAssignMentorModal()">Assign Mentor</button>
                    }
                  </div>
                }
              </div>

              <!-- Skill Gap Analysis Table -->
              <div class="gaps-card">
                <div class="card-header">
                  <h3>Target Role Skill Gap Analysis</h3>
                  <span class="badge badge-warning">{{ planDetail()?.skillGap?.length }} skills analyzed</span>
                </div>
                
                <div class="table-container">
                  <table class="dense-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Category</th>
                        <th>Required Level</th>
                        <th>Your Level</th>
                        <th>Gap</th>
                        <th>Priority</th>
                        <th>Recommended Training / Certifications</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (gap of planDetail()?.skillGap; track gap.skillId) {
                        <tr>
                          <td class="font-medium text-white">{{ gap.skillName }}</td>
                          <td>
                            <span class="category-tag">{{ gap.category }}</span>
                          </td>
                          <td class="text-center font-medium">{{ gap.requiredLevel }}/10</td>
                          <td class="text-center font-medium">
                            <span [ngClass]="gap.gap === 0 ? 'text-success' : 'text-warning'">
                              {{ gap.actualLevel }}/10
                            </span>
                          </td>
                          <td class="text-center">
                            <span class="badge" [ngClass]="gap.gap === 0 ? 'badge-success' : 'badge-danger'">
                              {{ gap.gap === 0 ? 'Met' : '-' + gap.gap }}
                            </span>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="getPriorityClass(gap.priority)">
                              {{ gap.priority }}
                            </span>
                          </td>
                          <td>
                            @if (gap.gap === 0) {
                              <span class="text-success font-medium">✓ Requirements Satisfied</span>
                            } @else {
                              <div class="recommendations-cell">
                                @for (course of gap.recommendedCourses; track course) {
                                  <a routerLink="/learning/courses" class="rec-link badge badge-learning" title="Browse course in Learning Catalog">
                                    {{ course }}
                                  </a>
                                }
                                @for (cert of gap.recommendedCertifications; track cert) {
                                  <a routerLink="/certifications/new" class="rec-link badge badge-cert" title="Register certification in Registry">
                                    {{ cert }}
                                  </a>
                                }
                                @if (gap.recommendedCourses.length === 0 && gap.recommendedCertifications.length === 0) {
                                  <span class="text-muted">Standard skill-building exercises</span>
                                }
                              </div>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>

    <!-- Create Plan Modal -->
    @if (showCreateModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Initialize Career Blueprint</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Target Role Title</label>
              <input type="text" class="form-input" [(ngModel)]="newPlan.targetRole" placeholder="e.g. Senior Software Engineer" />
            </div>
            <div class="form-group">
              <label>Career Goal Statement</label>
              <textarea class="form-input" rows="3" [(ngModel)]="newPlan.careerGoal" placeholder="Describe the employee's career vision..."></textarea>
            </div>
            <div class="form-group">
              <label>Timeline Target</label>
              <input type="text" class="form-input" [(ngModel)]="newPlan.timeline" placeholder="e.g. 12 months, 2 years" />
            </div>
            <div class="form-group">
              <label>Expected Promotion Date</label>
              <input type="date" class="form-input" [(ngModel)]="newPlan.expectedPromotionDate" />
            </div>
            <div class="form-group">
              <label>Meeting Schedule</label>
              <input type="text" class="form-input" [(ngModel)]="newPlan.meetingSchedule" placeholder="e.g. Bi-weekly on Tuesdays" />
            </div>
            <div class="form-group">
              <label>Initial Guidance / Notes</label>
              <textarea class="form-input" rows="3" [(ngModel)]="newPlan.guidanceNotes" placeholder="Share guidance or action items..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="createPlanSubmit()">Save Blueprint</button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Plan Modal -->
    @if (showEditModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Edit Career Blueprint</h3>
            <button class="close-btn" (click)="showEditModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Target Role Title</label>
              <input type="text" class="form-input" [(ngModel)]="editPlanData.targetRole" />
            </div>
            <div class="form-group">
              <label>Career Goal Statement</label>
              <textarea class="form-input" rows="3" [(ngModel)]="editPlanData.careerGoal"></textarea>
            </div>
            <div class="form-group">
              <label>Timeline Target</label>
              <input type="text" class="form-input" [(ngModel)]="editPlanData.timeline" />
            </div>
            <div class="form-group">
              <label>Expected Promotion Date</label>
              <input type="date" class="form-input" [(ngModel)]="editPlanData.expectedPromotionDate" />
            </div>
            <div class="form-group">
              <label>Meeting Schedule</label>
              <input type="text" class="form-input" [(ngModel)]="editPlanData.meetingSchedule" />
            </div>
            <div class="form-group">
              <label>Guidance & Notes</label>
              <textarea class="form-input" rows="3" [(ngModel)]="editPlanData.guidanceNotes"></textarea>
            </div>
            <div class="form-group">
              <label>Plan Status</label>
              <select class="form-input" [(ngModel)]="editPlanData.status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showEditModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="updatePlanSubmit()">Save Changes</button>
          </div>
        </div>
      </div>
    }

    <!-- Assign Mentor Modal -->
    @if (showMentorModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Assign Mentor</h3>
            <button class="close-btn" (click)="showMentorModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Mentor</label>
              <select class="form-input" [(ngModel)]="selectedMentorId">
                <option value="">-- Choose Mentor --</option>
                @for (m of mentorsList(); track m.id) {
                  <option [value]="m.id">{{ m.name }} ({{ m.department }} - {{ m.experienceYears }} yrs exp)</option>
                }
              </select>
            </div>
            @if (mentorsList().length === 0) {
              <p class="text-warning">No mentors registered in the system. HR must add mentors first.</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showMentorModal = false">Cancel</button>
            <button class="btn btn-primary" [disabled]="!selectedMentorId" (click)="assignMentorSubmit()">Assign</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .career-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .career-main-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      grid-column: span 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .blueprint-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--primary-accent);
      font-weight: 700;
      margin-bottom: 4px;
      display: block;
    }

    .plan-title {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .goal-text {
      color: var(--text-secondary);
      font-style: italic;
      font-size: 14px;
      line-height: 1.5;
    }

    .card-divider {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 20px 0;
    }

    .plan-metadata-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta-value {
      font-size: 15px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .highlight-orange {
      color: var(--primary-accent);
    }

    .readiness-card, .mentor-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
    }

    .readiness-gauge-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .readiness-summary {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
    }

    .readiness-tag {
      font-size: 14px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .tag-ready { background-color: rgba(16, 185, 129, 0.15); color: var(--status-success); }
    .tag-training { background-color: rgba(234, 88, 12, 0.15); color: var(--primary-accent); }
    .tag-cert { background-color: rgba(124, 58, 237, 0.15); color: #c084fc; }
    .tag-exp { background-color: rgba(245, 158, 11, 0.15); color: var(--status-warning); }

    .readiness-pct {
      font-size: 12px;
      color: var(--text-muted);
    }

    .readiness-checklist {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .check-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .icon-success { background-color: rgba(16, 185, 129, 0.15); color: var(--status-success); }
    .icon-fail { background-color: rgba(239, 68, 68, 0.15); color: var(--status-danger); }

    .check-label {
      display: flex;
      flex-direction: column;
      
      strong { font-size: 13px; color: var(--text-primary); }
      span { font-size: 11px; color: var(--text-muted); }
    }

    .mentor-profile {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      margin-bottom: 20px;
    }

    .mentor-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 18px;
    }

    .mentor-info {
      h4 { font-size: 15px; color: var(--text-primary); margin-bottom: 2px; }
      .mentor-dept { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
      .mentor-schedule { 
        font-size: 12px; 
        color: var(--primary-light); 
        display: flex; 
        align-items: center; 
        gap: 4px;
      }
    }

    .mentor-guidance {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      
      h5 { font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
      p { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
    }

    .gaps-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      grid-column: span 2;
    }

    .category-tag {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }

    .recommendations-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .rec-link {
      text-decoration: none;
      font-size: 11px;
      transition: all 0.2s;
      
      &:hover {
        opacity: 0.8;
        transform: translateY(-1px);
      }
    }

    .badge-learning { background-color: rgba(234, 88, 12, 0.15); color: var(--primary-accent); border: 1px solid rgba(234, 88, 12, 0.3); }
    .badge-cert { background-color: rgba(124, 58, 237, 0.15); color: #c084fc; border: 1px solid rgba(124, 58, 237, 0.3); }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0,0,0,0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }

    .modal-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--text-primary); }
      .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
    }

    .form-input {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 12px;
      color: white;
      font-size: 14px;
      
      &:focus { outline: 1px solid var(--primary-accent); }
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .empty-state-dashed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      text-align: center;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      color: var(--text-muted);
      gap: 12px;
      width: 100%;
    }
    
    .empty-icon-subtle {
      width: 48px;
      height: 48px;
      color: #4b5563;
      margin-bottom: 8px;
    }
    
    .empty-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 992px) {
      .career-grid {
        grid-template-columns: 1fr;
      }
      .gaps-card {
        grid-column: span 1;
      }
    }
  `]
})
export class CareerPlanComponent implements OnInit {
  private readonly careerService = inject(CareerService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly loading = signal(true);
  readonly planDetail = signal<CareerPlanDetail | null>(null);
  readonly mentorsList = signal<Mentor[]>([]);
  readonly employeesList = signal<Employee[]>([]);

  careerPlanEmployeeId = '';
  selectedEmployeeId = '';

  // Modal controls
  showCreateModal = false;
  showEditModal = false;
  showMentorModal = false;

  selectedMentorId = '';
  newPlan = {
    targetRole: '',
    careerGoal: '',
    timeline: '12 months',
    expectedPromotionDate: '',
    meetingSchedule: '',
    guidanceNotes: ''
  };

  editPlanData = {
    targetRole: '',
    careerGoal: '',
    status: 'ACTIVE',
    timeline: '12 months',
    expectedPromotionDate: '',
    meetingSchedule: '',
    guidanceNotes: '',
    mentorId: ''
  };

  ngOnInit() {
    if (this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER') {
      this.loadMentors();
      this.loadEmployees();
    } else {
      this.loadMentors();
    }
    this.loadCareerPlan();
  }

  loadCareerPlan() {
    this.loading.set(true);
    this.route.queryParams.subscribe(params => {
      let employeeId = params['employeeId'];
      
      if (!employeeId && this.authService.role() !== 'EMPLOYEE') {
        this.selectedEmployeeId = '';
        this.planDetail.set(null);
        this.careerPlanEmployeeId = '';
        this.loading.set(false);
        return;
      }

      if (!employeeId) {
        employeeId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
      } else {
        this.selectedEmployeeId = employeeId;
      }
      this.careerPlanEmployeeId = employeeId;

      this.loadCareerPlanForEmployee(employeeId);
    });
  }

  loadCareerPlanForEmployee(employeeId: string) {
    this.loading.set(true);
    this.careerService.getPlanByEmployee(employeeId).subscribe({
      next: (res) => {
        this.planDetail.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading career plan', err);
        this.planDetail.set(null);
        this.loading.set(false);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees(undefined, 0, 100).subscribe({
      next: (res) => {
        this.employeesList.set(res.content || []);
      }
    });
  }

  onEmployeeChange() {
    if (this.selectedEmployeeId) {
      this.careerPlanEmployeeId = this.selectedEmployeeId;
      this.loadCareerPlanForEmployee(this.selectedEmployeeId);
    } else {
      this.planDetail.set(null);
      this.careerPlanEmployeeId = '';
    }
  }

  loadMentors() {
    this.careerService.getMentors().subscribe(res => {
      this.mentorsList.set(res);
    });
  }

  getReadinessStatusClass(status?: string): string {
    if (!status) return '';
    if (status.toLowerCase() === 'ready') return 'tag-ready';
    if (status.includes('Training')) return 'tag-training';
    if (status.includes('Certification')) return 'tag-cert';
    return 'tag-exp';
  }

  getPriorityClass(priority: string): string {
    if (priority === 'HIGH') return 'badge-danger';
    if (priority === 'MEDIUM') return 'badge-warning';
    return 'badge-success';
  }

  createPlanSubmit() {
    const employeeId = this.careerPlanEmployeeId || this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
    const request = {
      employeeId,
      ...this.newPlan
    };
    this.careerService.createPlan(request).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Career plan successfully initialized!');
        this.showCreateModal = false;
        this.loadCareerPlan();
      },
      error: (err) => {
        this.notificationService.error('Error', 'Failed to create plan: ' + err.error?.message);
      }
    });
  }

  openEditModal() {
    const p = this.planDetail()?.plan;
    if (p) {
      this.editPlanData = {
        targetRole: p.targetRole,
        careerGoal: p.careerGoal || '',
        status: p.status,
        timeline: p.timeline,
        expectedPromotionDate: p.expectedPromotionDate || '',
        meetingSchedule: p.meetingSchedule || '',
        guidanceNotes: p.guidanceNotes || '',
        mentorId: p.mentor?.id || ''
      };
      this.showEditModal = true;
    }
  }

  updatePlanSubmit() {
    const planId = this.planDetail()?.plan?.id;
    if (planId) {
      this.careerService.updatePlan(planId, this.editPlanData).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Career plan updated.');
          this.showEditModal = false;
          this.loadCareerPlan();
        },
        error: (err) => {
          this.notificationService.error('Error', 'Failed to update plan: ' + err.error?.message);
        }
      });
    }
  }

  openAssignMentorModal() {
    this.selectedMentorId = this.planDetail()?.plan?.mentor?.id || '';
    this.showMentorModal = true;
  }

  assignMentorSubmit() {
    const planId = this.planDetail()?.plan?.id;
    if (planId && this.selectedMentorId) {
      this.careerService.updatePlan(planId, {
        ...this.editPlanData,
        targetRole: this.planDetail()?.plan?.targetRole || '',
        timeline: this.planDetail()?.plan?.timeline || '',
        mentorId: this.selectedMentorId
      }).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Mentor successfully assigned.');
          this.showMentorModal = false;
          this.loadCareerPlan();
        },
        error: (err) => {
          this.notificationService.error('Error', 'Failed to assign mentor.');
        }
      });
    }
  }
}
