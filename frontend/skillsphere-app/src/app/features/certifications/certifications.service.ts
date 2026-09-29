import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Certification {
  id?: string;
  name: string;
  provider: string;
  validityMonths: number;
  category: string;
  associatedSkillId?: string | null;
  associatedCourseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeCertification {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  certificationId: string;
  certificationName: string;
  provider: string;
  credentialId?: string;
  issueDate: string;
  expiryDate: string;
  status: string; // ACTIVE, EXPIRING_SOON, EXPIRED, RENEWAL_IN_PROGRESS, RENEWED, REVOKED
  documentUrl?: string;
  verified: boolean;
  verifiedAt?: string;
  renewalStatus: string; // NOT_REQUIRED, DUE_SOON, RENEWAL_REQUESTED, IN_PROGRESS, RENEWED, FAILED
  renewalDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  renewalRequestedDate?: string;
  renewalRequestedBy?: string;
  renewalCompletedDate?: string;
  newExpiryDate?: string;
  renewalNotes?: string;
  certificateType?: string;
  courseId?: string;
  courseCompletionId?: string;
  requestStatus?: string;
  approvedBy?: string;
  approvedDate?: string;
  certificateNumber?: string;
  pdfLocation?: string;
  assessmentScore?: number;
  completionPercentage?: number;
  instructor?: string;
  completionDate?: string;
  requestDate?: string;
}

export interface CertificationReport {
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  expiringCount: number;
  renewalRate: number;
  providerDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  skillDistribution: Record<string, number>;
}

export interface ComplianceCheckResponse {
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  complianceStatus: string; // COMPLIANT, EXPIRING, NON_COMPLIANT, NOT_VERIFIED
  missingCertifications: string[];
  activeCertifications: EmployeeCertification[];
}

export interface ComplianceSummary {
  compliantCount: number;
  expiringCount: number;
  nonCompliantCount: number;
  complianceRate: number;
}

export interface CertificationAudit {
  id: string;
  actionType: string;
  certificationId?: string;
  certificationName?: string;
  employeeCertificationId?: string;
  employeeId: string;
  performedBy: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  source?: string;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.certServiceUrl;

  // --- Certification Definitions ---
  getCertifications(): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.baseUrl}/certifications`);
  }

  getCertificationById(id: string): Observable<Certification> {
    return this.http.get<Certification>(`${this.baseUrl}/certifications/${id}`);
  }

  createCertification(cert: Certification): Observable<Certification> {
    return this.http.post<Certification>(`${this.baseUrl}/certifications`, cert);
  }

  updateCertification(id: string, cert: Certification): Observable<Certification> {
    return this.http.put<Certification>(`${this.baseUrl}/certifications/${id}`, cert);
  }

  deleteCertification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/certifications/${id}`);
  }

  getReports(): Observable<CertificationReport> {
    return this.http.get<CertificationReport>(`${this.baseUrl}/certifications/reports`);
  }

  getAudits(): Observable<CertificationAudit[]> {
    return this.http.get<CertificationAudit[]>(`${this.baseUrl}/certifications/audits`);
  }

  // --- Employee Awards ---
  getAllEmployeeCertifications(): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications`);
  }

  getEmployeeCertificationById(id: string): Observable<EmployeeCertification> {
    return this.http.get<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}`);
  }

  registerCertification(req: {
    employeeId: string;
    certificationId: string;
    credentialId?: string;
    issueDate: string;
    documentUrl?: string;
    notes?: string;
  }): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications`, req);
  }

  updateEmployeeCertification(id: string, req: {
    employeeId: string;
    certificationId: string;
    credentialId?: string;
    issueDate: string;
    documentUrl?: string;
    notes?: string;
  }): Observable<EmployeeCertification> {
    return this.http.put<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}`, req);
  }

  revokeCertification(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employee-certifications/${id}/revoke`, { reason });
  }

  deleteEmployeeCertification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employee-certifications/${id}`);
  }

  downloadCertificatePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/employee-certifications/${id}/download`, { responseType: 'blob' });
  }

  verifyCertification(id: string): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}/verify`, {});
  }

  startRenewal(id: string, notes?: string): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}/renew`, { notes });
  }

  completeRenewal(id: string, req: {
    status: string; // RENEWED, FAILED, IN_PROGRESS
    notes?: string;
    newIssueDate?: string;
    newCredentialId?: string;
    newDocumentUrl?: string;
  }): Observable<EmployeeCertification> {
    return this.http.put<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}/renew/progress`, req);
  }

  getCertificationsByEmployee(employeeId: string): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/employee/${employeeId}`);
  }

  getCertificationsBySkill(skillId: string): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/skill/${skillId}`);
  }

  getActiveCertifications(): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/active`);
  }

  getExpiredCertifications(): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/expired`);
  }

  getExpiringCertifications(): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/expiring`);
  }

  checkEmployeeCompliance(employeeId: string): Observable<ComplianceCheckResponse> {
    return this.http.get<ComplianceCheckResponse>(`${this.baseUrl}/employee-certifications/compliance/${employeeId}`);
  }

  getComplianceSummary(): Observable<ComplianceSummary> {
    return this.http.get<ComplianceSummary>(`${this.baseUrl}/employee-certifications/compliance/summary`);
  }

  requestLearningCertificate(req: {
    employeeId: string;
    courseId: string;
    courseCompletionId: string;
    completionDate: string;
    assessmentScore: number;
    completionPercentage: number;
    instructor: string;
    courseName: string;
    category: string;
  }): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications/request`, req);
  }

  getPendingRequests(): Observable<EmployeeCertification[]> {
    return this.http.get<EmployeeCertification[]>(`${this.baseUrl}/employee-certifications/requests`);
  }

  approveRequest(id: string): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}/approve`, {});
  }

  rejectRequest(id: string, reason: string): Observable<EmployeeCertification> {
    return this.http.post<EmployeeCertification>(`${this.baseUrl}/employee-certifications/${id}/reject`, { reason });
  }
}
