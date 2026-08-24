import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Course {
  title: string;
  progress: number;
  score?: number;
  type: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  desc: string;
}

@Component({
  selector: 'app-learning-journey-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="learning-journey-section" id="learning">
      <div class="container">
        <div class="section-header-centered animate-on-scroll">
          <span class="section-tag">Learning Pathways</span>
          <h2 class="section-title-lg">Learning that leads somewhere.</h2>
          <p class="section-subtitle">
            Say goodbye to random catalog clicking. Enterprise Learning Platform with Skill and Career Guidance System structures courses into logical progressive milestones designed to fulfill real certifications and career promotions.
          </p>
        </div>

        <div class="learning-path-wrapper animate-on-scroll">
          <!-- Visual Pathway Stepper -->
          <div class="learning-stepper">
            <div class="step-connector-line">
              <div class="step-connector-fill" style="width: 55%"></div>
            </div>
            
            <div class="step-milestones-row">
              <div class="milestone-item completed" (click)="selectMilestone(0)" [class.active]="selectedMilestoneIdx() === 0">
                <div class="milestone-dot">✓</div>
                <span class="milestone-lbl">Java Core</span>
              </div>
              <div class="milestone-item completed" (click)="selectMilestone(1)" [class.active]="selectedMilestoneIdx() === 1">
                <div class="milestone-dot">✓</div>
                <span class="milestone-lbl">Spring Boot</span>
              </div>
              <div class="milestone-item active" (click)="selectMilestone(2)" [class.active]="selectedMilestoneIdx() === 2">
                <div class="milestone-dot">◐</div>
                <span class="milestone-lbl">Microservices</span>
              </div>
              <div class="milestone-item locked" (click)="selectMilestone(3)" [class.active]="selectedMilestoneIdx() === 3">
                <div class="milestone-dot">○</div>
                <span class="milestone-lbl">Angular web</span>
              </div>
              <div class="milestone-item locked" (click)="selectMilestone(4)" [class.active]="selectedMilestoneIdx() === 4">
                <div class="milestone-dot">○</div>
                <span class="milestone-lbl">Cloud deploy</span>
              </div>
            </div>
          </div>

          <!-- Course Cards Container for Selected Milestone -->
          <div class="milestone-detail-container">
            <div class="milestone-header-row">
              <div>
                <h3>Milestone {{ selectedMilestoneIdx() + 1 }}: {{ currentMilestoneName() }}</h3>
                <p>Status: <span class="status-accent-text">{{ currentMilestoneStatus() }}</span></p>
              </div>
              <div class="milestone-progress-pill">
                Milestone Progress: {{ currentMilestoneProgress() }}%
              </div>
            </div>

            <div class="courses-cards-grid">
              @for (course of currentCourses(); track course.title) {
                <div class="course-detail-card" [class.locked-card]="course.status === 'LOCKED'">
                  <div class="card-status-row">
                    <span class="course-type">{{ course.type }}</span>
                    <span class="status-badge" [class.badge-completed]="course.status === 'COMPLETED'" 
                          [class.badge-progress]="course.status === 'IN_PROGRESS'" 
                          [class.badge-locked]="course.status === 'LOCKED'">
                      {{ course.status }}
                    </span>
                  </div>
                  
                  <h4>{{ course.title }}</h4>
                  <p class="course-desc">{{ course.desc }}</p>

                  <div class="course-progress-section">
                    @if (course.status !== 'LOCKED') {
                      <div class="prog-label">
                        <span>Progress</span>
                        <span>{{ course.progress }}%</span>
                      </div>
                      <div class="course-prog-bar">
                        <div class="course-prog-fill" [style.width]="course.progress + '%'"></div>
                      </div>
                      
                      @if (course.score) {
                        <div class="score-row">
                          <span>Assessment score:</span>
                          <span class="score-val">{{ course.score }}%</span>
                        </div>
                      }
                    } @else {
                      <div class="locked-indicator-row">
                        <svg class="lock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Prerequisites required</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LearningJourneySectionComponent {
  selectedMilestoneIdx = signal(2);

  milestonesData = [
    {
      name: 'Java Fundamentals',
      status: 'Completed',
      progress: 100,
      courses: [
        {
          title: 'Java 17 Core Features',
          progress: 100,
          score: 95,
          type: 'Language Module',
          status: 'COMPLETED',
          desc: 'Comprehensive study of records, patterns, sealed classes, and concurrency improvements.'
        },
        {
          title: 'Functional Programming with Streams',
          progress: 100,
          score: 88,
          type: 'Advanced Module',
          status: 'COMPLETED',
          desc: 'Deep-dive into lambdas, streams, optional patterns, and functional interfaces.'
        }
      ] as Course[]
    },
    {
      name: 'Spring Boot Framework',
      status: 'Completed',
      progress: 100,
      courses: [
        {
          title: 'Spring Boot 3 Core Concepts',
          progress: 100,
          score: 91,
          type: 'Framework Module',
          status: 'COMPLETED',
          desc: 'Dependency injection, bean lifecycles, configuration handling, profiles, and initial structure.'
        },
        {
          title: 'Spring Data JPA & Flyway',
          progress: 100,
          score: 94,
          type: 'Database Module',
          status: 'COMPLETED',
          desc: 'Configuring database connections, migrations, repositories, and transactional behavior.'
        }
      ] as Course[]
    },
    {
      name: 'Microservices Architecture',
      status: 'In Progress',
      progress: 67,
      courses: [
        {
          title: 'Spring Boot 4 Microservices & API Gateway',
          progress: 67,
          score: 92,
          type: 'System Design',
          status: 'IN_PROGRESS',
          desc: 'Building loosely coupled services, writing clients, configuring load balancing and discovery.'
        },
        {
          title: 'JWT Authentication & Security Filters',
          progress: 100,
          score: 96,
          type: 'Security Module',
          status: 'COMPLETED',
          desc: 'Implementing Custom filters, validating signatures, managing role contexts in Spring Security.'
        }
      ] as Course[]
    },
    {
      name: 'Angular App Development',
      status: 'Locked',
      progress: 0,
      courses: [
        {
          title: 'Angular 20 Standalone Components & Signals',
          progress: 0,
          type: 'Frontend Module',
          status: 'LOCKED',
          desc: 'Exploring modern reactive signals, standalone routing, templates, and state sync.'
        }
      ] as Course[]
    },
    {
      name: 'Cloud Infrastructure & Scaling',
      status: 'Locked',
      progress: 0,
      courses: [
        {
          title: 'AWS Deployment Pipelines & IaC',
          progress: 0,
          type: 'DevOps Module',
          status: 'LOCKED',
          desc: 'Packaging Spring apps in docker, deployment workflows, ECS, and Terraform automation.'
        }
      ] as Course[]
    }
  ];

  currentMilestoneName() {
    return this.milestonesData[this.selectedMilestoneIdx()].name;
  }

  currentMilestoneStatus() {
    return this.milestonesData[this.selectedMilestoneIdx()].status;
  }

  currentMilestoneProgress() {
    return this.milestonesData[this.selectedMilestoneIdx()].progress;
  }

  currentCourses() {
    return this.milestonesData[this.selectedMilestoneIdx()].courses;
  }

  selectMilestone(idx: number) {
    this.selectedMilestoneIdx.set(idx);
  }
}
