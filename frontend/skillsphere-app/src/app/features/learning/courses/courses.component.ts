import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LearningApiService, CourseDTO, PageResponse } from '../../../core/services/learning-api.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Course Catalog</h1>
          <p class="page-subtitle">{{ totalElements() }} courses available</p>
        </div>
        <button class="btn btn-primary" (click)="openDialog()">
          <span class="material-icons">add</span> Add Course
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <div class="search-bar" style="flex:1; max-width:340px">
          <span class="material-icons">search</span>
          <input placeholder="Search courses..." [(ngModel)]="search" (input)="onSearch()" />
        </div>
        <select class="form-control" style="width:180px" [(ngModel)]="categoryFilter" (change)="loadCourses(0)">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <select class="form-control" style="width:160px" [(ngModel)]="typeFilter" (change)="loadCourses(0)">
          <option value="">All Types</option>
          <option value="ONLINE">Online</option>
          <option value="CLASSROOM">Classroom</option>
          <option value="BLENDED">Blended</option>
          <option value="SELF_PACED">Self-paced</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="courses-grid">
        <div *ngFor="let _ of [1,2,3,4,6]" class="course-card skeleton" style="height:200px"></div>
      </div>

      <!-- Courses Grid -->
      <div class="courses-grid" *ngIf="!loading()">
        <div *ngIf="courses().length===0" class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">school</span></div>
          <div class="empty-title">No courses found</div>
        </div>

        <div *ngFor="let course of courses(); let i=index"
             class="course-card card card--glow animate-fade-in-up"
             [style.animation-delay]="(i*50)+'ms'">
          <div class="course-header">
            <div class="course-type-icon" [class]="'type-'+course.type?.toLowerCase()">
              <span class="material-icons">{{ getTypeIcon(course.type) }}</span>
            </div>
            <div class="flex gap-sm">
              <span class="badge badge-muted">{{ course.type }}</span>
              <span class="badge badge-primary">{{ course.category }}</span>
            </div>
          </div>
          <h4 class="course-title">{{ course.title }}</h4>
          <p class="course-desc text-muted" *ngIf="course.description">{{ course.description | slice:0:100 }}{{ (course.description?.length ?? 0) > 100 ? '...' : '' }}</p>
          <div class="course-meta">
            <span *ngIf="course.durationHours" class="meta-item">
              <span class="material-icons">schedule</span>
              {{ course.durationHours }}h
            </span>
            <span *ngIf="course.provider" class="meta-item">
              <span class="material-icons">business</span>
              {{ course.provider }}
            </span>
          </div>
          <div class="course-actions">
            <button class="btn btn-secondary btn-sm" (click)="openDialog(course)">
              <span class="material-icons" style="font-size:14px">edit</span> Edit
            </button>
            <button class="btn btn-danger btn-sm" (click)="deleteCourse(course)">
              <span class="material-icons" style="font-size:14px">delete_outline</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages()>1">
        <button class="page-btn" [disabled]="currentPage()===0" (click)="loadCourses(currentPage()-1)">
          <span class="material-icons" style="font-size:16px">chevron_left</span>
        </button>
        <span>Page {{ currentPage()+1 }} of {{ totalPages() }}</span>
        <button class="page-btn" [disabled]="currentPage()>=totalPages()-1" (click)="loadCourses(currentPage()+1)">
          <span class="material-icons" style="font-size:16px">chevron_right</span>
        </button>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <div *ngIf="showDialog()" class="dialog-overlay" (click)="closeDialog($event)">
      <div class="dialog-panel" (click)="$event.stopPropagation()" style="max-width:580px">
        <div class="dialog-header">
          <h3>{{ editMode() ? 'Edit Course' : 'Add New Course' }}</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div *ngIf="dialogError()" class="alert alert-error">{{ dialogError() }}</div>

        <div class="form-group">
          <label class="form-label">Title *</label>
          <input class="form-control" [(ngModel)]="form.title" placeholder="Course title" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-control" [(ngModel)]="form.category">
              <option value="">Select...</option>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Type *</label>
            <select class="form-control" [(ngModel)]="form.type">
              <option value="">Select...</option>
              <option value="ONLINE">Online</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="BLENDED">Blended</option>
              <option value="SELF_PACED">Self-paced</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Duration (hours)</label>
            <input class="form-control" type="number" [(ngModel)]="form.durationHours" min="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Provider</label>
            <input class="form-control" [(ngModel)]="form.provider" placeholder="e.g. Coursera, Internal" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" [(ngModel)]="form.description" rows="3" placeholder="Course description..."></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="saveCourse()" [disabled]="saving() || !form.title || !form.category || !form.type">
            <span *ngIf="saving()" class="spinner" style="width:14px;height:14px"></span>
            {{ saving() ? 'Saving...' : (editMode() ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px,1fr));
      gap: var(--space-md);
    }
    .course-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .course-header { display: flex; align-items: center; justify-content: space-between; }
    .course-type-icon {
      width: 38px; height: 38px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      .material-icons { font-size: 18px; }
    }
    .type-online     { background: rgba(16,185,129,0.12); .material-icons { color: var(--color-success); } }
    .type-classroom  { background: rgba(108,99,255,0.12); .material-icons { color: var(--color-primary); } }
    .type-blended    { background: rgba(0,212,255,0.1);   .material-icons { color: var(--color-accent); } }
    .type-self_paced { background: rgba(245,158,11,0.12); .material-icons { color: var(--color-warning); } }

    .course-title { font-size: 0.9375rem; font-weight: 600; }
    .course-desc  { font-size: 0.8125rem; line-height: 1.5; flex: 1; }
    .course-meta  { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-item    { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); .material-icons { font-size: 14px; } }
    .course-actions { display: flex; gap: 8px; margin-top: auto; }
    textarea.form-control { resize: vertical; }
  `]
})
export class CoursesComponent implements OnInit {
  courses = signal<CourseDTO[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  loading = signal(true);
  showDialog = signal(false);
  editMode = signal(false);
  saving = signal(false);
  dialogError = signal<string | null>(null);
  search = '';
  categoryFilter = '';
  typeFilter = '';

  readonly categories = ['Technical', 'Leadership', 'Compliance', 'Soft Skills', 'Domain', 'Safety', 'Product', 'Design'];

  form: CourseDTO = this.emptyForm();

  constructor(private learningApi: LearningApiService) {}
  ngOnInit(): void { this.loadCourses(0); }

  loadCourses(page: number): void {
    this.loading.set(true);
    this.learningApi.getCourses({
      category: this.categoryFilter || undefined,
      type: this.typeFilter || undefined,
      search: this.search || undefined,
      page
    }).subscribe({
      next: (res) => {
        this.courses.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    if (this.search.length >= 2 || this.search.length === 0) this.loadCourses(0);
  }

  openDialog(course?: CourseDTO): void {
    this.form = course ? { ...course } : this.emptyForm();
    this.editMode.set(!!course);
    this.dialogError.set(null);
    this.showDialog.set(true);
  }

  closeDialog(e: Event): void { this.showDialog.set(false); }

  saveCourse(): void {
    this.saving.set(true);
    const obs = this.editMode() && this.form.id
      ? this.learningApi.updateCourse(this.form.id, this.form)
      : this.learningApi.createCourse(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showDialog.set(false); this.loadCourses(this.currentPage()); },
      error: (err) => { this.saving.set(false); this.dialogError.set(err.error?.message ?? 'Error saving course'); }
    });
  }

  deleteCourse(course: CourseDTO): void {
    if (!confirm(`Delete "${course.title}"?`)) return;
    this.learningApi.deleteCourse(course.id!).subscribe(() => this.loadCourses(this.currentPage()));
  }

  getTypeIcon(type?: string): string {
    const m: Record<string,string> = { ONLINE:'wifi', CLASSROOM:'business', BLENDED:'merge_type', SELF_PACED:'play_circle' };
    return m[type ?? ''] ?? 'school';
  }

  private emptyForm(): CourseDTO { return { title: '', category: '', type: '', description: '', durationHours: 0, provider: '' }; }
}
