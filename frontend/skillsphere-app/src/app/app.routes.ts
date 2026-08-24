import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing/landing';
import { LoginComponent } from './features/skills/login/login';
import { EmployeeListComponent } from './features/skills/employee-list/employee-list';
import { EmployeeDetailComponent } from './features/skills/employee-detail/employee-detail';
import { LearningDashboardComponent } from './features/learning/learning-dashboard/learning-dashboard';
import { CourseListComponent } from './features/learning/course-list/course-list';
import { CourseDetailComponent } from './features/learning/course-detail/course-detail';
import { LearningPathListComponent } from './features/learning/learning-path-list/learning-path-list';
import { DashboardComponent } from './features/skills/dashboard/dashboard';
import { ProfileComponent } from './features/skills/profile/profile';
import { SkillsListComponent } from './features/skills/skills-list/skills-list';
import { authGuard } from './core/auth.guard';

// Certifications Module Components
import { CertificationsDashboardComponent } from './features/certifications/certifications-dashboard/certifications-dashboard';
import { CertificationsListComponent } from './features/certifications/certifications-list/certifications-list';
import { CertificationsDetailComponent } from './features/certifications/certifications-detail/certifications-detail';
import { CertificationsRegisterComponent } from './features/certifications/certifications-register/certifications-register';
import { ComplianceDashboardComponent } from './features/certifications/compliance-dashboard/compliance-dashboard';

// Career & Analytics Module Components
import { CareerPlanComponent } from './features/career/career-plan/career-plan';
import { CareerRoadmapComponent } from './features/career/career-roadmap/career-roadmap';
import { JobPortalComponent } from './features/career/job-portal/job-portal';
import { ExecutiveDashboardComponent } from './features/career/executive-dashboard/executive-dashboard';
import { AssistantPageComponent } from './features/assistant/assistant-page/assistant-page';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, pathMatch: 'full' },
  { path: 'home', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'employees', component: EmployeeListComponent, canActivate: [authGuard] },
  { path: 'employees/:id', component: EmployeeDetailComponent, canActivate: [authGuard] },
  { path: 'skills', component: SkillsListComponent, canActivate: [authGuard] },
  
  // Learning Module Routes
  { path: 'learning', redirectTo: '/learning/dashboard', pathMatch: 'full' },
  { path: 'learning/dashboard', component: LearningDashboardComponent, canActivate: [authGuard] },
  { path: 'learning/courses', component: CourseListComponent, canActivate: [authGuard] },
  { path: 'learning/courses/:id', component: CourseDetailComponent, canActivate: [authGuard] },
  { path: 'learning/paths', component: LearningPathListComponent, canActivate: [authGuard] },

  // Certifications Module Routes
  { path: 'certifications', redirectTo: '/certifications/dashboard', pathMatch: 'full' },
  { path: 'certifications/dashboard', component: CertificationsDashboardComponent, canActivate: [authGuard] },
  { path: 'certifications/list', component: CertificationsListComponent, canActivate: [authGuard] },
  { path: 'certifications/new', component: CertificationsRegisterComponent, canActivate: [authGuard] },
  { path: 'certifications/:id/edit', component: CertificationsRegisterComponent, canActivate: [authGuard] },
  { path: 'certifications/compliance', component: ComplianceDashboardComponent, canActivate: [authGuard] },
  { path: 'certifications/:id', component: CertificationsDetailComponent, canActivate: [authGuard] },

  // Career & Analytics Module Routes
  { path: 'career/plan', component: CareerPlanComponent, canActivate: [authGuard] },
  { path: 'career/roadmap', component: CareerRoadmapComponent, canActivate: [authGuard] },
  { path: 'career/jobs', component: JobPortalComponent, canActivate: [authGuard] },
  { path: 'career/analytics', component: ExecutiveDashboardComponent, canActivate: [authGuard] },
  { path: 'assistant', component: AssistantPageComponent, canActivate: [authGuard] },
  
  { path: '**', redirectTo: '' }
];
