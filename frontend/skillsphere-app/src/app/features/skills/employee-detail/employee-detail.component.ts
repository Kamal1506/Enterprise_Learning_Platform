import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SkillApiService, EmployeeDTO, EmployeeSkillDTO, AssessmentDTO, SkillGapDTO, SkillDTO, MapSkillRequest, AssessmentRequest } from '../../../core/services/skill-api.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container animate-fade-in">

      <!-- Back -->
      <a routerLink="/employees" class="back-link">
        <span class="material-icons">arrow_back</span> Back to Employees
      </a>

      <!-- Loading -->
      <div *ngIf="loading()" class="empty-state" style="margin-top:40px">
        <div class="spinner" style="margin:0 auto"></div>
      </div>

      <ng-container *ngIf="!loading() && employee()">
        <!-- Profile Header -->
        <div class="profile-header card" style="margin-top:16px">
          <div class="profile-avatar-lg">{{ employee()!.name.slice(0,2).toUpperCase() }}</div>
          <div class="profile-info">
            <h2>{{ employee()!.name }}</h2>
            <p class="text-secondary">{{ employee()!.roleTitle }}</p>
            <div class="profile-meta">
              <span class="badge badge-primary">{{ employee()!.department }}</span>
              <span class="badge badge-muted">
                <span class="material-icons" style="font-size:12px">work</span>
                {{ employee()!.experienceYears }} years
              </span>
              <span class="badge badge-warning">
                <span class="material-icons" style="font-size:12px">star</span>
                {{ employee()!.rating }}
              </span>
              <span class="text-secondary" style="font-size:0.8125rem">{{ employee()!.email }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" style="margin-top:24px">
          <button *ngFor="let tab of tabs" class="tab-btn" [class.active]="activeTab()===tab.id" (click)="activeTab.set(tab.id)">
            <span class="material-icons">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Skills Tab -->
        <div *ngIf="activeTab()==='skills'" class="tab-content animate-fade-in">
          <div class="section-toolbar">
            <h3>Mapped Skills</h3>
            <button class="btn btn-primary btn-sm" (click)="showSkillDialog.set(true)">
              <span class="material-icons">add</span> Map Skill
            </button>
          </div>
          <div class="skills-grid">
            <div *ngFor="let es of employeeSkills()" class="skill-tile card">
              <div class="skill-tile-header">
                <span class="badge badge-accent">{{ es.skillName }}</span>
                <span class="badge badge-muted">Level {{ es.proficiencyLevel }}/5</span>
              </div>
              <div class="progress-bar-container" style="margin-top:10px">
                <div class="progress-bar-fill" [style.width]="(es.proficiencyLevel/5*100)+'%'"></div>
              </div>
              <div class="text-muted" style="font-size:0.75rem; margin-top:6px">
                Last assessed: {{ es.lastAssessedAt ? (es.lastAssessedAt | date:'mediumDate') : 'N/A' }}
              </div>
            </div>
            <div *ngIf="employeeSkills().length===0" class="empty-state" style="padding:32px">
              <div class="empty-title">No skills mapped yet</div>
            </div>
          </div>
        </div>

        <!-- Assessments Tab -->
        <div *ngIf="activeTab()==='assessments'" class="tab-content animate-fade-in">
          <div class="section-toolbar">
            <h3>Assessments</h3>
            <button class="btn btn-primary btn-sm" (click)="showAssessDialog.set(true)">
              <span class="material-icons">add</span> New Assessment
            </button>
          </div>
          <div class="card" style="padding:0; overflow:hidden">
            <table class="data-table">
              <thead><tr><th>Skill</th><th>Score</th><th>Assessor</th><th>Notes</th><th>Date</th></tr></thead>
              <tbody>
                <tr *ngIf="assessments().length===0"><td colspan="5">
                  <div class="empty-state" style="padding:24px">
                    <div class="empty-title">No assessments yet</div>
                  </div>
                </td></tr>
                <tr *ngFor="let a of assessments()">
                  <td><span class="badge badge-accent">{{ a.skillName }}</span></td>
                  <td>
                    <div class="score-bar">
                      <div class="score-fill" [style.width]="a.score+'%'"
                           [style.background]="a.score>=75?'var(--color-success)':a.score>=50?'var(--color-warning)':'var(--color-danger)'"></div>
                      <span>{{ a.score }}%</span>
                    </div>
                  </td>
                  <td class="text-secondary">{{ a.assessorName }}</td>
                  <td class="text-muted">{{ a.notes || '—' }}</td>
                  <td class="text-muted">{{ a.assessedAt | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Skill Gaps Tab -->
        <div *ngIf="activeTab()==='gaps'" class="tab-content animate-fade-in">
          <div class="section-toolbar"><h3>Skill Gap Analysis</h3></div>
          <div class="gaps-list">
            <div *ngIf="skillGaps().length===0" class="empty-state">
              <div class="empty-icon"><span class="material-icons" style="font-size:3rem;opacity:0.3">verified</span></div>
              <div class="empty-title">No skill gaps detected</div>
              <div class="empty-desc">This employee meets all competency requirements</div>
            </div>
            <div *ngFor="let gap of skillGaps()" class="gap-card card">
              <div class="gap-header">
                <span class="badge badge-accent">{{ gap.skillName }}</span>
                <span class="badge badge-danger">Gap: {{ gap.gap }}</span>
              </div>
              <div class="gap-bars">
                <div class="gap-row">
                  <span class="gap-label text-muted">Current</span>
                  <div class="progress-bar-container" style="flex:1">
                    <div class="progress-bar-fill" [style.width]="(gap.current/5*100)+'%'" style="background: var(--color-warning)"></div>
                  </div>
                  <span class="gap-val">{{ gap.current }}/5</span>
                </div>
                <div class="gap-row">
                  <span class="gap-label text-muted">Required</span>
                  <div class="progress-bar-container" style="flex:1">
                    <div class="progress-bar-fill" [style.width]="(gap.required/5*100)+'%'" style="background: var(--color-primary)"></div>
                  </div>
                  <span class="gap-val">{{ gap.required }}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- Map Skill Dialog -->
    <div *ngIf="showSkillDialog()" class="dialog-overlay" (click)="showSkillDialog.set(false)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>Map Skill</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showSkillDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Skill</label>
          <select class="form-control" [(ngModel)]="skillForm.skillId">
            <option value="">Select skill...</option>
            <option *ngFor="let s of allSkills()" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Proficiency Level (1-5)</label>
          <input class="form-control" type="number" [(ngModel)]="skillForm.proficiencyLevel" min="1" max="5"/>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showSkillDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="mapSkill()" [disabled]="!skillForm.skillId">Map Skill</button>
        </div>
      </div>
    </div>

    <!-- Assessment Dialog -->
    <div *ngIf="showAssessDialog()" class="dialog-overlay" (click)="showAssessDialog.set(false)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>New Assessment</h3>
          <button class="btn btn-secondary btn-sm btn-icon" (click)="showAssessDialog.set(false)">
            <span class="material-icons" style="font-size:18px">close</span>
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Skill</label>
          <select class="form-control" [(ngModel)]="assessForm.skillId">
            <option value="">Select skill...</option>
            <option *ngFor="let s of allSkills()" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Score (0-100)</label>
          <input class="form-control" type="number" [(ngModel)]="assessForm.score" min="0" max="100"/>
        </div>
        <div class="form-group">
          <label class="form-label">Assessor Name</label>
          <input class="form-control" [(ngModel)]="assessForm.assessorName" placeholder="Assessor name"/>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <textarea class="form-control" [(ngModel)]="assessForm.notes" rows="2" placeholder="Additional notes..."></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="showAssessDialog.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="submitAssessment()" [disabled]="!assessForm.skillId || !assessForm.assessorName">Submit</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.875rem; cursor: pointer; &:hover { color: var(--color-primary); } .material-icons { font-size: 18px; } }

    .profile-header { display: flex; align-items: center; gap: 24px; }
    .profile-avatar-lg {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 0 24px rgba(108,99,255,0.3);
    }
    .profile-info h2 { font-size: 1.375rem; margin-bottom: 4px; }
    .profile-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0; }
    .tab-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border: none; background: none;
      color: var(--text-muted); font-size: 0.875rem; font-family: 'Inter', sans-serif;
      font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent;
      transition: all var(--transition-fast);
      .material-icons { font-size: 16px; }
      &:hover { color: var(--text-primary); }
      &.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    }
    .tab-content { margin-top: 24px; }
    .section-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; h3 { font-size: 1rem; } }

    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 16px; }
    .skill-tile { padding: 16px; }
    .skill-tile-header { display: flex; justify-content: space-between; align-items: center; }

    .score-bar { display: flex; align-items: center; gap: 10px; min-width: 140px; }
    .score-fill { height: 6px; border-radius: 9999px; transition: width 0.5s; }
    .progress-bar-container { height: 6px; background: var(--bg-surface-3); border-radius: 9999px; overflow: hidden; }

    .gap-card { margin-bottom: 12px; }
    .gap-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .gap-bars { display: flex; flex-direction: column; gap: 8px; }
    .gap-row { display: flex; align-items: center; gap: 12px; }
    .gap-label { width: 60px; font-size: 0.75rem; }
    .gap-val { width: 36px; font-size: 0.75rem; text-align: right; color: var(--text-secondary); }

    textarea.form-control { resize: vertical; min-height: 60px; }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  employee = signal<EmployeeDTO | null>(null);
  employeeSkills = signal<EmployeeSkillDTO[]>([]);
  assessments = signal<AssessmentDTO[]>([]);
  skillGaps = signal<SkillGapDTO[]>([]);
  allSkills = signal<SkillDTO[]>([]);
  loading = signal(true);
  activeTab = signal('skills');
  showSkillDialog = signal(false);
  showAssessDialog = signal(false);

  skillForm: MapSkillRequest = { skillId: '', proficiencyLevel: 3 };
  assessForm: AssessmentRequest = { skillId: '', score: 80, assessorName: '', notes: '' };

  readonly tabs = [
    { id: 'skills', label: 'Skills', icon: 'psychology' },
    { id: 'assessments', label: 'Assessments', icon: 'assignment_turned_in' },
    { id: 'gaps', label: 'Skill Gaps', icon: 'analytics' },
  ];

  private empId!: string;

  constructor(private route: ActivatedRoute, private skillApi: SkillApiService) {}

  ngOnInit(): void {
    this.empId = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      emp: this.skillApi.getEmployee(this.empId),
      skills: this.skillApi.getEmployeeSkills(this.empId),
      assessments: this.skillApi.getAssessments(this.empId),
      gaps: this.skillApi.getSkillGaps(this.empId),
      allSkills: this.skillApi.getSkills(),
    }).subscribe({
      next: (res) => {
        this.employee.set(res.emp);
        this.employeeSkills.set(res.skills);
        this.assessments.set(res.assessments);
        this.skillGaps.set(res.gaps);
        this.allSkills.set(res.allSkills);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  mapSkill(): void {
    this.skillApi.mapEmployeeSkill(this.empId, this.skillForm).subscribe({
      next: (s) => {
        this.employeeSkills.update(list => [...list, s]);
        this.showSkillDialog.set(false);
        this.skillForm = { skillId: '', proficiencyLevel: 3 };
      }
    });
  }

  submitAssessment(): void {
    this.skillApi.createAssessment(this.empId, this.assessForm).subscribe({
      next: (a) => {
        this.assessments.update(list => [a, ...list]);
        this.showAssessDialog.set(false);
        this.assessForm = { skillId: '', score: 80, assessorName: '', notes: '' };
      }
    });
  }
}
