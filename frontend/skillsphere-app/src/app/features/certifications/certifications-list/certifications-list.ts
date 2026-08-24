import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CertificationsService, EmployeeCertification } from '../certifications.service';
import { LearningService } from '../../learning/learning.service';

@Component({
  selector: 'app-certifications-list',
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
          title="Certifications Registry" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <div class="section-header-row">
            <h2 class="section-title">Certifications Catalog & Active Credentials</h2>
            <div class="action-buttons-group">
              <a routerLink="/certifications/dashboard" class="btn btn-secondary">
                View Dashboard Analytics
              </a>
              <a routerLink="/certifications/new" class="btn btn-primary">
                {{ authService.role() === 'EMPLOYEE' ? 'Request Verification' : 'Register Certification' }}
              </a>
            </div>
          </div>

          <!-- Filters Panel -->
          <div class="filters-panel glass-card">
            <div class="search-input-wrapper">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search by employee or certification name..." 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="applyFilters()"
              />
            </div>

            <div class="filters-row">
              <div class="select-wrapper">
                <select class="form-control" [(ngModel)]="filterStatus" (change)="applyFilters()">
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRING_SOON">Expiring Soon (30 Days)</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="RENEWAL_IN_PROGRESS">Renewal In Progress</option>
                  <option value="RENEWED">Renewed</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>

              <div class="select-wrapper">
                <select class="form-control" [(ngModel)]="filterVerified" (change)="applyFilters()">
                  <option value="">All Verification Statuses</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified Only</option>
                </select>
              </div>

              <div class="select-wrapper">
                <select class="form-control" [(ngModel)]="filterCategory" (change)="applyFilters()">
                  <option value="">All Categories</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="DOMAIN">Domain</option>
                  <option value="SOFT">Soft Skills</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Pending Requests Section for Admin/HR -->
          @if ((authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') && pendingRequests().length > 0) {
            <div class="section-header-row" style="margin-top: 24px; margin-bottom: 16px;">
              <h2 class="section-title" style="color: #ea580c; display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ea580c;"></span>
                Pending Learning Certificate Requests
              </h2>
            </div>
            <div class="table-container" style="margin-bottom: 32px; border: 1px solid rgba(234, 88, 12, 0.2);">
              <table class="dense-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Course Name</th>
                    <th>Completion Date</th>
                    <th>Assessment Score</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of pendingRequests(); track r.id) {
                    <tr>
                      <td>
                        <strong>{{ r.employeeName }}</strong>
                        <div class="sub-text">{{ r.employeeDepartment }}</div>
                      </td>
                      <td>
                        <strong>{{ r.certificationName }}</strong>
                        <div class="sub-text">Instructor: {{ r.instructor || 'N/A' }}</div>
                      </td>
                      <td>{{ r.completionDate | date:'mediumDate' }}</td>
                      <td>
                        @if (r.assessmentScore !== null && r.assessmentScore !== undefined) {
                          <strong style="color: #10b981;">{{ r.assessmentScore }}%</strong>
                        } @else {
                          N/A
                        }
                      </td>
                      <td>{{ r.requestDate | date:'mediumDate' }}</td>
                      <td>
                        <span class="badge" style="background-color: rgba(234, 88, 12, 0.15); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.3);">PENDING</span>
                      </td>
                      <td>
                        <div class="table-actions">
                          <button (click)="approveRequest(r.id)" class="btn-table-action action-verify" title="Approve certificate request">
                            Approve
                          </button>
                          <button (click)="rejectRequest(r.id)" class="btn-table-action action-delete" title="Reject certificate request" style="border-color: rgba(239, 68, 68, 0.3); color: #ef4444;">
                            Reject
                          </button>
                          <a [routerLink]="['/learning/courses', r.courseId]" class="btn-table-action" style="border-color: var(--border-color); color: var(--text-secondary); text-decoration: none;" title="View Course Details">
                            Course
                          </a>
                          <a [routerLink]="['/skills/employees', r.employeeId]" class="btn-table-action" style="border-color: var(--border-color); color: var(--text-secondary); text-decoration: none;" title="View Employee Details">
                            Employee
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Credentials Table -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading credentials catalog...</p>
            </div>
          } @else if (filteredCerts().length === 0) {
            <div class="empty-state">
              <h3>No certifications found</h3>
              <p>No employee certifications match the selected filter criteria.</p>
            </div>
          } @else {
            <div class="table-container">
              <table class="dense-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Certification</th>
                    <th>Provider</th>
                    <th>Credential ID</th>
                    <th>Expiration Date</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of filteredCerts(); track c.id) {
                    <tr>
                      <td>
                        <strong>{{ c.employeeName }}</strong>
                        <div class="sub-text">{{ c.employeeDepartment }}</div>
                      </td>
                      <td>
                        <strong>{{ c.certificationName }}</strong>
                        <div style="margin-top: 4px; margin-bottom: 4px;">
                          @if (c.certificateType === 'LEARNING') {
                            <span class="badge" style="background-color: rgba(234, 88, 12, 0.15); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.3); font-size: 10px; padding: 2px 6px;">Learning Certificate</span>
                          } @else {
                            <span class="badge" style="background-color: rgba(124, 58, 237, 0.15); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.3); font-size: 10px; padding: 2px 6px;">Professional Certification</span>
                          }
                        </div>
                        <div class="sub-text">Issued: {{ c.issueDate | date:'mediumDate' }}</div>
                        <div class="sub-text text-accent" style="font-weight: 500;">
                          Remaining: {{ getRemainingValidity(c.issueDate, c.expiryDate) }}
                        </div>
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
                        <div class="table-actions">
                          <a [routerLink]="['/certifications', c.id]" class="btn-icon" title="View details">
                            👁
                          </a>
                          
                          @if ((authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') && !c.verified) {
                            <button (click)="verifyCert(c.id)" class="btn-table-action action-verify" title="Verify certification">
                              Verify
                            </button>
                          }

                          @if (c.status === 'EXPIRED' || c.status === 'EXPIRING_SOON') {
                            <button (click)="startRenewal(c.id)" class="btn-table-action action-renew" title="Start renewal process">
                              Renew
                            </button>
                          } @else if (c.status === 'RENEWAL_IN_PROGRESS') {
                            <button disabled class="btn-table-action" style="opacity: 0.6; cursor: not-allowed; border-color: rgba(2, 132, 199, 0.3); color: #0284c7;" title="Renewal is active and in progress">
                              In Progress
                            </button>
                          }

                          @if (authService.role() !== 'EMPLOYEE' || c.verified) {
                            <button (click)="downloadProfessionalCertificate(c.id)" class="btn-table-action" title="Download PDF Certificate" style="background-color: var(--primary-accent); color: white; border: none; font-size: 11px;">
                              PDF
                            </button>
                          }

                          @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                            <button (click)="deleteCert(c.id)" class="btn-table-action action-delete" title="Delete certification" style="border-color: rgba(239, 68, 68, 0.3); color: #ef4444;">
                              Delete
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

          @if (courseCertificates().length > 0) {
            <div class="section-header-row" style="margin-top: 32px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <h2 class="section-title">Verified Course Completion Certificates</h2>
            </div>
            <div class="table-container glass-card animate-fade-in" style="overflow-x: auto; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 30px;">
              <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 13px;">
                    <th style="padding: 16px 20px;">Course Title</th>
                    <th style="padding: 16px 20px;">Credential ID</th>
                    <th style="padding: 16px 20px;">Completion Date</th>
                    <th style="padding: 16px 20px;">Status</th>
                    <th style="padding: 16px 20px; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cc of courseCertificates(); track cc.id) {
                    <tr style="border-bottom: 1px solid var(--border-color); font-size: 13px; color: var(--text-secondary);">
                      <td style="padding: 16px 20px; color: var(--text-primary); font-weight: 500;">{{ cc.courseNameSnapshot }}</td>
                      <td style="padding: 16px 20px;"><code style="color: var(--primary-light); font-family: monospace;">{{ cc.credentialId }}</code></td>
                      <td style="padding: 16px 20px;">{{ cc.issueDate | date:'mediumDate' }}</td>
                      <td style="padding: 16px 20px;"><span class="badge badge-active">Active</span></td>
                      <td style="padding: 16px 20px; text-align: right;">
                        <button class="btn btn-primary btn-sm" (click)="downloadCourseCertificate(cc.id)">
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
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
    .filters-panel {
      padding: 20px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .search-input-wrapper {
      width: 100%;
      input {
        width: 100%;
        background-color: rgba(255,255,255,0.03);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        
        &:focus {
          border-color: var(--primary-accent);
          outline: none;
        }
      }
    }
    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .select-wrapper {
      select {
        width: 100%;
        background-color: rgba(255,255,255,0.03);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        
        &:focus {
          border-color: var(--primary-accent);
        }
        
        option {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }
      }
    }
    .sub-text {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .table-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-icon {
      text-decoration: none;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background-color: rgba(255,255,255,0.04);
      border-radius: 6px;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      
      &:hover {
        background-color: var(--bg-hover);
        color: white;
        border-color: var(--primary-accent);
      }
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
      
      &.action-verify {
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
        
        &:hover {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
        }
      }
      
      &.action-renew {
        border-color: rgba(234, 88, 12, 0.3);
        color: var(--primary-accent);
        
        &:hover {
          background-color: rgba(234, 88, 12, 0.1);
          border-color: var(--primary-accent);
        }
      }
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
  `]
})
export class CertificationsListComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly certsService = inject(CertificationsService);
  protected readonly learningService = inject(LearningService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly allCerts = signal<EmployeeCertification[]>([]);
  readonly filteredCerts = signal<EmployeeCertification[]>([]);
  readonly courseCertificates = signal<any[]>([]);
  readonly pendingRequests = signal<EmployeeCertification[]>([]);

  searchQuery = '';
  filterStatus = '';
  filterVerified = '';
  filterCategory = '';
  currentEmployeeIdFilter: string | undefined = undefined;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let empId = params['employeeId'];
      const role = this.authService.role();
      const currentEmpId = this.authService.employeeId();
      
      if (role === 'EMPLOYEE') {
        empId = currentEmpId || '00000000-0000-0000-0000-000000000000';
      }
      
      this.loadCertifications(empId);
    });
  }

  loadCertifications(employeeId?: string) {
    this.currentEmployeeIdFilter = employeeId;
    this.loading.set(true);
    const obs$ = employeeId 
      ? this.certsService.getCertificationsByEmployee(employeeId)
      : this.certsService.getAllEmployeeCertifications();

    obs$.subscribe({
      next: (data) => {
        const activeRecords = data.filter(c => c.status !== 'RENEWED');
        this.allCerts.set(activeRecords);
        this.applyFilters();
        
        // Load pending requests if user is Admin or HR
        if (this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER') {
          this.certsService.getPendingRequests().subscribe({
            next: (reqs) => this.pendingRequests.set(reqs || []),
            error: () => this.pendingRequests.set([])
          });
        } else {
          this.pendingRequests.set([]);
        }
        
        // Also fetch course completion certificates if employeeId context is available
        const targetEmpId = employeeId || (this.authService.role() === 'EMPLOYEE' ? this.authService.employeeId() : null);
        if (targetEmpId) {
          this.learningService.getCertificatesByEmployee(targetEmpId).subscribe({
            next: (certs) => {
              this.courseCertificates.set(certs || []);
              this.loading.set(false);
            },
            error: () => {
              this.courseCertificates.set([]);
              this.loading.set(false);
            }
          });
        } else {
          this.courseCertificates.set([]);
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  downloadCourseCertificate(certId: string) {
    this.learningService.downloadCertificatePdf(certId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cert = this.courseCertificates().find(c => c.id === certId);
        a.download = `Certificate-${cert ? cert.credentialId : 'Course'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  applyFilters() {
    let result = [...this.allCerts()];

    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c => 
        c.employeeName.toLowerCase().includes(q) || 
        c.certificationName.toLowerCase().includes(q) ||
        (c.credentialId && c.credentialId.toLowerCase().includes(q))
      );
    }

    if (this.filterStatus !== '') {
      result = result.filter(c => c.status === this.filterStatus);
    }

    if (this.filterVerified !== '') {
      const verifiedBool = this.filterVerified === 'true';
      result = result.filter(c => c.verified === verifiedBool);
    }

    this.filteredCerts.set(result);
  }

  verifyCert(id: string) {
    this.confirmationService.confirm({
      title: 'Verify Certification?',
      message: 'Are you sure you want to verify this certification award?',
      confirmText: 'Verify',
      cancelText: 'Cancel',
      type: 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.verifyCertification(id).subscribe({
          next: () => {
            this.notificationService.success('Certification Verified', 'The certification has been verified successfully.');
            this.loadCertifications();
          },
          error: (err) => {
            this.notificationService.error('Verification Failed', err.error?.message || 'Failed to verify certification.');
          }
        });
      }
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
        this.certsService.startRenewal(id, 'Triggered renewal from catalog table.').subscribe({
          next: () => {
            this.notificationService.success('Renewal Started', 'Renewal process has been initiated.');
            this.loadCertifications(this.currentEmployeeIdFilter);
          },
          error: (err) => {
            this.notificationService.error('Renewal Failed', err.error?.message || 'Failed to start renewal process.');
          }
        });
      }
    });
  }

  deleteCert(id: string) {
    this.confirmationService.confirm({
      title: 'Delete Employee Certification?',
      message: 'Are you sure you want to physically delete this employee certification? This action is permanent and cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.deleteEmployeeCertification(id).subscribe({
          next: () => {
            this.notificationService.success('Certification Deleted', 'The employee certification was successfully deleted.');
            this.loadCertifications(this.currentEmployeeIdFilter);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || 'Failed to delete certification.');
          }
        });
      }
    });
  }

  downloadProfessionalCertificate(id: string) {
    this.certsService.downloadCertificatePdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cert = this.allCerts().find(c => c.id === id);
        const cleanEmpName = cert && cert.employeeName ? cert.employeeName.replace(/\s+/g, '_') : 'Employee';
        a.download = `Certification_${cleanEmpName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  approveRequest(id: string) {
    this.confirmationService.confirm({
      title: 'Approve Request?',
      message: 'Are you sure you want to approve this learning certificate request?',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.approveRequest(id).subscribe({
          next: () => {
            this.notificationService.success('Approved', 'Learning certificate has been approved.');
            this.loadCertifications(this.currentEmployeeIdFilter);
          },
          error: (err) => this.notificationService.error('Approval Failed', err.error?.message || 'Failed to approve request.')
        });
      }
    });
  }

  rejectRequest(id: string) {
    this.confirmationService.confirm({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this certificate request?',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.rejectRequest(id, 'Requirements not met or assessment score insufficient.').subscribe({
          next: () => {
            this.notificationService.success('Rejected', 'Certificate request has been rejected.');
            this.loadCertifications(this.currentEmployeeIdFilter);
          },
          error: (err) => this.notificationService.error('Rejection Failed', err.error?.message || 'Failed to reject request.')
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
      case 'PENDING': return 'Pending Verification';
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
      case 'PENDING': return 'badge-warning';
      default: return '';
    }
  }

  getRemainingValidity(issueDateStr: string, expiryDateStr: string): string {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    
    expiry.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    if (expiry < now) {
      const diffTime = Math.abs(now.getTime() - expiry.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Expired ${diffDays} Day${diffDays !== 1 ? 's' : ''} Ago`;
    } else {
      let years = expiry.getFullYear() - now.getFullYear();
      let months = expiry.getMonth() - now.getMonth();
      let days = expiry.getDate() - now.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(expiry.getFullYear(), expiry.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      
      if (years > 0 && months > 0) {
        return `${years} Year${years !== 1 ? 's' : ''} ${months} Month${months !== 1 ? 's' : ''}`;
      } else if (years > 0) {
        return `${years} Year${years !== 1 ? 's' : ''}`;
      } else if (months > 0) {
        return `${months} Month${months !== 1 ? 's' : ''}`;
      } else {
        return `${days} Day${days !== 1 ? 's' : ''}`;
      }
    }
  }
}
