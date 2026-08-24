import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService, Employee, DashboardStats, Skill } from '../employee.service';
import { AuthService } from '../../../core/auth.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';

@Component({
  selector: 'app-employee-list',
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
          title="Workforce Directory" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <!-- Stat Cards -->
          <div class="stats-grid">
            <app-stat-card 
              title="Employees" 
              [value]="stats().employeesCount" 
              icon="users"
              trend="+4% this quarter"
            />
            <app-stat-card 
              title="Skills Tracked" 
              [value]="stats().skillsTrackedCount" 
              icon="activity"
              trend="+8 new skills"
            />
            <app-stat-card 
              title="Assessments" 
              [value]="stats().assessmentsThisMonthCount" 
              icon="award"
              trend="+12 this month"
            />
          </div>

          @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
            <!-- Advanced Filters Section -->
            <div class="filters-card glass-card animate-fade-in">
              <div class="filters-grid-fields">
                <div class="filter-field">
                  <label for="deptFilter">Department</label>
                  <div class="select-wrapper">
                    <select id="deptFilter" class="form-control select-field" [(ngModel)]="selectedDept">
                      <option value="">All Departments</option>
                      @for (dept of departments(); track dept) {
                        <option [value]="dept">{{ dept }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="filter-field">
                  <label for="roleFilter">Role</label>
                  <div class="select-wrapper">
                    <select id="roleFilter" class="form-control select-field" [(ngModel)]="selectedRole">
                      <option value="">All Roles</option>
                      @for (role of roles(); track role) {
                        <option [value]="role">{{ role }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="filter-field">
                  <label for="expFilter">Experience</label>
                  <div class="select-wrapper">
                    <select id="expFilter" class="form-control select-field" [(ngModel)]="selectedExperience">
                      <option value="">All Experience</option>
                      <option value="0-2">0–2 years</option>
                      <option value="3-5">3–5 years</option>
                      <option value="6-10">6–10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                </div>

                <div class="filter-field">
                  <label>Skills</label>
                  <div class="custom-multiselect">
                    <button type="button" class="form-control select-btn" (click)="toggleSkillsDropdown($event)">
                      <span class="btn-text">{{ getSkillsSelectLabel() }}</span>
                      <svg class="chevron-icon" [class.open]="showSkillsDropdown()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    
                    @if (showSkillsDropdown()) {
                      <div class="skills-dropdown-menu" (click)="$event.stopPropagation()">
                        <input 
                          type="text" 
                          class="form-control search-skills-input" 
                          placeholder="Search skills..." 
                          [ngModel]="skillSearchQuery()"
                          (ngModelChange)="skillSearchQuery.set($event)"
                        />
                        <div class="options-list">
                          @for (skill of filteredSkills(); track skill.id) {
                            <label class="option-item">
                              <input 
                                type="checkbox" 
                                class="skill-checkbox"
                                [checked]="selectedSkills().includes(skill.id)" 
                                (change)="toggleSkillSelection(skill.id)"
                              />
                              <span class="checkbox-label">{{ skill.name }}</span>
                            </label>
                          } @empty {
                            <div class="no-options">No skills found</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="filter-actions-row">
                <span class="matching-count">
                  @if (loading()) {
                    Loading...
                  } @else {
                    {{ totalElements() }} matching employees found
                  }
                </span>
                <div class="btn-group">
                  <button class="btn btn-secondary" (click)="clearFilters()">Clear Filters</button>
                  <button class="btn btn-primary" (click)="applyFilters()">Apply Filters</button>
                </div>
              </div>
            </div>
          }

          <!-- Table Actions -->
          <div class="actions-panel">
            <div class="filters-group">
              <div class="search-input-wrapper">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  class="form-control search-input" 
                  placeholder="Search employees by name..." 
                  [(ngModel)]="searchQuery" 
                  (ngModelChange)="onSearchChange()"
                />
              </div>
            </div>
          </div>

          <!-- Employees Table -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading employees...</p>
            </div>
          } @else if (filteredEmployees().length === 0) {
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <h3>No employees found</h3>
              <p>No employees matched your criteria. Adjust your filters or search query.</p>
              @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                <button class="btn btn-secondary btn-sm mt-12" (click)="clearFilters()">Clear Filters</button>
              }
            </div>
          } @else {
            <div class="table-container animate-fade-in">
              <table class="dense-table" role="grid" aria-label="Employees List">
                <thead>
                  <tr>
                    <th scope="col">Employee Name</th>
                    <th scope="col">Role/Title</th>
                    <th scope="col">Department</th>
                    <th scope="col">Experience</th>
                    <th scope="col">Performance Rating</th>
                    <th scope="col" class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (emp of filteredEmployees(); track emp.id) {
                    <tr>
                      <td class="font-semibold">{{ emp.name }}</td>
                      <td>{{ emp.roleTitle }}</td>
                      <td>
                        <span class="dept-badge">{{ emp.department }}</span>
                      </td>
                      <td>{{ emp.experienceYears }} yrs</td>
                      <td>
                        <div class="rating-wrapper">
                          <svg class="star-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{{ emp.rating | number:'1.1-2' }}</span>
                        </div>
                      </td>
                      <td class="text-right">
                        <div class="actions-wrapper">
                          <button class="btn-action-icon" (click)="viewDetails(emp.id)" title="View Details" aria-label="View Details">
                            <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
                            <button class="btn-action-icon btn-delete-icon" (click)="deleteEmployee(emp.id)" title="Delete Employee" aria-label="Delete Employee">
                              <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            
            <!-- Simple Pagination Info -->
            <div class="pagination-footer">
              <span>Showing {{ filteredEmployees().length }} of {{ totalElements() }} records</span>
              <div class="pagination-actions">
                <button class="btn btn-secondary btn-sm" [disabled]="pageIndex() === 0" (click)="prevPage()">Prev</button>
                <span class="page-num">Page {{ pageIndex() + 1 }}</span>
                <button class="btn btn-secondary btn-sm" [disabled]="pageIndex() >= totalPages() - 1" (click)="nextPage()">Next</button>
              </div>
            </div>
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
      margin-bottom: 60px; /* offset bottom nav on mobile */
    }
    
    @media (min-width: 769px) {
      .content-wrapper {
        margin-bottom: 0;
      }
    }
    .main-content {
      padding: 32px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    .actions-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filters-group {
      display: flex;
      gap: 16px;
      flex-grow: 1;
      max-width: 600px;
      flex-wrap: wrap;
    }
    .search-input-wrapper {
      position: relative;
      flex-grow: 1;
      min-width: 200px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }
    .search-input {
      padding-left: 36px;
    }
    .select-wrapper {
      position: relative;
      min-width: 160px;
    }
    .select-dept {
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 16px;
      padding-right: 36px;
      appearance: none;
    }
    .font-semibold {
      font-weight: 600;
      color: var(--text-primary);
    }
    .dept-badge {
      background-color: rgba(2, 132, 199, 0.1);
      color: var(--secondary-light);
      border: 1px solid rgba(2, 132, 199, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .rating-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #fbbf24;
    }
    .star-icon {
      width: 16px;
      height: 16px;
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
    }
    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: var(--text-muted);
    }
    .empty-state h3 {
      color: var(--text-primary);
      margin-bottom: 8px;
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
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text-secondary);
      flex-wrap: wrap;
      gap: 12px;
    }
    .pagination-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-num {
      font-weight: 500;
      color: var(--text-primary);
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }
    .btn-action-icon {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: rgba(234, 88, 12, 0.1);
        border-color: var(--primary-accent);
        color: var(--primary-light);
      }
    }
    .btn-delete-icon {
      margin-left: 8px;
      &:hover {
        background-color: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #f87171;
      }
    }
    .action-svg {
      width: 16px;
      height: 16px;
    }
    .actions-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Filter section styles */
    .filters-card {
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .filters-grid-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-field label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .select-field {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 16px;
      padding-right: 36px;
    }
    .custom-multiselect {
      position: relative;
      width: 100%;
    }
    .select-btn {
      width: 100%;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 6px;
      padding: 10px 14px;
      height: 42px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
    }
    .btn-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-grow: 1;
    }
    .chevron-icon {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .chevron-icon.open {
      transform: rotate(180deg);
    }
    .skills-dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      margin-top: 4px;
      z-index: 100;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .search-skills-input {
      padding: 6px 10px;
      font-size: 13px;
      background-color: var(--bg-main);
      height: 32px;
    }
    .options-list {
      max-height: 160px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .option-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .option-item:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);
    }
    .skill-checkbox {
      cursor: pointer;
    }
    .checkbox-label {
      user-select: none;
    }
    .no-options {
      padding: 8px;
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
    }
    .filter-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }
    .matching-count {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .btn-group {
      display: flex;
      gap: 12px;
    }
    .mt-12 {
      margin-top: 12px;
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  // Signals
  readonly stats = signal<DashboardStats>({
    employeesCount: 0,
    skillsTrackedCount: 0,
    assessmentsThisMonthCount: 0
  });
  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(false);

  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageIndex = signal(0);

  // Filter bindings
  searchQuery = '';
  selectedDept = '';
  selectedRole = '';
  selectedExperience = '';
  selectedSkills = signal<string[]>([]);

  // Dropdown options
  departments = signal<string[]>([]);
  roles = signal<string[]>([]);
  allSkills = signal<Skill[]>([]);

  // Skill dropdown UI
  showSkillsDropdown = signal(false);
  skillSearchQuery = signal('');

  filteredSkills = computed(() => {
    const q = this.skillSearchQuery().toLowerCase().trim();
    if (!q) return this.allSkills();
    return this.allSkills().filter(s => s.name.toLowerCase().includes(q));
  });

  filteredEmployees = signal<Employee[]>([]);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showSkillsDropdown()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-multiselect')) {
        this.showSkillsDropdown.set(false);
      }
    }
  }

  ngOnInit() {
    this.loadStats();
    this.loadFilterOptions();
    this.loadEmployees();
  }

  loadStats() {
    this.employeeService.getDashboardStats().subscribe({
      next: (res) => this.stats.set(res),
      error: () => {}
    });
  }

  loadFilterOptions() {
    if (this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER') {
      this.employeeService.getDepartments().subscribe({
        next: (depts) => this.departments.set(depts)
      });
      this.employeeService.getRoles().subscribe({
        next: (rolesList) => this.roles.set(rolesList)
      });
      this.employeeService.getAllSkills().subscribe({
        next: (skillsList) => this.allSkills.set(skillsList)
      });
    }
  }

  getExperienceRange(): { min?: number, max?: number } {
    switch (this.selectedExperience) {
      case '0-2': return { min: 0, max: 2 };
      case '3-5': return { min: 3, max: 5 };
      case '6-10': return { min: 6, max: 10 };
      case '10+': return { min: 10, max: 100 };
      default: return {};
    }
  }

  loadEmployees() {
    this.loading.set(true);
    const exp = this.getExperienceRange();
    const isHrOrAdmin = this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER';

    this.employeeService.getEmployees(
      this.selectedDept,
      this.pageIndex(),
      10,
      isHrOrAdmin ? this.selectedRole : undefined,
      isHrOrAdmin ? exp.min : undefined,
      isHrOrAdmin ? exp.max : undefined,
      isHrOrAdmin ? this.selectedSkills() : undefined
    ).subscribe({
      next: (res) => {
        this.employees.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleSkillsDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showSkillsDropdown.update(v => !v);
  }

  toggleSkillSelection(skillId: string) {
    this.selectedSkills.update(current => {
      if (current.includes(skillId)) {
        return current.filter(id => id !== skillId);
      } else {
        return [...current, skillId];
      }
    });
  }

  getSkillsSelectLabel(): string {
    const selectedCount = this.selectedSkills().length;
    if (selectedCount === 0) return 'All Skills';
    if (selectedCount === 1) {
      const firstId = this.selectedSkills()[0];
      const s = this.allSkills().find(item => item.id === firstId);
      return s ? s.name : '1 skill selected';
    }
    return `${selectedCount} skills selected`;
  }

  applyFilters() {
    this.pageIndex.set(0);
    this.loadEmployees();
  }

  clearFilters() {
    this.selectedDept = '';
    this.selectedRole = '';
    this.selectedExperience = '';
    this.selectedSkills.set([]);
    this.searchQuery = '';
    this.pageIndex.set(0);
    this.loadEmployees();
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (q === '') {
      this.filteredEmployees.set(this.employees());
    } else {
      this.filteredEmployees.set(
        this.employees().filter(e => e.name.toLowerCase().includes(q))
      );
    }
  }

  onSearchChange() {
    this.applyFilter();
  }

  prevPage() {
    if (this.pageIndex() > 0) {
      this.pageIndex.update(i => i - 1);
      this.loadEmployees();
    }
  }

  nextPage() {
    if (this.pageIndex() < this.totalPages() - 1) {
      this.pageIndex.update(i => i + 1);
      this.loadEmployees();
    }
  }

  viewDetails(id: string) {
    this.router.navigate(['/employees', id]);
  }

  canAddEmployee(): boolean {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'HR_MANAGER';
  }

  onAddEmployeeStub() {
    this.notificationService.info(
      'Locked Feature',
      'Stub: Employee management features are reserved. Under our build order, Milestone 1 concentrates on skill profiles.'
    );
  }

  deleteEmployee(id: string) {
    this.confirmationService.confirm({
      title: 'Delete Employee?',
      message: 'Are you sure you want to delete this employee? This will also remove their credentials and access.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: () => {
            this.notificationService.success('Employee Deleted', 'Employee deleted successfully.');
            this.loadEmployees();
            this.loadStats();
          },
          error: () => {
            this.notificationService.error('Delete Failed', 'Failed to delete employee. Please try again.');
          }
        });
      }
    });
  }
}
