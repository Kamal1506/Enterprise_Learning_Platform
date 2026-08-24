import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { AuthService } from '../../../core/auth.service';
import { CertificationsService, CertificationReport, ComplianceSummary, EmployeeCertification } from '../certifications.service';
import { LearningService, Course } from '../../learning/learning.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-certifications-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
          title="Certifications Dashboard" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading analytics and metrics...</p>
            </div>
          } @else {
            @if (authService.role() === 'EMPLOYEE') {
              <!-- ==================== EMPLOYEE DASHBOARD ==================== -->
              <div class="dashboard-section animate-fade-in">
                <div class="section-header-row">
                  <h2 class="section-title">My Certifications</h2>
                  <div class="action-buttons-group" style="display: flex; gap: 8px;">
                    <a routerLink="/certifications/new" class="btn btn-primary" style="background-color: var(--primary-accent); border: none; color: white;">
                      Request Verification
                    </a>
                    <a routerLink="/certifications/list" class="btn btn-secondary">
                      View Credentials Catalog
                    </a>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                  <app-stat-card 
                    title="Professional Certifications" 
                    [value]="myProfessionalCount()" 
                    icon="award"
                  />
                  <app-stat-card 
                    title="Learning Certificates" 
                    [value]="myLearningCount()" 
                    icon="activity"
                  />
                  <app-stat-card 
                    title="Pending Requests" 
                    [value]="myPendingCount()" 
                    icon="activity"
                  />
                  <app-stat-card 
                    title="Approved Requests" 
                    [value]="myApprovedCount()" 
                    icon="award"
                  />
                </div>

                <!-- Tables Grid -->
                <div class="dashboard-grid">
                  <!-- Registered Professional Certifications -->
                  <div class="dashboard-card">
                    <h3>Professional Certifications</h3>
                    @if (myCerts().length === 0) {
                      <p class="empty-text">No professional certifications registered by Admin or HR.</p>
                    } @else {
                      <div class="table-container">
                        <table class="dense-table">
                          <thead>
                            <tr>
                              <th>Certification</th>
                              <th>Provider</th>
                              <th>Credential ID</th>
                              <th>Expiration</th>
                              <th>Status</th>
                              <th>Verified</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (c of myCerts(); track c.id) {
                              <tr>
                                <td>
                                  <strong>{{ c.certificationName }}</strong>
                                  <div class="sub-text">Issued: {{ c.issueDate | date:'mediumDate' }}</div>
                                </td>
                                <td>{{ c.provider }}</td>
                                <td><code>{{ c.credentialId || 'N/A' }}</code></td>
                                <td>{{ c.expiryDate | date:'mediumDate' }}</td>
                                <td>
                                  <span class="badge" [ngClass]="getStatusClass(c.status)">
                                    {{ getStatusLabel(c.status) }}
                                  </span>
                                </td>
                                <td>
                                  @if (c.verified) {
                                    <span class="badge badge-success">✓ Verified</span>
                                  } @else {
                                    <span class="badge badge-warning">⏳ Pending</span>
                                  }
                                </td>
                                <td>
                                  <div style="display: flex; gap: 6px; align-items: center;">
                                    @if (c.status === 'EXPIRED' || c.status === 'EXPIRING_SOON') {
                                      <button (click)="startRenewal(c.id)" class="btn-table-action action-renew">
                                        Renew
                                      </button>
                                    } @else if (c.status === 'RENEWAL_IN_PROGRESS') {
                                      <button disabled class="btn-table-action" style="opacity: 0.6; cursor: not-allowed; border-color: rgba(2, 132, 199, 0.3); color: #0284c7;">
                                        In Progress
                                      </button>
                                    }
                                    @if (c.verified) {
                                      <button (click)="downloadProfessionalCertificate(c.id)" class="btn-table-action" title="Download PDF Certificate" style="background-color: var(--primary-accent); color: white; border: none; font-size: 11px;">
                                        PDF
                                      </button>
                                    }
                                  </div>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>

                  <!-- Course Completion Certificates -->
                  <div class="dashboard-card" style="border: none; background: transparent; padding: 0; box-shadow: none;">
                    <h3 style="font-family: 'Outfit', sans-serif; font-size: 18px; margin-bottom: 20px; color: var(--text-primary); font-weight: 600;">Course Certificates</h3>
                    
                    @if (myCourseCerts().length === 0) {
                      <div class="empty-state-card glass-card">
                        <div class="empty-icon-wrapper">
                          <span class="material-icons empty-icon">school</span>
                        </div>
                        <h3>No Course Certificates Yet</h3>
                        <p>Complete eligible courses and request approval to receive learning certificates.</p>
                        <a routerLink="/learning/courses" class="btn btn-primary btn-orange">
                          Explore Courses
                        </a>
                      </div>
                    } @else {
                      <div class="learning-certs-grid">
                        @for (cc of myCourseCerts(); track cc.id) {
                          @let course = getCourseForCert(cc);
                          <div class="premium-cert-card glass-card">
                            <div class="card-header-accent"></div>
                            
                            <div class="card-body">
                              
                              <div class="cert-title-row">
                                <h4 class="cert-course-title">{{ cc.certificationName }}</h4>
                                <span class="badge badge-active-custom">{{ cc.status }}</span>
                              </div>

                              <div class="course-meta-pills">
                                <span class="meta-pill pill-category">{{ course?.category || 'Technical' }}</span>
                                <span class="meta-pill pill-type">{{ course?.type || 'Online' }}</span>
                                <span class="meta-pill pill-duration">{{ course ? course.durationHours + ' Hours' : 'N/A' }}</span>
                                <span class="meta-pill pill-difficulty">{{ getDifficulty(course) }}</span>
                              </div>

                              <div class="cert-divider"></div>

                              <div class="info-grid">
                                <div class="info-column">
                                  <div class="info-group">
                                    <span class="info-label">Instructor</span>
                                    <span class="info-val font-semibold">{{ cc.instructor || 'Academy Instructor' }}</span>
                                  </div>
                                  
                                  <div class="info-group">
                                    <span class="info-label">Completed</span>
                                    <span class="info-val">{{ (cc.completionDate || cc.issueDate) | date:'mediumDate' }}</span>
                                  </div>

                                  <div class="info-group">
                                    <span class="info-label">Certificate Number</span>
                                    <span class="info-val code-val">{{ cc.certificateNumber || cc.credentialId }}</span>
                                  </div>
                                </div>

                                <div class="info-column">
                                  <div class="info-group stats-box">
                                    <div class="stat-mini">
                                      <span class="stat-lbl">Score</span>
                                      <span class="stat-val text-green">{{ cc.assessmentScore ? cc.assessmentScore + '%' : 'N/A' }}</span>
                                    </div>
                                    <div class="stat-mini">
                                      <span class="stat-lbl">Grade</span>
                                      <span class="stat-val text-accent">{{ getGrade(cc.assessmentScore) }}</span>
                                    </div>
                                    <div class="stat-mini">
                                      <span class="stat-lbl">Progress</span>
                                      <span class="stat-val">{{ cc.completionPercentage ? cc.completionPercentage + '%' : '100%' }}</span>
                                    </div>
                                  </div>

                                  <div class="info-group">
                                    <span class="info-label">Approved By</span>
                                    <span class="info-val font-semibold">{{ cc.approvedBy || 'System Administrator' }}</span>
                                    @if (cc.approvedDate) {
                                      <span class="info-subval">on {{ cc.approvedDate | date:'mediumDate' }}</span>
                                    }
                                  </div>
                                </div>
                              </div>

                              <div class="cert-divider"></div>

                              <div class="verification-row">
                                <div class="verif-status">
                                  <span class="material-icons verif-icon" [ngClass]="cc.verified ? 'text-green' : 'text-warning'">
                                    {{ cc.verified ? 'check_circle' : 'pending' }}
                                  </span>
                                  <span class="verif-text" [ngStyle]="{'color': cc.verified ? '#10b981' : '#f59e0b'}">
                                    {{ cc.verified ? 'Verified ID Credential' : 'Pending Verification Review' }}
                                  </span>
                                </div>
                                <span class="badge" style="text-transform: capitalize; background-color: rgba(234, 88, 12, 0.1); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.2); font-size: 10px; padding: 2px 6px;">
                                  Learning Certificate
                                </span>
                              </div>

                              <div class="card-actions">
                                <a [routerLink]="['/certifications', cc.id]" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center; text-decoration: none;">
                                  View Certificate
                                </a>
                                 @if (cc.verified) {
                                   <button class="btn btn-primary btn-sm btn-orange" (click)="downloadCourseCertificate(cc.id)" style="flex: 1;">
                                     Download PDF
                                   </button>
                                 }
                                @if (!cc.verified) {
                                  <button class="btn btn-success btn-sm" (click)="verifyCertificate(cc.id)" style="padding: 0 10px;">
                                    Verify
                                  </button>
                                }
                                <button class="btn btn-icon-only btn-sm" (click)="shareCertificate(cc)" title="Share Verification Link">
                                  🔗 Share
                                </button>
                              </div>

                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <!-- ==================== ADMIN/HR DASHBOARD ==================== -->
              <div class="dashboard-section animate-fade-in">
                <div class="section-header-row">
                  <h2 class="section-title">Certification Status & Metrics</h2>
                  <div class="action-buttons-group">
                    <a routerLink="/certifications/list" class="btn btn-secondary">
                      View Credentials List
                    </a>
                    @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                      <a routerLink="/certifications/new" class="btn btn-primary">
                        Register Certification
                      </a>
                    }
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                  <app-stat-card 
                    title="Total Certifications" 
                    [value]="reports().totalCount" 
                    icon="award"
                  />
                  <app-stat-card 
                    title="Active Certifications" 
                    [value]="reports().activeCount" 
                    icon="activity"
                  />
                  <app-stat-card 
                    title="Expiring (30 Days)" 
                    [value]="reports().expiringCount" 
                    icon="activity"
                  />
                  <app-stat-card 
                    title="Expired Certifications" 
                    [value]="reports().expiredCount" 
                    icon="award"
                  />
                </div>

                <!-- Second Row Stats -->
                <div class="stats-grid secondary-stats">
                  <div class="stat-card">
                    <span class="stat-title">Renewal Performance</span>
                    <div class="stat-value">{{ reports().renewalRate | number:'1.0-1' }}%</div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill fill-orange" [style.width.%]="reports().renewalRate"></div>
                    </div>
                    <span class="stat-desc">Target Rate: 94.0%</span>
                  </div>
                  
                  <div class="stat-card">
                    <span class="stat-title">Compliance Summary</span>
                    <div class="stat-value">{{ compliance().complianceRate | number:'1.0-1' }}%</div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill fill-green" [style.width.%]="compliance().complianceRate"></div>
                    </div>
                    <span class="stat-desc">Compliant Employees: {{ compliance().compliantCount }} / {{ compliance().compliantCount + compliance().expiringCount + compliance().nonCompliantCount }}</span>
                  </div>
                </div>

                <!-- Charts & Tables Grid -->
                <div class="dashboard-grid">
                  <!-- Providers Distribution -->
                  <div class="dashboard-card">
                    <h3>Certifications by Provider</h3>
                    <div class="dist-list">
                      @if (providersList().length === 0) {
                        <p class="empty-text">No provider data available.</p>
                      }
                      @for (item of providersList(); track item.key) {
                        <div class="dist-item">
                          <div class="dist-header">
                            <span class="dist-name">{{ item.key }}</span>
                            <span class="dist-count">{{ item.value }}</span>
                          </div>
                          <div class="dist-bar-wrapper">
                            <div class="dist-bar-fill fill-blue" [style.width.%]="item.percent"></div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Categories Distribution -->
                  <div class="dashboard-card">
                    <h3>Certifications by Category</h3>
                    <div class="dist-list">
                      @if (categoriesList().length === 0) {
                        <p class="empty-text">No category data available.</p>
                      }
                      @for (item of categoriesList(); track item.key) {
                        <div class="dist-item">
                          <div class="dist-header">
                            <span class="dist-name">{{ item.key }}</span>
                            <span class="dist-count">{{ item.value }}</span>
                          </div>
                          <div class="dist-bar-wrapper">
                            <div class="dist-bar-fill fill-orange" [style.width.%]="item.percent"></div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Department Distribution -->
                <div class="dashboard-card-full">
                  <div class="card-header">
                    <h3>Departmental Compliance Distribution</h3>
                  </div>
                  <div class="table-container">
                    @if (departmentsList().length === 0) {
                      <div class="empty-state">
                        <p class="empty-text">No department compliance data available.</p>
                      </div>
                    } @else {
                      <table class="dense-table">
                        <thead>
                          <tr>
                            <th>Department Name</th>
                            <th>Awarded Certifications</th>
                            <th>Percentage Distribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (dept of departmentsList(); track dept.key) {
                            <tr>
                              <td><strong>{{ dept.key }}</strong></td>
                              <td>{{ dept.value }}</td>
                              <td>
                                <div class="progress-bar-table">
                                  <span class="progress-percentage-label">{{ dept.percent | number:'1.0-1' }}%</span>
                                  <div class="progress-bar-container table-bar">
                                    <div class="progress-bar-fill fill-blue" [style.width.%]="dept.percent"></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
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
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .action-buttons-group {
      display: flex;
      gap: 12px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .secondary-stats {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }
    .stat-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .stat-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 12px;
    }
    .progress-bar-container {
      height: 8px;
      background-color: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .fill-orange {
      background-color: var(--primary-accent);
    }
    .fill-green {
      background-color: var(--status-success);
    }
    .fill-blue {
      background-color: #0284c7;
    }
    .stat-desc {
      font-size: 12px;
      color: var(--text-muted);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .dashboard-card {
      padding: 24px;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        margin-bottom: 20px;
        color: var(--text-primary);
      }
    }
    .dashboard-card-full {
      padding: 24px;
      margin-bottom: 20px;
      
      .card-header {
        margin-bottom: 20px;
        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          color: var(--text-primary);
        }
      }
    }
    .dist-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dist-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dist-header {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 500;
    }
    .dist-name {
      color: var(--text-secondary);
    }
    .dist-count {
      color: var(--text-primary);
    }
    .dist-bar-wrapper {
      height: 6px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      overflow: hidden;
    }
    .dist-bar-fill {
      height: 100%;
      border-radius: 3px;
    }
    .progress-bar-table {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-percentage-label {
      font-size: 13px;
      width: 45px;
      text-align: right;
    }
    .table-bar {
      flex-grow: 1;
      max-width: 200px;
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-success {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-active {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-expired {
      background-color: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-warning {
      background-color: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-info {
      background-color: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.2);
    }
    .badge-muted {
      background-color: rgba(100, 116, 139, 0.12);
      color: #94a3b8;
      border: 1px solid rgba(100, 116, 139, 0.2);
    }
    .dense-table {
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
        font-size: 13px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
      }
    }
    .table-container {
      width: 100%;
      overflow-x: auto;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-top: 10px;
    }
    .btn-table-action {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.action-renew {
        border-color: rgba(234, 88, 12, 0.3);
        color: var(--primary-accent);
        
        &:hover {
          background-color: rgba(234, 88, 12, 0.1);
          border-color: var(--primary-accent);
        }
      }
    }
    .sub-text {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .empty-text {
      color: var(--text-secondary);
      font-size: 14px;
    }
    .learning-certs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      margin-top: 16px;
      
      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
      
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }
    
    .premium-cert-card {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease, border-color 0.3s ease;
      
      &:hover {
        transform: translateY(-4px);
        border-color: rgba(234, 88, 12, 0.4);
      }
      
      .card-header-accent {
        height: 4px;
        background: linear-gradient(90deg, #ea580c, #f97316);
      }
      
      .card-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }
    
    .cert-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .cert-course-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }
    
    .badge-active-custom {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
      font-size: 10px;
      padding: 3px 8px;
      text-transform: uppercase;
      font-weight: 600;
      border-radius: 4px;
    }
    
    .course-meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }
    
    .meta-pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
      
      &.pill-category {
        background-color: rgba(99, 102, 241, 0.12);
        color: #818cf8;
      }
      
      &.pill-type {
        background-color: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
      }
      
      &.pill-duration {
        background-color: rgba(16, 185, 129, 0.12);
        color: #34d399;
      }
      
      &.pill-difficulty {
        background-color: rgba(236, 72, 153, 0.12);
        color: #f472b6;
      }
    }
    
    .cert-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 12px 0;
      opacity: 0.5;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 14px;
    }
    
    .info-column {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .info-group {
      display: flex;
      flex-direction: column;
      
      .info-label {
        font-size: 10px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }
      
      .info-val {
        font-size: 13px;
        color: var(--text-secondary);
        
        &.font-semibold {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        &.code-val {
          font-family: monospace;
          color: #a78bfa;
          font-size: 12px;
        }
      }
      
      .info-subval {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 1px;
      }
    }
    
    .stats-box {
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      justify-content: space-between;
      gap: 4px;
    }
    
    .stat-mini {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      
      .stat-lbl {
        font-size: 9px;
        color: var(--text-muted);
        text-transform: uppercase;
      }
      
      .stat-val {
        font-size: 12px;
        font-weight: 600;
        margin-top: 2px;
        
        &.text-green {
          color: #10b981;
        }
        
        &.text-accent {
          color: var(--primary-light);
        }
      }
    }
    
    .verification-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    
    .verif-status {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .verif-icon {
        font-size: 16px;
        
        &.text-green {
          color: #10b981;
        }
        
        &.text-warning {
          color: #f59e0b;
        }
      }
      
      .verif-text {
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 500;
      }
    }
    
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        height: 32px;
        padding: 0 12px;
        border-radius: 6px;
        
        &.btn-orange {
          background-color: #ea580c;
          border-color: #ea580c;
          color: white;
          border: 1px solid #ea580c;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background-color: #d97706;
            border-color: #d97706;
          }
        }
        
        &.btn-icon-only {
          padding: 0 8px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
          }
        }
      }
    }
    
    .empty-state-card {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px dashed var(--border-color);
      border-radius: 16px;
      background: rgba(255,255,255,0.01);
      
      .empty-icon-wrapper {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background-color: rgba(234, 88, 12, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        border: 1px solid rgba(234, 88, 12, 0.2);
      }
      
      .empty-icon {
        font-size: 28px;
        color: #ea580c;
      }
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: 13px;
        color: var(--text-secondary);
        max-width: 340px;
        margin: 0 0 20px 0;
        line-height: 1.5;
      }
      
      .btn-orange {
        background-color: #ea580c;
        border-color: #ea580c;
        color: white;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        padding: 0 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.3s ease;
        border: 1px solid #ea580c;
        cursor: pointer;
        
        &:hover {
          background-color: #d97706;
          border-color: #d97706;
          transform: translateY(-1px);
        }
      }
    }
  `]
})
export class CertificationsDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly certsService = inject(CertificationsService);
  private readonly learningService = inject(LearningService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly loading = signal(true);
  readonly reports = signal<CertificationReport>({
    totalCount: 0,
    activeCount: 0,
    expiredCount: 0,
    expiringCount: 0,
    renewalRate: 100.0,
    providerDistribution: {},
    categoryDistribution: {},
    departmentDistribution: {},
    skillDistribution: {}
  });

  readonly compliance = signal<ComplianceSummary>({
    compliantCount: 0,
    expiringCount: 0,
    nonCompliantCount: 0,
    complianceRate: 100.0
  });

  readonly providersList = signal<{ key: string; value: number; percent: number }[]>([]);
  readonly categoriesList = signal<{ key: string; value: number; percent: number }[]>([]);
  readonly departmentsList = signal<{ key: string; value: number; percent: number }[]>([]);

  // Employee-specific signals
  readonly myTotalCount = signal<number>(0);
  readonly myActiveCount = signal<number>(0);
  readonly myExpiredCount = signal<number>(0);
  readonly myExpiringCount = signal<number>(0);
  readonly myProfessionalCount = signal<number>(0);
  readonly myLearningCount = signal<number>(0);
  readonly myPendingCount = signal<number>(0);
  readonly myApprovedCount = signal<number>(0);
  readonly myCerts = signal<EmployeeCertification[]>([]);
  readonly myCourseCerts = signal<any[]>([]);
  readonly allCourses = signal<Course[]>([]);

  ngOnInit() {
    this.loadData();
  }

  getCourseForCert(cc: any): Course | undefined {
    return this.allCourses().find(c => c.id === cc.courseId);
  }

  getGrade(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  }

  getDifficulty(course: Course | undefined): string {
    if (!course) return 'Intermediate';
    if (course.durationHours > 30) return 'Advanced';
    if (course.durationHours < 10) return 'Beginner';
    return 'Intermediate';
  }

  verifyCertificate(id: string) {
    this.certsService.verifyCertification(id).subscribe({
      next: () => {
        this.notificationService.success('Verified Successfully', 'Certificate is now fully verified.');
        const empId = this.authService.employeeId();
        if (empId) this.fetchEmployeeCertifications(empId);
      },
      error: (err) => this.notificationService.error('Verification Failed', err.error?.message || 'Verification could not be processed.')
    });
  }

  shareCertificate(cc: any) {
    const shareUrl = `${window.location.origin}/certifications/${cc.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.notificationService.success('Link Copied', 'Certificate verification link copied to clipboard!');
    }).catch(() => {
      this.notificationService.error('Failed to Copy', 'Could not copy link to clipboard.');
    });
  }

  loadData() {
    this.loading.set(true);
    const role = this.authService.role();
    const empId = this.authService.employeeId();

    if (role === 'EMPLOYEE') {
      if (empId) {
        this.learningService.getAllCoursesList().subscribe({
          next: (courses) => {
            this.allCourses.set(courses || []);
            this.fetchEmployeeCertifications(empId);
          },
          error: () => {
            this.fetchEmployeeCertifications(empId);
          }
        });
      } else {
        this.loading.set(false);
      }
    } else {
      this.certsService.getReports().subscribe({
        next: (rep) => {
          this.reports.set(rep);

          const total = rep.totalCount || 1;
          
          const providers = Object.entries(rep.providerDistribution || {}).map(([key, val]) => ({
            key,
            value: Number(val),
            percent: (Number(val) / total) * 100
          })).sort((a, b) => b.value - a.value);
          this.providersList.set(providers);

          const categories = Object.entries(rep.categoryDistribution || {}).map(([key, val]) => ({
            key,
            value: Number(val),
            percent: (Number(val) / total) * 100
          })).sort((a, b) => b.value - a.value);
          this.categoriesList.set(categories);

          const departments = Object.entries(rep.departmentDistribution || {}).map(([key, val]) => ({
            key,
            value: Number(val),
            percent: (Number(val) / total) * 100
          })).sort((a, b) => b.value - a.value);
          this.departmentsList.set(departments);

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });

      this.certsService.getComplianceSummary().subscribe({
        next: (comp) => {
          this.compliance.set(comp);
        }
      });
    }
  }

  fetchEmployeeCertifications(empId: string) {
    this.certsService.getCertificationsByEmployee(empId).subscribe({
      next: (certs) => {
        const activeCerts = certs.filter(c => c.status !== 'RENEWED');
        
        const profCerts = activeCerts.filter(c => c.certificateType !== 'LEARNING');
        const learnCerts = activeCerts.filter(c => c.certificateType === 'LEARNING' && c.status === 'ACTIVE');
        const pendingReqs = certs.filter(c => c.certificateType === 'LEARNING' && c.requestStatus === 'PENDING_APPROVAL');
        const approvedReqs = certs.filter(c => c.certificateType === 'LEARNING' && c.requestStatus === 'APPROVED');

        this.myCerts.set(profCerts);
        this.myCourseCerts.set(learnCerts);

        this.myProfessionalCount.set(profCerts.length);
        this.myLearningCount.set(learnCerts.length);
        this.myPendingCount.set(pendingReqs.length);
        this.myApprovedCount.set(approvedReqs.length);

        this.myTotalCount.set(activeCerts.length);
        this.myActiveCount.set(activeCerts.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRING_SOON').length);
        this.myExpiredCount.set(activeCerts.filter(c => c.status === 'EXPIRED').length);
        this.myExpiringCount.set(activeCerts.filter(c => c.status === 'EXPIRING_SOON').length);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  downloadCourseCertificate(certId: string) {
    this.certsService.downloadCertificatePdf(certId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cert = this.myCourseCerts().find(c => c.id === certId);
        a.download = `Certificate-${cert ? cert.credentialId : 'Course'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  downloadProfessionalCertificate(id: string) {
    this.certsService.downloadCertificatePdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cert = this.myCerts().find(c => c.id === id);
        a.download = `Certificate-${cert && cert.credentialId ? cert.credentialId : 'Professional'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  startRenewal(id: string) {
    this.confirmationService.confirm({
      title: 'Start Renewal?',
      message: 'Start renewal process for this certification?',
      confirmText: 'Start Renewal',
      cancelText: 'Cancel',
      type: 'warning'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.startRenewal(id, 'Triggered renewal from employee dashboard.').subscribe({
          next: () => {
            this.notificationService.success('Renewal Started', 'Renewal process has been initiated.');
            this.loadData();
          },
          error: (err) => {
            this.notificationService.error('Renewal Failed', err.error?.message || 'Failed to start renewal process.');
          }
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'ACTIVE': return 'Active';
      case 'EXPIRING_SOON': return 'Expiring Soon';
      case 'EXPIRED': return 'Expired';
      case 'RENEWAL_IN_PROGRESS': return 'Renewal In Progress';
      case 'RENEWED': return 'Renewed';
      case 'REVOKED': return 'Revoked';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'ACTIVE': return 'badge-active';
      case 'EXPIRING_SOON': return 'badge-warning';
      case 'EXPIRED': return 'badge-expired';
      case 'RENEWAL_IN_PROGRESS': return 'badge-info';
      case 'RENEWED': return 'badge-active';
      case 'REVOKED': return 'badge-muted';
      default: return '';
    }
  }
}
