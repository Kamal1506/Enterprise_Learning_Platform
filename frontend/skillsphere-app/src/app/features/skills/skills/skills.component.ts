import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillApiService, SkillDTO } from '../../../core/services/skill-api.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Skills Directory</h1>
          <p class="page-subtitle">{{ skills().length }} skills across all categories</p>
        </div>
        <button class="btn btn-primary" (click)="showDialog.set(true)">
          <span class="material-icons">add</span> Add Skill
        </button>
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <div class="search-bar" style="flex:1; max-width:340px">
          <span class="material-icons">search</span>
          <input placeholder="Search skills..." [(ngModel)]="search" />
        </div>
        <div class="flex gap-sm flex-wrap">
          <button *ngFor="let cat of categories"
                  class="chip" [class.active]="filterCat===cat"
                  (click)="filterCat = filterCat===cat?'':cat">{{ cat }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="empty-state">
        <div class="spinner" style="margin:0 auto"></div>
      </div>

      <!-- Skills Grid -->
      <div class="skills-catalog-grid" *ngIf="!loading()">
        <div *ngFor="let skill of filteredSkills()" class="skill-card card card--glow">
          <div class="skill-card-top">
            <div class="skill-icon">
              <span class="material-icons">{{ getCategoryIcon(skill.category) }}</span>
            </div>
            <span class="badge" [class]="getCategoryBadge(skill.category)">{{ skill.category }}</span>
          </div>
          <h4 class="skill-name">{{ skill.name }}</h4>
          <p class="skill-desc text-muted" *ngIf="skill.description">{{ skill.description }}</p>
        </div>

        <div *ngIf="filteredSkills().length===0" class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">psychology_alt</span></div>
          <div class="empty-title">No skills found</div>
        </div>
      </div>
    </div>

    <!-- Add Skill Dialog -->
    <div *ngIf="showDialog()" class="dialog-overlay" (click)="showDialog.set(false)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>Add New Skill</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
        <div class="form-group">
          <label class="form-label">Skill Name *</label>
          <input class="form-control" [(ngModel)]="form.name" placeholder="e.g., Angular, Docker, SQL..." />
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <select class="form-control" [(ngModel)]="form.category">
            <option value="">Select category</option>
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" [(ngModel)]="form.description" rows="2" placeholder="Brief description..."></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="createSkill()" [disabled]="saving() || !form.name || !form.category">
            <span *ngIf="saving()" class="spinner" style="width:14px;height:14px"></span>
            {{ saving() ? 'Creating...' : 'Create Skill' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skills-catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-md);
    }
    .skill-card { padding: 20px; }
    .skill-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .skill-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      background: rgba(108,99,255,0.12);
      display: flex; align-items: center; justify-content: center;
      .material-icons { color: var(--color-primary); font-size: 20px; }
    }
    .skill-name { font-size: 0.9375rem; font-weight: 600; margin-bottom: 6px; }
    .skill-desc { font-size: 0.8125rem; line-height: 1.5; }
    textarea.form-control { resize: vertical; }
  `]
})
export class SkillsComponent implements OnInit {
  skills = signal<SkillDTO[]>([]);
  loading = signal(true);
  showDialog = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  search = '';
  filterCat = '';

  form: SkillDTO = { name: '', category: '', description: '' };

  readonly categories = ['Technical', 'Soft Skills', 'Leadership', 'Domain', 'Tools', 'Language', 'Cloud', 'Security', 'Data'];

  filteredSkills = signal<SkillDTO[]>([]);

  constructor(private skillApi: SkillApiService) {}

  ngOnInit(): void {
    this.skillApi.getSkills().subscribe({
      next: (data) => { this.skills.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter(): void {
    this.filteredSkills.set(
      this.skills().filter(s =>
        (!this.search || s.name.toLowerCase().includes(this.search.toLowerCase())) &&
        (!this.filterCat || s.category === this.filterCat)
      )
    );
  }

  createSkill(): void {
    this.saving.set(true); this.error.set(null);
    this.skillApi.createSkill(this.form).subscribe({
      next: (s) => {
        this.skills.update(list => [...list, s]);
        this.applyFilter();
        this.saving.set(false);
        this.showDialog.set(false);
        this.form = { name: '', category: '', description: '' };
      },
      error: (err) => { this.saving.set(false); this.error.set(err.error?.message ?? 'Error creating skill'); }
    });
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string,string> = {
      Technical:'code', 'Soft Skills':'sentiment_satisfied', Leadership:'stars',
      Domain:'business', Tools:'build', Language:'translate', Cloud:'cloud',
      Security:'security', Data:'analytics'
    };
    return map[cat] ?? 'psychology';
  }

  getCategoryBadge(cat: string): string {
    const map: Record<string,string> = {
      Technical:'badge-accent', 'Soft Skills':'badge-success', Leadership:'badge-warning',
      Domain:'badge-primary', Cloud:'badge-info', Security:'badge-danger',
    };
    return map[cat] ?? 'badge-muted';
  }
}
