import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { AuthService } from '../../../core/auth.service';
import { CertificationsService, Certification } from '../certifications.service';
import { EmployeeService, Employee } from '../../../features/skills/employee.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-certifications-register',
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
          title="Award Certification Credential" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <div class="register-container animate-fade-in">
            <div class="form-card glass-card">
              <div class="card-header">
                <h2>{{ authService.role() === 'EMPLOYEE' ? 'Request Certification Verification' : (isEditMode() ? 'Edit' : 'Register') + ' Employee Certification' }}</h2>
                <p>{{ authService.role() === 'EMPLOYEE' ? 'Submit your professional certification credential details to request HR verification and approval.' : (isEditMode() ? 'Update the details of this employee certification record.' : 'Award a validated professional certification credential to an employee profile.') }}</p>
              </div>

              @if (errorMessage()) {
                <div class="alert-banner alert-danger">
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="register-form">
                 <!-- Employee Selection -->
                @if (authService.role() !== 'EMPLOYEE') {
                  <div class="form-group">
                    <label for="employee">Employee Recipient</label>
                    <select id="employee" name="employee" class="form-control" [(ngModel)]="selectedEmployeeId" required>
                      <option value="">Select an Employee...</option>
                      @for (emp of employees(); track emp.id) {
                        <option [value]="emp.id">{{ emp.name }} ({{ emp.department }} - {{ emp.roleTitle }})</option>
                      }
                    </select>
                  </div>
                } @else {
                  <div class="form-group">
                    <label>Employee Recipient</label>
                    <input type="text" class="form-control" [value]="authService.email()" readonly />
                  </div>
                }

                <!-- Certification Definition Selection -->
                <div class="form-group">
                  <label for="certification">Certification Course / Definition</label>
                  <select id="certification" name="certification" class="form-control" [(ngModel)]="selectedCertId" (change)="onCertChange()" required>
                    <option value="">Select Certification...</option>
                    @for (c of certDefinitions(); track c.id) {
                      <option [value]="c.id">{{ c.name }} (Issued by: {{ c.provider }})</option>
                    }
                  </select>
                </div>

                <div class="form-row">
                  <!-- Credential ID -->
                  <div class="form-group">
                    <label for="credId">Credential / License ID</label>
                    <input type="text" id="credId" name="credId" class="form-control" [(ngModel)]="credentialId" placeholder="e.g. AWS-SAA-4881" required />
                  </div>

                  <!-- Issue Date -->
                  <div class="form-group">
                    <label for="issueDate">Issue Date</label>
                    <input type="date" id="issueDate" name="issueDate" class="form-control" [(ngModel)]="issueDate" (change)="onIssueDateChange()" required />
                  </div>
                </div>

                <div class="form-row">
                  <!-- Validity Duration -->
                  <div class="form-group">
                    <label for="validityDuration">Validity Duration</label>
                    <select id="validityDuration" name="validityDuration" class="form-control" [(ngModel)]="validityDuration" (change)="onDurationChange()" required>
                      <option value="">Select Duration...</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year</option>
                      <option value="24">2 Years</option>
                      <option value="36">3 Years</option>
                      <option value="60">5 Years</option>
                      <option value="custom">Custom (Specify Expiry)</option>
                    </select>
                  </div>

                  <!-- Expiry Date -->
                  <div class="form-group">
                    <label for="expiryDate">Expiry Date</label>
                    <input type="date" id="expiryDate" name="expiryDate" class="form-control" [(ngModel)]="expiryDate" (change)="onExpiryDateChange()" required />
                  </div>
                </div>

                 <!-- Status -->
                @if (authService.role() !== 'EMPLOYEE') {
                  <div class="form-row">
                    <div class="form-group">
                      <label for="status">Award Status</label>
                      <select id="status" name="status" class="form-control" [(ngModel)]="status" required>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRING_SOON">Expiring Soon</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="REVOKED">Revoked</option>
                      </select>
                    </div>
                  </div>
                }

                <!-- Document Link -->
                <div class="form-group">
                  <label for="docUrl">Certificate Verification Document URL</label>
                  <input type="url" id="docUrl" name="docUrl" class="form-control" [(ngModel)]="documentUrl" placeholder="https://provider.com/verify/credential" />
                </div>

                 <!-- Notes -->
                <div class="form-group">
                  <label for="notes">{{ authService.role() === 'EMPLOYEE' ? 'Applicant Notes' : 'Internal Assessment Notes' }}</label>
                  <textarea id="notes" name="notes" class="form-control" [(ngModel)]="notes" rows="4" [placeholder]="authService.role() === 'EMPLOYEE' ? 'Provide any additional details or verification references for HR review (optional)...' : 'Include notes on performance or score metrics (optional)...'"></textarea>
                </div>

                 <div class="form-actions">
                  <a routerLink="/certifications/list" class="btn btn-secondary">Cancel</a>
                  <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                    @if (submitting()) {
                      <span>{{ authService.role() === 'EMPLOYEE' ? 'Submitting request...' : 'Saving award...' }}</span>
                    } @else {
                      <span>{{ authService.role() === 'EMPLOYEE' ? 'Submit Request' : (isEditMode() ? 'Save Changes' : 'Register Award') }}</span>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      max-width: 700px;
      margin: 0 auto;
    }
    .form-card {
      padding: 30px;
    }
    .card-header {
      margin-bottom: 24px;
      h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        color: var(--text-primary);
        margin-bottom: 6px;
      }
      p {
        font-size: 13px;
        color: var(--text-secondary);
      }
    }
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }
    .alert-banner {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
  `]
})
export class CertificationsRegisterComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly certsService = inject(CertificationsService);
  private readonly empService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly employees = signal<Employee[]>([]);
  readonly certDefinitions = signal<Certification[]>([]);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly editId = signal<string | null>(null);

  selectedEmployeeId = '';
  selectedCertId = '';
  credentialId = '';
  issueDate = new Date().toISOString().substring(0, 10);
  expiryDate = '';
  validityDuration = '';
  status = 'ACTIVE';
  documentUrl = '';
  notes = '';
 
  ngOnInit() {
    this.loadData();
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode.set(true);
        this.editId.set(id);
        this.loadExistingDetails(id);
      } else if (this.authService.role() === 'EMPLOYEE') {
        this.selectedEmployeeId = this.authService.employeeId() || '';
        this.status = 'PENDING';
      }
    });
  }

  loadExistingDetails(id: string) {
    this.certsService.getEmployeeCertificationById(id).subscribe({
      next: (cert) => {
        this.selectedEmployeeId = cert.employeeId;
        this.selectedCertId = cert.certificationId;
        this.credentialId = cert.credentialId || '';
        this.issueDate = cert.issueDate.substring(0, 10);
        this.expiryDate = cert.expiryDate.substring(0, 10);
        this.status = cert.status;
        this.documentUrl = cert.documentUrl || '';
        this.notes = cert.notes || '';
        
        this.calculateDurationFromExpiry();
      },
      error: () => {
        this.notificationService.error('Error', 'Failed to load certification details.');
      }
    });
  }

  loadData() {
    if (this.authService.role() !== 'EMPLOYEE') {
      this.empService.getEmployees(undefined, 0, 100).subscribe({
        next: (res) => {
          this.employees.set(res.content || []);
        }
      });
    }

    this.certsService.getCertifications().subscribe({
      next: (res) => {
        this.certDefinitions.set(res || []);
      }
    });
  }

  onCertChange() {
    const cert = this.certDefinitions().find(c => c.id === this.selectedCertId);
    if (cert && cert.validityMonths) {
      this.validityDuration = cert.validityMonths.toString();
      this.calculateExpiryFromDuration();
    }
  }

  onDurationChange() {
    if (this.validityDuration !== 'custom' && this.validityDuration !== '') {
      this.calculateExpiryFromDuration();
    }
  }

  onIssueDateChange() {
    if (this.validityDuration !== 'custom' && this.validityDuration !== '') {
      this.calculateExpiryFromDuration();
    } else if (this.expiryDate) {
      this.calculateDurationFromExpiry();
    }
  }

  onExpiryDateChange() {
    this.calculateDurationFromExpiry();
  }

  calculateExpiryFromDuration() {
    if (!this.issueDate || !this.validityDuration || this.validityDuration === 'custom') return;
    
    const issue = new Date(this.issueDate);
    const months = parseInt(this.validityDuration, 10);
    if (!isNaN(months)) {
      issue.setMonth(issue.getMonth() + months);
      this.expiryDate = issue.toISOString().substring(0, 10);
    }
  }

  calculateDurationFromExpiry() {
    if (!this.issueDate || !this.expiryDate) return;
    
    const issue = new Date(this.issueDate);
    const expiry = new Date(this.expiryDate);
    
    let months = (expiry.getFullYear() - issue.getFullYear()) * 12 + (expiry.getMonth() - issue.getMonth());
    if (expiry.getDate() < issue.getDate()) {
      months--;
    }
    
    if (months < 0) {
      this.validityDuration = 'custom';
      return;
    }
    
    const presetMonths = ['6', '12', '24', '36', '60'];
    if (presetMonths.includes(months.toString())) {
      this.validityDuration = months.toString();
    } else {
      this.validityDuration = 'custom';
    }
  }

  onSubmit() {
    if (this.selectedEmployeeId === '' || this.selectedCertId === '' || this.credentialId === '' || this.issueDate === '' || this.expiryDate === '' || this.status === '') {
      this.notificationService.error('Validation Error', 'Please fill out all required fields.');
      return;
    }

    const issue = new Date(this.issueDate);
    const expiry = new Date(this.expiryDate);
    if (issue > new Date()) {
      this.notificationService.error('Validation Error', 'Issue date cannot be in the future.');
      return;
    }

    if (expiry <= issue) {
      this.notificationService.error('Validation Error', 'Expiry Date must always be after Issue Date.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      employeeId: this.selectedEmployeeId,
      certificationId: this.selectedCertId,
      credentialId: this.credentialId,
      issueDate: this.issueDate,
      expiryDate: this.expiryDate,
      status: this.status,
      documentUrl: this.documentUrl !== '' ? this.documentUrl : undefined,
      notes: this.notes !== '' ? this.notes : undefined
    };

    if (this.isEditMode()) {
      this.certsService.updateEmployeeCertification(this.editId()!, payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.notificationService.success('Update Successful', 'Employee certification updated successfully.');
          this.router.navigate(['/certifications', res.id]);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.error && err.error.message) {
            this.notificationService.error('Update Failed', err.error.message);
          } else {
            this.notificationService.error('Update Failed', 'An error occurred while updating the certification record.');
          }
        }
      });
    } else {
      this.certsService.registerCertification(payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.notificationService.success('Registration Successful', 'Employee certification registered successfully.');
          this.router.navigate(['/certifications', res.id]);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.error && err.error.message) {
            this.notificationService.error('Registration Failed', err.error.message);
          } else {
            this.notificationService.error('Registration Failed', 'An error occurred while registering the certification award.');
          }
        }
      });
    }
  }
}
