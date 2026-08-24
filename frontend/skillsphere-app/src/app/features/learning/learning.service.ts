import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../skills/employee.service';

export interface Course {
  id?: string;
  title: string;
  description: string;
  category: string;
  type: string;
  instructor?: string;
  rating?: number;
  enrolledCount?: number;
  completedCount?: number;
  learningPathName?: string | null;
  learningPathProgress?: number | null;
  lastAssessmentScore?: number | null;
  learningSourceUrl?: string;
  durationHours: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PathCourseDetail {
  courseId: string;
  title: string;
  category: string;
  durationHours: number;
  sequenceOrder: number;
}

export interface LearningPath {
  id?: string;
  name: string;
  description: string;
  courses?: PathCourseDetail[];
  courseIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  id: string;
  employeeId: string;
  courseId: string | null;
  courseTitle: string | null;
  learningPathId: string | null;
  learningPathTitle: string | null;
  status: string;
  progressPercent: number;
  finalScore: number | null;
  enrolledAt: string;
  completedAt: string | null;
  updatedAt: string;
  learningSourceUrl?: string | null;
}

export interface LearningStats {
  activeEnrollmentsCount: number;
  completedCoursesCount: number;
  completedLearningPathsCount: number;
}

export interface CourseStats {
  totalCourses: number;
  monthlyEnrollments: number;
  overallCompletionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1';

  // --- Courses ---
  getCourses(category?: string, search?: string, page = 0, size = 20, type?: string): Observable<PaginatedResponse<Course>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (category && category.trim() !== '') {
      params = params.set('category', category);
    }
    if (type && type.trim() !== '') {
      params = params.set('type', type);
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search);
    }
    
    return this.http.get<PaginatedResponse<Course>>(`${this.baseUrl}/courses`, { params });
  }

  getAllCoursesList(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/courses/all`);
  }

  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${id}`);
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/courses`, course);
  }

  updateCourse(id: string, course: Course): Observable<Course> {
    return this.http.put<Course>(`${this.baseUrl}/courses/${id}`, course);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/courses/${id}`);
  }

  getGlobalStats(): Observable<CourseStats> {
    return this.http.get<CourseStats>(`${this.baseUrl}/courses/stats`);
  }

  // --- Learning Paths ---
  getLearningPaths(): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(`${this.baseUrl}/learning-paths`);
  }

  getLearningPathById(id: string): Observable<LearningPath> {
    return this.http.get<LearningPath>(`${this.baseUrl}/learning-paths/${id}`);
  }

  createLearningPath(path: LearningPath): Observable<LearningPath> {
    return this.http.post<LearningPath>(`${this.baseUrl}/learning-paths`, path);
  }

  updateLearningPath(id: string, path: LearningPath): Observable<LearningPath> {
    return this.http.put<LearningPath>(`${this.baseUrl}/learning-paths/${id}`, path);
  }

  deleteLearningPath(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/learning-paths/${id}`);
  }

  // --- Enrollments ---
  getEnrollmentsByEmployee(employeeId: string): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/employees/${employeeId}/enrollments`);
  }

  getEnrollmentsByCourse(courseId: string): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/courses/${courseId}/enrollments`);
  }

  enroll(employeeId: string, courseId: string | null, learningPathId: string | null): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/employees/${employeeId}/enrollments`, {
      courseId,
      learningPathId
    });
  }

  updateProgress(enrollmentId: string, progressPercent: number): Observable<Enrollment> {
    return this.http.put<Enrollment>(`${this.baseUrl}/enrollments/${enrollmentId}/progress`, {
      progressPercent
    });
  }

  completeEnrollment(enrollmentId: string, finalScore: number): Observable<Enrollment> {
    return this.http.patch<Enrollment>(`${this.baseUrl}/enrollments/${enrollmentId}/complete`, {
      finalScore
    });
  }

  getStatsByEmployee(employeeId: string): Observable<LearningStats> {
    return this.http.get<LearningStats>(`${this.baseUrl}/enrollments/employee/${employeeId}/stats`);
  }

  getLearningPathProgress(employeeId: string, pathId: string): Observable<{ progressPercent: number }> {
    return this.http.get<{ progressPercent: number }>(`${this.baseUrl}/employees/${employeeId}/learning-paths/${pathId}/progress`);
  }

  // --- Modules ---
  getModulesByCourse(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/courses/${courseId}/modules`);
  }

  completeModule(employeeId: string, moduleId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/employees/${employeeId}/modules/${moduleId}/complete`, {});
  }

  getCompletedModuleIds(employeeId: string, courseId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/employees/${employeeId}/courses/${courseId}/completed-modules`);
  }

  // --- Certificates ---
  getCertificatesByEmployee(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/certificates/employee/${employeeId}`);
  }

  getCertificateById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/certificates/${id}`);
  }

  downloadCertificatePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/certificates/${id}/download`, { responseType: 'blob' });
  }

  // --- Employee Details fallback ---
  getEmployeeDetails(employeeId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8081/api/v1/employees/${employeeId}`);
  }

  // --- Quiz and Assessment ---
  getCourseQuiz(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/courses/${courseId}/quiz`);
  }

  saveCourseQuiz(courseId: string, questions: any[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/courses/${courseId}/quiz`, questions);
  }

  uploadQuizCsv(courseId: string, file: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(`${this.baseUrl}/courses/${courseId}/quiz/upload`, formData);
  }

  submitQuiz(enrollmentId: string, answers: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/enrollments/${enrollmentId}/quiz/submit`, { answers });
  }
}
