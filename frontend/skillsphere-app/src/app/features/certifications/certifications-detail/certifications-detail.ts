import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CertificationsService, EmployeeCertification, CertificationAudit } from '../certifications.service';

@Component({
  selector: 'app-certifications-detail',
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
          title="Credential Verification Details" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading credential data...</p>
            </div>
          } @else if (!cert()) {
            <div class="empty-state">
              <h3>Credential Not Found</h3>
              <p>The requested certification award record does not exist or has been removed.</p>
              <a routerLink="/certifications/list" class="btn btn-primary">Back to Registry</a>
            </div>
          } @else {
            <div class="detail-layout animate-fade-in">
              <div class="detail-header-row">
                <div class="detail-title-group">
                  <div class="badge-wrapper">
                    <span class="badge" [ngClass]="getStatusClass(cert()!.status)">
                      {{ getStatusLabel(cert()!.status) }}
                    </span>
                    @if (cert()!.verified) {
                      <span class="badge badge-verified">✓ Verified ID</span>
                    }
                  </div>
                  <h2>{{ cert()!.certificationName }}</h2>
                  <p class="provider-label">Issued by: <strong>{{ cert()!.provider }}</strong></p>
                </div>
                
                <div class="action-buttons">
                  <a routerLink="/certifications/list" class="btn btn-secondary">Back</a>
                  
                  @if ((authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') && !cert()!.verified) {
                    <button (click)="verifyCert()" class="btn btn-success">Verify Award</button>
                  }

                  @if (cert()!.status === 'EXPIRED' || cert()!.status === 'EXPIRING_SOON') {
                    <button (click)="startRenewalProcess()" class="btn btn-primary">Start Renewal</button>
                  } @else if (cert()!.status === 'RENEWAL_IN_PROGRESS') {
                    <button disabled class="btn btn-primary" style="opacity: 0.6; cursor: not-allowed; background-color: #0284c7; border-color: #0284c7;">Renewal In Progress</button>
                  }
                  
                  <button (click)="downloadProfessionalCertificate()" class="btn btn-primary" style="background-color: #10b981; border-color: #10b981;">Download PDF</button>

                  @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                    <a [routerLink]="['/certifications', cert()!.id, 'edit']" class="btn btn-warning" style="background-color: var(--primary-accent); border-color: var(--primary-accent); color: white; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 0 16px;">Edit</a>
                    <button (click)="triggerRevocation()" class="btn btn-danger">Revoke</button>
                  }
                </div>
              </div>

              <!-- Main Detail Cards Grid -->
              <div class="cards-grid">
                <!-- Info Card -->
                <div class="dashboard-card">
                  <h3>Metadata Details</h3>
                  <div class="metadata-list">
                    <div class="metadata-row">
                      <span class="lbl">Employee Recipient</span>
                      <span class="val"><strong>{{ cert()!.employeeName }}</strong> ({{ cert()!.employeeDepartment }})</span>
                    </div>
                    <div class="metadata-row">
                      <span class="lbl">Credential Identifier</span>
                      <span class="val"><code>{{ cert()!.credentialId || 'N/A' }}</code></span>
                    </div>
                    @if (cert()!.certificateType === 'LEARNING') {
                      <div class="metadata-row">
                        <span class="lbl">Learning Certificate Type</span>
                        <span class="val"><strong>Course Certificate</strong></span>
                      </div>
                      @if (cert()!.instructor) {
                        <div class="metadata-row">
                          <span class="lbl">Course Instructor</span>
                          <span class="val">{{ cert()!.instructor }}</span>
                        </div>
                      }
                      @if (cert()!.assessmentScore !== null && cert()!.assessmentScore !== undefined) {
                        <div class="metadata-row">
                          <span class="lbl">Assessment Score</span>
                          <span class="val" style="color: #10b981; font-weight: 600;">{{ cert()!.assessmentScore }}%</span>
                        </div>
                      }
                    }
                    <div class="metadata-row">
                      <span class="lbl">Date of Award</span>
                      <span class="val">{{ cert()!.issueDate | date:'longDate' }}</span>
                    </div>
                    <div class="metadata-row">
                      <span class="lbl">Expiration Target</span>
                      <span class="val">{{ cert()!.expiryDate | date:'longDate' }}</span>
                    </div>
                    <div class="metadata-row">
                      <span class="lbl">Countdown to Expiry</span>
                      <span class="val countdown-text" [ngClass]="getCountdownClass()">
                        {{ countdownMessage() }}
                      </span>
                    </div>
                    @if (cert()!.documentUrl) {
                      <div class="metadata-row">
                        <span class="lbl">Digital Document URL</span>
                        <span class="val"><a [href]="cert()!.documentUrl" target="_blank">{{ cert()!.documentUrl }}</a></span>
                      </div>
                    }
                    <div class="metadata-row">
                      <span class="lbl">Verification Date</span>
                      <span class="val">{{ cert()!.verifiedAt ? (cert()!.verifiedAt | date:'medium') : 'Pending verification review' }}</span>
                    </div>
                    @if (cert()!.notes) {
                      <div class="metadata-row full-width">
                        <span class="lbl">Description / Notes</span>
                        <div class="notes-box">{{ cert()!.notes }}</div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Renewal Flow Form (Visible if status RENEWAL_IN_PROGRESS for Admin/HR) -->
                @if (cert()!.status === 'RENEWAL_IN_PROGRESS' && (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER')) {
                  <div class="dashboard-card renewal-card">
                    <h3>Renew Certification Cycle</h3>
                    <p class="helper-text">Submit new validity parameters to complete this renewal cycle.</p>
                    
                    <form (ngSubmit)="submitRenewalProgress()" class="renewal-form">
                      <div class="form-group">
                        <label>Process Status Outcome</label>
                        <select class="form-control" [(ngModel)]="renewalResult" name="renewalResult" required>
                          <option value="RENEWED">Successful (Issue New Certificate)</option>
                          <option value="FAILED">Failed (Keep Expired Status)</option>
                          <option value="IN_PROGRESS">Keep Request Active</option>
                        </select>
                      </div>

                      @if (renewalResult === 'RENEWED') {
                        <div class="form-group">
                          <label>New Issue Date</label>
                          <input type="date" class="form-control" [(ngModel)]="newIssueDate" name="newIssueDate" required />
                        </div>
                        <div class="form-group">
                          <label>New Credential ID</label>
                          <input type="text" class="form-control" [(ngModel)]="newCredId" name="newCredId" placeholder="e.g. AWS-SAA-9922" />
                        </div>
                        <div class="form-group">
                          <label>New Document URL</label>
                          <input type="text" class="form-control" [(ngModel)]="newDocUrl" name="newDocUrl" placeholder="http://..." />
                        </div>
                      }

                      <div class="form-group">
                        <label>Audit Log Notes</label>
                        <textarea class="form-control" [(ngModel)]="renewalNotes" name="renewalNotes" placeholder="Provide notes regarding the renewal check..."></textarea>
                      </div>

                      <button type="submit" class="btn btn-primary w-full">Update Renewal Progress</button>
                    </form>
                  </div>
                }

                <!-- Renewal Status & Timeline Details -->
                @if (cert()!.renewalStatus !== 'NOT_REQUIRED' || cert()!.renewalRequestedDate) {
                  <div class="dashboard-card">
                    <h3>Renewal Process Details</h3>
                    <div class="metadata-list">
                      <div class="metadata-row">
                        <span class="lbl">Renewal Status</span>
                        <span class="val">
                          <span class="badge" [ngClass]="getStatusClass(cert()!.renewalStatus)">
                            {{ getStatusLabel(cert()!.renewalStatus) }}
                          </span>
                        </span>
                      </div>
                      <div class="metadata-row">
                        <span class="lbl">Current Expiry</span>
                        <span class="val">{{ cert()!.expiryDate | date:'longDate' }}</span>
                      </div>
                      @if (cert()!.renewalRequestedDate) {
                        <div class="metadata-row">
                          <span class="lbl">Renewal Requested</span>
                          <span class="val">{{ cert()!.renewalRequestedDate | date:'longDate' }}</span>
                        </div>
                      }
                      @if (cert()!.renewalRequestedBy) {
                        <div class="metadata-row">
                          <span class="lbl">Requested By</span>
                          <span class="val">{{ cert()!.renewalRequestedBy }}</span>
                        </div>
                      }
                      @if (cert()!.newExpiryDate) {
                        <div class="metadata-row">
                          <span class="lbl">Expected New Expiry</span>
                          <span class="val">{{ cert()!.newExpiryDate | date:'longDate' }}</span>
                        </div>
                      }
                      @if (cert()!.renewalCompletedDate) {
                        <div class="metadata-row">
                          <span class="lbl">Completion Date</span>
                          <span class="val">{{ cert()!.renewalCompletedDate | date:'longDate' }}</span>
                        </div>
                      }
                      @if (cert()!.renewalNotes) {
                        <div class="metadata-row full-width">
                          <span class="lbl">Renewal Notes</span>
                          <div class="notes-box">{{ cert()!.renewalNotes }}</div>
                        </div>
                      }
                    </div>

                    <!-- Renewal Timeline -->
                    <div class="timeline-container" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                      <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary);">Renewal Timeline</h4>
                      <div class="renewal-timeline-steps" style="display: flex; flex-direction: column; gap: 12px;">
                        
                        <!-- Step 1: Requested -->
                        <div class="timeline-step" style="display: flex; gap: 10px; align-items: flex-start;">
                          <div class="step-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: #10b981; margin-top: 5px;"></div>
                          <div class="step-details">
                            <div class="step-title" style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Renewal Requested</div>
                            <div class="step-desc" style="font-size: 11px; color: var(--text-muted);">
                              Requested on {{ cert()!.renewalRequestedDate | date:'mediumDate' }} by {{ cert()!.renewalRequestedBy || 'System' }}
                            </div>
                          </div>
                        </div>

                        <!-- Step 2: Under Process -->
                        @if (cert()!.renewalStatus === 'RENEWAL_REQUESTED' || cert()!.renewalStatus === 'IN_PROGRESS') {
                          <div class="timeline-step" style="display: flex; gap: 10px; align-items: flex-start;">
                            <div class="step-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: #0284c7; margin-top: 5px;"></div>
                            <div class="step-details">
                              <div class="step-title" style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Under Verification</div>
                              <div class="step-desc" style="font-size: 11px; color: var(--text-muted);">Admin/HR is verifying the renewal credentials.</div>
                            </div>
                          </div>
                        }

                        <!-- Step 3: Complete or Failed -->
                        @if (cert()!.renewalStatus === 'RENEWED') {
                          <div class="timeline-step" style="display: flex; gap: 10px; align-items: flex-start;">
                            <div class="step-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: #10b981; margin-top: 5px;"></div>
                            <div class="step-details">
                              <div class="step-title" style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Renewal Approved</div>
                              <div class="step-desc" style="font-size: 11px; color: var(--text-muted);">Completed on {{ cert()!.renewalCompletedDate | date:'mediumDate' }}</div>
                            </div>
                          </div>
                        } @else if (cert()!.renewalStatus === 'FAILED') {
                          <div class="timeline-step" style="display: flex; gap: 10px; align-items: flex-start;">
                            <div class="step-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: #ef4444; margin-top: 5px;"></div>
                            <div class="step-details">
                              <div class="step-title" style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Renewal Failed / Rejected</div>
                              <div class="step-desc" style="font-size: 11px; color: var(--text-muted);">Completed on {{ cert()!.renewalCompletedDate | date:'mediumDate' }}</div>
                            </div>
                          </div>
                        }

                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Audit Logs Section -->
              <!-- PDF Preview Section -->
              @if (pdfPreviewUrl()) {
                <div class="dashboard-card-full preview-section" style="margin-top: 24px; padding: 24px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 24px;">
                  <h3 style="font-family: 'Outfit', sans-serif; font-size: 16px; margin-bottom: 20px; color: var(--text-primary); font-weight: 600; border-left: 3px solid var(--primary-accent); padding-left: 10px;">Credential PDF Preview</h3>
                  <div class="pdf-preview-container" style="width: 100%; height: 500px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #0f172a;">
                    <iframe [src]="pdfPreviewUrl()" style="width: 100%; height: 100%; border: none;" title="Certificate PDF Preview"></iframe>
                  </div>
                </div>
              }

              <div class="dashboard-card-full audits-section">
                <h3>Certification Audit Trail Logs</h3>
                <div class="audit-timeline">
                  @if (audits().length === 0) {
                    <p class="empty-text">No audit history found for this credential.</p>
                  }
                  @for (a of audits(); track a.id) {
                    <div class="timeline-item">
                      <div class="timeline-badge"></div>
                      <div class="timeline-content">
                        <div class="timeline-meta">
                          <span class="action-badge">{{ a.actionType }}</span>
                          <span class="date">{{ a.timestamp | date:'medium' }}</span>
                          <span class="user">&bull; Performed by: <strong>{{ a.performedBy }}</strong></span>
                        </div>
                        <p class="reason"><strong>Notes:</strong> {{ a.reason || 'No description provided' }}</p>
                        @if (a.newValue) {
                          <div class="diff-block">
                            @if (a.previousValue) {
                              <div class="prev-val">- {{ a.previousValue }}</div>
                            }
                            <div class="new-val">+ {{ a.newValue }}</div>
                          </div>
                        }
                      </div>
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
    .detail-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      
      h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 26px;
        margin: 8px 0;
        color: var(--text-primary);
      }
    }
    .badge-wrapper {
      display: flex;
      gap: 8px;
    }
    .provider-label {
      color: var(--text-secondary);
      font-size: 14px;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
    }
    .cards-grid {
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
      }
    }
    .metadata-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .metadata-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding-bottom: 8px;
      
      &.full-width {
        flex-direction: column;
        gap: 8px;
        border-bottom: none;
      }
    }
    .lbl {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .val {
      font-size: 14px;
      color: var(--text-primary);
      text-align: right;
      
      a {
        color: var(--primary-accent);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .notes-box {
      background-color: rgba(255,255,255,0.02);
      border: 1px solid var(--border-color);
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .countdown-text {
      font-weight: 600;
    }
    .countdown-green {
      color: var(--status-success);
    }
    .countdown-orange {
      color: var(--status-warning);
    }
    .countdown-red {
      color: var(--status-danger);
    }
    .renewal-card {
      border-top: 2px solid var(--primary-accent) !important;
    }
    .helper-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    .renewal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dashboard-card-full {
      padding: 24px;
      margin-bottom: 20px;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        margin-bottom: 20px;
      }
    }
    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      padding-left: 20px;
      border-left: 2px solid var(--border-color);
    }
    .timeline-item {
      position: relative;
    }
    .timeline-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      position: absolute;
      left: -27px;
      top: 6px;
      border: 2px solid var(--bg-main);
    }
    .timeline-content {
      background-color: rgba(255,255,255,0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
    }
    .timeline-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .action-badge {
      font-weight: 600;
      color: var(--primary-light);
      text-transform: uppercase;
      font-size: 11px;
    }
    .date {
      color: var(--text-muted);
    }
    .user {
      color: var(--text-secondary);
    }
    .reason {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }
    .diff-block {
      background-color: rgba(0,0,0,0.2);
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    .prev-val {
      color: #f43f5e;
    }
    .new-val {
      color: #10b981;
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
    .badge-verified {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
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
export class CertificationsDetailComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly certsService = inject(CertificationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly cert = signal<EmployeeCertification | null>(null);
  readonly audits = signal<CertificationAudit[]>([]);
  readonly pdfPreviewUrl = signal<SafeResourceUrl | null>(null);

  // Renewal Form
  renewalResult = 'RENEWED';
  newIssueDate = new Date().toISOString().substring(0,10);
  newCredId = '';
  newDocUrl = '';
  renewalNotes = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadDetails(id);
    });
  }

  loadDetails(id: string) {
    this.loading.set(true);
    this.certsService.getEmployeeCertificationById(id).subscribe({
      next: (data) => {
        this.cert.set(data);
        this.loadAudits(data.employeeId, data.id);
        
        // Fetch PDF preview
        this.certsService.downloadCertificatePdf(data.id).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            this.pdfPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
          },
          error: () => {
            this.pdfPreviewUrl.set(null);
          }
        });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadAudits(employeeId: string, employeeCertificationId: string) {
    this.certsService.getAudits().subscribe({
      next: (data) => {
        const matched = data.filter(a => a.employeeCertificationId === employeeCertificationId);
        this.audits.set(matched);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  verifyCert() {
    this.confirmationService.confirm({
      title: 'Verify Certification',
      message: 'Verify this certification credentials?',
      confirmText: 'Verify',
      cancelText: 'Cancel',
      type: 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.certsService.verifyCertification(this.cert()!.id).subscribe({
          next: () => {
            this.notificationService.success('Certification Verified', 'The certification has been verified successfully.');
            this.loadDetails(this.cert()!.id);
          },
          error: (err) => {
            this.notificationService.error('Verification Failed', err.error?.message || 'Failed to verify certification.');
          }
        });
      }
    });
  }

  triggerRevocation() {
    this.confirmationService.confirm({
      title: 'Revoke Certification',
      message: 'Specify the reason for revoking this certification:',
      confirmText: 'Revoke',
      cancelText: 'Cancel',
      type: 'danger',
      showInput: true,
      inputPlaceholder: 'Reason for revocation...'
    }).then((reason) => {
      if (reason && reason.trim() !== '') {
        this.certsService.revokeCertification(this.cert()!.id, reason).subscribe({
          next: () => {
            this.notificationService.success('Certification Revoked', 'The certification has been revoked.');
            this.loadDetails(this.cert()!.id);
          },
          error: (err) => {
            this.notificationService.error('Revocation Failed', err.error?.message || 'Failed to revoke certification.');
          }
        });
      }
    });
  }

  startRenewalProcess() {
    this.certsService.startRenewal(this.cert()!.id, 'Renewal initiated by user.').subscribe({
      next: () => {
        this.notificationService.success('Renewal Started', 'Renewal process has been initiated.');
        this.loadDetails(this.cert()!.id);
      },
      error: (err) => {
        this.notificationService.error('Renewal Failed', err.error?.message || 'Failed to start renewal process.');
      }
    });
  }

  submitRenewalProgress() {
    const req = {
      status: this.renewalResult,
      notes: this.renewalNotes,
      newIssueDate: this.renewalResult === 'RENEWED' ? this.newIssueDate : undefined,
      newCredentialId: this.renewalResult === 'RENEWED' ? this.newCredId : undefined,
      newDocumentUrl: this.renewalResult === 'RENEWED' ? this.newDocUrl : undefined
    };

    this.certsService.completeRenewal(this.cert()!.id, req).subscribe({
      next: (res) => {
        this.notificationService.success('Renewal Saved', 'Renewal status successfully saved.');
        this.loadDetails(res.id);
      },
      error: (err) => {
        this.notificationService.error('Save Failed', err.error?.message || 'Failed to complete renewal.');
      }
    });
  }

  downloadProfessionalCertificate() {
    if (!this.cert()) return;
    this.certsService.downloadCertificatePdf(this.cert()!.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanEmpName = this.cert()!.employeeName ? this.cert()!.employeeName.replace(/\s+/g, '_') : 'Employee';
        a.download = `Certification_${cleanEmpName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download Failed', 'Failed to generate PDF.')
    });
  }

  countdownMessage(): string {
    if (!this.cert()) return '';
    return this.getRemainingValidity(this.cert()!.issueDate, this.cert()!.expiryDate);
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

  getCountdownClass(): string {
    if (!this.cert()) return '';
    const expiry = new Date(this.cert()!.expiryDate).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    
    if (diff < 0) return 'countdown-red';
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 30) return 'countdown-orange';
    return 'countdown-green';
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'ACTIVE': return 'Active';
      case 'EXPIRING_SOON': return 'Expiring Soon';
      case 'EXPIRED': return 'Expired';
      case 'RENEWAL_IN_PROGRESS': return 'Renewal In Progress';
      case 'RENEWED': return 'Renewed';
      case 'REVOKED': return 'Revoked';
      case 'NOT_REQUIRED': return 'Not Required';
      case 'DUE_SOON': return 'Due Soon';
      case 'RENEWAL_REQUESTED': return 'Renewal Requested';
      case 'IN_PROGRESS': return 'In Progress';
      case 'FAILED': return 'Failed';
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
      case 'NOT_REQUIRED': return 'badge-muted';
      case 'DUE_SOON': return 'badge-warning';
      case 'RENEWAL_REQUESTED': return 'badge-info';
      case 'IN_PROGRESS': return 'badge-info';
      case 'FAILED': return 'badge-expired';
      default: return '';
    }
  }
}
