import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LearningService, LearningPath, Course } from '../learning.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';

@Component({
  selector: 'app-learning-path-list',
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
          title="Learning Paths" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          <div class="page-actions-row">
            <h2 class="section-title">Structured Learning Paths</h2>
            @if (isAdminOrManager()) {
              <button class="btn btn-primary" (click)="toggleForm()">
                {{ showForm() ? 'Close Form' : '+ Build Path' }}
              </button>
            }
          </div>

          <!-- Path Builder Form -->
          @if (showForm()) {
            <div class="form-card animate-fade-in">
              <h3>{{ editingPathId ? 'Modify Learning Pathway' : 'Design New Learning Pathway' }}</h3>
              <form (submit)="savePath()">
                <div class="form-group">
                  <label for="name">Pathway Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    class="form-control" 
                    [(ngModel)]="formPath.name" 
                    required 
                    placeholder="e.g. Cloud Native Architect"
                  />
                </div>
                <div class="form-group mt-12">
                  <label for="description">Pathway Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    class="form-control" 
                    [(ngModel)]="formPath.description" 
                    rows="3"
                    placeholder="Describe target audience and expected outcomes..."
                  ></textarea>
                </div>

                <!-- Course Sequencing Selector -->
                <div class="course-selector-box mt-16">
                  <div class="selector-column">
                    <h4>1. Choose Courses</h4>
                    <div class="courses-check-list">
                      @for (c of allCourses(); track c.id) {
                        <label class="check-item">
                          <input 
                            type="checkbox" 
                            [checked]="isCourseSelected(c.id!)"
                            (change)="toggleCourseSelection(c)"
                          />
                          <span>{{ c.title }} ({{ c.category }})</span>
                        </label>
                      }
                    </div>
                  </div>
                  
                  <div class="selector-column">
                    <h4>2. Curated Path Sequence</h4>
                    @if (selectedCoursesList.length === 0) {
                      <div class="empty-sequence">
                        <p>No courses added yet. Check courses on the left to set sequence.</p>
                      </div>
                    } @else {
                      <div class="selected-courses-list">
                        @for (sc of selectedCoursesList; track sc.id; let idx = $index) {
                          <div class="selected-course-row">
                            <span class="seq-num">#{{ idx + 1 }}</span>
                            <span class="course-lbl">{{ sc.title }}</span>
                            <div class="reorder-btns">
                              <button type="button" class="reorder-btn" (click)="moveUp(idx)" [disabled]="idx === 0">▲</button>
                              <button type="button" class="reorder-btn" (click)="moveDown(idx)" [disabled]="idx === selectedCoursesList.length - 1">▼</button>
                              <button type="button" class="remove-row-btn" (click)="removeCourse(idx)">✕</button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <div class="form-actions mt-16">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="cancelForm()">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-sm ml-8">{{ editingPathId ? 'Update Pathway' : 'Publish Pathway' }}</button>
                </div>
              </form>
            </div>
          }

          <!-- Paths Listing -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading curated pathways...</p>
            </div>
          } @else if (paths().length === 0) {
            <div class="empty-state">
              <h3>No pathways created</h3>
              <p>Check back later or contact a Training Manager to create paths.</p>
            </div>
          } @else {
            <div class="paths-stack animate-fade-in">
              @for (p of paths(); track p.id) {
                <div class="path-card">
                  <div class="path-header" (click)="togglePathDetail(p.id!)">
                    <div class="path-title-section">
                      <div class="toggle-arrow" [class.open]="isExpanded(p.id!)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                      <div>
                        <h3>{{ p.name }}</h3>
                        <p class="path-description-text">{{ p.description }}</p>
                      </div>
                    </div>
                    <div class="path-stats">
                      <span class="badge badge-purple">{{ p.courses?.length || 0 }} Courses</span>
                      <span class="badge badge-blue">{{ getPathTotalHours(p) }} Hrs Total</span>
                    </div>
                  </div>
                  
                  @if (isExpanded(p.id!)) {
                    <div class="path-content animate-fade-in">
                      <!-- Timeline of courses -->
                      <h4 class="timeline-title">Curriculum Timeline</h4>
                      @if (!p.courses || p.courses.length === 0) {
                        <p class="no-courses-notice">No courses assigned to this pathway catalog.</p>
                      } @else {
                        <div class="timeline">
                          @for (c of p.courses; track c.courseId; let first = $first; let last = $last) {
                            <div class="timeline-item">
                              <div class="timeline-badge">{{ c.sequenceOrder }}</div>
                              <div class="timeline-panel">
                                <div class="panel-header">
                                  <h5>{{ c.title }}</h5>
                                  <span class="badge" [class]="c.category.toLowerCase()">{{ c.category }}</span>
                                </div>
                                <p class="panel-meta">{{ c.durationHours }} hour study duration</p>
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <div class="path-footer mt-16">
                        <button class="btn btn-primary" (click)="enroll(p)">
                          Enroll in Pathway
                        </button>
                        
                        @if (isAdminOrManager()) {
                          <div class="path-management mt-12">
                            <button class="btn btn-secondary btn-sm" (click)="editPath(p)">Edit Pathway</button>
                            <button class="btn btn-danger btn-sm ml-8" (click)="deletePath(p.id!)">Delete</button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
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
    }
    .main-content {
      padding: 32px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    
    .page-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 22px;
      color: var(--text-primary);
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
    }

    /* Pathway Stack */
    .paths-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .path-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: border-color 0.3s ease;
      
      &:hover {
        border-color: var(--primary-accent);
      }
    }
    .path-header {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      flex-wrap: wrap;
      gap: 16px;
    }
    .path-title-section {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      max-width: 75%;
      
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        color: var(--text-primary);
        margin-bottom: 4px;
        font-weight: 600;
      }
    }
    .path-description-text {
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.5;
    }
    .toggle-arrow {
      width: 24px;
      height: 24px;
      color: var(--text-muted);
      transform: rotate(0);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &.open {
        transform: rotate(90deg);
        color: var(--primary-accent);
      }
    }
    .path-stats {
      display: flex;
      gap: 8px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      
      &.badge-purple {
        background-color: rgba(234, 88, 12, 0.12);
        color: var(--primary-light);
        border: 1px solid rgba(234, 88, 12, 0.2);
      }
      &.badge-blue {
        background-color: rgba(2, 132, 199, 0.12);
        color: var(--secondary-light);
        border: 1px solid rgba(2, 132, 199, 0.2);
      }
      &.technical {
        background-color: rgba(2, 132, 199, 0.12);
        color: var(--secondary-light);
      }
      &.domain {
        background-color: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
      }
      &.soft {
        background-color: rgba(236, 72, 153, 0.12);
        color: #f472b6;
      }
    }

    .path-content {
      padding: 0 24px 24px 24px;
      border-top: 1px solid var(--border-color);
      background-color: #121822;
    }
    .timeline-title {
      font-size: 14px;
      color: var(--text-primary);
      margin: 20px 0 16px 0;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .no-courses-notice {
      color: var(--text-muted);
      font-size: 13px;
      padding: 12px;
      background-color: var(--bg-card);
      border-radius: 8px;
      border: 1px dashed var(--border-color);
    }

    /* Curated timeline design */
    .timeline {
      position: relative;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      &::before {
        content: '';
        position: absolute;
        left: 9px;
        top: 10px;
        bottom: 10px;
        width: 2px;
        background-color: var(--border-color);
      }
    }
    .timeline-item {
      position: relative;
      display: flex;
      gap: 16px;
    }
    .timeline-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      flex-shrink: 0;
      margin-top: 10px;
      box-shadow: 0 0 8px rgba(234, 88, 12, 0.5);
    }
    .timeline-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 18px;
      flex-grow: 1;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      
      h5 {
        font-size: 14px;
        color: var(--text-primary);
        font-weight: 600;
      }
    }
    .panel-meta {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Path Builder Form & Course selector styling */
    .form-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
      box-shadow: 0 8px 16px -4px rgba(0,0,0,0.3);
      
      h3 {
        font-size: 16px;
        color: var(--text-primary);
        margin-bottom: 16px;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
      }
    }
    .form-control {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      
      &:focus {
        border-color: var(--primary-accent);
      }
    }
    
    .course-selector-box {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .course-selector-box {
        grid-template-columns: 1fr;
      }
    }
    .selector-column {
      padding: 16px;
      
      h4 {
        font-size: 12px;
        color: var(--text-primary);
        margin-bottom: 12px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 6px;
      }
      
      &:first-child {
        border-right: 1px solid var(--border-color);
      }
    }
    @media (max-width: 768px) {
      .selector-column:first-child {
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
    }
    .courses-check-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
      
      input {
        accent-color: var(--primary-accent);
        cursor: pointer;
      }
      
      &:hover {
        color: var(--text-primary);
      }
    }
    .empty-sequence {
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      border: 1px dashed var(--border-color);
      border-radius: 6px;
      padding: 12px;
    }
    .selected-courses-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .selected-course-row {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .seq-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary-accent);
    }
    .course-lbl {
      font-size: 13px;
      color: var(--text-primary);
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .reorder-btns {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .reorder-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      
      &:hover:not(:disabled) {
        color: var(--primary-accent);
        border-color: var(--primary-accent);
      }
      
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
    .remove-row-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 11px;
      cursor: pointer;
      padding: 4px;
      
      &:hover {
        color: #f87171;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .mt-12 { margin-top: 12px; }
    .mt-16 { margin-top: 16px; }
    .ml-8 { margin-left: 8px; }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-secondary);
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
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LearningPathListComponent implements OnInit {
  protected readonly learningService = inject(LearningService);
  protected readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly paths = signal<LearningPath[]>([]);
  readonly allCourses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly expandedPathId = signal<string | null>(null);

  // Form states
  formPath: LearningPath = {
    name: '',
    description: '',
    courseIds: []
  };
  selectedCoursesList: Course[] = [];
  editingPathId: string | null = null;

  ngOnInit() {
    this.loadPaths();
    this.loadAllCourses();
  }

  loadPaths() {
    this.loading.set(true);
    this.learningService.getLearningPaths().subscribe({
      next: (res) => {
        this.paths.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadAllCourses() {
    this.learningService.getAllCoursesList().subscribe({
      next: (res) => this.allCourses.set(res)
    });
  }

  getPathTotalHours(path: LearningPath): number {
    if (!path.courses) return 0;
    return path.courses.reduce((sum, c) => sum + c.durationHours, 0);
  }

  isAdminOrManager(): boolean {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'TRAINING_MANAGER';
  }

  togglePathDetail(id: string) {
    if (this.expandedPathId() === id) {
      this.expandedPathId.set(null);
    } else {
      this.expandedPathId.set(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedPathId() === id;
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formPath = {
      name: '',
      description: '',
      courseIds: []
    };
    this.selectedCoursesList = [];
    this.editingPathId = null;
  }

  isCourseSelected(id: string): boolean {
    return this.selectedCoursesList.some(c => c.id === id);
  }

  toggleCourseSelection(course: Course) {
    const index = this.selectedCoursesList.findIndex(c => c.id === course.id);
    if (index > -1) {
      this.selectedCoursesList.splice(index, 1);
    } else {
      this.selectedCoursesList.push(course);
    }
  }

  removeCourse(idx: number) {
    this.selectedCoursesList.splice(idx, 1);
  }

  moveUp(idx: number) {
    if (idx === 0) return;
    const temp = this.selectedCoursesList[idx];
    this.selectedCoursesList[idx] = this.selectedCoursesList[idx - 1];
    this.selectedCoursesList[idx - 1] = temp;
  }

  moveDown(idx: number) {
    if (idx === this.selectedCoursesList.length - 1) return;
    const temp = this.selectedCoursesList[idx];
    this.selectedCoursesList[idx] = this.selectedCoursesList[idx + 1];
    this.selectedCoursesList[idx + 1] = temp;
  }

  savePath() {
    this.formPath.courseIds = this.selectedCoursesList.map(c => c.id!);
    if (this.formPath.courseIds.length < 2) {
      this.notificationService.warning('Validation Error', 'A learning pathway must consist of at least two courses.');
      return;
    }
    
    if (this.editingPathId) {
      this.learningService.updateLearningPath(this.editingPathId, this.formPath).subscribe({
        next: () => {
          this.notificationService.success('Pathway Updated', 'Learning pathway updated successfully.');
          this.loadPaths();
          this.showForm.set(false);
          this.resetForm();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || "Failed to update learning path")
      });
    } else {
      this.learningService.createLearningPath(this.formPath).subscribe({
        next: () => {
          this.notificationService.success('Pathway Created', 'Learning pathway created successfully.');
          this.loadPaths();
          this.showForm.set(false);
          this.resetForm();
        },
        error: (err) => this.notificationService.error('Creation Failed', err.error?.message || "Failed to create learning path")
      });
    }
  }

  editPath(path: LearningPath) {
    this.editingPathId = path.id!;
    this.formPath = {
      name: path.name,
      description: path.description,
      courseIds: path.courseIds || []
    };
    
    // Build selected course list matching actual sequences
    this.selectedCoursesList = [];
    if (path.courses) {
      path.courses.forEach(pc => {
        const found = this.allCourses().find(c => c.id === pc.courseId);
        if (found) {
          this.selectedCoursesList.push(found);
        }
      });
    }
    
    this.showForm.set(true);
  }

  deletePath(id: string) {
    this.confirmationService.confirm({
      title: 'Delete Pathway?',
      message: 'Are you sure you want to delete this pathway? Courses inside it will remain untouched.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.learningService.deleteLearningPath(id).subscribe({
          next: () => {
            this.notificationService.success('Pathway Deleted', 'Learning pathway deleted successfully.');
            this.loadPaths();
          },
          error: () => this.notificationService.error('Delete Failed', 'Failed to delete learning path')
        });
      }
    });
  }

  enroll(path: LearningPath) {
    const empId = this.authService.employeeId();
    if (!empId) {
      this.notificationService.warning('Enrollment Failed', 'Only registered employees can enroll in learning paths.');
      return;
    }

    this.learningService.enroll(empId, null, path.id!).subscribe({
      next: () => {
        this.notificationService.success(
          'Enrolled Successfully',
          `Successfully enrolled in pathway: "${path.name}". Track progress on your Learning Dashboard.`
        );
      },
      error: (err) => this.notificationService.error('Enrollment Failed', err.error?.message || "Already enrolled or failed to register")
    });
  }

  cancelForm() {
    this.showForm.set(false);
    this.resetForm();
  }
}
