import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { AuthService } from '../../../core/auth.service';
import { EmployeeService, Employee } from '../employee.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile',
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
          title="My Profile" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <div class="profile-layout animate-fade-in">
            <!-- Sidebar card Info -->
            <div class="profile-card-left glass-card">
              <div class="avatar-huge">
                <svg class="avatar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="profile-summary-title">
                <h2>{{ name }}</h2>
                <p>{{ roleTitle }} &bull; {{ department }}</p>
              </div>
              <div class="rating-box-huge">
                <span class="rating-number">{{ rating }}</span>
                <span class="rating-star">★</span>
                <span class="rating-label">Average Performance</span>
              </div>
            </div>

            <!-- Form Edit Details -->
            <div class="profile-card-right glass-card">
              <h3>Edit Profile Details</h3>
              <form (ngSubmit)="onSave()" #profileForm="ngForm" class="profile-edit-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input 
                      type="text" 
                      id="fullName" 
                      name="fullName" 
                      [(ngModel)]="name" 
                      required 
                      class="form-control" 
                      placeholder="e.g. Alice Smith"
                      [disabled]="saving()"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Work Email (Read-Only)</label>
                    <input 
                      type="text" 
                      [value]="email" 
                      disabled 
                      class="form-control disabled-input" 
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="roleTitle">Role Title</label>
                    <input 
                      type="text" 
                      id="roleTitle" 
                      name="roleTitle" 
                      [(ngModel)]="roleTitle" 
                      required 
                      class="form-control" 
                      placeholder="e.g. Senior Software Engineer"
                      [disabled]="saving()"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="department">Department</label>
                    <div class="select-wrapper">
                      <select 
                        id="department" 
                        name="department" 
                        [(ngModel)]="department" 
                        required 
                        class="form-control select-input"
                        [disabled]="saving()"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="HR">HR</option>
                        <option value="Product">Product</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="experienceYears">Experience Years</label>
                    <input 
                      type="number" 
                      id="experienceYears" 
                      name="experienceYears" 
                      [(ngModel)]="experienceYears" 
                      required 
                      min="0"
                      class="form-control" 
                      placeholder="e.g. 5"
                      [disabled]="saving()"
                    />
                  </div>
                  
                  <div class="form-group empty-form-group">
                    <!-- spacing placeholder -->
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="!profileForm.form.valid || saving()">
                    @if (saving()) {
                      <span class="spinner"></span> Saving Changes...
                    } @else {
                      Save Changes
                    }
                  </button>
                  <a routerLink="/dashboard" class="btn btn-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }
    .profile-card-left {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
    }
    .avatar-huge {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(234, 88, 12, 0.4);
    }
    .avatar-icon-svg {
      width: 48px;
      height: 48px;
      color: var(--text-primary);
    }
    .profile-summary-title {
      h2 {
        font-family: 'Outfit', sans-serif;
        color: var(--text-primary);
        margin: 0 0 4px 0;
        font-size: 20px;
      }
      p {
        color: var(--text-secondary);
        font-size: 13px;
        margin: 0;
      }
    }
    .rating-box-huge {
      background-color: var(--bg-main);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .rating-number {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #fbbf24;
      line-height: 1;
    }
    .rating-star {
      color: #fbbf24;
      font-size: 20px;
      margin: 4px 0;
    }
    .rating-label {
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .profile-card-right {
      padding: 32px;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        color: var(--text-primary);
        margin: 0 0 24px 0;
      }
    }
    
    .profile-edit-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
    .empty-form-group {
      @media (max-width: 768px) {
        display: none;
      }
    }
    .disabled-input {
      background-color: var(--bg-main);
      border-color: #1e293b;
      color: var(--text-muted);
      cursor: not-allowed;
    }
    .select-wrapper {
      position: relative;
      display: block;
      width: 100%;
    }
    .select-input {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
      padding-right: 40px;
      cursor: pointer;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 24px;
    }
    
    /* Alerts */
    .alert-banner {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      animation: slideDown 0.3s ease-out;
    }
    .alert-success {
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .alert-close-btn {
      background: none;
      border: none;
      color: inherit;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // States
  readonly saving = signal(false);

  // Form Fields
  id = '';
  name = '';
  email = '';
  roleTitle = '';
  department = 'Engineering';
  experienceYears = 0;
  rating = 5.0;
  createdAt = '';

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const empId = this.authService.employeeId();
    if (!empId) {
      this.showFeedback('No profile ID found. Profile editing is for employees only.', 'danger');
      return;
    }

    this.employeeService.getEmployeeById(empId).subscribe({
      next: (profile) => {
        this.id = profile.id;
        this.name = profile.name;
        this.email = profile.email;
        this.roleTitle = profile.roleTitle;
        this.department = profile.department;
        this.experienceYears = profile.experienceYears;
        this.rating = profile.rating;
        this.createdAt = profile.createdAt;
      },
      error: () => this.showFeedback('Failed to load profile details.', 'danger')
    });
  }

  onSave() {
    if (!this.id || !this.name || !this.roleTitle || !this.department) return;

    this.saving.set(true);

    const updatedEmployee: Employee = {
      id: this.id,
      name: this.name,
      email: this.email,
      roleTitle: this.roleTitle,
      department: this.department,
      experienceYears: this.experienceYears,
      rating: this.rating,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString()
    };

    this.employeeService.updateEmployee(this.id, updatedEmployee).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.name = res.name;
        this.roleTitle = res.roleTitle;
        this.department = res.department;
        this.experienceYears = res.experienceYears;
        this.showFeedback('Profile saved successfully!', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showFeedback('Failed to save profile changes.', 'danger');
      }
    });
  }

  showFeedback(message: string, type: 'success' | 'danger') {
    if (type === 'success') {
      this.notificationService.success('Success', message);
    } else {
      this.notificationService.error('Error', message);
    }
  }
}
