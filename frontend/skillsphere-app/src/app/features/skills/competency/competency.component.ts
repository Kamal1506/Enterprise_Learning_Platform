import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillApiService, CompetencyFrameworkDTO, SkillGapDTO } from '../../../core/services/skill-api.service';

@Component({
  selector: 'app-competency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Competency Frameworks</h1>
          <p class="page-subtitle">View required skill levels per role and identify gaps</p>
        </div>
      </div>

      <!-- Role Filter -->
      <div class="filter-row">
        <div class="search-bar" style="flex:1; max-width:340px">
          <span class="material-icons">badge</span>
          <input placeholder="Filter by role (e.g. Developer, Manager)..." [(ngModel)]="roleFilter" (input)="loadFrameworks()" />
        </div>
        <button class="btn btn-secondary" (click)="roleFilter=''; loadFrameworks()">
          <span class="material-icons">clear</span> Clear
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="empty-state">
        <div class="spinner" style="margin:0 auto"></div>
      </div>

      <!-- Frameworks -->
      <div *ngIf="!loading()">
        <div *ngIf="frameworks().length===0" class="empty-state">
          <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">verified</span></div>
          <div class="empty-title">No competency frameworks found</div>
          <div class="empty-desc">Try a different role filter</div>
        </div>

        <!-- Group by role -->
        <ng-container *ngFor="let roleGroup of groupedFrameworks()">
          <div class="role-section">
            <div class="role-header">
              <span class="material-icons role-icon">badge</span>
              <h3>{{ roleGroup.role }}</h3>
              <span class="badge badge-muted">{{ roleGroup.items.length }} skills</span>
            </div>
            <div class="framework-grid">
              <div *ngFor="let fw of roleGroup.items" class="fw-card card">
                <div class="fw-card-header">
                  <span class="badge badge-accent">{{ fw.skillName }}</span>
                  <span class="badge badge-primary">Required: {{ fw.requiredProficiency }}/5</span>
                </div>
                <div class="progress-bar-container" style="margin-top:10px">
                  <div class="progress-bar-fill" [style.width]="(fw.requiredProficiency/5*100)+'%'"></div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .role-section { margin-bottom: 32px; }
    .role-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
      h3 { font-size: 1.0625rem; }
    }
    .role-icon { color: var(--color-primary); }
    .framework-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
      gap: 12px;
    }
    .fw-card { padding: 14px; }
    .fw-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .progress-bar-container { height: 6px; background: var(--bg-surface-3); border-radius: 9999px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); border-radius: 9999px; }
  `]
})
export class CompetencyComponent implements OnInit {
  frameworks = signal<CompetencyFrameworkDTO[]>([]);
  loading = signal(true);
  roleFilter = '';
  groupedFrameworks = signal<{ role: string; items: CompetencyFrameworkDTO[] }[]>([]);

  constructor(private skillApi: SkillApiService) {}

  ngOnInit(): void { this.loadFrameworks(); }

  loadFrameworks(): void {
    this.loading.set(true);
    this.skillApi.getCompetencyFrameworks(this.roleFilter || undefined).subscribe({
      next: (data) => {
        this.frameworks.set(data);
        const map = new Map<string, CompetencyFrameworkDTO[]>();
        data.forEach(fw => {
          if (!map.has(fw.role)) map.set(fw.role, []);
          map.get(fw.role)!.push(fw);
        });
        this.groupedFrameworks.set([...map.entries()].map(([role, items]) => ({ role, items })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
