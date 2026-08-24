import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../employee.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';

interface Skill {
  id: string;
  name: string;
  category: string;
  createdAt?: string;
}

interface SkillEmployee {
  employeeId: string;
  name: string;
  roleTitle: string;
  department: string;
  proficiency: number;
  verified: boolean;
}

@Component({
  selector: 'app-skills-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderComponent,
    StatCardComponent
  ],
  template: `
    <div class="app-layout">
      <app-sidebar />
      
      <div class="content-wrapper">
        <app-header 
          title="Skills Directory" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Stats neon cards -->
          <div class="stats-grid animate-fade-in">
            <app-stat-card 
              title="Total Tracked Skills" 
              [value]="skills().length" 
              icon="activity"
            />
            <app-stat-card 
              title="Technical Skills" 
              [value]="techCount()" 
              icon="settings"
            />
            <app-stat-card 
              title="Soft Skills" 
              [value]="softCount()" 
              icon="users"
            />
            <app-stat-card 
              title="Domain Skills" 
              [value]="domainCount()" 
              icon="award"
            />
          </div>

          <!-- Main Layout Grid -->
          <div class="skills-grid mt-24 animate-fade-in">
            
            <!-- Left Panel: Skills Table -->
            <div class="skills-table-card">
              <div class="card-header">
                <h3>System Skills Directory</h3>
                <button class="btn btn-primary btn-sm" (click)="toggleSkillForm()">
                  {{ showAddForm() ? 'Cancel' : '+ Add New Skill' }}
                </button>
              </div>

              @if (showAddForm()) {
                <div class="add-skill-form-card animate-slide-down">
                  <h4>Register New Skill</h4>
                  <form (ngSubmit)="onCreateSkill()" class="skill-form">
                    <div class="form-row">
                      <div class="form-group flex-grow">
                        <label for="skillName">Skill Name</label>
                        <input 
                          type="text" 
                          id="skillName" 
                          [(ngModel)]="newSkillName" 
                          name="newSkillName" 
                          required 
                          placeholder="e.g. Kotlin, Docker, Leadership"
                          class="form-control"
                        />
                      </div>
                      
                      <div class="form-group">
                        <label for="skillCategory">Category</label>
                        <div class="select-wrapper">
                          <select 
                            id="skillCategory" 
                            [(ngModel)]="newSkillCategory" 
                            name="newSkillCategory" 
                            required 
                            class="form-control select-input"
                          >
                            <option value="TECHNICAL">TECHNICAL</option>
                            <option value="SOFT">SOFT</option>
                            <option value="DOMAIN">DOMAIN</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      class="btn btn-primary" 
                      [disabled]="!newSkillName.trim() || !newSkillCategory"
                    >
                      Save Skill
                    </button>
                  </form>
                </div>
              }

              @if (loadingSkills()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Loading directory...</p>
                </div>
              } @else if (skills().length === 0) {
                <div class="empty-state-dashed">
                  <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline>
                  </svg>
                  <p class="empty-text">No skills registered yet. Create one to begin tracking competency.</p>
                </div>
              } @else {
                <div class="table-container">
                  <table class="dense-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Category</th>
                        <th class="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sk of skills(); track sk.id) {
                        <tr 
                          [class.selected-row]="selectedSkill()?.id === sk.id"
                          (click)="selectSkill(sk)"
                          class="interactive-row"
                        >
                          <td class="font-semibold text-white">{{ sk.name }}</td>
                          <td>
                            <span class="category-badge" [ngClass]="getCategoryClass(sk.category)">
                              {{ sk.category }}
                            </span>
                          </td>
                          <td class="text-right">
                            <button class="btn-select-arrow" aria-label="View holders">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-svg"><path d="M9 18l6-6-6-6"></path></svg>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- Right Panel: Obtained Employees List -->
            <div class="holders-card">
              @if (!selectedSkill()) {
                <div class="placeholder-state">
                  <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3>Select a Competency</h3>
                  <p>Choose any skill from the left directory to view which team members have obtained it and their proficiency level.</p>
                </div>
              } @else {
                <div class="holders-container animate-fade-in">
                  <div class="holders-header">
                    <div>
                      <span class="category-pill" [ngClass]="getCategoryClass(selectedSkill()!.category)">
                        {{ selectedSkill()!.category }}
                      </span>
                      <h3>{{ selectedSkill()!.name }}</h3>
                    </div>
                    <span class="holders-count">{{ employeesWithSkill().length }} Holders</span>
                  </div>

                  @if (loadingHolders()) {
                    <div class="loading-state">
                      <div class="spinner"></div>
                      <p>Querying competency mappings...</p>
                    </div>
                  } @else if (employeesWithSkill().length === 0) {
                    <div class="empty-state-dashed">
                      <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <p class="empty-text">No employees have mapped this skill to their profile yet.</p>
                    </div>
                  } @else {
                    <div class="holders-list">
                      @for (emp of employeesWithSkill(); track emp.employeeId) {
                        <div class="holder-item">
                          <div class="holder-meta">
                            <div class="holder-avatar">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="avatar-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <div class="holder-info">
                              <span class="holder-name text-white">{{ emp.name }}</span>
                              <span class="holder-role">{{ emp.roleTitle }} &bull; {{ emp.department }}</span>
                            </div>
                          </div>

                          <div class="holder-proficiency">
                            <div class="proficiency-header">
                              <span class="prof-label">Proficiency:</span>
                              <span class="prof-val">{{ emp.proficiency }}/10</span>
                            </div>
                            <div class="prof-bar-bg">
                              <div class="prof-bar-fill" [style.width.%]="emp.proficiency * 10"></div>
                            </div>
                            @if (emp.verified) {
                              <span class="verified-pill">✓ Verified</span>
                            } @else {
                              <span class="unverified-pill">Pending Verification</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

          </div>
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: start;
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .skills-table-card, .holders-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 480px;

      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Add form styling */
    .add-skill-form-card {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        color: var(--primary-light);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .skill-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .flex-grow {
      flex-grow: 1;
    }

    /* Table styles */
    .interactive-row {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(234, 88, 12, 0.05);
      }
    }

    .selected-row {
      background-color: rgba(234, 88, 12, 0.1) !important;
      border-left: 3px solid var(--primary-accent);
      
      .btn-select-arrow {
        color: var(--primary-light) !important;
        border-color: var(--primary-accent) !important;
      }
    }

    .category-badge {
      display: inline-flex;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-tech {
      background-color: rgba(14, 165, 233, 0.12);
      color: var(--secondary-light);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }

    .badge-soft {
      background-color: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge-domain {
      background-color: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .btn-select-arrow {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .arrow-svg {
      width: 14px;
      height: 14px;
    }

    /* Holders display cards */
    .placeholder-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      flex-grow: 1;
      color: var(--text-muted);
      gap: 16px;
      padding: 40px 20px;
    }

    .placeholder-icon {
      width: 48px;
      height: 48px;
      color: #334155;
    }

    .holders-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .holders-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 16px;

      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        margin-top: 4px;
      }
    }

    .category-pill {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .holders-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: #1e293b;
      padding: 4px 10px;
      border-radius: 100px;
    }

    .holders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .holder-item {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .holder-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .holder-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-icon {
      width: 18px;
      height: 18px;
    }

    .holder-info {
      display: flex;
      flex-direction: column;
    }

    .holder-name {
      font-size: 14px;
      font-weight: 600;
    }

    .holder-role {
      font-size: 12px;
      color: var(--text-muted);
    }

    .holder-proficiency {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px dashed #1e293b;
      padding-top: 10px;
    }

    .proficiency-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }

    .prof-label {
      color: var(--text-muted);
    }

    .prof-val {
      font-weight: 700;
      color: var(--text-primary);
    }

    .prof-bar-bg {
      background-color: var(--bg-card);
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
    }

    .prof-bar-fill {
      background-color: var(--primary-accent);
      height: 100%;
      border-radius: 3px;
      box-shadow: 0 0 6px rgba(234, 88, 12, 0.6);
    }

    .verified-pill {
      font-size: 10px;
      font-weight: 600;
      color: #10b981;
      margin-top: 4px;
    }

    .unverified-pill {
      font-size: 10px;
      font-weight: 600;
      color: #f59e0b;
      margin-top: 4px;
    }

    .empty-state-dashed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      text-align: center;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      color: var(--text-muted);
      gap: 12px;
      width: 100%;
    }
    
    .empty-icon-subtle {
      width: 32px;
      height: 32px;
      color: #4b5563;
    }
    
    .empty-text {
      font-size: 13px;
      margin: 0;
      color: var(--text-secondary);
    }

    .mt-24 { margin-top: 24px; }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-secondary);
    }
    
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(234, 88, 12, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-accent);
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SkillsListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  protected readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly skills = signal<Skill[]>([]);
  readonly loadingSkills = signal(true);
  
  readonly selectedSkill = signal<Skill | null>(null);
  readonly employeesWithSkill = signal<SkillEmployee[]>([]);
  readonly loadingHolders = signal(false);

  // Stats computed from skills signal
  readonly techCount = computed(() => this.skills().filter(s => s.category === 'TECHNICAL').length);
  readonly softCount = computed(() => this.skills().filter(s => s.category === 'SOFT').length);
  readonly domainCount = computed(() => this.skills().filter(s => s.category === 'DOMAIN').length);

  // Form bindings
  showAddForm = signal(false);
  newSkillName = '';
  newSkillCategory = 'TECHNICAL';

  ngOnInit() {
    this.loadSkills();
  }

  loadSkills() {
    this.loadingSkills.set(true);
    this.employeeService.getAllSkills().subscribe({
      next: (res) => {
        this.skills.set(res);
        this.loadingSkills.set(false);
      },
      error: () => this.loadingSkills.set(false)
    });
  }

  toggleSkillForm() {
    this.showAddForm.update(val => !val);
    this.newSkillName = '';
    this.newSkillCategory = 'TECHNICAL';
  }

  onCreateSkill() {
    if (!this.newSkillName.trim()) return;

    const req = {
      name: this.newSkillName.trim(),
      category: this.newSkillCategory
    };

    this.employeeService.createSkill(req).subscribe({
      next: (newSkill) => {
        this.notificationService.success(
          'Skill Registered',
          `Skill "${newSkill.name}" registered successfully.`
        );
        this.loadSkills();
        this.toggleSkillForm();
      },
      error: (err) => {
        this.notificationService.error(
          'Registration Failed',
          err?.error?.message || 'Failed to create skill. Make sure the name is unique.'
        );
      }
    });
  }

  selectSkill(skill: Skill) {
    this.selectedSkill.set(skill);
    this.loadHolders(skill.id);
  }

  loadHolders(skillId: string) {
    this.loadingHolders.set(true);
    this.employeeService.getEmployeesWithSkill(skillId).subscribe({
      next: (res) => {
        this.employeesWithSkill.set(res);
        this.loadingHolders.set(false);
      },
      error: () => {
        this.employeesWithSkill.set([]);
        this.loadingHolders.set(false);
      }
    });
  }

  getCategoryClass(category: string): string {
    if (category === 'TECHNICAL') return 'badge-tech';
    if (category === 'SOFT') return 'badge-soft';
    if (category === 'DOMAIN') return 'badge-domain';
    return '';
  }
}
