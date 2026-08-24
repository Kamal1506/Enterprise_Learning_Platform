import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CareerService, CareerPlanDetail, RoadmapStepDetail, RoadmapTemplate, CareerRoadmap } from '../career.service';
import { AuthService } from '../../../core/auth.service';
import { EmployeeService, Employee, EmployeeSkill } from '../../skills/employee.service';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-career-roadmap',
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
          title="Interactive Career Roadmap" 
          [role]="authService.role() || 'EMPLOYEE'" 
          [email]="authService.email() || ''"
          (logout)="authService.logout()"
        />
        
        <main class="main-content">
          @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
            <div class="tab-header" style="margin-bottom: 24px;">
              <button 
                class="tab-btn" 
                [class.active]="activeTab() === 'my-roadmap'"
                (click)="activeTab.set('my-roadmap')"
              >
                Employee Roadmap View
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab() === 'manage-templates'"
                (click)="activeTab.set('manage-templates')"
              >
                Manage Path Templates
              </button>
            </div>
          }

           @if (activeTab() === 'my-roadmap') {
            @if (authService.role() === 'ADMIN' || authService.role() === 'HR_MANAGER') {
              <div class="employee-selector-bar glass-card" style="padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; border-radius: 8px;">
                <label style="font-weight: 600; font-size: 14px; color: var(--text-secondary);">Select Employee to View Roadmap:</label>
                <select class="form-input" style="max-width: 300px; background-color: var(--bg-main); border: 1px solid var(--border-color); color: white; padding: 8px 12px; border-radius: 6px;" [(ngModel)]="selectedEmployeeId" (change)="onEmployeeChange()">
                  <option value="">-- Choose Employee --</option>
                  @for (emp of employeesList(); track emp.id) {
                    <option [value]="emp.id">{{ emp.name }} ({{ emp.department }})</option>
                  }
                </select>
              </div>
            }

            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Generating interactive career roadmap...</p>
              </div>
            } @else if (!planDetail()) {
              <div class="empty-state-dashed animate-fade-in" style="max-width: 600px; margin: 40px auto;">
                <svg class="empty-icon-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                </svg>
                @if (authService.role() === 'EMPLOYEE') {
                  <h3>No Career Roadmap Available</h3>
                  <p class="empty-text">Initialize a career blueprint to view your interactive visual roadmap.</p>
                  <a routerLink="/career/plan" class="btn btn-primary" style="margin-top: 16px;">Go to Career Blueprint</a>
                } @else if (selectedEmployeeId) {
                  <h3>No Active Roadmap Configured</h3>
                  <p class="empty-text" style="margin-bottom: 16px;">
                    This employee does not have an active career roadmap configured. You can directly assign a roadmap from the created path templates below:
                  </p>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 20px; width: 100%; max-width: 320px; margin-left: auto; margin-right: auto;">
                    <select class="form-input" style="width: 100%; background-color: var(--bg-main); border: 1px solid var(--border-color); color: white; padding: 8px 12px; border-radius: 6px;" [(ngModel)]="assignedTemplateId">
                      <option value="">-- Choose Template --</option>
                      @for (tmpl of roadmapTemplates(); track tmpl.id) {
                        <option [value]="tmpl.title">{{ tmpl.title }}</option>
                      }
                    </select>
                    <button class="btn btn-primary" style="width: 100%;" (click)="assignRoadmapTemplate()" [disabled]="!assignedTemplateId">
                      Assign Roadmap Template
                    </button>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Or, set up a custom blueprint:</div>
                  <a [routerLink]="['/career/plan']" [queryParams]="{ employeeId: selectedEmployeeId }" class="btn btn-secondary btn-sm">
                    Initialize Career Plan & Mentor
                  </a>
                } @else {
                  <h3>Select an Employee</h3>
                  <p class="empty-text">
                    Choose an employee from the dropdown list above to audit their progression roadmap.
                  </p>
                }
              </div>
            } @else {
              <div class="roadmap-selector-bar glass-card" style="padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; border-radius: 8px;">
                <label style="font-weight: 600; font-size: 14px; color: var(--text-secondary);">Explore Career Roadmap:</label>
                <select class="form-input" style="max-width: 300px; background-color: var(--bg-main); border: 1px solid var(--border-color); color: white; padding: 8px 12px; border-radius: 6px;" [(ngModel)]="selectedRoadmapTitle" (change)="onRoadmapTemplateChange()">
                  <option value="my-assigned">-- My Assigned Roadmap --</option>
                  @for (tmpl of roadmapTemplates(); track tmpl.id) {
                    <option [value]="tmpl.title">{{ tmpl.title }}</option>
                  }
                </select>
              </div>

              <div class="roadmap-container animate-fade-in">
                <!-- Roadmap Visual Header -->
                <div class="roadmap-header">
                  <div>
                    <span class="roadmap-subtitle">Career Path Tracker &bull; Target: {{ activeRoadmap?.targetPosition || planDetail()?.plan?.targetRole }}</span>
                    <h2>Interactive Progression Roadmap</h2>
                  </div>
                  <div class="roadmap-progress">
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" [style.width.%]="activeRoadmap?.roadmapProgressPercent"></div>
                    </div>
                    <span class="progress-text">{{ activeRoadmap?.roadmapProgressPercent }}% Path Complete</span>
                  </div>
                </div>

                <!-- Interactive Visual Roadmap Node Chain -->
                <div class="roadmap-chain-card">
                  <div class="nodes-wrapper">
                    @for (step of activeRoadmap?.stepDetails; track step.roleName; let i = $index; let last = $last) {
                      <div class="node-container">
                        <!-- Node button -->
                        <button 
                          class="roadmap-node" 
                          [class.active]="selectedStep()?.roleName === step.roleName"
                          [class.completed]="step.status === 'COMPLETED'"
                          [class.in-progress]="step.status === 'IN_PROGRESS'"
                          [class.locked]="step.status === 'LOCKED'"
                          (click)="selectStep(step)"
                        >
                          <div class="node-status-indicator">
                            @if (step.status === 'COMPLETED') {
                              ✓
                            } @else if (step.status === 'IN_PROGRESS') {
                              &bull;
                            } @else {
                              🔒
                            }
                          </div>
                          <span class="node-title">{{ step.roleName }}</span>
                          <span class="node-tag" [ngClass]="'node-tag-' + step.status.toLowerCase()">
                            {{ step.status }}
                          </span>
                        </button>
                        
                        <!-- Connection line -->
                        @if (!last) {
                          <div class="connection-line" [class.completed]="step.status === 'COMPLETED' && activeRoadmap?.stepDetails?.[i+1]?.status !== 'LOCKED'"></div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Selected Step Details Panel -->
                @if (selectedStep()) {
                  <div class="step-detail-card animate-fade-in">
                    <div class="step-detail-header">
                      <div>
                        <span class="step-tag" [ngClass]="'node-tag-' + selectedStep()?.status?.toLowerCase()">
                          Step Status: {{ selectedStep()?.status }}
                        </span>
                        <h3>Role Requirements: {{ selectedStep()?.roleName }}</h3>
                      </div>
                    </div>
                    
                    <hr class="card-divider" />
                    
                    <div class="requirements-grid">
                      <!-- Skills card -->
                      <div class="req-column">
                        <div class="column-header">
                          <span class="col-icon icon-purple">⚙</span>
                          <h4>Competency Gaps</h4>
                        </div>
                        
                        <div class="skills-list">
                          @for (skill of selectedStep()?.requiredSkills; track skill) {
                            <div class="skill-row">
                              <span class="status-dot" [ngClass]="isSkillMet(skill) ? 'dot-success' : 'dot-fail'"></span>
                              <span class="skill-name">{{ skill }}</span>
                              <span class="skill-status-lbl" [ngClass]="isSkillMet(skill) ? 'lbl-success' : 'lbl-fail'">
                                {{ isSkillMet(skill) ? 'Competent' : 'Gap' }}
                              </span>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Courses card -->
                      <div class="req-column">
                        <div class="column-header">
                          <span class="col-icon icon-orange">📚</span>
                          <h4>Curriculum Training</h4>
                        </div>
                        
                        <div class="courses-list">
                          @for (course of selectedStep()?.requiredCourses; track course) {
                            <div class="course-row">
                              <span class="status-dot" [ngClass]="isCourseCompleted(course) ? 'dot-success' : 'dot-fail'"></span>
                              <span class="course-title-text">{{ course }}</span>
                              <span class="course-status-lbl" [ngClass]="isCourseCompleted(course) ? 'lbl-success' : 'lbl-fail'">
                                {{ isCourseCompleted(course) ? 'Completed' : 'Recommended' }}
                              </span>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Certifications card -->
                      <div class="req-column">
                        <div class="column-header">
                          <span class="col-icon icon-blue">★</span>
                          <h4>Required Certifications</h4>
                        </div>
                        
                        <div class="certs-list">
                          @for (cert of selectedStep()?.requiredCertifications; track cert) {
                            <div class="cert-row">
                              <span class="status-dot" [ngClass]="isCertCompleted(cert) ? 'dot-success' : 'dot-fail'"></span>
                              <span class="cert-name-text">{{ cert }}</span>
                              <span class="cert-status-lbl" [ngClass]="isCertCompleted(cert) ? 'lbl-success' : 'lbl-fail'">
                                {{ isCertCompleted(cert) ? 'Active' : 'Missing' }}
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            <!-- Manage Templates Tab View -->
            <div class="templates-manager animate-fade-in" style="display: flex; flex-direction: column; gap: 20px;">
              <div class="manager-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h2 style="margin: 0; font-size: 20px; font-family: 'Outfit', sans-serif;">Career Path Templates</h2>
                  <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0 0 0;">Create and configure standard career progression roadmaps.</p>
                </div>
                <button class="btn btn-primary" (click)="openCreateModal()">
                  + Create Path
                </button>
              </div>

              <!-- List of Templates -->
              @if (templatesLoading()) {
                <div class="loading-state" style="padding: 40px 0;">
                  <div class="spinner"></div>
                  <p>Loading path templates...</p>
                </div>
              } @else if (roadmapTemplates().length === 0) {
                <div class="empty-state-dashed" style="padding: 40px;">
                  <p class="empty-text">No path templates configured. Click "Create Path" to add one.</p>
                </div>
              } @else {
                <div class="templates-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                  @for (tmpl of roadmapTemplates(); track tmpl.id) {
                    <div class="template-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                          <h3 style="margin: 0; font-size: 16px; font-family: 'Outfit', sans-serif; color: var(--text-primary);">{{ tmpl.title }}</h3>
                          <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-secondary" style="padding: 4px 8px; font-size: 11px;" (click)="openEditModal(tmpl)">Edit</button>
                            <button class="btn btn-sm btn-danger" style="padding: 4px 8px; font-size: 11px; background-color: var(--status-fail); border-color: var(--status-fail); color: #fff;" (click)="deleteTemplate(tmpl.id!)">Delete</button>
                          </div>
                        </div>
                        <div class="steps-flow" style="display: flex; flex-direction: column; gap: 8px;">
                          @for (step of tmpl.steps; track step; let idx = $index; let last = $last) {
                            <div class="step-item" style="display: flex; align-items: center; gap: 8px;">
                              <span style="background: rgba(124, 58, 237, 0.15); color: #c084fc; font-size: 11px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">
                                {{ idx + 1 }}
                              </span>
                              <span style="font-size: 13px; color: var(--text-secondary);">{{ step }}</span>
                              @if (!last) {
                                <span style="color: var(--text-muted); font-size: 11px;">&darr;</span>
                              }
                            </div>
                          }
                        </div>
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

    <!-- Create/Edit Modal Dialog -->
    @if (showFormModal()) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'Edit Path Template' : 'Create Path Template' }}</h3>
            <button class="close-btn" (click)="showFormModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Roadmap Title</label>
              <input type="text" class="form-input" [(ngModel)]="formTitle" placeholder="e.g. Cloud Architecture Path" />
            </div>
            
            <div class="form-group">
              <label>Roles Sequence (in progression order)</label>
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input 
                  type="text" 
                  class="form-input" 
                  style="flex-grow: 1;" 
                  [(ngModel)]="newStepName" 
                  placeholder="e.g. Cloud Engineer" 
                  (keyup.enter)="addStep()" 
                />
                <button type="button" class="btn btn-secondary" (click)="addStep()">Add</button>
              </div>

              <!-- List of current steps -->
              @if (formSteps.length > 0) {
                <div class="form-steps-list" style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                  @for (step of formSteps; track step; let idx = $index) {
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-secondary);">
                      <span>{{ idx + 1 }}. {{ step }}</span>
                      <button type="button" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 12px; font-weight: bold;" (click)="removeStep(idx)">Remove</button>
                    </div>
                  }
                </div>
              } @else {
                <p style="font-size: 12px; color: var(--text-muted); margin: 0;">No steps configured. Add roles in sequential progression order.</p>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showFormModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveTemplate()">Save Template</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .roadmap-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .roadmap-header {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      
      h2 { font-family: 'Outfit', sans-serif; font-size: 20px; color: var(--text-primary); }
      .roadmap-subtitle { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 2px; display: block; }
    }

    .roadmap-progress {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 250px;
    }

    .progress-bar-container {
      height: 6px;
      background-color: var(--bg-main);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--primary-accent);
      border-radius: 3px;
      transition: width 0.8s ease-in-out;
    }

    .progress-text {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 600;
      text-align: right;
    }

    .roadmap-chain-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 30px;
      overflow-x: auto;
    }

    .nodes-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 800px;
      position: relative;
      padding: 20px 0;
    }

    .node-container {
      display: flex;
      align-items: center;
      flex-grow: 1;
      
      &:last-child {
        flex-grow: 0;
      }
    }

    .roadmap-node {
      background-color: var(--bg-main);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 160px;
      cursor: pointer;
      position: relative;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      
      &:hover {
        border-color: var(--primary-accent);
        transform: translateY(-4px);
        box-shadow: 0 6px 12px rgba(234, 88, 12, 0.1);
      }
      
      &.active {
        border-color: var(--primary-accent);
        background-color: rgba(234, 88, 12, 0.05);
        box-shadow: 0 0 0 2px var(--primary-accent);
      }

      &.completed {
        border-color: var(--status-success);
        .node-status-indicator { background-color: var(--status-success); color: white; }
      }

      &.in-progress {
        border-color: var(--primary-accent);
        .node-status-indicator { background-color: var(--primary-accent); color: white; }
      }

      &.locked {
        opacity: 0.5;
        .node-status-indicator { background-color: var(--border-color); color: var(--text-muted); }
      }
    }

    .node-status-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }

    .node-title {
      font-family: 'Outfit', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-primary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .node-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .node-tag-completed { background-color: rgba(16, 185, 129, 0.15); color: var(--status-success); }
    .node-tag-in_progress { background-color: rgba(234, 88, 12, 0.15); color: var(--primary-accent); }
    .node-tag-locked { background-color: rgba(255,255,255,0.05); color: var(--text-muted); }

    .connection-line {
      height: 3px;
      background-color: var(--border-color);
      flex-grow: 1;
      margin: 0 10px;
      border-radius: 2px;
      
      &.completed {
        background-color: var(--status-success);
      }
    }

    .step-detail-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
    }

    .step-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--text-primary); }
      .step-tag { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; display: inline-block;}
    }

    .card-divider {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 16px 0;
    }

    .requirements-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .req-column {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      
      h4 { font-family: 'Outfit', sans-serif; font-size: 14px; color: var(--text-primary); }
      .col-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .icon-purple { background-color: rgba(124, 58, 237, 0.15); color: #c084fc; }
      .icon-orange { background-color: rgba(234, 88, 12, 0.15); color: var(--primary-accent); }
      .icon-blue { background-color: rgba(2, 132, 199, 0.1); color: var(--secondary-light); }
    }

    .skills-list, .courses-list, .certs-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .skill-row, .course-row, .cert-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-success { background-color: var(--status-success); box-shadow: 0 0 6px var(--status-success); }
    .dot-fail { background-color: var(--border-color); }

    .skill-name, .course-title-text, .cert-name-text {
      flex-grow: 1;
    }

    .skill-status-lbl, .course-status-lbl, .cert-status-lbl {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .lbl-success { background-color: rgba(16, 185, 129, 0.1); color: var(--status-success); }
    .lbl-fail { background-color: rgba(255,255,255,0.05); color: var(--text-muted); }

    /* Tab Styling */
    .tab-header {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      
      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
      }
      
      &.active {
        color: var(--primary-accent);
        background: rgba(234, 88, 12, 0.1);
        font-weight: 700;
      }
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0,0,0,0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }

    .modal-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--text-primary); }
      .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
    }

    .form-input {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 12px;
      color: white;
      font-size: 14px;
      
      &:focus { outline: 1px solid var(--primary-accent); }
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .empty-state-dashed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      text-align: center;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      color: var(--text-muted);
      gap: 12px;
      width: 100%;
    }
    
    .empty-icon-subtle {
      width: 48px;
      height: 48px;
      color: #4b5563;
      margin-bottom: 8px;
    }
    
    .empty-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 992px) {
      .requirements-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CareerRoadmapComponent implements OnInit {
  private readonly careerService = inject(CareerService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly loading = signal(true);
  readonly planDetail = signal<CareerPlanDetail | null>(null);
  readonly selectedStep = signal<RoadmapStepDetail | null>(null);

  // Tabs and templates Signal state
  readonly activeTab = signal<'my-roadmap' | 'manage-templates'>('my-roadmap');
  readonly roadmapTemplates = signal<RoadmapTemplate[]>([]);
  readonly templatesLoading = signal(false);
  readonly employeesList = signal<Employee[]>([]);

  // Modal controls
  readonly showFormModal = signal(false);
  readonly isEditing = signal(false);
  readonly selectedTemplateId = signal<string | null>(null);

  // Form fields
  formTitle = '';
  formSteps: string[] = [];
  newStepName = '';
  selectedEmployeeId = '';
  assignedTemplateId = '';

  // Exploration fields
  readonly employeeSkills = signal<EmployeeSkill[]>([]);
  readonly selectedRoadmapTitle = signal<string>('my-assigned');

  get activeRoadmap(): CareerRoadmap | null {
    const detail = this.planDetail();
    if (!detail) return null;

    const title = this.selectedRoadmapTitle();
    if (!title || title === 'my-assigned') {
      return detail.roadmap;
    }

    return this.generateRoadmapFromTemplate(title);
  }

  ngOnInit() {
    this.loadTemplates();
    if (this.authService.role() === 'ADMIN' || this.authService.role() === 'HR_MANAGER') {
      this.loadEmployees();
    }
    this.loadRoadmap();
  }

  loadRoadmap() {
    this.loading.set(true);
    this.route.queryParams.subscribe(params => {
      let employeeId = params['employeeId'];
      
      if (!employeeId && this.authService.role() !== 'EMPLOYEE') {
        this.selectedEmployeeId = '';
        this.planDetail.set(null);
        this.loading.set(false);
        return;
      }

      if (!employeeId) {
        employeeId = this.authService.employeeId() || 'e0000000-0000-0000-0000-000000000002';
      } else {
        this.selectedEmployeeId = employeeId;
      }

      this.loadRoadmapForEmployee(employeeId);
    });
  }

  loadRoadmapForEmployee(employeeId: string) {
    this.loading.set(true);
    this.employeeService.getEmployeeSkills(employeeId).subscribe({
      next: (skills) => {
        this.employeeSkills.set(skills);
        this.fetchPlanDetail(employeeId);
      },
      error: (err) => {
        console.error('Error loading employee skills, falling back to basic roadmap', err);
        this.fetchPlanDetail(employeeId);
      }
    });
  }

  private fetchPlanDetail(employeeId: string) {
    this.careerService.getPlanByEmployee(employeeId).subscribe({
      next: (res) => {
        this.planDetail.set(res);
        // Default select the in-progress step
        const activeRm = this.activeRoadmap;
        const currentStep = activeRm ? (activeRm.stepDetails.find(s => s.status === 'IN_PROGRESS') || activeRm.stepDetails[0]) : null;
        this.selectedStep.set(currentStep);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading roadmap details', err);
        this.planDetail.set(null);
        this.loading.set(false);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees(undefined, 0, 100).subscribe({
      next: (res) => {
        this.employeesList.set(res.content || []);
      }
    });
  }

  onEmployeeChange() {
    this.assignedTemplateId = '';
    if (this.selectedEmployeeId) {
      this.loadRoadmapForEmployee(this.selectedEmployeeId);
    } else {
      this.planDetail.set(null);
    }
  }

  assignRoadmapTemplate() {
    if (!this.selectedEmployeeId || !this.assignedTemplateId) return;

    const targetRole = this.assignedTemplateId;
    const expectedPromotionDate = new Date();
    expectedPromotionDate.setMonth(expectedPromotionDate.getMonth() + 12);

    const newPlanReq = {
      employeeId: this.selectedEmployeeId,
      targetRole: targetRole,
      careerGoal: `Complete ${targetRole} roadmap sequence.`,
      timeline: '12 months',
      expectedPromotionDate: expectedPromotionDate.toISOString().substring(0, 10),
      meetingSchedule: '',
      guidanceNotes: ''
    };

    this.careerService.createPlan(newPlanReq).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Roadmap template successfully assigned to employee!');
        this.loadRoadmapForEmployee(this.selectedEmployeeId);
      },
      error: (err: any) => {
        this.notificationService.error('Error', 'Failed to assign roadmap template: ' + (err.error?.message || err.message));
      }
    });
  }

  loadTemplates() {
    this.templatesLoading.set(true);
    this.careerService.getRoadmapTemplates().subscribe({
      next: (res) => {
        this.roadmapTemplates.set(res);
        this.templatesLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading templates', err);
        this.templatesLoading.set(false);
      }
    });
  }

  selectStep(step: RoadmapStepDetail) {
    this.selectedStep.set(step);
  }

  isSkillMet(skill: string): boolean {
    const detail = this.planDetail();
    if (!detail) return false;
    
    const title = this.selectedRoadmapTitle();
    if (!title || title === 'my-assigned') {
      const gapObj = detail.skillGap.find(g => g.skillName.toLowerCase() === skill.toLowerCase());
      return gapObj ? gapObj.gap === 0 : true;
    }

    const empSkill = this.employeeSkills().find(s => s.skillName.toLowerCase() === skill.toLowerCase());
    if (!empSkill) return false;

    const activeStep = this.selectedStep();
    const role = activeStep ? activeStep.roleName : '';
    const requiredLevel = role.includes('Senior') ? 8 : (role.includes('Lead') || role.includes('Manager') ? 9 : 5);
    
    return empSkill.proficiency >= requiredLevel;
  }

  isCourseCompleted(course: string): boolean {
    const detail = this.planDetail();
    if (!detail) return false;
    return detail.completedCourses.some(c => c.toLowerCase() === course.toLowerCase());
  }

  isCertCompleted(cert: string): boolean {
    const detail = this.planDetail();
    if (!detail) return false;
    return detail.completedCertifications.some(c => c.toLowerCase() === cert.toLowerCase());
  }

  onRoadmapTemplateChange() {
    const activeRm = this.activeRoadmap;
    if (activeRm && activeRm.stepDetails && activeRm.stepDetails.length > 0) {
      const nextStep = activeRm.stepDetails.find(s => s.status === 'IN_PROGRESS') || activeRm.stepDetails[0];
      this.selectedStep.set(nextStep);
    } else {
      this.selectedStep.set(null);
    }
  }

  generateRoadmapFromTemplate(title: string): CareerRoadmap | null {
    const detail = this.planDetail();
    if (!detail) return null;

    const tmpl = this.roadmapTemplates().find(t => t.title.toLowerCase() === title.toLowerCase());
    if (!tmpl) return detail.roadmap;

    const currentRole = detail.plan.currentRole || 'Associate Developer';
    const currentRoleIndex = tmpl.steps.indexOf(currentRole);

    let completedSteps = 0;
    const stepDetails: RoadmapStepDetail[] = tmpl.steps.map((roleName, idx) => {
      let status: string;
      if (currentRoleIndex !== -1) {
        if (idx <= currentRoleIndex) {
          status = 'COMPLETED';
          completedSteps++;
        } else if (idx === currentRoleIndex + 1) {
          status = 'IN_PROGRESS';
        } else {
          status = 'LOCKED';
        }
      } else {
        if (idx === 0) {
          status = 'IN_PROGRESS';
        } else {
          status = 'LOCKED';
        }
      }

      const reqSkills = this.getMockSkillsForRole(roleName);
      let compSkills: string[] = [];
      let missSkills: string[] = [];

      if (status === 'COMPLETED') {
        compSkills = [...reqSkills];
      } else if (status === 'IN_PROGRESS') {
        const requiredLevel = roleName.includes('Senior') ? 8 : (roleName.includes('Lead') || roleName.includes('Manager') ? 9 : 5);
        for (const skill of reqSkills) {
          const empSkill = this.employeeSkills().find(s => s.skillName.toLowerCase() === skill.toLowerCase());
          if (empSkill && empSkill.proficiency >= requiredLevel) {
            compSkills.push(skill);
          } else {
            missSkills.push(skill);
          }
        }
      } else {
        missSkills = [...reqSkills];
      }

      const reqCourses = this.getMockCoursesForRole(roleName);
      const compCourses = status === 'COMPLETED' ? [...reqCourses] : reqCourses.filter(c => this.isCourseCompleted(c));

      const reqCerts = this.getMockCertsForRole(roleName);
      const compCerts = status === 'COMPLETED' ? [...reqCerts] : reqCerts.filter(c => this.isCertCompleted(c));

      return {
        roleName,
        requiredSkills: reqSkills,
        completedSkills: compSkills,
        missingSkills: missSkills,
        requiredCourses: reqCourses,
        completedCourses: compCourses,
        requiredCertifications: reqCerts,
        completedCertifications: compCerts,
        status
      };
    });

    const progressPercent = tmpl.steps.length > 0 ? Math.round((completedSteps * 100) / tmpl.steps.length) : 100;

    return {
      currentPosition: currentRole,
      targetPosition: title,
      steps: tmpl.steps,
      roadmapProgressPercent: progressPercent,
      stepDetails: stepDetails,
      estimatedTimeline: '12 months'
    };
  }

  getMockSkillsForRole(role: string): string[] {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer') || roleLower.includes('engineer')) {
      return ['Java', 'Spring Boot', 'Angular', 'SQL & Databases'];
    } else if (roleLower.includes('lead') || roleLower.includes('architect')) {
      return ['Java', 'Spring Boot', 'Agile Methodologies'];
    } else if (roleLower.includes('hr')) {
      return ['Public Speaking', 'Agile Methodologies'];
    }
    return ['Java', 'Agile Methodologies'];
  }

  getMockCoursesForRole(role: string): string[] {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer') || roleLower.includes('engineer')) {
      return ['Java Advanced Programming', 'Spring Boot Microservices', 'Angular Standalone Architecture'];
    } else if (roleLower.includes('lead') || roleLower.includes('architect')) {
      return ['Java Advanced Programming', 'Database Optimization & SQL'];
    }
    return ['Effective Presentation Skills'];
  }

  getMockCertsForRole(role: string): string[] {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer') || roleLower.includes('engineer')) {
      return ['Oracle Certified Professional: Java SE 17 Developer'];
    } else if (roleLower.includes('lead') || roleLower.includes('architect')) {
      return ['AWS Certified Solutions Architect - Associate'];
    }
    return ['Professional Scrum Product Owner I'];
  }

  // Admin CRUD logic
  openCreateModal() {
    this.isEditing.set(false);
    this.selectedTemplateId.set(null);
    this.formTitle = '';
    this.formSteps = [];
    this.newStepName = '';
    this.showFormModal.set(true);
  }

  openEditModal(tmpl: RoadmapTemplate) {
    this.isEditing.set(true);
    this.selectedTemplateId.set(tmpl.id || null);
    this.formTitle = tmpl.title;
    this.formSteps = [...tmpl.steps];
    this.newStepName = '';
    this.showFormModal.set(true);
  }

  addStep() {
    const val = this.newStepName.trim();
    if (val && !this.formSteps.includes(val)) {
      this.formSteps.push(val);
      this.newStepName = '';
    }
  }

  removeStep(index: number) {
    this.formSteps.splice(index, 1);
  }

  saveTemplate() {
    if (!this.formTitle.trim()) {
      this.notificationService.error('Error', 'Please enter a path title.');
      return;
    }
    if (this.formSteps.length === 0) {
      this.notificationService.error('Error', 'Please add at least one step.');
      return;
    }

    const payload: RoadmapTemplate = {
      title: this.formTitle.trim(),
      steps: this.formSteps
    };

    if (this.isEditing()) {
      const id = this.selectedTemplateId()!;
      this.careerService.updateRoadmapTemplate(id, payload).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Roadmap template updated successfully.');
          this.showFormModal.set(false);
          this.loadTemplates();
        },
        error: (err: any) => {
          this.notificationService.error('Error', 'Failed to update template: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.careerService.createRoadmapTemplate(payload).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Roadmap template created successfully.');
          this.showFormModal.set(false);
          this.loadTemplates();
        },
        error: (err: any) => {
          this.notificationService.error('Error', 'Failed to create template: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteTemplate(id: string) {
    if (confirm('Are you sure you want to delete this career path template?')) {
      this.careerService.deleteRoadmapTemplate(id).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Roadmap template deleted successfully.');
          this.loadTemplates();
        },
        error: (err: any) => {
          this.notificationService.error('Error', 'Failed to delete template: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
