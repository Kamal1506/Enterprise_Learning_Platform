import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { LearningService, Course, Enrollment } from '../learning.service';
import { AuthService } from '../../../core/auth.service';
import { EmployeeService, Employee } from '../../skills/employee.service';
import { CertificationsService, Certification, EmployeeCertification } from '../../certifications/certifications.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-course-detail',
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
          title="Course Management Details" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Back Link -->
          <div class="back-nav mb-20 animate-fade-in">
            <a routerLink="/learning/courses" class="back-link">
              <span class="arrow">&larr;</span> Back to Catalog
            </a>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Fetching course analytics and summaries...</p>
            </div>
          } @else if (!course()) {
            <div class="empty-state">
              <h3>Course Not Found</h3>
              <p>The requested course record does not exist or has been removed.</p>
              <a routerLink="/learning/courses" class="btn btn-primary mt-12">Back to Catalog</a>
            </div>
          } @else {
            @if (authService.role() === 'ADMIN' || authService.role() === 'TRAINING_MANAGER') {
              <div class="course-detail-layout animate-fade-in">
                
                <!-- Header Section -->
                <div class="detail-header-card glass-card mb-24">
                  <div class="header-main">
                    <div>
                      <span class="category-badge" [class]="course()!.category.toLowerCase()">
                        {{ course()!.category }}
                      </span>
                      <span class="type-badge ml-8">
                        {{ course()!.type }}
                      </span>
                      <h2 class="course-name mt-12">{{ course()!.title }}</h2>
                      <p class="instructor-txt">Led by: <strong>{{ course()!.instructor || 'N/A' }}</strong></p>
                    </div>
                    <div class="course-rating-box">
                      <span class="star-rating">★ {{ course()!.rating || '4.5' }}</span>
                      <span class="rating-label">Average Instructor Rating</span>
                    </div>
                  </div>
                </div>

                <!-- Metrics Summary Cards -->
                <div class="stats-row mb-24">
                  <app-stat-card 
                    title="Enrolled Employees" 
                    [value]="statsEnrolled()" 
                    icon="users"
                  />
                  <app-stat-card 
                    title="Completion Rate" 
                    [value]="(statsCompletionRate() | number:'1.0-1') + '%'" 
                    icon="award"
                  />
                  <app-stat-card 
                    title="Average Score" 
                    [value]="statsAverageScore() > 0 ? (statsAverageScore() | number:'1.0-1') + '%' : 'N/A'" 
                    icon="activity"
                  />
                </div>

                <div class="cards-grid">
                  <!-- Course Metadata & Stats Column -->
                  <div class="column-left flex-col gap-24">
                    
                    <!-- Metadata Details -->
                    <div class="dashboard-card glass-card">
                      <h3>Course Information</h3>
                      <div class="metadata-list">
                        <div class="metadata-row">
                          <span class="lbl">Course Name</span>
                          <span class="val"><strong>{{ course()!.title }}</strong></span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Category</span>
                          <span class="val">{{ course()!.category }}</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Course Type</span>
                          <span class="val">{{ course()!.type }}</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Duration</span>
                          <span class="val">{{ course()!.durationHours }} Hours</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Difficulty Level</span>
                          <span class="val font-semibold text-accent">{{ difficultyLevel() }}</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Instructor</span>
                          <span class="val">{{ course()!.instructor || 'N/A' }}</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Status</span>
                          <span class="val"><span class="badge badge-success">Active</span></span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Created Date</span>
                          <span class="val">{{ course()!.createdAt | date:'mediumDate' }}</span>
                        </div>
                        <div class="metadata-row">
                          <span class="lbl">Last Updated</span>
                          <span class="val">{{ course()!.updatedAt | date:'mediumDate' }}</span>
                        </div>
                        <div class="metadata-row full-width">
                          <span class="lbl">Description</span>
                          <p class="desc-txt">{{ course()!.description || 'No description provided.' }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Statistics Panel -->
                    <div class="dashboard-card glass-card">
                      <h3>Course Statistics</h3>
                      <div class="stats-panel-list">
                        <div class="metric-row">
                          <span class="lbl">Total Enrolled</span>
                          <span class="val">{{ statsEnrolled() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Total In Progress</span>
                          <span class="val">{{ statsInProgress() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Total Completed</span>
                          <span class="val">{{ statsCompleted() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Eligible for Certificate</span>
                          <span class="val text-blue font-bold" style="color: #3b82f6; font-weight: 600;">{{ statsEligibleForCert() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Certificate Requests</span>
                          <span class="val text-orange font-bold" style="color: #ea580c; font-weight: 600;">{{ statsTotalRequests() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Pending Requests</span>
                          <span class="val text-warning font-bold" style="color: #f59e0b; font-weight: 600;">{{ statsPendingRequests() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Rejected Requests</span>
                          <span class="val text-danger font-bold" style="color: #ef4444; font-weight: 600;">{{ statsRejectedRequests() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Certificates Issued</span>
                          <span class="val text-green font-bold" style="color: #10b981; font-weight: 600;">{{ certsIssued() }}</span>
                        </div>
                        <div class="metric-row">
                          <span class="lbl">Completion Rate</span>
                          <span class="val text-accent" style="font-weight: 600;">{{ (statsCompletionRate() | number:'1.0-1') }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Progress Distribution Panel -->
                    <div class="dashboard-card glass-card">
                      <h3>Course Progress Analysis</h3>
                      <div class="progress-dist-section">
                        <div class="dist-row">
                          <span>Completion Rate</span>
                          <span>{{ (statsCompletionRate() | number:'1.0-1') }}%</span>
                        </div>
                        <div class="progress-bar-container">
                          <div class="progress-bar-fill fill-green" [style.width.%]="statsCompletionRate()"></div>
                        </div>

                        <div class="dist-row mt-12">
                          <span>Average Assessment Score</span>
                          <span>{{ statsAverageScore() > 0 ? (statsAverageScore() | number:'1.0-1') + '%' : 'N/A' }}</span>
                        </div>
                        <div class="progress-bar-container">
                          <div class="progress-bar-fill fill-accent" [style.width.%]="statsAverageScore()"></div>
                        </div>

                        <div class="distribution-legend mt-16">
                          <h4 class="legend-title">Progress Distribution</h4>
                          <div class="legend-bar">
                            <div class="legend-bar-part part-completed" [style.width.%]="pctCompleted()" title="Completed"></div>
                            <div class="legend-bar-part part-progress" [style.width.%]="pctInProgress()" title="In Progress"></div>
                            <div class="legend-bar-part part-enrolled" [style.width.%]="pctEnrolled()" title="Enrolled"></div>
                          </div>
                          <div class="legend-labels mt-8">
                            <span class="lbl-item"><span class="dot dot-completed"></span> Completed ({{ statsCompleted() }})</span>
                            <span class="lbl-item"><span class="dot dot-progress"></span> In Progress ({{ statsInProgress() }})</span>
                            <span class="lbl-item"><span class="dot dot-enrolled"></span> Enrolled ({{ statsEnrolled() - statsInProgress() - statsCompleted() < 0 ? 0 : statsEnrolled() - statsInProgress() - statsCompleted() }})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column: Enrollments & Certifications -->
                  <div class="column-right flex-col gap-24">
                    
                    <!-- Certification Configuration -->
                    <div class="dashboard-card glass-card">
                      <h3>Certification Mapping</h3>
                      @if (associatedCert()) {
                        <div class="cert-info-box">
                          <div class="cert-header">
                            <span class="material-icons cert-icon text-accent">award</span>
                            <div>
                              <h4 class="cert-title">{{ associatedCert()!.name }}</h4>
                              <p class="cert-provider">Provider: {{ associatedCert()!.provider }}</p>
                            </div>
                          </div>
                          <div class="cert-details-grid mt-16">
                            <div class="detail-item">
                              <span class="lbl">Validity</span>
                              <span class="val">{{ associatedCert()!.validityMonths }} Months</span>
                            </div>
                            <div class="detail-item">
                              <span class="lbl">Passing Score</span>
                              <span class="val">80%</span>
                            </div>
                            <div class="detail-item">
                              <span class="lbl">Status</span>
                              <span class="val"><span class="badge badge-success">Active</span></span>
                            </div>
                            <div class="detail-item">
                              <span class="lbl">Eligible Criteria</span>
                              <span class="val text-muted" style="font-size:11px">Complete course score &ge; 80%</span>
                            </div>
                          </div>
                          <div class="cert-stats-row mt-16">
                            <div class="stat-badge orange-badge">
                              <span class="num">{{ certsRequested() }}</span>
                              <span class="lbl">Requested</span>
                            </div>
                            <div class="stat-badge green-badge">
                              <span class="num">{{ certsIssued() }}</span>
                              <span class="lbl">Issued</span>
                            </div>
                          </div>
                        </div>
                      } @else {
                        <div class="empty-state-dashed">
                          <span class="material-icons block-icon">block</span>
                          <p class="warning-txt">No certification configured for this course.</p>
                        </div>
                      }
                    </div>

                    <!-- Enrollment Summary lists -->
                    <div class="dashboard-card glass-card">
                      <h3>Enrollment Summary</h3>
                      
                      <div class="enrollment-list-section">
                        
                        <!-- Completed List -->
                        <div class="sub-list-container">
                          <h4 class="text-green border-bottom-green">Completed Employees ({{ listCompleted().length }})</h4>
                          @if (listCompleted().length === 0) {
                            <p class="empty-sub-list">No employees have completed this course.</p>
                          } @else {
                            <ul class="employee-ul">
                              @for (e of listCompleted(); track e.id) {
                                <li class="employee-li">
                                  <div class="emp-info">
                                    <span class="emp-name">{{ getEmployeeName(e.employeeId) }}</span>
                                    <span class="emp-dept">{{ getEmployeeDept(e.employeeId) }}</span>
                                  </div>
                                  <span class="badge badge-success">Completed</span>
                                </li>
                              }
                            </ul>
                          }
                        </div>

                        <!-- In Progress List -->
                        <div class="sub-list-container mt-16">
                          <h4 class="text-orange border-bottom-orange">In Progress Employees ({{ listInProgress().length }})</h4>
                          @if (listInProgress().length === 0) {
                            <p class="empty-sub-list">No employees are in In Progress state.</p>
                          } @else {
                            <ul class="employee-ul">
                              @for (e of listInProgress(); track e.id) {
                                <li class="employee-li">
                                  <div class="emp-info">
                                    <span class="emp-name">{{ getEmployeeName(e.employeeId) }}</span>
                                    <span class="emp-dept">{{ getEmployeeDept(e.employeeId) }}</span>
                                  </div>
                                  <div class="flex-col gap-4 text-right">
                                    <span class="badge badge-warning">In Progress</span>
                                    <span class="text-muted" style="font-size:10px">{{ e.progressPercent }}% Complete</span>
                                  </div>
                                </li>
                              }
                            </ul>
                          }
                        </div>

                        <!-- Enrolled List -->
                        <div class="sub-list-container mt-16">
                          <h4 class="text-secondary border-bottom-secondary">Registered/Enrolled Employees ({{ listEnrolled().length }})</h4>
                          @if (listEnrolled().length === 0) {
                            <p class="empty-sub-list">No employees are in Enrolled state.</p>
                          } @else {
                            <ul class="employee-ul">
                              @for (e of listEnrolled(); track e.id) {
                                <li class="employee-li">
                                  <div class="emp-info">
                                    <span class="emp-name">{{ getEmployeeName(e.employeeId) }}</span>
                                    <span class="emp-dept">{{ getEmployeeDept(e.employeeId) }}</span>
                                  </div>
                                  <span class="badge badge-muted">Enrolled</span>
                                </li>
                              }
                            </ul>
                          }
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

              </div>
            } @else {
              <!-- Learner Classroom View -->
              <div class="learner-classroom-layout animate-fade-in">
                <div class="classroom-header glass-card mb-24">
                  <span class="category-badge" [class]="course()!.category.toLowerCase()">{{ course()!.category }}</span>
                  <span class="type-badge ml-8">{{ course()!.type }}</span>
                  <h2 class="course-name mt-12">{{ course()!.title }}</h2>
                  <p class="instructor-txt">Led by: <strong>{{ course()!.instructor || 'N/A' }}</strong> &bull; Duration: <strong>{{ course()!.durationHours }} Hrs</strong></p>
                  
                  @if (course()!.learningSourceUrl) {
                    <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; background: rgba(234, 88, 12, 0.08); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(234, 88, 12, 0.15); width: fit-content;">
                      <span style="color: var(--primary-accent); display: inline-flex; align-items: center;">
                        <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      </span>
                      <span style="color: var(--text-secondary);">Course Material:</span>
                      <a [href]="course()!.learningSourceUrl" target="_blank" style="color: var(--primary-light); font-weight: 600; text-decoration: underline;">
                        Access External Study Source Link
                      </a>
                    </div>
                  }
                  
                  @if (activeEnrollment()) {
                    <div class="overall-progress-box mt-16">
                      <div class="progress-info mb-6" style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span class="progress-lbl" style="color: var(--text-secondary);">Course Progression</span>
                        <span class="progress-val" style="color: var(--primary-accent); font-weight: 600;">{{ activeEnrollment()?.progressPercent }}% Complete</span>
                      </div>
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill fill-green" [style.width.%]="activeEnrollment()?.progressPercent"></div>
                      </div>
                    </div>
                  } @else if (authService.role() === 'EMPLOYEE' || authService.role() === 'HR_MANAGER') {
                    <div style="margin-top: 16px;">
                      <button class="btn btn-primary" (click)="enrollInCourse()">
                        Enroll in Course
                      </button>
                    </div>
                  }
                </div>

                <div class="classroom-grid">
                  <!-- Modules Timeline Panel (Left) -->
                  <div class="classroom-sidebar glass-card">
                    <h3 style="font-size: 15px; margin: 0 0 16px 0; color: var(--text-primary);">Course Curriculum</h3>
                    <div class="modules-timeline-list">
                      @if (courseModules().length === 0) {
                        <p class="empty-txt" style="font-size: 12px; color: var(--text-muted); font-style: italic;">No modules available for this course.</p>
                      } @else {
                        @for (m of courseModules(); track m.id) {
                          <div class="timeline-module-item" 
                               [class.active]="selectedModule()?.id === m.id"
                               [class.completed]="isModuleCompleted(m.id)"
                               (click)="selectedModule.set(m)">
                            <div class="timeline-indicator">
                              @if (isModuleCompleted(m.id)) {
                                <span class="check-icon">✓</span>
                              } @else {
                                <span class="seq-num">#{{ m.sequenceOrder }}</span>
                              }
                            </div>
                            <div class="module-timeline-details">
                              <h4>{{ m.title }}</h4>
                              <span class="duration">{{ m.durationHours }} Hours Study</span>
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>

                  <!-- Active Module Reader (Right) -->
                  <div class="classroom-content flex-col gap-24" style="display: flex; flex-direction: column; gap: 24px;">
                    @if (selectedModule()) {
                      <div class="dashboard-card glass-card">
                        <div class="module-reader-header border-bottom-secondary pb-12 mb-16" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; margin-bottom: 16px;">
                          <span class="seq-badge">Module #{{ selectedModule()?.sequenceOrder }}</span>
                          <h2 class="module-title mt-8" style="font-size: 20px; color: var(--text-primary); margin: 8px 0 0 0;">{{ selectedModule()?.title }}</h2>
                          <p class="module-desc mt-4" style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0;">{{ selectedModule()?.description }}</p>
                        </div>
                        
                        <div class="module-content-body" style="margin-top: 16px;">
                          <h3 style="font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">Study Resources & Content</h3>
                          <p class="content-paragraph">{{ selectedModule()?.content }}</p>
                        </div>

                        <div class="module-actions-footer mt-24" style="margin-top: 24px;">
                          @if (isModuleCompleted(selectedModule()?.id)) {
                            <span class="badge badge-success px-12 py-8" style="font-size: 13px; padding: 6px 12px; border-radius: 4px;">✓ Completed</span>
                          } @else {
                            <button class="btn btn-primary" (click)="completeModule(selectedModule()?.id)">
                              Mark Module as Completed
                            </button>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="dashboard-card glass-card empty-classroom-center" style="padding: 48px; text-align: center; color: var(--text-muted);">
                        <p>Select a curriculum module from the left menu to start learning.</p>
                      </div>
                    }

                    <!-- Quiz Ready Card -->
                    @if (activeEnrollment()?.progressPercent === 100 && activeEnrollment()?.status !== 'COMPLETED') {
                      <div class="dashboard-card glass-card completion-congrats-card animate-scale-in" style="background: linear-gradient(135deg, rgba(234,88,12,0.1), rgba(16,185,129,0.05)); border: 1px solid var(--primary-accent); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
                        <div class="congrats-header" style="display: flex; align-items: center; gap: 16px;">
                          <span style="color: var(--primary-accent); display: inline-flex; align-items: center;">
                            <svg style="width: 36px; height: 36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="9" y1="14" x2="15" y2="14"></line><line x1="9" y1="18" x2="13" y2="18"></line><line x1="9" y1="10" x2="15" y2="10"></line></svg>
                          </span>
                          <div>
                            <h3 style="font-size: 18px; color: var(--text-primary); margin: 0;">Course Quiz Ready</h3>
                            <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0 0;">
                              You have studied all curriculum modules. Please complete the quiz to log completion.
                            </p>
                          </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; align-items: center; gap: 16px;">
                          <button class="btn btn-primary" (click)="openQuizModal()">
                            Take Course Quiz
                          </button>
                          @if (activeEnrollment()?.finalScore !== null && activeEnrollment()?.finalScore !== undefined) {
                            <span style="font-size: 13px; color: #ef4444; font-weight: 600;">
                              Last Attempt Score: {{ activeEnrollment()?.finalScore }}% (Failed, need &ge; 80%)
                            </span>
                          }
                        </div>
                      </div>
                    }

                    <!-- Completion Certificate Card -->
                    @if (activeEnrollment()?.status === 'COMPLETED') {
                      <div class="dashboard-card glass-card completion-congrats-card animate-scale-in" style="background: linear-gradient(135deg, rgba(234,88,12,0.1), rgba(16,185,129,0.05)); border: 1px solid var(--primary-accent); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
                        <div class="congrats-header" style="display: flex; align-items: center; gap: 16px;">
                          <span style="color: #f59e0b; display: inline-flex; align-items: center;">
                            <svg style="width: 36px; height: 36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                          </span>
                          <div>
                            <h3 style="font-size: 18px; color: var(--text-primary); margin: 0;">Congratulations!</h3>
                            <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0 0;">You successfully completed this course with a score of <strong>{{ activeEnrollment()?.finalScore }}%</strong>.</p>
                          </div>
                        </div>
                        
                        <div class="cert-preview-card" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                          @if (getCertificateStatus() === 'ELIGIBLE') {
                            <button class="btn btn-primary" (click)="requestCertificate()">
                              Request Professional PDF Certificate
                            </button>
                          } @else if (getCertificateStatus() === 'PENDING_APPROVAL') {
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <span class="badge badge-warning">Request Pending Approval</span>
                              <span style="font-size: 12px; color: var(--text-muted);">HR is currently reviewing your attempt score.</span>
                            </div>
                          } @else if (getCertificateStatus() === 'REJECTED') {
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                              <span class="badge badge-danger" style="width: fit-content;">Request Rejected</span>
                              <span style="font-size: 12px; color: var(--text-secondary);">Your certification request was not approved. You can submit another request.</span>
                              <button class="btn btn-primary" (click)="requestCertificate()" style="margin-top: 8px; width: fit-content;">
                                Re-request Certificate
                              </button>
                            </div>
                          } @else if (getCertificateStatus() === 'APPROVED' || activeCertificate()) {
                            <p class="credential-lbl" style="font-size: 13px; color: var(--text-secondary);">
                              Credential ID: <strong style="color: var(--text-primary);">{{ activeCertificate()?.credentialId || 'APPROVED' }}</strong>
                            </p>
                            <button class="btn btn-primary mt-12" (click)="downloadCertificatePdf(activeCertificate()?.id || getCertificationRecordId())" style="margin-top: 12px;">
                              Download Professional PDF Certificate
                            </button>
                          }
                        </div>
                      </div>
                    }

                    <!-- Interactive Quiz Modal Overlay -->
                    @if (showQuizModal()) {
                      <div class="modal-overlay animate-fade-in">
                        <div class="modal-card" style="max-width: 750px; max-height: 85vh; overflow-y: auto;">
                          <div class="modal-header">
                            <h3>{{ course()?.title }} - Course Assessment</h3>
                            <button class="close-btn" (click)="closeQuizModal()">✕</button>
                          </div>
                          <div class="modal-body" style="padding-top: 12px;">
                            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
                              Answer all 10 questions. You must secure at least <strong>80% (8 correct answers)</strong> to complete the course and request a certification.
                            </p>

                            <div class="quiz-questions-list" style="display: flex; flex-direction: column; gap: 20px;">
                              @for (q of quizQuestions(); track q.id; let idx = $index) {
                                <div class="quiz-question-item" style="border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.01);">
                                  <h4 style="font-size: 14px; color: var(--text-primary); margin: 0 0 12px 0; font-weight: 600;">
                                    Q{{ idx + 1 }}. {{ q.questionText }}
                                  </h4>
                                  <div class="options-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                                    <label class="option-label">
                                      <input type="radio" [name]="'q_' + q.id" value="A" (change)="selectAnswer(q.id, 'A')" />
                                      <span>A. {{ q.optionA }}</span>
                                    </label>
                                    <label class="option-label">
                                      <input type="radio" [name]="'q_' + q.id" value="B" (change)="selectAnswer(q.id, 'B')" />
                                      <span>B. {{ q.optionB }}</span>
                                    </label>
                                    <label class="option-label">
                                      <input type="radio" [name]="'q_' + q.id" value="C" (change)="selectAnswer(q.id, 'C')" />
                                      <span>C. {{ q.optionC }}</span>
                                    </label>
                                    <label class="option-label">
                                      <input type="radio" [name]="'q_' + q.id" value="D" (change)="selectAnswer(q.id, 'D')" />
                                      <span>D. {{ q.optionD }}</span>
                                    </label>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                          <div class="modal-footer" style="margin-top: 24px;">
                            <button class="btn btn-secondary" (click)="closeQuizModal()">Cancel</button>
                            <button class="btn btn-primary ml-8" [disabled]="!isQuizComplete()" (click)="submitQuizAnswers()">
                              Submit Assessment
                            </button>
                          </div>
                        </div>
                      </div>
                    }
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
    .back-nav {
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        transition: color 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        &:hover {
          color: var(--primary-accent);
        }
      }
    }
    .mb-20 { margin-bottom: 20px; }
    .mb-24 { margin-bottom: 24px; }
    .ml-8 { margin-left: 8px; }
    .mt-12 { margin-top: 12px; }
    .mt-16 { margin-top: 16px; }
    
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

    /* Layout detail structure */
    .detail-header-card {
      padding: 24px 32px;
      border-radius: 12px;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .category-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
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
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .course-name {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      color: var(--text-primary);
      font-weight: 700;
    }
    .instructor-txt {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    .course-rating-box {
      text-align: right;
      display: flex;
      flex-direction: column;
      .star-rating {
        font-size: 22px;
        color: #fbbf24;
        font-weight: 700;
      }
      .rating-label {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-top: 2px;
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }
    }
    .flex-col {
      display: flex;
      flex-direction: column;
    }
    .gap-24 { gap: 24px; }

    .dashboard-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        color: var(--text-primary);
        font-weight: 600;
        margin-bottom: 20px;
        border-left: 3px solid var(--primary-accent);
        padding-left: 10px;
      }
    }

    /* Metadata details rows */
    .metadata-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 600px) {
      .metadata-list {
        grid-template-columns: 1fr;
      }
    }
    .metadata-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding-bottom: 10px;
      
      .lbl {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--text-muted);
        letter-spacing: 0.05em;
      }
      .val {
        font-size: 14px;
        color: var(--text-primary);
      }
      &.full-width {
        grid-column: 1 / -1;
        border-bottom: none;
      }
    }
    .desc-txt {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-top: 4px;
    }

    /* Stats lists */
    .stats-panel-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
      
      .lbl { color: var(--text-secondary); }
      .val { font-weight: 600; font-size: 14px; }
    }

    /* Progress Distribution Visuals */
    .progress-dist-section {
      .dist-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }
    }
    .progress-bar-container {
      background-color: var(--bg-main);
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 3px;
      
      &.fill-green { background-color: #10b981; }
      &.fill-accent { background-color: var(--primary-accent); }
    }
    
    .legend-title {
      font-size: 13px;
      color: var(--text-primary);
      margin-bottom: 8px;
      font-weight: 500;
    }
    .legend-bar {
      height: 14px;
      background-color: var(--bg-main);
      border-radius: 4px;
      display: flex;
      overflow: hidden;
    }
    .legend-bar-part {
      height: 100%;
      
      &.part-completed { background-color: #10b981; }
      &.part-progress { background-color: var(--primary-accent); }
      &.part-enrolled { background-color: #64748b; }
    }
    .legend-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 11px;
    }
    .lbl-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      
      &.dot-completed { background-color: #10b981; }
      &.dot-progress { background-color: var(--primary-accent); }
      &.dot-enrolled { background-color: #64748b; }
    }

    /* Cert box styling */
    .cert-info-box {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      background-color: rgba(255,255,255,0.01);
    }
    .cert-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cert-icon {
      font-size: 32px;
    }
    .cert-title {
      font-size: 15px;
      color: var(--text-primary);
      font-weight: 600;
    }
    .cert-provider {
      font-size: 11px;
      color: var(--text-muted);
    }
    .cert-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
        .val { font-size: 12px; color: var(--text-secondary); }
      }
    }
    .cert-stats-row {
      display: flex;
      gap: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }
    .stat-badge {
      flex: 1;
      padding: 8px;
      border-radius: 6px;
      text-align: center;
      display: flex;
      flex-direction: column;
      
      .num { font-size: 16px; font-weight: 700; }
      .lbl { font-size: 10px; text-transform: uppercase; margin-top: 2px; }
      
      &.orange-badge {
        background-color: rgba(245, 158, 11, 0.08);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.15);
      }
      &.green-badge {
        background-color: rgba(16, 185, 129, 0.08);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.15);
      }
    }
    
    .empty-state-dashed {
      border: 1px dashed var(--border-color);
      padding: 30px 16px;
      text-align: center;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .block-icon { font-size: 28px; color: var(--text-muted); }
      .warning-txt { font-size: 13px; color: var(--text-secondary); }
    }

    /* Enrollment List Styles */
    .enrollment-list-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sub-list-container {
      h4 {
        font-size: 13px;
        font-weight: 600;
        padding-bottom: 6px;
        margin-bottom: 10px;
        border-bottom: 1px solid;
      }
    }
    .border-bottom-green { border-bottom-color: rgba(16,185,129,0.2) !important; }
    .border-bottom-orange { border-bottom-color: rgba(245,158,11,0.2) !important; }
    .border-bottom-secondary { border-bottom-color: rgba(255,255,255,0.06) !important; }
    
    .empty-sub-list {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
      padding: 4px 8px;
    }
    .employee-ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .employee-li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: rgba(255,255,255,0.02);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
    }
    .emp-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .emp-name { font-weight: 500; color: var(--text-primary); }
      .emp-dept { font-size: 11px; color: var(--text-muted); }
    }

    /* Classroom Classroom Layout Styles */
    .learner-classroom-layout {
      display: flex;
      flex-direction: column;
    }
    .classroom-header {
      padding: 24px;
    }
    .classroom-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .classroom-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .classroom-sidebar {
      padding: 20px;
      height: fit-content;
    }
    .modules-timeline-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .timeline-module-item {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.01);
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary-accent);
        background: rgba(234, 88, 12, 0.04);
      }
      
      &.active {
        border-color: var(--primary-accent);
        background: rgba(234, 88, 12, 0.08);
      }
      
      &.completed {
        border-left: 4px solid #10b981;
      }
    }
    .timeline-indicator {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      flex-shrink: 0;
      border: 1px solid var(--border-color);
    }
    .timeline-module-item.completed .timeline-indicator {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }
    .module-timeline-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
      
      h4 {
        font-size: 13px;
        color: var(--text-primary);
        font-weight: 500;
        margin: 0;
      }
      .duration {
        font-size: 10px;
        color: var(--text-muted);
      }
    }

    .seq-badge {
      background: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      width: fit-content;
    }
    .content-paragraph {
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-secondary);
      background: var(--bg-main);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      white-space: pre-wrap;
      text-align: left;
    }

    /* Modal Overlay Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
        font-weight: 600;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s;
        &:hover {
          color: var(--text-primary);
        }
      }
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(15, 23, 42, 0.2);
      border-radius: 0 0 16px 16px;
    }

    /* Option Label hover state and styling */
    .option-label {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px !important;
      display: flex;
      align-items: center;
      gap: 12px !important;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(234, 88, 12, 0.04);
        border-color: rgba(234, 88, 12, 0.4);
        color: var(--text-primary);
      }
      
      input[type="radio"] {
        accent-color: var(--primary-accent);
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
      }
      
      span {
        font-size: 13px;
        color: var(--text-secondary);
        user-select: none;
      }
    }

    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class CourseDetailComponent implements OnInit {
  protected readonly learningService = inject(LearningService);
  protected readonly authService = inject(AuthService);
  private readonly empService = inject(EmployeeService);
  private readonly certsService = inject(CertificationsService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly course = signal<Course | null>(null);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly employeesList = signal<Employee[]>([]);
  
  // Certifications lists
  readonly associatedCert = signal<Certification | null>(null);
  readonly matchingEmployeeCerts = signal<EmployeeCertification[]>([]);

  // Employee mapping dictionary
  private employeeMap: Record<string, Employee> = {};

  // Metrics derived
  readonly statsEligible = signal(0);
  
  readonly statsEnrolled = computed(() => this.enrollments().length);
  
  readonly statsInProgress = computed(() => 
    this.enrollments().filter(e => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED').length
  );
  
  readonly statsCompleted = computed(() => 
    this.enrollments().filter(e => e.status === 'COMPLETED').length
  );

  readonly statsCompletionRate = computed(() => {
    const total = this.statsEnrolled();
    if (total === 0) return 0;
    return (this.statsCompleted() / total) * 100;
  });

  readonly statsAverageScore = computed(() => {
    const completed = this.enrollments().filter(e => e.status === 'COMPLETED' && e.finalScore !== null);
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    return sum / completed.length;
  });

  // Percentages for Progress bar
  readonly pctCompleted = computed(() => this.statsCompletionRate());
  readonly pctInProgress = computed(() => {
    const total = this.statsEnrolled();
    if (total === 0) return 0;
    const inProgress = this.enrollments().filter(e => e.status === 'IN_PROGRESS').length;
    return (inProgress / total) * 100;
  });
  readonly pctEnrolled = computed(() => {
    const total = this.statsEnrolled();
    if (total === 0) return 0;
    const enrolled = this.enrollments().filter(e => e.status === 'ENROLLED').length;
    return (enrolled / total) * 100;
  });

  // Certificate Statistics
  readonly certsRequested = computed(() => 
    this.matchingEmployeeCerts().filter(ec => !ec.verified).length
  );
  readonly certsIssued = computed(() => 
    this.matchingEmployeeCerts().filter(ec => ec.verified && ec.status === 'ACTIVE').length
  );

  readonly statsEligibleForCert = computed(() => {
    const completedEmps = this.enrollments().filter(e => e.status === 'COMPLETED').map(e => e.employeeId);
    const certEmps = this.matchingEmployeeCerts().filter(c => c.status === 'ACTIVE' || c.requestStatus === 'APPROVED' || c.requestStatus === 'PENDING_APPROVAL').map(c => c.employeeId);
    return completedEmps.filter(empId => !certEmps.includes(empId)).length;
  });

  readonly statsPendingRequests = computed(() => 
    this.matchingEmployeeCerts().filter(ec => ec.certificateType === 'LEARNING' && ec.requestStatus === 'PENDING_APPROVAL').length
  );

  readonly statsRejectedRequests = computed(() => 
    this.matchingEmployeeCerts().filter(ec => ec.certificateType === 'LEARNING' && ec.requestStatus === 'REJECTED').length
  );

  readonly statsTotalRequests = computed(() => 
    this.matchingEmployeeCerts().filter(ec => ec.certificateType === 'LEARNING').length
  );

  // Lists filtered
  readonly listCompleted = computed(() => 
    this.enrollments().filter(e => e.status === 'COMPLETED')
  );
  readonly listInProgress = computed(() => 
    this.enrollments().filter(e => e.status === 'IN_PROGRESS')
  );
  readonly listEnrolled = computed(() => 
    this.enrollments().filter(e => e.status === 'ENROLLED')
  );

  // Course Difficulty Level derived from duration
  readonly difficultyLevel = computed(() => {
    const c = this.course();
    if (!c) return 'Beginner';
    const hrs = c.durationHours;
    if (hrs <= 10) return 'Beginner';
    if (hrs <= 30) return 'Intermediate';
    return 'Advanced';
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadAllData(id);
      }
    });
  }

  readonly courseModules = signal<any[]>([]);
  readonly completedModuleIds = signal<string[]>([]);
  readonly selectedModule = signal<any>(null);
  readonly activeEnrollment = signal<Enrollment | null>(null);
  readonly activeCertificate = signal<any>(null);

  // Quiz & Certification states
  userCertifications: EmployeeCertification[] = [];
  quizQuestions = signal<any[]>([]);
  showQuizModal = signal(false);
  quizAnswers: Record<string, string> = {};

  isModuleCompleted(moduleId: string): boolean {
    return this.completedModuleIds().includes(moduleId);
  }

  completeModule(moduleId: string) {
    const empId = this.authService.employeeId();
    const courseId = this.course()?.id;
    if (!empId || !courseId) return;

    this.learningService.completeModule(empId, moduleId).subscribe({
      next: () => {
        this.notificationService.success('Module Completed', 'Progress updated successfully.');
        this.loadAllData(courseId);
      },
      error: (err) => {
        this.notificationService.error('Error', err.error?.message || 'Failed to update progress.');
      }
    });
  }

  downloadCertificatePdf(certId: string) {
    if (!certId) return;
    this.learningService.downloadCertificatePdf(certId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate-${this.activeCertificate()?.credentialId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  loadAllData(courseId: string) {
    this.loading.set(true);
    const role = this.authService.role();
    const empId = this.authService.employeeId();

    this.learningService.getCourseById(courseId).subscribe({
      next: (courseData) => {
        this.course.set(courseData);
        
        if (role === 'ADMIN' || role === 'TRAINING_MANAGER') {
          // Admin analytics flow
          this.loadEnrollmentsAndEmployees(courseId);
          this.loadCertifications(courseId);
        } else {
          // Learner classroom flow
          this.learningService.getModulesByCourse(courseId).subscribe({
            next: (modules) => {
              this.courseModules.set(modules);
              
              if (empId) {
                this.learningService.getEnrollmentsByEmployee(empId).subscribe({
                  next: (enrolls) => {
                    const found = enrolls.find(e => e.courseId === courseId);
                    if (found) {
                      this.activeEnrollment.set(found);
                      this.loadUserCertifications(empId);
                      this.loadCertificatesIfCompleted(empId, courseId, found);
                    }
                    
                    // Setup modules if present
                    if (modules.length > 0) {
                      this.learningService.getCompletedModuleIds(empId, courseId).subscribe({
                        next: (completedIds) => {
                          this.completedModuleIds.set(completedIds);
                          const firstUncompleted = modules.find(m => !completedIds.includes(m.id));
                          this.selectedModule.set(firstUncompleted || modules[0]);
                          this.loading.set(false);
                        },
                        error: () => {
                          this.selectedModule.set(modules[0]);
                          this.loading.set(false);
                        }
                      });
                    } else {
                      this.loading.set(false);
                    }
                  },
                  error: () => this.loading.set(false)
                });
              } else {
                this.loading.set(false);
              }
            },
            error: () => this.loading.set(false)
          });
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadCertificatesIfCompleted(empId: string, courseId: string, enrollment: Enrollment) {
    if (enrollment.status === 'COMPLETED') {
      this.learningService.getCertificatesByEmployee(empId).subscribe({
        next: (certs) => {
          const cert = certs.find(c => c.courseId === courseId);
          if (cert) {
            this.activeCertificate.set(cert);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }
  }

  loadEnrollmentsAndEmployees(courseId: string) {
    // Fetch all employees in system to build map
    this.empService.getEmployees(undefined, 0, 1000).subscribe({
      next: (empRes) => {
        const emps = empRes.content || [];
        this.employeesList.set(emps);
        this.statsEligible.set(empRes.totalElements || emps.length);
        
        // Build Dictionary Map
        this.employeeMap = {};
        emps.forEach(emp => {
          this.employeeMap[emp.id] = emp;
        });

        // Now fetch enrollments
        this.learningService.getEnrollmentsByCourse(courseId).subscribe({
          next: (enrollmentList) => {
            this.enrollments.set(enrollmentList || []);
            this.checkLoadingState();
          },
          error: () => this.checkLoadingState()
        });
      },
      error: () => this.checkLoadingState()
    });
  }

  loadCertifications(courseId: string) {
    this.certsService.getCertifications().subscribe({
      next: (certs) => {
        // Find matching definition
        const matched = certs.find(c => c.associatedCourseId === courseId);
        if (matched) {
          this.associatedCert.set(matched);
        } else {
          this.associatedCert.set(null);
        }
        
        // Load Employee Certifications to count Requested / Issued / Pending / Rejected
        this.certsService.getAllEmployeeCertifications().subscribe({
          next: (empCerts) => {
            const matching = empCerts.filter(ec => 
              (matched && ec.certificationId === matched.id) || 
              (ec.courseId === courseId)
            );
            this.matchingEmployeeCerts.set(matching);
            this.checkLoadingState();
          },
          error: () => this.checkLoadingState()
        });
      },
      error: () => this.checkLoadingState()
    });
  }

  checkLoadingState() {
    // If course is loaded, and enrollments/certifications are fetched, set loading to false
    if (this.course()) {
      this.loading.set(false);
    }
  }

  getEmployeeName(id: string): string {
    const emp = this.employeeMap[id];
    return emp ? emp.name : 'Unknown Employee';
  }

  getEmployeeDept(id: string): string {
    const emp = this.employeeMap[id];
    return emp ? emp.department : 'N/A';
  }

  loadUserCertifications(empId: string) {
    this.certsService.getCertificationsByEmployee(empId).subscribe({
      next: (res) => this.userCertifications = res || [],
      error: () => this.userCertifications = []
    });
  }

  getCertificateStatus(): string {
    const enrollment = this.activeEnrollment();
    if (!enrollment || enrollment.status !== 'COMPLETED') {
      return 'NOT_ELIGIBLE';
    }
    const found = this.userCertifications.find(c => c.courseId === this.course()?.id);
    if (!found) {
      return 'ELIGIBLE';
    }
    return found.requestStatus || 'ELIGIBLE';
  }

  getCertificationRecordId(): string {
    const found = this.userCertifications.find(c => c.courseId === this.course()?.id);
    return found ? found.id : '';
  }

  openQuizModal() {
    const courseId = this.course()?.id;
    if (!courseId) return;
    this.learningService.getCourseQuiz(courseId).subscribe({
      next: (questions) => {
        this.quizQuestions.set(questions);
        this.quizAnswers = {};
        this.showQuizModal.set(true);
      },
      error: (err) => {
        this.notificationService.error('Failed to load quiz', err.error?.message || 'No quiz questions available.');
      }
    });
  }

  closeQuizModal() {
    this.showQuizModal.set(false);
  }

  selectAnswer(questionId: string, option: string) {
    this.quizAnswers[questionId] = option;
  }

  isQuizComplete(): boolean {
    return Object.keys(this.quizAnswers).length === this.quizQuestions().length && this.quizQuestions().length === 10;
  }

  submitQuizAnswers() {
    const enrollment = this.activeEnrollment();
    if (!enrollment) return;

    const answersList = Object.keys(this.quizAnswers).map(qid => ({
      questionId: qid,
      selectedOption: this.quizAnswers[qid]
    }));

    this.learningService.submitQuiz(enrollment.id, answersList).subscribe({
      next: (res) => {
        this.showQuizModal.set(false);
        if (res.passed) {
          this.notificationService.success('Congratulations!', `You passed the quiz with a score of ${res.score}%!`);
        } else {
          this.notificationService.error('Assessment Failed', `You scored ${res.score}%. You need at least 80% to pass.`);
        }
        this.loadAllData(enrollment.courseId!);
      },
      error: (err) => {
        this.notificationService.error('Submission Failed', err.error?.message || 'Failed to submit quiz.');
      }
    });
  }

  requestCertificate() {
    const empId = this.authService.employeeId();
    const course = this.course();
    const enrollment = this.activeEnrollment();
    if (!empId || !course || !enrollment) return;

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
        this.loadUserCertifications(empId);
      },
      error: (err) => this.notificationService.error('Request Failed', err.error?.message || 'Failed to request certificate.')
    });
  }

  enrollInCourse() {
    const empId = this.authService.employeeId();
    const courseId = this.course()?.id;
    if (!empId || !courseId) return;

    this.learningService.enroll(empId, courseId, null).subscribe({
      next: () => {
        this.notificationService.success('Enrolled Successfully', 'You are now enrolled in this course.');
        this.loadAllData(courseId);
      },
      error: (err) => this.notificationService.error('Enrollment Failed', err.error?.message || 'Failed to enroll.')
    });
  }
}
