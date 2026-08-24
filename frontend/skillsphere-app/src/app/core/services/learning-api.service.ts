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

export interface CourseDTO {
  id?: string;
  title: string;
  description?: string;
  category: string;
  type: string;
  durationHours?: number;
  provider?: string;
  skillIds?: string[];
  createdAt?: string;
}

export interface CourseStatsDTO {
  totalCourses: number;
  totalEnrollments: number;
  completionRate: number;
  avgDurationHours?: number;
}

export interface LearningPathDTO {
  id?: string;
  name: string;
  description?: string;
  targetRole?: string;
  courseIds?: string[];
  courses?: CourseDTO[];
  createdAt?: string;
}

export interface EnrollmentDTO {
  id?: string;
  employeeId: string;
  courseId: string;
  courseTitle?: string;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
  completedAt?: string;
  score?: number;
}

export interface CourseEnrollmentRequest {
  courseId: string;
}

export interface ProgressUpdateRequest {
  progressPercent: number;
}

export interface CompleteEnrollmentRequest {
  score?: number;
}

@Injectable({ providedIn: 'root' })
export class LearningApiService {
  private readonly BASE = 'http://localhost:8082/api/v1';

  constructor(private http: HttpClient) {}

  /* ----- Courses ----- */
  getCourses(params?: { category?: string; type?: string; search?: string; page?: number; size?: number }): Observable<PageResponse<CourseDTO>> {
    let p = new HttpParams().set('page', params?.page ?? 0).set('size', params?.size ?? 20);
    if (params?.category) p = p.set('category', params.category);
    if (params?.type) p = p.set('type', params.type);
    if (params?.search) p = p.set('search', params.search);
    return this.http.get<PageResponse<CourseDTO>>(`${this.BASE}/courses`, { params: p });
  }

  getCourseById(id: string): Observable<CourseDTO> {
    return this.http.get<CourseDTO>(`${this.BASE}/courses/${id}`);
  }

  getCourseStats(): Observable<CourseStatsDTO> {
    return this.http.get<CourseStatsDTO>(`${this.BASE}/courses/stats`);
  }

  getAllCoursesList(): Observable<CourseDTO[]> {
    return this.http.get<CourseDTO[]>(`${this.BASE}/courses/all`);
  }

  createCourse(dto: CourseDTO): Observable<CourseDTO> {
    return this.http.post<CourseDTO>(`${this.BASE}/courses`, dto);
  }

  updateCourse(id: string, dto: CourseDTO): Observable<CourseDTO> {
    return this.http.put<CourseDTO>(`${this.BASE}/courses/${id}`, dto);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/courses/${id}`);
  }

  /* ----- Learning Paths ----- */
  getLearningPaths(): Observable<LearningPathDTO[]> {
    return this.http.get<LearningPathDTO[]>(`${this.BASE}/learning-paths`);
  }

  getLearningPathById(id: string): Observable<LearningPathDTO> {
    return this.http.get<LearningPathDTO>(`${this.BASE}/learning-paths/${id}`);
  }

  createLearningPath(dto: LearningPathDTO): Observable<LearningPathDTO> {
    return this.http.post<LearningPathDTO>(`${this.BASE}/learning-paths`, dto);
  }

  updateLearningPath(id: string, dto: LearningPathDTO): Observable<LearningPathDTO> {
    return this.http.put<LearningPathDTO>(`${this.BASE}/learning-paths/${id}`, dto);
  }

  deleteLearningPath(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/learning-paths/${id}`);
  }

  /* ----- Enrollments ----- */
  getEnrollmentsByEmployee(employeeId: string): Observable<EnrollmentDTO[]> {
    return this.http.get<EnrollmentDTO[]>(`${this.BASE}/employees/${employeeId}/enrollments`);
  }

  createEnrollment(employeeId: string, req: CourseEnrollmentRequest): Observable<EnrollmentDTO> {
    return this.http.post<EnrollmentDTO>(`${this.BASE}/employees/${employeeId}/enrollments`, req);
  }

  updateProgress(enrollmentId: string, progressPercent: number): Observable<EnrollmentDTO> {
    return this.http.put<EnrollmentDTO>(`${this.BASE}/enrollments/${enrollmentId}/progress`, { progressPercent });
  }

  completeEnrollment(enrollmentId: string, score?: number): Observable<EnrollmentDTO> {
    return this.http.patch<EnrollmentDTO>(`${this.BASE}/enrollments/${enrollmentId}/complete`, { score });
  }

  getDashboardStats(employeeId: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.BASE}/enrollments/employee/${employeeId}/stats`);
  }

  getLearningPathProgress(employeeId: string, pathId: string): Observable<{ progressPercent: number }> {
    return this.http.get<{ progressPercent: number }>(`${this.BASE}/employees/${employeeId}/learning-paths/${pathId}/progress`);
  }
}
