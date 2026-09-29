import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Mentor {
  id?: string;
  employeeId: string;
  name: string;
  department: string;
  experienceYears: number;
  guidanceNotes?: string;
}

export interface CareerPlan {
  id?: string;
  employeeId: string;
  employeeName: string;
  currentRole: string;
  targetRole: string;
  careerGoal?: string;
  status: string;
  mentor?: Mentor | null;
  timeline: string;
  expectedPromotionDate?: string;
  meetingSchedule?: string;
  guidanceNotes?: string;
}

export interface SkillGapAnalysis {
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number;
  actualLevel: number;
  gap: number;
  priority: string;
  recommendedCourses: string[];
  recommendedCertifications: string[];
}

export interface PromotionReadiness {
  status: string;
  readinessPercent: number;
  skillsMet: boolean;
  certificationsMet: boolean;
  coursesMet: boolean;
  experienceMet: boolean;
  details: string;
}

export interface RoadmapStepDetail {
  roleName: string;
  requiredSkills: string[];
  completedSkills: string[];
  missingSkills: string[];
  requiredCourses: string[];
  completedCourses: string[];
  requiredCertifications: string[];
  completedCertifications: string[];
  status: string;
}

export interface CareerRoadmap {
  currentPosition: string;
  targetPosition: string;
  steps: string[];
  roadmapProgressPercent: number;
  stepDetails: RoadmapStepDetail[];
  estimatedTimeline: string;
}

export interface CareerPlanDetail {
  plan: CareerPlan;
  skillGap: SkillGapAnalysis[];
  skillCoveragePercent: number;
  promotionReadiness: PromotionReadiness;
  completedCourses: string[];
  completedCertifications: string[];
  recommendedCourses: string[];
  recommendedCertifications: string[];
  roadmap: CareerRoadmap;
}

export interface JobPosting {
  id?: string;
  roleTitle: string;
  department: string;
  location: string;
  experienceRequired: number;
  requiredSkills: string;
  salaryBand: string;
  description: string;
  eligibility?: string;
  active?: boolean;
}

export interface JobApplication {
  id?: string;
  jobPostingId: string;
  jobPostingRoleTitle: string;
  jobPostingDepartment: string;
  jobPostingLocation: string;
  employeeId: string;
  employeeName: string;
  status: string;
  appliedAt: string;
  matchPercent: number;
}

export interface RoadmapTemplate {
  id?: string;
  title: string;
  steps: string[];
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CareerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.careerServiceUrl;

  // --- Career Plans ---
  getPlanByEmployee(employeeId: string): Observable<CareerPlanDetail> {
    return this.http.get<CareerPlanDetail>(`${this.baseUrl}/career-plans/employee/${employeeId}`);
  }

  createPlan(planRequest: any): Observable<CareerPlan> {
    return this.http.post<CareerPlan>(`${this.baseUrl}/career-plans`, planRequest);
  }

  updatePlan(planId: string, planRequest: any): Observable<CareerPlan> {
    return this.http.put<CareerPlan>(`${this.baseUrl}/career-plans/${planId}`, planRequest);
  }

  // --- Mentors ---
  getMentors(): Observable<Mentor[]> {
    return this.http.get<Mentor[]>(`${this.baseUrl}/mentors`);
  }

  registerMentor(employeeId: string, guidanceNotes: string): Observable<Mentor> {
    return this.http.post<Mentor>(`${this.baseUrl}/mentors`, { employeeId, guidanceNotes });
  }

  // --- Job Portal ---
  getActiveJobs(): Observable<JobPosting[]> {
    return this.http.get<JobPosting[]>(`${this.baseUrl}/job-postings`);
  }

  getAllJobs(): Observable<JobPosting[]> {
    return this.http.get<JobPosting[]>(`${this.baseUrl}/job-postings/all`);
  }

  createJob(job: JobPosting): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.baseUrl}/job-postings`, job);
  }

  updateJob(jobId: string, job: JobPosting): Observable<JobPosting> {
    return this.http.put<JobPosting>(`${this.baseUrl}/job-postings/${jobId}`, job);
  }

  deleteJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/job-postings/${jobId}`);
  }

  getJobMatch(jobId: string, employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/job-postings/${jobId}/match/${employeeId}`);
  }

  applyForJob(jobId: string, employeeId: string): Observable<JobApplication> {
    return this.http.post<JobApplication>(`${this.baseUrl}/job-postings/${jobId}/apply?employeeId=${employeeId}`, {});
  }

  getJobApplications(employeeId?: string, jobId?: string): Observable<JobApplication[]> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId);
    if (jobId) params = params.set('jobId', jobId);
    return this.http.get<JobApplication[]>(`${this.baseUrl}/job-applications`, { params });
  }

  updateApplicationStatus(applicationId: string, status: string): Observable<JobApplication> {
    return this.http.put<JobApplication>(`${this.baseUrl}/job-applications/${applicationId}/status`, { status });
  }

  // --- Executive Dashboard ---
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/career/dashboard-stats`);
  }

  // --- Reports Export ---
  exportReport(type: string, format: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/career/reports/export`, {
      params: new HttpParams().set('type', type).set('format', format),
      responseType: 'blob'
    });
  }

  // --- Roadmap Templates CRUD ---
  getRoadmapTemplates(): Observable<RoadmapTemplate[]> {
    return this.http.get<RoadmapTemplate[]>(`${this.baseUrl}/roadmaps`);
  }

  createRoadmapTemplate(roadmap: RoadmapTemplate): Observable<RoadmapTemplate> {
    return this.http.post<RoadmapTemplate>(`${this.baseUrl}/roadmaps`, roadmap);
  }

  updateRoadmapTemplate(id: string, roadmap: RoadmapTemplate): Observable<RoadmapTemplate> {
    return this.http.put<RoadmapTemplate>(`${this.baseUrl}/roadmaps/${id}`, roadmap);
  }

  deleteRoadmapTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roadmaps/${id}`);
  }
}
