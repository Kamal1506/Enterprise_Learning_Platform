import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface EmployeeDTO {
  id?: string;
  name: string;
  email: string;
  roleTitle: string;
  department: string;
  experienceYears: number;
  rating: number;
}

export interface SkillDTO {
  id?: string;
  name: string;
  category: string;
  description?: string;
}

export interface EmployeeSkillDTO {
  employeeId: string;
  skillId: string;
  skillName?: string;
  proficiencyLevel: number;
  lastAssessedAt?: string;
}

export interface MapSkillRequest {
  skillId: string;
  proficiencyLevel: number;
}

export interface AssessmentDTO {
  id?: string;
  employeeId?: string;
  skillId: string;
  skillName?: string;
  score: number;
  assessorName: string;
  notes?: string;
  assessedAt?: string;
}

export interface AssessmentRequest {
  skillId: string;
  score: number;
  assessorName: string;
  notes?: string;
}

export interface CompetencyFrameworkDTO {
  id?: string;
  role: string;
  skillId: string;
  skillName?: string;
  requiredProficiency: number;
}

export interface SkillGapDTO {
  skillId: string;
  skillName: string;
  required: number;
  current: number;
  gap: number;
}

export interface AdminStats {
  employeeCount: number;
  hrManagerCount: number;
  skillsTrackedCount: number;
  pendingApprovals: number;
}

export interface DashboardStats {
  employeesCount: number;
  skillsTrackedCount: number;
  assessmentsThisMonthCount: number;
}

export interface PendingApprovalDTO {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SkillApiService {
  private readonly BASE = environment.skillServiceUrl;

  constructor(private http: HttpClient) {}

  /* ----- Employees ----- */
  getEmployees(department?: string, page = 0, size = 20): Observable<PageResponse<EmployeeDTO>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (department) params = params.set('department', department);
    return this.http.get<PageResponse<EmployeeDTO>>(`${this.BASE}/employees`, { params });
  }

  getEmployee(id: string): Observable<EmployeeDTO> {
    return this.http.get<EmployeeDTO>(`${this.BASE}/employees/${id}`);
  }

  createEmployee(dto: EmployeeDTO): Observable<EmployeeDTO> {
    return this.http.post<EmployeeDTO>(`${this.BASE}/employees`, dto);
  }

  updateEmployee(id: string, dto: EmployeeDTO): Observable<EmployeeDTO> {
    return this.http.put<EmployeeDTO>(`${this.BASE}/employees/${id}`, dto);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/employees/${id}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.BASE}/employees/dashboard-stats`);
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.BASE}/employees/admin-stats`);
  }

  /* ----- Skills ----- */
  getSkills(): Observable<SkillDTO[]> {
    return this.http.get<SkillDTO[]>(`${this.BASE}/skills`);
  }

  createSkill(dto: SkillDTO): Observable<SkillDTO> {
    return this.http.post<SkillDTO>(`${this.BASE}/skills`, dto);
  }

  getEmployeeSkills(employeeId: string): Observable<EmployeeSkillDTO[]> {
    return this.http.get<EmployeeSkillDTO[]>(`${this.BASE}/employees/${employeeId}/skills`);
  }

  mapEmployeeSkill(employeeId: string, req: MapSkillRequest): Observable<EmployeeSkillDTO> {
    return this.http.post<EmployeeSkillDTO>(`${this.BASE}/employees/${employeeId}/skills`, req);
  }

  getEmployeesWithSkill(skillId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/skills/${skillId}/employees`);
  }

  /* ----- Assessments ----- */
  getAssessments(employeeId: string): Observable<AssessmentDTO[]> {
    return this.http.get<AssessmentDTO[]>(`${this.BASE}/employees/${employeeId}/assessments`);
  }

  createAssessment(employeeId: string, req: AssessmentRequest): Observable<AssessmentDTO> {
    return this.http.post<AssessmentDTO>(`${this.BASE}/employees/${employeeId}/assessments`, req);
  }

  /* ----- Competency ----- */
  getCompetencyFrameworks(role?: string): Observable<CompetencyFrameworkDTO[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<CompetencyFrameworkDTO[]>(`${this.BASE}/competency-frameworks`, { params });
  }

  getSkillGaps(employeeId: string): Observable<SkillGapDTO[]> {
    return this.http.get<SkillGapDTO[]>(`${this.BASE}/employees/${employeeId}/skill-gaps`);
  }

  /* ----- Auth Admin ----- */
  getPendingApprovals(): Observable<PendingApprovalDTO[]> {
    return this.http.get<PendingApprovalDTO[]>(`${this.BASE}/auth/pending-approvals`);
  }

  approveUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/auth/approve/${userId}`, {});
  }

  rejectUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/auth/reject/${userId}`, {});
  }
}
