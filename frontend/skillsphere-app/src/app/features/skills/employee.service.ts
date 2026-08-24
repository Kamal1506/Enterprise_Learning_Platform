import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  department: string;
  experienceYears: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DashboardStats {
  employeesCount: number;
  skillsTrackedCount: number;
  assessmentsThisMonthCount: number;
}

export interface EmployeeSkill {
  employeeId: string;
  skillId: string;
  skillName: string;
  category: string;
  proficiency: number;
  verified: boolean;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Assessment {
  id: string;
  employeeId: string;
  skillOrTopic: string;
  score: number;
  passed: boolean;
  takenAt: string;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number;
  actualLevel: number;
  gap: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081/api/v1';

  getEmployees(
    department?: string,
    page = 0,
    size = 20,
    roleTitle?: string,
    experienceMin?: number,
    experienceMax?: number,
    skills?: string[]
  ): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (department && department.trim() !== '') {
      params = params.set('department', department);
    }
    if (roleTitle && roleTitle.trim() !== '') {
      params = params.set('roleTitle', roleTitle);
    }
    if (experienceMin !== undefined && experienceMin !== null) {
      params = params.set('experienceMin', experienceMin.toString());
    }
    if (experienceMax !== undefined && experienceMax !== null) {
      params = params.set('experienceMax', experienceMax.toString());
    }
    if (skills && skills.length > 0) {
      params = params.set('skills', skills.join(','));
    }
    
    return this.http.get<PaginatedResponse<Employee>>(`${this.baseUrl}/employees`, { params });
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/employees/departments`);
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/employees/roles`);
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/employees/${id}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/employees/dashboard-stats`);
  }

  getEmployeeSkills(id: string): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(`${this.baseUrl}/employees/${id}/skills`);
  }

  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.baseUrl}/skills`);
  }

  mapEmployeeSkill(employeeId: string, mapping: { skillId: string; proficiency: number; verified: boolean }): Observable<EmployeeSkill> {
    return this.http.post<EmployeeSkill>(`${this.baseUrl}/employees/${employeeId}/skills`, mapping);
  }

  getEmployeeAssessments(id: string): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.baseUrl}/employees/${id}/assessments`);
  }

  addEmployeeAssessment(employeeId: string, assessment: { skillOrTopic: string; score: number }): Observable<Assessment> {
    return this.http.post<Assessment>(`${this.baseUrl}/employees/${employeeId}/assessments`, assessment);
  }

  getEmployeeSkillGaps(id: string): Observable<SkillGap[]> {
    return this.http.get<SkillGap[]>(`${this.baseUrl}/employees/${id}/skill-gaps`);
  }

  updateEmployee(id: string, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${id}`, employee);
  }

  getAdminStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/employees/admin-stats`);
  }

  getPendingApprovals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/auth/pending-approvals`);
  }

  approveUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/approve/${userId}`, {});
  }

  rejectUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/reject/${userId}`, {});
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`);
  }

  createSkill(skill: { name: string; category: string }): Observable<Skill> {
    return this.http.post<Skill>(`${this.baseUrl}/skills`, skill);
  }

  getEmployeesWithSkill(skillId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/skills/${skillId}/employees`);
  }
}
