import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LearningService, Course, CourseStats } from '../learning.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { CertificationsService, EmployeeCertification } from '../../certifications/certifications.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    StatCardComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Learning Course Catalog" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Stats counters row -->
          <div class="stats-row animate-fade-in mb-28">
            <app-stat-card 
              title="Courses (Available)" 
              [value]="stats().totalCourses" 
              icon="activity"
            />
            <app-stat-card 
              title="Enrollments (This Month)" 
              [value]="stats().monthlyEnrollments" 
              icon="users"
            />
            <app-stat-card 
              title="Overall Completion Rate" 
              [value]="(stats().overallCompletionRate | number:'1.1-1') + '%'" 
              icon="award"
            />
          </div>

          <!-- Page Header & Actions -->
          <div class="page-actions-row">
            <div class="search-filter-box">
              <input 
                type="text" 
                class="search-control" 
                placeholder="Search courses..." 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
              />
              
              <div class="category-tabs">
                <button 
                  class="tab-btn" 
                  [class.active]="selectedCategory() === '' && selectedType() === ''"
                  (click)="filterByBoth('', '')"
                >All</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedCategory() === 'TECHNICAL'"
                  (click)="filterByBoth('TECHNICAL', '')"
                >Technical</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedCategory() === 'DOMAIN'"
                  (click)="filterByBoth('DOMAIN', '')"
                >Domain</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedCategory() === 'SOFT'"
                  (click)="filterByBoth('SOFT', '')"
                >Soft</button>
              </div>

              <div class="category-tabs">
                <button 
                  class="tab-btn" 
                  [class.active]="selectedType() === 'ONLINE'"
                  (click)="filterByBoth('', 'ONLINE')"
                >Online</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedType() === 'WORKSHOP'"
                  (click)="filterByBoth('', 'WORKSHOP')"
                >Workshop</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedType() === 'WEBINAR'"
                  (click)="filterByBoth('', 'WEBINAR')"
                >Webinar</button>
                <button 
                  class="tab-btn" 
                  [class.active]="selectedType() === 'BOOTCAMP'"
                  (click)="filterByBoth('', 'BOOTCAMP')"
                >Bootcamp</button>
              </div>
            </div>

            @if (isAdminOrManager()) {
              <button class="btn btn-primary" (click)="toggleForm()">
                {{ showForm() ? 'Close Form' : '+ Add Course' }}
              </button>
            }
          </div>

          <!-- Add / Edit Course Form -->
          @if (showForm()) {
            <div class="form-card animate-fade-in">
              <h3>{{ editingCourseId ? 'Edit Course Details' : 'Introduce New Course' }}</h3>
              <form (submit)="saveCourse()">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="title">Course Title *</label>
                    <input 
                      type="text" 
                      id="title" 
                      name="title"
                      class="form-control" 
                      [(ngModel)]="formCourse.title" 
                      required 
                      placeholder="e.g. Concurrent Java Systems"
                    />
                  </div>
                  <div class="form-group">
                    <label for="duration">Duration (Hours) *</label>
                    <input 
                      type="number" 
                      id="duration" 
                      name="durationHours"
                      class="form-control" 
                      [(ngModel)]="formCourse.durationHours" 
                      required 
                      min="1"
                    />
                  </div>
                  <div class="form-group">
                    <label for="category">Category *</label>
                    <select 
                      id="category" 
                      name="category"
                      class="form-control" 
                      [(ngModel)]="formCourse.category"
                      required
                    >
                      <option value="TECHNICAL">TECHNICAL</option>
                      <option value="DOMAIN">DOMAIN</option>
                      <option value="SOFT">SOFT</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="type">Type *</label>
                    <select 
                      id="type" 
                      name="type"
                      class="form-control" 
                      [(ngModel)]="formCourse.type"
                      required
                    >
                      <option value="ONLINE">ONLINE</option>
                      <option value="WORKSHOP">WORKSHOP</option>
                      <option value="WEBINAR">WEBINAR</option>
                      <option value="BOOTCAMP">BOOTCAMP</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="instructor">Instructor *</label>
                    <input 
                      type="text" 
                      id="instructor" 
                      name="instructor"
                      class="form-control" 
                      [(ngModel)]="formCourse.instructor" 
                      required 
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div class="form-group">
                    <label for="rating">Rating (0-5)</label>
                    <input 
                      type="number" 
                      id="rating" 
                      name="rating"
                      class="form-control" 
                      [(ngModel)]="formCourse.rating" 
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>
                </div>
                <div class="form-group mt-12">
                  <label for="description">Course Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    class="form-control" 
                    [(ngModel)]="formCourse.description" 
                    rows="3"
                    placeholder="Provide a summary of concepts covered..."
                  ></textarea>
                </div>
                <div class="form-group mt-12">
                  <label for="learningSourceUrl">External Study Resource URL</label>
                  <input 
                    type="text" 
                    id="learningSourceUrl" 
                    name="learningSourceUrl"
                    class="form-control" 
                    [(ngModel)]="formCourse.learningSourceUrl" 
                    placeholder="e.g. https://docs.oracle.com/en/java/"
                  />
                </div>
                <div class="form-group mt-12">
                  <label for="quizCsv">Upload Course Quiz CSV (10 Questions)</label>
                  <input 
                    type="file" 
                    id="quizCsv" 
                    (change)="onFileSelected($event)" 
                    accept=".csv"
                    class="form-control"
                    style="padding: 6px;"
                  />
                  <small style="color: var(--text-muted); font-size: 11px; display: block; margin-top: 4px;">
                    CSV format: question_text,option_a,option_b,option_c,option_d,correct_option (A, B, C, or D)
                  </small>
                </div>
                <div class="form-actions mt-16">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="cancelForm()">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-sm ml-8">{{ editingCourseId ? 'Update' : 'Publish' }}</button>
                </div>
              </form>
            </div>
          }

          <!-- Grid of Courses -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Fetching course curriculum...</p>
            </div>
          } @else if (courses().length === 0) {
            <div class="empty-state">
              <h3>No courses found</h3>
              <p>Try resetting the search query or filters.</p>
            </div>
          } @else {
            <div class="courses-grid animate-fade-in">
              @for (c of courses(); track c.id) {
                <div class="course-card">
                  <div class="card-header">
                    <div class="card-top">
                      <span class="category-badge" [class]="c.category.toLowerCase()">
                        {{ c.category }}
                      </span>
                      <span class="type-badge">
                        {{ c.type }}
                      </span>
                      <span class="duration-tag">
                        <svg class="duration-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {{ c.durationHours }}h
                      </span>
                    </div>
                    
                    <h3 class="course-title mt-12">
                      <a [routerLink]="['/learning/courses', c.id]" class="course-title-link">{{ c.title }}</a>
                    </h3>
                    @if (c.instructor) {
                      <div class="instructor-row">
                        <span class="instructor-lbl">Instructor: {{ c.instructor }}</span>
                        @if (c.rating) {
                          <span class="rating-lbl">★ {{ c.rating | number:'1.1-1' }}</span>
                        }
                      </div>
                    }
                  </div>

                  <div class="card-body mt-8">
                    <p class="course-desc">{{ c.description }}</p>
                    
                    <!-- Stats details -->
                    <div class="course-stats-detail">
                      <div class="stat-detail-item">
                        <span class="val">{{ c.enrolledCount || 0 }}</span>
                        <span class="lbl">Enrolled</span>
                      </div>
                      <div class="stat-detail-item">
                        <span class="val">{{ c.completedCount || 0 }}</span>
                        <span class="lbl">Completed</span>
                      </div>
                      @if (c.lastAssessmentScore !== null && c.lastAssessmentScore !== undefined) {
                        <div class="stat-detail-item highlight">
                          <span class="val">{{ c.lastAssessmentScore }}%</span>
                          <span class="lbl">Last Score</span>
                        </div>
                      }
                    </div>

                    <!-- Associated Learning Path -->
                    @if (c.learningPathName) {
                      <div class="associated-path">
                        <div class="path-info">
                          <span class="path-lbl">Path: {{ c.learningPathName }}</span>
                          @if (c.learningPathProgress !== null) {
                            <span class="path-pct">{{ c.learningPathProgress }}% progress</span>
                          }
                        </div>
                        @if (c.learningPathProgress !== null) {
                          <div class="tiny-bar-bg">
                            <div class="tiny-bar-fill" [style.width.%]="c.learningPathProgress"></div>
                          </div>
                        }
                      </div>
                    }

                    @if (c.learningSourceUrl && getEnrollmentStatus(c) !== 'NOT_ENROLLED') {
                      <div class="associated-path" style="margin-top: 12px; border-color: rgba(16, 185, 129, 0.3);">
                        <div class="path-info">
                          <span class="path-lbl" style="color: #10b981;">Study Link:</span>
                          <a [href]="c.learningSourceUrl" target="_blank" style="color: var(--primary-light); text-decoration: underline; font-weight: 600;">
                            Go to course materials
                          </a>
                        </div>
                      </div>
                    }

                    <!-- User Enrollment Status Badge -->
                    <div class="badge-status-row mt-12">
                      <app-status-badge [status]="getEnrollmentStatusForBadge(c)" />
                    </div>

                  </div>
                  
                  <div class="card-bottom mt-16">
                    <div class="actions-group">
                      @if (isAdminOrManager()) {
                        <!-- Consolidated Admin Action Icons -->
                        <a [routerLink]="['/learning/courses', c.id]" class="action-btn view-btn" title="View Course Details" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-secondary); background: transparent; transition: all 0.2s;">
                          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </a>
                        <button class="action-btn edit-btn" (click)="editCourse(c)" title="Edit Course Details" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-secondary); background: transparent; transition: all 0.2s; margin-left: 8px;">
                          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" (click)="deleteCourse(c.id!)" title="Delete Course" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-secondary); background: transparent; transition: all 0.2s; margin-left: 8px;">
                          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      } @else if (authService.role() === 'EMPLOYEE' || authService.role() === 'HR_MANAGER') {
                        @if (getEnrollmentStatus(c) === 'NOT_ENROLLED') {
                          <button class="btn btn-primary btn-sm" (click)="enroll(c)">
                            Enroll
                          </button>
                        } @else if (getEnrollmentStatus(c) === 'IN_PROGRESS') {
                          <a [routerLink]="['/learning/courses', c.id]" class="btn btn-secondary btn-sm neon-border">
                            Continue
                          </a>
                        } @else if (getEnrollmentStatus(c) === 'COMPLETED') {
                          <!-- Certificate Status Badge -->
                          <div style="margin-bottom: 8px;">
                            <span class="badge" [ngClass]="{
                              'badge-muted': getCertificateStatus(c) === 'NOT_ELIGIBLE',
                              'badge-info': getCertificateStatus(c) === 'ELIGIBLE',
                              'badge-warning': getCertificateStatus(c) === 'PENDING_APPROVAL',
                              'badge-success': getCertificateStatus(c) === 'APPROVED',
                              'badge-expired': getCertificateStatus(c) === 'REJECTED'
                            }" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">
                              Certificate: {{ getCertificateStatusLabel(getCertificateStatus(c)) }}
                            </span>
                          </div>

                          @if (getCertificateStatus(c) === 'ELIGIBLE' || getCertificateStatus(c) === 'REJECTED') {
                            <button class="btn btn-primary btn-sm neon-border" (click)="requestCertificate(c)">
                              Request Certificate
                            </button>
                          } @else if (getCertificateStatus(c) === 'APPROVED') {
                            <div style="display: flex; gap: 8px;">
                              <button class="btn btn-secondary btn-sm" (click)="viewCertificate(c)">
                                View Certificate
                              </button>
                              <button class="btn btn-primary btn-sm" (click)="downloadCertificatePdf(getCertificationRecordId(c))" style="background-color: #ea580c; border-color: #ea580c;">
                                Download PDF
                              </button>
                            </div>
                          } @else if (getCertificateStatus(c) === 'PENDING_APPROVAL') {
                            <button disabled class="btn btn-secondary btn-sm" style="opacity: 0.6; cursor: not-allowed;">
                              Pending Approval
                            </button>
                          }
                        }
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination Footer -->
            <div class="pagination-footer">
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="currentPage() === 0"
                (click)="changePage(currentPage() - 1)"
              >Previous</button>
              <span class="page-indicator">Page {{ currentPage() + 1 }} of {{ totalPages() || 1 }}</span>
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="currentPage() >= totalPages() - 1"
                (click)="changePage(currentPage() + 1)"
              >Next</button>
            </div>

            <!-- Certificate Preview Modal Overlay -->
            @if (activeCertificate()) {
              <div class="modal-overlay animate-fade-in">
                <div class="modal-card certificate-modal">
                  <div class="modal-header">
                    <h3>Certificate Preview</h3>
                    <button class="close-btn" (click)="closeCertificatePreview()">✕</button>
                  </div>
                  <div class="modal-body">
                    <div class="cert-border">
                      <div class="cert-content">
                        <h4 class="cert-brand">Enterprise Learning Platform with Skill and Career Guidance System</h4>
                        <h2 class="cert-title">CERTIFICATE OF COMPLETION</h2>
                        <p class="cert-subtitle">This is proudly presented to</p>
                        <h3 class="cert-name">{{ activeCertificateName() }}</h3>
                        <p class="cert-stmt">for successfully mastering the curriculum and completing all modules of the course</p>
                        <h4 class="cert-course">{{ activeCertificate()?.courseNameSnapshot }}</h4>
                        
                        <div class="cert-footer">
                          <div class="cert-footer-item">
                            <span class="label">Date of Issue:</span>
                            <span class="val">{{ activeCertificate()?.issueDate | date:'mediumDate' }}</span>
                          </div>
                          <div class="cert-footer-item right">
                            <span class="label">Credential ID:</span>
                            <span class="val">{{ activeCertificate()?.credentialId }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="closeCertificatePreview()">Close</button>
                    <button class="btn btn-primary ml-8" (click)="downloadCertificatePdf(activeCertificate()?.id)">Download PDF</button>
                  </div>
                </div>
              </div>
            }
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
    }
    .main-content {
      padding: 32px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .mb-28 { margin-bottom: 28px; }
    
    .page-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .search-filter-box {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      flex-grow: 1;
      max-width: 900px;
    }
    .search-control {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 16px;
      border-radius: 8px;
      width: 200px;
      font-size: 14px;
      outline: none;
      transition: all 0.3s ease;
      
      &:focus {
        border-color: var(--primary-accent);
        box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
      }
    }
    .category-tabs {
      display: flex;
      background-color: var(--bg-card);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        color: var(--text-primary);
      }
      
      &.active {
        background-color: var(--primary-accent);
        color: white;
        font-weight: 600;
      }
    }

    /* Form Card Styles */
    .form-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
      box-shadow: 0 8px 16px -4px rgba(0,0,0,0.3);
      
      h3 {
        font-size: 16px;
        color: var(--text-primary);
        margin-bottom: 16px;
      }
    }
    .form-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
      }
    }
    .form-control {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      
      &:focus {
        border-color: var(--primary-accent);
      }
    }
    .inline-input {
      width: 80px;
      padding: 4px 8px;
      font-size: 12px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Courses Grid */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .course-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      min-height: 380px;
      justify-content: space-between;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      
      &:hover {
        transform: translateY(-4px);
        border-color: var(--primary-accent);
        box-shadow: 0 10px 20px -6px rgba(234, 88, 12, 0.3);
      }
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .category-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      
      &.technical {
        background-color: rgba(2, 132, 199, 0.12);
        color: var(--secondary-light);
        border: 1px solid rgba(2, 132, 199, 0.2);
      }
      &.domain {
        background-color: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
      &.soft {
        background-color: rgba(236, 72, 153, 0.12);
        color: #f472b6;
        border: 1px solid rgba(236, 72, 153, 0.2);
      }
    }
    .type-badge {
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-light);
      border: 1px solid rgba(234, 88, 12, 0.15);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    .duration-tag {
      font-size: 11px;
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .duration-icon {
      width: 14px;
      height: 14px;
    }
    .course-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      color: var(--text-primary);
      margin-top: 12px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .course-title-link {
      color: inherit;
      text-decoration: none;
      transition: color 0.2s ease;
      &:hover {
        color: var(--primary-accent);
      }
    }
    .instructor-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
    }
    .instructor-lbl {
      font-style: italic;
    }
    .rating-lbl {
      color: #fbbf24;
      font-weight: 600;
    }
    .course-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    /* Stats grid per card */
    .course-stats-detail {
      display: flex;
      gap: 16px;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      padding: 8px 0;
      margin-bottom: 12px;
    }
    .stat-detail-item {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      
      .val {
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .lbl {
        font-size: 10px;
        color: var(--text-muted);
        text-transform: uppercase;
      }
      
      &.highlight {
        .val {
          color: #10b981;
        }
      }
    }

    /* Associated Path progress bar */
    .associated-path {
      background-color: var(--bg-main);
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid rgba(43, 57, 77, 0.5);
    }
    .path-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .path-lbl {
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 65%;
    }
    .path-pct {
      color: var(--primary-light);
      font-weight: 600;
    }
    .tiny-bar-bg {
      background-color: var(--bg-card);
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }
    .tiny-bar-fill {
      background-color: var(--primary-accent);
      height: 100%;
      border-radius: 2px;
    }

    /* Continue completion input */
    .completion-input-box {
      background-color: var(--bg-main);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid var(--primary-light);
      
      label {
        font-size: 11px;
        color: var(--text-secondary);
        display: block;
        margin-bottom: 4px;
      }
    }
    .input-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .management-actions {
      display: flex;
      gap: 8px;
    }
    .action-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      &.edit-btn:hover {
        border-color: var(--secondary-accent);
        color: var(--secondary-light);
      }
      &.delete-btn:hover {
        border-color: #ef4444;
        color: #f87171;
      }
    }

    .neon-border {
      border-color: var(--primary-accent) !important;
      color: var(--primary-light) !important;
      &:hover {
        background-color: rgba(234, 88, 12, 0.08) !important;
      }
    }

    /* Pagination Footer */
    .pagination-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 12px;
    }
    .page-indicator {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* Core / Utility Overrides */
    .mt-8 { margin-top: 8px; }
    .mt-12 { margin-top: 12px; }
    .mt-16 { margin-top: 16px; }
    .ml-8 { margin-left: 8px; }
    .ml-4 { margin-left: 4px; }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
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
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal Overlay Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 650px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      
      h3 {
        font-size: 18px;
        color: var(--text-primary);
        font-weight: 600;
        margin: 0;
      }
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      &:hover { color: var(--text-primary); }
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }

    /* Certificate Preview Styling */
    .cert-border {
      border: 4px solid var(--primary-accent);
      padding: 6px;
      border-radius: 8px;
    }
    .cert-content {
      border: 1px solid var(--border-color);
      padding: 32px;
      text-align: center;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.4);
    }
    .cert-brand {
      color: var(--primary-accent);
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 20px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .cert-title {
      font-size: 24px;
      color: var(--text-primary);
      margin: 0 0 16px 0;
      font-family: 'Outfit', sans-serif;
    }
    .cert-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      font-style: italic;
      margin: 0 0 12px 0;
    }
    .cert-name {
      font-size: 22px;
      color: var(--primary-light);
      font-weight: 700;
      margin: 0 0 16px 0;
    }
    .cert-stmt {
      font-size: 13px;
      color: var(--text-muted);
      max-width: 500px;
      margin: 0 auto 16px auto;
    }
    .cert-course {
      font-size: 18px;
      color: var(--text-primary);
      font-weight: 600;
      margin: 0 0 28px 0;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed var(--border-color);
      padding-top: 16px;
      font-size: 12px;
    }
    .cert-footer-item {
      text-align: left;
      display: flex;
      flex-direction: column;
      .label { color: var(--text-muted); }
      .val { color: var(--text-primary); font-weight: 600; }
      &.right { text-align: right; }
    }
  `]
})
export class CourseListComponent implements OnInit {
  protected readonly learningService = inject(LearningService);
  protected readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly certsService = inject(CertificationsService);

  readonly courses = signal<Course[]>([]);
  userCertifications: EmployeeCertification[] = [];
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly selectedCategory = signal<string>('');
  readonly selectedType = signal<string>('');

  // Global course statistics
  readonly stats = signal<CourseStats>({
    totalCourses: 0,
    monthlyEnrollments: 0,
    overallCompletionRate: 0
  });

  // User enrollments maps
  userEnrollmentsList: any[] = [];

  // Continuing active course UI state
  activeContinuingCourseId: string | null = null;
  completionScore = 80;

  // Pagination states
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);

  // Form Model
  formCourse: Course = {
    title: '',
    description: '',
    category: 'TECHNICAL',
    type: 'ONLINE',
    instructor: '',
    rating: 4.5,
    durationHours: 10,
    learningSourceUrl: ''
  };
  editingCourseId: string | null = null;
  selectedQuizFile: File | null = null;
  searchQuery = '';

  ngOnInit() {
    this.loadStats();
    this.loadUserEnrollments();
    this.loadUserCertifications();
    this.loadCourses();
  }

  loadStats() {
    this.learningService.getGlobalStats().subscribe({
      next: (res) => this.stats.set(res)
    });
  }

  loadUserEnrollments() {
    const empId = this.authService.employeeId();
    if (!empId) return;
    this.learningService.getEnrollmentsByEmployee(empId).subscribe({
      next: (res) => this.userEnrollmentsList = res
    });
  }

  loadUserCertifications() {
    const empId = this.authService.employeeId();
    if (!empId) return;
    this.certsService.getCertificationsByEmployee(empId).subscribe({
      next: (res) => this.userCertifications = res || [],
      error: () => this.userCertifications = []
    });
  }

  loadCourses() {
    this.loading.set(true);
    this.learningService.getCourses(
      this.selectedCategory(),
      this.searchQuery,
      this.currentPage(),
      8,
      this.selectedType()
    ).subscribe({
      next: (res) => {
        this.courses.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isAdminOrManager(): boolean {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'TRAINING_MANAGER';
  }

  filterByBoth(cat: string, type: string) {
    if (cat !== '') {
      this.selectedCategory.set(cat);
      this.selectedType.set('');
    } else if (type !== '') {
      this.selectedCategory.set('');
      this.selectedType.set(type);
    } else {
      this.selectedCategory.set('');
      this.selectedType.set('');
    }
    this.currentPage.set(0);
    this.loadCourses();
  }

  onSearchChange() {
    this.currentPage.set(0);
    this.loadCourses();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadCourses();
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formCourse = {
      title: '',
      description: '',
      category: 'TECHNICAL',
      type: 'ONLINE',
      instructor: '',
      rating: 4.5,
      durationHours: 10,
      learningSourceUrl: ''
    };
    this.editingCourseId = null;
    this.selectedQuizFile = null;
    const fileInput = document.getElementById('quizCsv') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedQuizFile = file;
    }
  }

  finalizeSave(isUpdate: boolean) {
    const msg = isUpdate ? 'The course was updated successfully.' : 'The course was registered successfully.';
    this.notificationService.success(isUpdate ? 'Course Updated' : 'Course Created', msg);
    this.loadCourses();
    this.loadStats();
    this.showForm.set(false);
    this.resetForm();
  }

  saveCourse() {
    if (this.editingCourseId) {
      this.learningService.updateCourse(this.editingCourseId, this.formCourse).subscribe({
        next: () => {
          if (this.selectedQuizFile) {
            this.learningService.uploadQuizCsv(this.editingCourseId!, this.selectedQuizFile).subscribe({
              next: () => this.finalizeSave(true),
              error: (err) => this.notificationService.error('Quiz Upload Failed', err.error?.message || 'Failed to upload quiz CSV.')
            });
          } else {
            this.finalizeSave(true);
          }
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || 'Failed to update course.')
      });
    } else {
      this.learningService.createCourse(this.formCourse).subscribe({
        next: (created) => {
          if (this.selectedQuizFile && created.id) {
            this.learningService.uploadQuizCsv(created.id, this.selectedQuizFile).subscribe({
              next: () => this.finalizeSave(false),
              error: (err) => this.notificationService.error('Quiz Upload Failed', err.error?.message || 'Failed to upload quiz CSV.')
            });
          } else {
            this.finalizeSave(false);
          }
        },
        error: (err) => this.notificationService.error('Creation Failed', err.error?.message || 'Failed to create course.')
      });
    }
  }

  editCourse(course: Course) {
    this.editingCourseId = course.id!;
    this.formCourse = { ...course };
    this.showForm.set(true);
  }

  deleteCourse(id: string) {
    this.confirmationService.confirm({
      title: 'Delete Course?',
      message: 'Are you sure you want to delete this course from the catalog?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.learningService.deleteCourse(id).subscribe({
          next: () => {
            this.notificationService.success('Course Deleted', 'The course was successfully deleted.');
            this.loadCourses();
            this.loadStats();
          },
          error: () => this.notificationService.error('Delete Failed', 'Failed to delete course')
        });
      }
    });
  }

  getEnrollmentStatus(course: Course): string {
    const found = this.userEnrollmentsList.find(e => e.courseId === course.id);
    return found ? found.status : 'NOT_ENROLLED';
  }

  getEnrollmentStatusForBadge(course: Course): string {
    const status = this.getEnrollmentStatus(course);
    if (status === 'COMPLETED') return 'true';
    if (status === 'IN_PROGRESS' || status === 'ENROLLED') return 'warning';
    return 'false';
  }

  enroll(course: Course) {
    const empId = this.authService.employeeId();
    if (!empId) {
      this.notificationService.warning('Enrollment Failed', 'Only registered employees can enroll in courses.');
      return;
    }

    this.learningService.enroll(empId, course.id!, null).subscribe({
      next: () => {
        this.loadUserEnrollments();
        this.loadCourses();
        this.notificationService.success('Enrolled Successfully', `Successfully enrolled in: "${course.title}".`);
      },
      error: (err) => this.notificationService.error('Enrollment Failed', err.error?.message || "Already enrolled or failed to register")
    });
  }

  triggerContinue(course: Course) {
    this.activeContinuingCourseId = course.id!;
    this.completionScore = 80;
  }

  submitCompletion(course: Course) {
    const found = this.userEnrollmentsList.find(e => e.courseId === course.id);
    if (!found) return;

    this.learningService.completeEnrollment(found.id, this.completionScore).subscribe({
      next: () => {
        this.activeContinuingCourseId = null;
        this.loadUserEnrollments();
        this.loadStats();
        this.loadCourses();
        this.notificationService.success('Course Completed', `Successfully completed: "${course.title}" with score ${this.completionScore}%!`);
      },
      error: () => this.notificationService.error('Error', 'Failed to log completion')
    });
  }

  readonly activeCertificate = signal<any>(null);
  readonly activeCertificateName = signal<string>('');

  getCertificateStatus(course: Course): string {
    const status = this.getEnrollmentStatus(course);
    if (status !== 'COMPLETED') {
      return 'NOT_ELIGIBLE';
    }

    const found = this.userCertifications.find(c => c.courseId === course.id);
    if (!found) {
      return 'ELIGIBLE';
    }

    if (found.requestStatus === 'PENDING_APPROVAL') {
      return 'PENDING_APPROVAL';
    }
    if (found.requestStatus === 'APPROVED') {
      return 'APPROVED';
    }
    if (found.requestStatus === 'REJECTED') {
      return 'REJECTED';
    }

    if (found.status === 'ACTIVE') {
      return 'APPROVED';
    }

    return 'ELIGIBLE';
  }

  getCertificateStatusLabel(status: string): string {
    switch(status) {
      case 'NOT_ELIGIBLE': return 'Not Eligible';
      case 'ELIGIBLE': return 'Eligible';
      case 'REQUESTED': return 'Requested';
      case 'PENDING_APPROVAL': return 'Pending Approval';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'CERTIFICATE_ISSUED': return 'Certificate Issued';
      default: return 'Not Eligible';
    }
  }

  getCertificationRecordId(course: Course): string {
    const found = this.userCertifications.find(c => c.courseId === course.id);
    return found ? found.id : '';
  }

  requestCertificate(course: Course) {
    const empId = this.authService.employeeId();
    const enrollment = this.userEnrollmentsList.find(e => e.courseId === course.id);
    if (!empId || !enrollment) return;

    const req = {
      employeeId: empId,
      courseId: course.id!,
      courseCompletionId: enrollment.id,
      completionDate: enrollment.completedAt || new Date().toISOString(),
      assessmentScore: enrollment.finalScore || 80,
      completionPercentage: 100,
      instructor: course.instructor || 'Academy Instructor',
      courseName: course.title,
      category: course.category
    };

    this.certsService.requestLearningCertificate(req).subscribe({
      next: () => {
        this.notificationService.success('Request Submitted', 'Certificate request submitted successfully.');
        this.loadUserCertifications();
      },
      error: (err) => this.notificationService.error('Request Failed', err.error?.message || 'Failed to request certificate.')
    });
  }

  viewCertificate(course: Course) {
    const found = this.userCertifications.find(c => c.courseId === course.id);
    if (found) {
      const mappedCert = {
        id: found.id,
        credentialId: found.credentialId,
        courseNameSnapshot: found.certificationName,
        issueDate: found.issueDate
      };
      this.activeCertificate.set(mappedCert);
      const email = this.authService.email() || 'employee@skillsphere.com';
      this.activeCertificateName.set(email.split('@')[0].toUpperCase());
      
      const empId = this.authService.employeeId();
      if (empId) {
        this.learningService.getEmployeeDetails(empId).subscribe({
          next: (emp) => {
            if (emp && emp.name) {
              this.activeCertificateName.set(emp.name);
            }
          }
        });
      }
    } else {
      this.notificationService.error('Error', 'Certificate not found. Please contact training administrator.');
    }
  }

  closeCertificatePreview() {
    this.activeCertificate.set(null);
  }

  downloadCertificatePdf(certId: string) {
    if (!certId) return;
    this.certsService.downloadCertificatePdf(certId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate-${this.activeCertificate()?.credentialId || 'Course'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate and download certificate PDF.')
    });
  }

  cancelForm() {
    this.showForm.set(false);
    this.resetForm();
  }
}
