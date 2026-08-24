import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SkillApiService, EmployeeDTO, PageResponse } from '../../../core/services/skill-api.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Employees</h1>
          <p class="page-subtitle">{{ totalElements() }} employees across all departments</p>
        </div>
        <button class="btn btn-primary" (click)="openDialog()">
          <span class="material-icons">person_add</span>
          Add Employee
        </button>
      </div>

      <!-- Filter Row -->
      <div class="filter-row">
        <div class="search-bar" style="flex:1; max-width:340px">
          <span class="material-icons">search</span>
          <input placeholder="Search employees..." [(ngModel)]="searchText" (input)="onSearch()" />
        </div>
        <select class="form-control" style="width:200px" [(ngModel)]="departmentFilter" (change)="loadEmployees(0)">
          <option value="">All Departments</option>
          <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0; overflow:hidden">
        <div class="table-container" style="border:none; border-radius:0">

          <div *ngIf="loading()" class="empty-state">
            <div class="spinner" style="margin:0 auto"></div>
          </div>

          <table class="data-table" *ngIf="!loading()">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Experience</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="employees().length === 0">
                <td colspan="7">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <span class="material-icons" style="font-size:3rem; opacity:0.3">people_outline</span>
                    </div>
                    <div class="empty-title">No employees found</div>
                    <div class="empty-desc">Try adjusting your filters</div>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let emp of employees()">
                <td>
                  <div class="employee-name">
                    <div class="emp-avatar">{{ emp.name.slice(0,2).toUpperCase() }}</div>
                    <a [routerLink]="['/employees', emp.id]" class="emp-link">{{ emp.name }}</a>
                  </div>
                </td>
                <td class="text-secondary">{{ emp.email }}</td>
                <td><span class="badge badge-primary">{{ emp.department }}</span></td>
                <td class="text-secondary">{{ emp.roleTitle }}</td>
                <td>
                  <span class="badge badge-muted">{{ emp.experienceYears }} yr{{ emp.experienceYears !== 1 ? 's' : '' }}</span>
                </td>
                <td>
                  <div class="rating">
                    <span class="material-icons" style="font-size:14px; color: var(--color-warning)">star</span>
                    <span>{{ emp.rating }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex gap-sm">
                    <a [routerLink]="['/employees', emp.id]" class="btn btn-secondary btn-sm btn-icon" title="View Details">
                      <span class="material-icons" style="font-size:16px">visibility</span>
                    </a>
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="openDialog(emp)" title="Edit">
                      <span class="material-icons" style="font-size:16px">edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-icon" (click)="deleteEmployee(emp)" title="Delete">
                      <span class="material-icons" style="font-size:16px">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" style="padding: 12px 16px" *ngIf="totalPages() > 1">
          <button class="page-btn" (click)="loadEmployees(currentPage()-1)" [disabled]="currentPage()===0">
            <span class="material-icons" style="font-size:16px">chevron_left</span>
          </button>
          <span>Page {{ currentPage()+1 }} of {{ totalPages() }}</span>
          <button class="page-btn" (click)="loadEmployees(currentPage()+1)" [disabled]="currentPage()>=totalPages()-1">
            <span class="material-icons" style="font-size:16px">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <div *ngIf="showDialog()" class="dialog-overlay" (click)="closeDialog($event)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>{{ editMode() ? 'Edit Employee' : 'Add New Employee' }}</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>

        <div *ngIf="dialogError()" class="alert alert-error">{{ dialogError() }}</div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input class="form-control" [(ngModel)]="form.name" placeholder="John Doe" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-control" type="email" [(ngModel)]="form.email" placeholder="john@company.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Department *</label>
            <input class="form-control" [(ngModel)]="form.department" placeholder="Engineering" required />
          </div>
          <div class="form-group">
            <label class="form-label">Role Title *</label>
            <input class="form-control" [(ngModel)]="form.roleTitle" placeholder="Senior Developer" required />
          </div>
          <div class="form-group">
            <label class="form-label">Experience (years) *</label>
            <input class="form-control" type="number" [(ngModel)]="form.experienceYears" min="0" max="50" />
          </div>
          <div class="form-group">
            <label class="form-label">Rating (0–5) *</label>
            <input class="form-control" type="number" [(ngModel)]="form.rating" min="0" max="5" step="0.1" />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="saveEmployee()" [disabled]="saving()">
            <span *ngIf="saving()" class="spinner" style="width:14px;height:14px"></span>
            {{ saving() ? 'Saving...' : (editMode() ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employee-name { display: flex; align-items: center; gap: 10px; }
    .emp-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 600; flex-shrink: 0;
    }
    .emp-link { color: var(--text-primary); font-weight: 500; &:hover { color: var(--color-primary); } }
    .rating { display: flex; align-items: center; gap: 4px; font-weight: 500; }
  `]
})
export class EmployeesComponent implements OnInit {
  employees = signal<EmployeeDTO[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  loading = signal(true);
  showDialog = signal(false);
  editMode = signal(false);
  saving = signal(false);
  dialogError = signal<string | null>(null);
  searchText = '';
  departmentFilter = '';

  readonly departments = ['Engineering', 'Product', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales'];

  form: EmployeeDTO = this.emptyForm();

  constructor(private skillApi: SkillApiService) {}

  ngOnInit(): void { this.loadEmployees(0); }

  loadEmployees(page: number): void {
    this.loading.set(true);
    this.skillApi.getEmployees(this.departmentFilter || undefined, page).subscribe({
      next: (res) => {
        this.employees.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void { /* local filter or trigger API search */ }

  openDialog(emp?: EmployeeDTO): void {
    this.form = emp ? { ...emp } : this.emptyForm();
    this.editMode.set(!!emp);
    this.dialogError.set(null);
    this.showDialog.set(true);
  }

  closeDialog(e: Event): void { this.showDialog.set(false); }

  saveEmployee(): void {
    this.saving.set(true);
    const obs = this.editMode() && this.form.id
      ? this.skillApi.updateEmployee(this.form.id, this.form)
      : this.skillApi.createEmployee(this.form);

    obs.subscribe({
      next: () => { this.saving.set(false); this.showDialog.set(false); this.loadEmployees(this.currentPage()); },
      error: (err) => { this.saving.set(false); this.dialogError.set(err.error?.message ?? 'Error saving employee'); }
    });
  }

  deleteEmployee(emp: EmployeeDTO): void {
    if (!confirm(`Delete ${emp.name}?`)) return;
    this.skillApi.deleteEmployee(emp.id!).subscribe(() => this.loadEmployees(this.currentPage()));
  }

  private emptyForm(): EmployeeDTO {
    return { name: '', email: '', roleTitle: '', department: '', experienceYears: 0, rating: 3 };
  }
}
