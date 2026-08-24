import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CareerService, JobPosting, JobApplication } from '../career.service';
import { AuthService } from '../../../core/auth.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-job-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Internal Job Board" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Navigation Tabs -->
          <div class="tabs-navigation">
            <button class="tab-btn" [class.active]="activeTab === 'browse'" (click)="setTab('browse')">
              Browse Openings
            </button>
            @if (authService.role() === 'EMPLOYEE') {
              <button class="tab-btn" [class.active]="activeTab === 'my-applications'" (click)="setTab('my-applications')">
                My Applications
              </button>
            }
            @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
              <button class="tab-btn" [class.active]="activeTab === 'manage-postings'" (click)="setTab('manage-postings')">
                Manage Postings
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'candidate-applications'" (click)="setTab('candidate-applications')">
                Candidate Applications
              </button>
            }
          </div>

          <!-- ================= TAB 1: BROWSE JOBS ================= -->
          @if (activeTab === 'browse') {
            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading active job openings...</p>
              </div>
            } @else if (jobsList().length === 0) {
              <div class="empty-state-dashed animate-fade-in">
                <p class="empty-text">No active job postings are available at this time.</p>
              </div>
            } @else {
              <div class="jobs-list animate-fade-in">
                @for (job of jobsList(); track job.id) {
                  <div class="job-card">
                    <div class="job-header">
                      <div>
                        <h3 class="job-title">{{ job.roleTitle }}</h3>
                        <p class="job-meta-header">{{ job.department }} &bull; {{ job.location }}</p>
                      </div>
                      
                      <!-- Matching Indicator -->
                      <div class="match-score-badge" [ngClass]="getMatchClass(getJobMatchPercent(job.id))">
                        {{ getJobMatchPercent(job.id) }}% Match
                      </div>
                    </div>

                    <p class="job-desc-snippet">{{ job.description }}</p>

                    <div class="job-footer">
                      <div class="job-meta-chips">
                        <span class="meta-chip">Exp: {{ job.experienceRequired }}+ Yrs</span>
                        <span class="meta-chip">{{ formatSalary(job.salaryBand) }}</span>
                      </div>
                      
                      <div class="job-actions">
                        <button class="btn btn-secondary btn-sm" (click)="openDetailModal(job)">View Details</button>
                        @if (authService.role() === 'EMPLOYEE') {
                          <button 
                            class="btn btn-primary btn-sm" 
                            [disabled]="isApplied(job.id)"
                            (click)="applyForJob(job.id)"
                          >
                            {{ isApplied(job.id) ? 'Applied' : 'Apply Now' }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- ================= TAB 2: MY APPLICATIONS ================= -->
          @if (activeTab === 'my-applications') {
            @if (loadingApps()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Retrieving applications history...</p>
              </div>
            } @else if (myApplications().length === 0) {
              <div class="empty-state-dashed animate-fade-in">
                <p class="empty-text">You have not submitted any internal job applications yet.</p>
              </div>
            } @else {
              <div class="table-container animate-fade-in">
                <table class="dense-table">
                  <thead>
                    <tr>
                      <th>Job Role</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Applied Date</th>
                      <th>Matching Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (app of myApplications(); track app.id) {
                      <tr>
                        <td class="font-medium text-white">{{ app.jobPostingRoleTitle }}</td>
                        <td>{{ app.jobPostingDepartment }}</td>
                        <td>{{ app.jobPostingLocation }}</td>
                        <td>{{ app.appliedAt | date:'mediumDate' }}</td>
                        <td>
                          <span class="badge" [ngClass]="getMatchClass(app.matchPercent)">
                            {{ app.matchPercent }}%
                          </span>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="getApplicationStatusClass(app.status)">
                            {{ formatStatus(app.status) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }

          <!-- ================= TAB 3: MANAGE POSTINGS (HR/Admin) ================= -->
          @if (activeTab === 'manage-postings') {
            <div class="manage-postings-header animate-fade-in" style="display:flex; justify-content:space-between; margin-bottom:16px;">
              <h3>Internal Job Opportunities</h3>
              <button class="btn btn-primary" (click)="showCreateJobModal = true">Post New Opening</button>
            </div>

            <div class="table-container animate-fade-in">
              <table class="dense-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Required Skills</th>
                    <th>Salary Band</th>
                    <th>Status</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (job of adminJobsList(); track job.id) {
                    <tr>
                      <td class="font-medium text-white">{{ job.roleTitle }}</td>
                      <td>{{ job.department }}</td>
                      <td>{{ job.location }}</td>
                      <td>{{ job.experienceRequired }} Yrs</td>
                      <td>
                        <span class="text-muted" style="font-size:12px;">{{ job.requiredSkills }}</span>
                      </td>
                      <td>{{ formatSalary(job.salaryBand) }}</td>
                      <td>
                        <span class="badge" [ngClass]="job.active ? 'badge-hr' : 'badge-pending'">
                          {{ job.active ? 'Active' : 'Closed' }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <div class="actions-wrapper">
                          <button class="btn-portal-action view-btn" (click)="openEditJobModal(job)" title="Edit Job" aria-label="Edit Job">
                            <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          <button class="btn-portal-action delete-btn" (click)="deleteJob(job.id)" title="Delete Job" aria-label="Delete Job">
                            <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- ================= TAB 4: CANDIDATE APPLICATIONS (HR/Admin) ================= -->
          @if (activeTab === 'candidate-applications') {
            @if (loadingApps()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading candidate applications...</p>
              </div>
            } @else if (candidateApplications().length === 0) {
              <div class="empty-state-dashed animate-fade-in">
                <p class="empty-text">No candidate applications have been received.</p>
              </div>
            } @else {
              <div class="table-container animate-fade-in">
                <table class="dense-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Job Posting</th>
                      <th>Department</th>
                      <th>Match Ratio</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (app of candidateApplications(); track app.id) {
                      <tr>
                        <td class="font-medium text-white">{{ app.employeeName }}</td>
                        <td>{{ app.jobPostingRoleTitle }}</td>
                        <td>{{ app.jobPostingDepartment }}</td>
                        <td>
                          <span class="badge" [ngClass]="getMatchClass(app.matchPercent)">
                            {{ app.matchPercent }}% Match
                          </span>
                        </td>
                        <td>{{ app.appliedAt | date:'mediumDate' }}</td>
                        <td>
                          <span class="badge" [ngClass]="getApplicationStatusClass(app.status)">
                            {{ formatStatus(app.status) }}
                          </span>
                        </td>
                        <td class="text-right actions-cell">
                          @if (app.status === 'PENDING') {
                            <button class="btn-action btn-approve" (click)="updateAppStatus(app.id, 'ACCEPTED')">Accept</button>
                            <button class="btn-action btn-reject" (click)="updateAppStatus(app.id, 'REJECTED')">Reject</button>
                          } @else {
                            <span class="text-muted" style="font-size:12px;">Processed</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </main>
      </div>
    </div>

    <!-- Job Detail / Matching Modal -->
    @if (showDetailModal && selectedJob()) {
      <div class="modal-overlay">
        <div class="modal-card" style="max-width: 650px;">
          <div class="modal-header">
            <h3>Job Details &amp; Compatibility Analysis</h3>
            <button class="close-btn" (click)="showDetailModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="job-detail-head">
              <h2 class="text-white">{{ selectedJob()?.roleTitle }}</h2>
              <p class="text-muted">{{ selectedJob()?.department }} &bull; {{ selectedJob()?.location }}</p>
            </div>
            
            <hr class="card-divider" />
            
            <div class="job-detail-body">
              <h4>Position Description</h4>
              <p style="font-size:13px; line-height:1.5; color:var(--text-secondary); margin-bottom:16px;">
                {{ selectedJob()?.description }}
              </p>
              
              <h4>Eligibility Criteria</h4>
              <p style="font-size:13px; line-height:1.5; color:var(--text-secondary); margin-bottom:16px;">
                {{ selectedJob()?.eligibility || 'Standard enterprise qualifications apply.' }}
              </p>

              <!-- Matching metrics -->
              <div class="matching-metrics-box">
                <div class="matching-bar-header">
                  <h4>Skills Match Profile</h4>
                  <span class="match-score-text highlight-orange">{{ activeJobMatch()?.matchPercent }}% Match</span>
                </div>
                <div class="progress-bar-container" style="margin-bottom: 16px;">
                  <div class="progress-bar-fill" [style.width.%]="activeJobMatch()?.matchPercent"></div>
                </div>

                <div class="skills-match-grid">
                  <div>
                    <h5 style="color:var(--status-success); margin-bottom:6px;">Matching Skills ({{ activeJobMatch()?.matchingSkills?.length }})</h5>
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                      @for (s of activeJobMatch()?.matchingSkills; track s) {
                        <span class="badge badge-success-outline">{{ s }}</span>
                      }
                      @if (activeJobMatch()?.matchingSkills?.length === 0) {
                        <span class="text-muted" style="font-size:11px;">None</span>
                      }
                    </div>
                  </div>
                  <div>
                    <h5 style="color:var(--status-danger); margin-bottom:6px;">Missing Gaps ({{ activeJobMatch()?.missingSkills?.length }})</h5>
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                      @for (s of activeJobMatch()?.missingSkills; track s) {
                        <span class="badge badge-danger-outline">{{ s }}</span>
                      }
                      @if (activeJobMatch()?.missingSkills?.length === 0) {
                        <span class="text-muted" style="font-size:11px;">None</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

              @if (activeJobMatch()?.recommendations?.length > 0) {
                <div class="match-recs" style="margin-top:16px;">
                  <h4>Training Recommendations</h4>
                  <ul class="recs-list" style="margin-left: 18px; font-size:12px; color:var(--text-secondary);">
                    @for (rec of activeJobMatch()?.recommendations; track rec) {
                      <li>{{ rec }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDetailModal = false">Close</button>
            @if (authService.role() === 'EMPLOYEE') {
              <button 
                class="btn btn-primary" 
                [disabled]="isApplied(selectedJob()?.id)"
                (click)="applyForJob(selectedJob()?.id)"
              >
                {{ isApplied(selectedJob()?.id) ? 'Applied' : 'Apply Now' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Post/Edit Job Modal -->
    @if (showCreateJobModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditingJob ? 'Edit Job Opening' : 'Post New Job Opening' }}</h3>
            <button class="close-btn" (click)="closeJobModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Role Title</label>
              <input type="text" class="form-input" [(ngModel)]="jobForm.roleTitle" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input type="text" class="form-input" [(ngModel)]="jobForm.department" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" class="form-input" [(ngModel)]="jobForm.location" placeholder="e.g. Remote, Boston Office" />
            </div>
            <div class="form-group">
              <label>Experience Required (Years)</label>
              <input type="number" class="form-input" [(ngModel)]="jobForm.experienceRequired" />
            </div>
            <div class="form-group">
              <label>Required Skills (Comma separated)</label>
              <input type="text" class="form-input" [(ngModel)]="jobForm.requiredSkills" placeholder="e.g. Java,Spring Boot,Angular" />
            </div>
            <div class="form-group">
              <label>Salary Band</label>
              <input type="text" class="form-input" [(ngModel)]="jobForm.salaryBand" placeholder="e.g. ₹80k - ₹100k" />
            </div>
            <div class="form-group">
              <label>Role Description</label>
              <textarea class="form-input" rows="4" [(ngModel)]="jobForm.description"></textarea>
            </div>
            <div class="form-group">
              <label>Eligibility & Prerequisites</label>
              <textarea class="form-input" rows="3" [(ngModel)]="jobForm.eligibility"></textarea>
            </div>
            <div class="form-group" style="flex-direction:row; align-items:center; gap:8px;">
              <input type="checkbox" [(ngModel)]="jobForm.active" id="jobActiveCheck" />
              <label for="jobActiveCheck" style="margin-bottom:0; cursor:pointer;">Set posting as Active</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeJobModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitJobForm()">{{ isEditingJob ? 'Update Posting' : 'Publish Job' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tabs-navigation {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 24px;
      gap: 8px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        color: var(--text-primary);
      }
      
      &.active {
        color: var(--primary-accent);
        border-bottom-color: var(--primary-accent);
      }
    }

    .jobs-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .job-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.3s ease;
      
      &:hover { border-color: var(--primary-accent); }
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .job-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .job-meta-header {
      font-size: 12px;
      color: var(--text-muted);
    }

    .match-score-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 20px;
    }

    .job-desc-snippet {
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-secondary);
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .job-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .job-meta-chips {
      display: flex;
      gap: 6px;
    }

    .meta-chip {
      font-size: 11px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .job-actions {
      display: flex;
      gap: 8px;
    }

    .match-high { background-color: rgba(16, 185, 129, 0.15); color: var(--status-success); }
    .match-med { background-color: rgba(245, 158, 11, 0.15); color: var(--status-warning); }
    .match-low { background-color: rgba(239, 68, 68, 0.15); color: var(--status-danger); }

    .badge-success-outline { background-color: rgba(16, 185, 129, 0.1); color: var(--status-success); border: 1px solid rgba(16,185,129,0.3); }
    .badge-danger-outline { background-color: rgba(239, 68, 68, 0.1); color: var(--status-danger); border: 1px solid rgba(239,68,68,0.3); }

    .badge-pending { background-color: rgba(245, 158, 11, 0.15); color: var(--status-warning); }
    .badge-success { background-color: rgba(16, 185, 129, 0.15); color: var(--status-success); }
    .badge-danger { background-color: rgba(239, 68, 68, 0.15); color: var(--status-danger); }
    .badge-hr { background-color: rgba(124, 58, 237, 0.15); color: #c084fc; }

    .matching-metrics-box {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
    }

    .matching-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .skills-match-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .progress-bar-container {
      height: 6px;
      background-color: var(--bg-main);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--primary-accent);
      border-radius: 3px;
    }

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
      
      h4 { font-family: 'Outfit', sans-serif; font-size: 13px; color: var(--text-primary); margin-bottom: 6px; }
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
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .highlight-orange { color: var(--primary-accent); }
    .card-divider { border: none; border-top: 1px solid var(--border-color); margin: 16px 0; }

    /* Action button styles that were missing */
    .btn-action {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      margin-left: 6px;
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

    /* Icon-based action buttons for Edit and Delete */
    .actions-cell {
      text-align: center !important;
      vertical-align: middle !important;
    }
    
    .actions-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-portal-action {
      background-color: transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      transition: all 0.2s ease-in-out;
      outline: none;
      box-sizing: border-box;
      padding: 0;
    }
    
    .btn-portal-action.view-btn {
      border: 1px solid #ea580c;
      color: #ffffff;
    }
    
    .btn-portal-action.view-btn:hover {
      background-color: rgba(234, 88, 12, 0.1);
      box-shadow: 0 0 8px rgba(234, 88, 12, 0.25);
    }
    
    .btn-portal-action.delete-btn {
      border: 1px solid #ef4444;
      color: #ffffff;
    }
    
    .btn-portal-action.delete-btn:hover {
      background-color: rgba(239, 68, 68, 0.1);
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.25);
    }
    
    .action-svg {
      width: 18px;
      height: 18px;
      display: block;
      stroke: currentColor;
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
  `]
})
export class JobPortalComponent implements OnInit {
  private readonly careerService = inject(CareerService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  activeTab = 'browse';
  readonly loading = signal(true);
  readonly loadingApps = signal(false);
  readonly jobsList = signal<JobPosting[]>([]);
  readonly adminJobsList = signal<JobPosting[]>([]);
  readonly myApplications = signal<JobApplication[]>([]);
  readonly candidateApplications = signal<JobApplication[]>([]);

  // Matching score maps cache
  jobMatchesMap = new Map<string, number>();

  // Modals
  showDetailModal = false;
  showCreateJobModal = false;
  isEditingJob = false;
  selectedJobId = '';

  selectedJob = signal<JobPosting | null>(null);
  activeJobMatch = signal<any | null>(null);

  // Job Posting Form
  jobForm = {
    roleTitle: '',
    department: '',
    location: '',
    experienceRequired: 3,
    requiredSkills: '',
    salaryBand: '',
    description: '',
    eligibility: '',
    active: true
  };

  ngOnInit() {
    this.loadJobs();
    if (this.authService.role() === 'EMPLOYEE') {
      this.loadMyApplications();
    } else {
      this.loadAdminData();
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'browse') {
      this.loadJobs();
    } else if (tab === 'my-applications') {
      this.loadMyApplications();
    } else if (tab === 'manage-postings') {
      this.loadAdminPostings();
    } else if (tab === 'candidate-applications') {
      this.loadCandidateApplications();
    }
  }

  loadJobs() {
    this.loading.set(true);
    this.careerService.getActiveJobs().subscribe({
      next: (res) => {
        this.jobsList.set(res);
        this.loading.set(false);
        // Pre-fetch match scores
        res.forEach(job => {
          if (job.id) {
            this.fetchMatchPercent(job.id);
          }
        });
      },
      error: () => this.loading.set(false)
    });
  }

  fetchMatchPercent(jobId: string) {
    const empId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
    this.careerService.getJobMatch(jobId, empId).subscribe(res => {
      this.jobMatchesMap.set(jobId, res.matchPercent);
    });
  }

  getJobMatchPercent(jobId?: string): number {
    if (!jobId) return 0;
    return this.jobMatchesMap.get(jobId) || 0;
  }

  isApplied(jobId?: string): boolean {
    if (!jobId) return false;
    return this.myApplications().some(app => app.jobPostingId === jobId);
  }

  loadMyApplications() {
    this.loadingApps.set(true);
    const empId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
    this.careerService.getJobApplications(empId).subscribe({
      next: (res) => {
        this.myApplications.set(res);
        this.loadingApps.set(false);
      },
      error: () => this.loadingApps.set(false)
    });
  }

  loadAdminData() {
    this.loadAdminPostings();
    this.loadCandidateApplications();
  }

  loadAdminPostings() {
    this.careerService.getAllJobs().subscribe(res => {
      this.adminJobsList.set(res);
    });
  }

  loadCandidateApplications() {
    this.loadingApps.set(true);
    this.careerService.getJobApplications().subscribe({
      next: (res) => {
        this.candidateApplications.set(res);
        this.loadingApps.set(false);
      },
      error: () => this.loadingApps.set(false)
    });
  }

  openDetailModal(job: JobPosting) {
    this.selectedJob.set(job);
    const empId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
    if (job.id) {
      this.careerService.getJobMatch(job.id, empId).subscribe(res => {
        this.activeJobMatch.set(res);
        this.showDetailModal = true;
      });
    }
  }

  applyForJob(jobId?: string) {
    if (!jobId) return;
    const empId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
    this.careerService.applyForJob(jobId, empId).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Application submitted successfully!');
        this.showDetailModal = false;
        this.loadMyApplications();
      },
      error: (err) => {
        this.notificationService.error('Error', 'Failed to apply: ' + err.error?.message);
      }
    });
  }

  openEditJobModal(job: JobPosting) {
    this.isEditingJob = true;
    this.selectedJobId = job.id || '';
    this.jobForm = {
      roleTitle: job.roleTitle,
      department: job.department,
      location: job.location,
      experienceRequired: job.experienceRequired,
      requiredSkills: job.requiredSkills,
      salaryBand: job.salaryBand,
      description: job.description,
      eligibility: job.eligibility || '',
      active: job.active ?? true
    };
    this.showCreateJobModal = true;
  }

  closeJobModal() {
    this.showCreateJobModal = false;
    this.isEditingJob = false;
    this.selectedJobId = '';
    this.jobForm = {
      roleTitle: '',
      department: '',
      location: '',
      experienceRequired: 3,
      requiredSkills: '',
      salaryBand: '',
      description: '',
      eligibility: '',
      active: true
    };
  }

  submitJobForm() {
    if (this.isEditingJob && this.selectedJobId) {
      this.careerService.updateJob(this.selectedJobId, this.jobForm).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Job posting updated.');
          this.closeJobModal();
          this.loadAdminPostings();
        },
        error: () => this.notificationService.error('Error', 'Failed to update job.')
      });
    } else {
      this.careerService.createJob(this.jobForm).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Job opportunity published.');
          this.closeJobModal();
          this.loadAdminPostings();
        },
        error: () => this.notificationService.error('Error', 'Failed to create job.')
      });
    }
  }

  deleteJob(jobId?: string) {
    if (!jobId) return;
    if (confirm('Are you sure you want to delete this job posting? This will remove all associated applications.')) {
      this.careerService.deleteJob(jobId).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Job posting deleted.');
          this.loadAdminPostings();
        },
        error: () => this.notificationService.error('Error', 'Failed to delete job.')
      });
    }
  }

  updateAppStatus(appId?: string, status?: string) {
    if (!appId || !status) return;
    this.careerService.updateApplicationStatus(appId, status).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Candidate status updated to ' + status);
        this.loadCandidateApplications();
      },
      error: () => this.notificationService.error('Error', 'Failed to update candidate application.')
    });
  }

  getMatchClass(pct: number): string {
    if (pct >= 80) return 'match-high';
    if (pct >= 50) return 'match-med';
    return 'match-low';
  }

  getApplicationStatusClass(status: string): string {
    if (status === 'ACCEPTED') return 'badge-success';
    if (status === 'REJECTED') return 'badge-danger';
    if (status === 'REVIEWED') return 'badge-hr';
    return 'badge-pending';
  }

  formatStatus(status: string): string {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'ACCEPTED') return 'Accepted';
    if (s === 'REJECTED') return 'Rejected';
    if (s === 'REVIEWED') return 'Reviewed';
    if (s === 'PENDING') return 'Pending';
    return status;
  }

  formatSalary(salary?: string): string {
    if (!salary) return '';
    return salary.replaceAll('$', '₹');
  }
}
