import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LearningApiService, LearningPathDTO, CourseDTO } from '../../../core/services/learning-api.service';

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Learning Paths</h1>
          <p class="page-subtitle">Structured journeys to guide employee development</p>
        </div>
        <button class="btn btn-primary" (click)="openDialog()">
          <span class="material-icons">add</span> Create Path
        </button>
      </div>

      <div *ngIf="loading()" class="empty-state">
        <div class="spinner" style="margin:0 auto"></div>
      </div>

      <div class="paths-grid" *ngIf="!loading()">
        <div *ngIf="paths().length===0" class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">route</span></div>
          <div class="empty-title">No learning paths yet</div>
          <div class="empty-desc">Create the first structured learning journey</div>
        </div>

        <div *ngFor="let path of paths(); let i=index"
             class="path-card card card--glow animate-fade-in-up"
             [style.animation-delay]="(i*60)+'ms'">
          <div class="path-card-header">
            <div class="path-icon">
              <span class="material-icons">route</span>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-secondary btn-sm btn-icon" (click)="openDialog(path)" title="Edit">
                <span class="material-icons" style="font-size:14px">edit</span>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" (click)="deletePath(path)" title="Delete">
                <span class="material-icons" style="font-size:14px">delete_outline</span>
              </button>
            </div>
          </div>
          <h4 class="path-title">{{ path.name }}</h4>
          <p class="text-muted" style="font-size:0.8125rem; line-height:1.5" *ngIf="path.description">{{ path.description }}</p>
          <div *ngIf="path.targetRole" class="path-meta">
            <span class="badge badge-primary">
              <span class="material-icons" style="font-size:12px">badge</span>
              {{ path.targetRole }}
            </span>
          </div>
          <div class="path-courses" *ngIf="path.courses && path.courses.length">
            <div class="path-courses-label text-muted">{{ path.courses.length }} course(s)</div>
            <div class="courses-list">
              <span *ngFor="let c of path.courses | slice:0:3" class="course-chip">{{ c.title }}</span>
              <span *ngIf="(path.courses.length ?? 0) > 3" class="badge badge-muted">+{{ path.courses.length - 3 }} more</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <div *ngIf="showDialog()" class="dialog-overlay" (click)="showDialog.set(false)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>{{ editMode() ? 'Edit Learning Path' : 'Create Learning Path' }}</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
        <div class="form-group">
          <label class="form-label">Path Name *</label>
          <input class="form-control" [(ngModel)]="form.name" placeholder="e.g. Full Stack Developer Path" />
        </div>
        <div class="form-group">
          <label class="form-label">Target Role</label>
          <input class="form-control" [(ngModel)]="form.targetRole" placeholder="e.g. Senior Developer" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" [(ngModel)]="form.description" rows="3" placeholder="Path description..."></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="savePath()" [disabled]="saving() || !form.name">
            <span *ngIf="saving()" class="spinner" style="width:14px;height:14px"></span>
            {{ saving() ? 'Saving...' : (editMode() ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .paths-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px,1fr));
      gap: var(--space-md);
    }
    .path-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .path-card-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .path-icon {
      width: 42px; height: 42px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1));
      display: flex; align-items: center; justify-content: center;
      .material-icons { color: var(--color-primary); font-size: 20px; }
    }
    .path-title { font-size: 1rem; font-weight: 600; }
    .path-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .path-courses-label { font-size: 0.75rem; margin-bottom: 6px; }
    .courses-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .course-chip {
      padding: 3px 10px; border-radius: var(--radius-full);
      background: var(--bg-surface-2); border: 1px solid var(--border-subtle);
      font-size: 0.6875rem; color: var(--text-secondary);
    }
    textarea.form-control { resize: vertical; }
  `]
})
export class LearningPathsComponent implements OnInit {
  paths = signal<LearningPathDTO[]>([]);
  loading = signal(true);
  showDialog = signal(false);
  editMode = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  form: LearningPathDTO = { name: '', description: '', targetRole: '' };

  constructor(private learningApi: LearningApiService) {}
  ngOnInit(): void { this.loadPaths(); }

  loadPaths(): void {
    this.loading.set(true);
    this.learningApi.getLearningPaths().subscribe({
      next: (data) => { this.paths.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openDialog(path?: LearningPathDTO): void {
    this.form = path ? { ...path } : { name: '', description: '', targetRole: '' };
    this.editMode.set(!!path);
    this.error.set(null);
    this.showDialog.set(true);
  }

  savePath(): void {
    this.saving.set(true);
    const obs = this.editMode() && this.form.id
      ? this.learningApi.updateLearningPath(this.form.id, this.form)
      : this.learningApi.createLearningPath(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showDialog.set(false); this.loadPaths(); },
      error: (err) => { this.saving.set(false); this.error.set(err.error?.message ?? 'Error saving path'); }
    });
  }

  deletePath(path: LearningPathDTO): void {
    if (!confirm(`Delete "${path.name}"?`)) return;
    this.learningApi.deleteLearningPath(path.id!).subscribe(() => this.loadPaths());
  }
}
