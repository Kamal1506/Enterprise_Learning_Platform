import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { AuthService } from '../../../core/auth.service';
import { CertificationsService, ComplianceSummary, ComplianceCheckResponse } from '../certifications.service';
import { EmployeeService, Employee } from '../../../features/skills/employee.service';

@Component({
  selector: 'app-compliance-dashboard',
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
          title="Security & Compliance Dashboard" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (loadingSummary()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading compliance database summaries...</p>
            </div>
          } @else {
            <div class="dashboard-section animate-fade-in">
              <div class="section-header-row">
                <h2 class="section-title">Workforce Certification Compliance</h2>
                <div class="action-buttons-group">
                  <a routerLink="/certifications/dashboard" class="btn btn-secondary">
                    Certification Analytics
                  </a>
                </div>
              </div>

              <!-- Compliance Stats Card Grid -->
              @if (authService.role() !== 'EMPLOYEE') {
                <div class="stats-grid">
                  <div class="stat-card border-green">
                    <span class="stat-title">Compliant Employees</span>
                    <div class="stat-value text-green">{{ summary().compliantCount }}</div>
                    <span class="stat-desc">Full valid required credentials</span>
                  </div>

                  <div class="stat-card border-orange">
                    <span class="stat-title">Expiring Credentials</span>
                    <div class="stat-value text-orange">{{ summary().expiringCount }}</div>
                    <span class="stat-desc">Expiring in next 30 days</span>
                  </div>

                  <div class="stat-card border-red">
                    <span class="stat-title">Non-Compliant Employees</span>
                    <div class="stat-value text-red">{{ summary().nonCompliantCount }}</div>
                    <span class="stat-desc">Missing required credentials</span>
                  </div>

                  <div class="stat-card">
                    <span class="stat-title">Global Compliance Rate</span>
                    <div class="stat-value">{{ summary().complianceRate | number:'1.0-1' }}%</div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill fill-green" [style.width.%]="summary().complianceRate"></div>
                    </div>
                    <span class="stat-desc">Target: 95.0% compliance threshold</span>
                  </div>
                </div>
              }

              <!-- Detail Panels Grid -->
              <div class="dashboard-grid">
                <!-- Check Specific Employee Compliance -->
                <div class="dashboard-card">
                  @if (authService.role() !== 'EMPLOYEE') {
                    <h3>Verify Employee Compliance Status</h3>
                    <div class="select-employee-row">
                      <select class="form-control" [(ngModel)]="selectedEmployeeId" (change)="checkEmployeeCompliance()">
                        <option value="">Select an Employee...</option>
                        @for (emp of employees(); track emp.id) {
                          <option [value]="emp.id">{{ emp.name }} ({{ emp.department }})</option>
                        }
                      </select>
                    </div>
                  } @else {
                    <h3>My Certification Compliance Status</h3>
                  }

                  @if (loadingCheck()) {
                    <div class="loading-state-mini">
                      <div class="spinner-mini"></div>
                      <p>Calculating compliance status...</p>
                    </div>
                  } @else if (checkResult()) {
                    <div class="compliance-check-results">
                      <div class="result-status-row">
                        <span class="lbl">Compliance Status:</span>
                        <span class="badge" [ngClass]="getComplianceBadgeClass(checkResult()!.complianceStatus)">
                          {{ checkResult()!.complianceStatus }}
                        </span>
                      </div>

                      @if (checkResult()!.missingCertifications.length > 0) {
                        <div class="results-list">
                          <h4 class="text-red">Missing Required Credentials:</h4>
                          <ul>
                            @for (item of checkResult()!.missingCertifications; track item) {
                              <li class="missing-item">⚠ {{ item }}</li>
                            }
                          </ul>
                        </div>
                      } @else {
                        <div class="results-list text-green">
                          <p>✓ All required skill-certifications are active and fully verified.</p>
                        </div>
                      }

                      @if (checkResult()!.activeCertifications.length > 0) {
                        <div class="results-list">
                          <h4>Active Valid Credentials:</h4>
                          <ul>
                            @for (award of checkResult()!.activeCertifications; track award.id) {
                              <li class="active-item" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 10px; border-bottom: 1px solid var(--border-color);">
                                <a [routerLink]="['/certifications', award.id]" style="font-weight:600; color: var(--text-primary); text-decoration: none;">{{ award.certificationName }}</a>
                                <div class="sub text-muted" style="font-size: 11px;">
                                  Issued: {{ award.issueDate | date:'mediumDate' }} | 
                                  Expires: {{ award.expiryDate | date:'mediumDate' }}
                                </div>
                                <div class="sub text-accent" style="font-size: 11px; font-weight:500; color: var(--primary-accent);">
                                  Remaining: {{ getRemainingValidity(award.issueDate, award.expiryDate) }}
                                </div>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-state-dashed">
                      <p class="empty-text">Select an employee from the dropdown list above to verify skill-competency and certificate validations.</p>
                    </div>
                  }
                </div>

                <!-- Compliance Guidelines Summary -->
                <div class="dashboard-card">
                  <h3>Compliance Guidelines & Rules</h3>
                  <div class="rules-box">
                    <div class="rule-item">
                      <strong>1. Competency Link:</strong>
                      <p>Every certification definition is linked to an associated skill in the Competency Framework. If an employee claims a skill, they must hold a valid certificate.</p>
                    </div>
                    <div class="rule-item">
                      <strong>2. Expiration Rules:</strong>
                      <p>Certificates are classified as expiring when the expiry target date falls within 30 days of the current date.</p>
                    </div>
                    <div class="rule-item">
                      <strong>3. Verification Requirement:</strong>
                      <p>Unverified certification submissions will block compliant status, changing the employee validation classification to <code>NOT_VERIFIED</code>.</p>
                    </div>
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
    .stat-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      
      &.border-green {
        border-left: 4px solid var(--status-success) !important;
      }
      &.border-orange {
        border-left: 4px solid var(--status-warning) !important;
      }
      &.border-red {
        border-left: 4px solid var(--status-danger) !important;
      }
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
      line-height: 1;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    .text-green { color: var(--status-success); }
    .text-orange { color: var(--status-warning); }
    .text-red { color: var(--status-danger); }
    
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
    .fill-green {
      background-color: var(--status-success);
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
    .select-employee-row {
      margin-bottom: 20px;
      select {
        width: 100%;
        background-color: rgba(255,255,255,0.03);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        
        &:focus {
          border-color: var(--primary-accent);
        }
      }
    }
    .compliance-check-results {
      background-color: rgba(255,255,255,0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .result-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }
    .results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      
      h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      ul {
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        
        li {
          font-size: 13px;
        }
      }
    }
    .missing-item {
      color: var(--status-danger);
      font-weight: 500;
    }
    .active-item {
      color: var(--text-secondary);
      
      a {
        color: var(--primary-accent);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .rules-box {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .rule-item {
      font-size: 13px;
      line-height: 1.5;
      
      strong {
        color: var(--text-primary);
        display: block;
        margin-bottom: 4px;
      }
      
      p {
        color: var(--text-secondary);
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
    .badge-compliant {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-noncompliant {
      background-color: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-expiring {
      background-color: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-unverified {
      background-color: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.2);
    }
    .loading-state-mini {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      gap: 10px;
      font-size: 13px;
      color: var(--text-secondary);
    }
  `]
})
export class ComplianceDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly certsService = inject(CertificationsService);
  private readonly empService = inject(EmployeeService);

  readonly loadingSummary = signal(true);
  readonly summary = signal<ComplianceSummary>({
    compliantCount: 0,
    expiringCount: 0,
    nonCompliantCount: 0,
    complianceRate: 100.0
  });

  readonly employees = signal<Employee[]>([]);
  readonly checkResult = signal<ComplianceCheckResponse | null>(null);
  readonly loadingCheck = signal(false);

  selectedEmployeeId = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadingSummary.set(true);
    if (this.authService.role() !== 'EMPLOYEE') {
      this.certsService.getComplianceSummary().subscribe({
        next: (data: ComplianceSummary) => {
          this.summary.set(data);
          this.loadingSummary.set(false);
        },
        error: () => {
          this.loadingSummary.set(false);
        }
      });

      this.empService.getEmployees(undefined, 0, 100).subscribe({
        next: (res) => {
          this.employees.set(res.content || []);
        }
      });
    } else {
      this.loadingSummary.set(false);
      const selfId = this.authService.employeeId();
      if (selfId) {
        this.selectedEmployeeId = selfId;
        this.checkEmployeeCompliance();
      }
    }
  }

  checkEmployeeCompliance() {
    if (this.selectedEmployeeId === '') {
      this.checkResult.set(null);
      return;
    }

    this.loadingCheck.set(true);
    this.certsService.checkEmployeeCompliance(this.selectedEmployeeId).subscribe({
      next: (res: ComplianceCheckResponse) => {
        this.checkResult.set(res);
        this.loadingCheck.set(false);
      },
      error: () => {
        this.loadingCheck.set(false);
      }
    });
  }

  getComplianceBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLIANT': return 'badge-compliant';
      case 'EXPIRING': return 'badge-expiring';
      case 'NON_COMPLIANT': return 'badge-noncompliant';
      case 'NOT_VERIFIED': return 'badge-unverified';
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
