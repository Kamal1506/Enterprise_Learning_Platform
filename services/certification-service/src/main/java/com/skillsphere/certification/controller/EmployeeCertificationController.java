package com.skillsphere.certification.controller;

import com.skillsphere.certification.dto.*;
import com.skillsphere.certification.service.EmployeeCertificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee-certifications")
public class EmployeeCertificationController {

    private final EmployeeCertificationService employeeCertificationService;

    public EmployeeCertificationController(EmployeeCertificationService employeeCertificationService) {
        this.employeeCertificationService = employeeCertificationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<List<EmployeeCertificationDTO>> getAllEmployeeCertifications() {
        return ResponseEntity.ok(employeeCertificationService.getAllEmployeeCertifications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeCertificationDTO> getEmployeeCertificationById(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeCertificationService.getEmployeeCertificationById(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeCertificationDTO> registerCertification(@Valid @RequestBody CertificationRegistrationRequest req) {
        EmployeeCertificationDTO created = employeeCertificationService.registerCertification(req);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeCertificationDTO> updateCertification(@PathVariable UUID id, @Valid @RequestBody CertificationRegistrationRequest req) {
        return ResponseEntity.ok(employeeCertificationService.updateCertification(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteEmployeeCertification(@PathVariable UUID id) {
        employeeCertificationService.deleteEmployeeCertification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> revokeCertification(@PathVariable UUID id, @RequestBody(required = false) java.util.Map<String, String> payload) {
        String reason = (payload != null && payload.get("reason") != null) ? payload.get("reason") : "Revoked by admin/HR";
        employeeCertificationService.revokeCertification(id, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/download", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable UUID id) {
        byte[] pdfBytes = employeeCertificationService.generateCertificatePdf(id);
        EmployeeCertificationDTO cert = employeeCertificationService.getEmployeeCertificationById(id);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        
        String cleanEmpName = cert.employeeName() != null ? cert.employeeName().replace(" ", "_") : "Employee";
        String filename = "Certification_" + cleanEmpName + ".pdf";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping(value = "/{id}/preview", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> previewCertificate(@PathVariable UUID id) {
        byte[] pdfBytes = employeeCertificationService.generateCertificatePdf(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmployeeCertificationDTO> verifyCertification(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeCertificationService.verifyCertification(id));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<EmployeeCertificationDTO> startRenewal(@PathVariable UUID id, @RequestBody(required = false) RenewalRequestDTO dto) {
        RenewalRequestDTO reqDto = dto != null ? dto : new RenewalRequestDTO("Renewal process requested");
        return ResponseEntity.ok(employeeCertificationService.startRenewal(id, reqDto));
    }

    @PutMapping("/{id}/renew/progress")
    public ResponseEntity<EmployeeCertificationDTO> completeRenewal(@PathVariable UUID id, @Valid @RequestBody RenewalProgressUpdateDTO dto) {
        return ResponseEntity.ok(employeeCertificationService.completeRenewal(id, dto));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeCertificationDTO>> getCertificationsByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(employeeCertificationService.getCertificationsByEmployee(employeeId));
    }

    @GetMapping("/skill/{skillId}")
    public ResponseEntity<List<EmployeeCertificationDTO>> getCertificationsBySkill(@PathVariable UUID skillId) {
        return ResponseEntity.ok(employeeCertificationService.getCertificationsBySkill(skillId));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<List<EmployeeCertificationDTO>> getActiveCertifications() {
        return ResponseEntity.ok(employeeCertificationService.getActiveCertifications());
    }

    @GetMapping("/expired")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<List<EmployeeCertificationDTO>> getExpiredCertifications() {
        return ResponseEntity.ok(employeeCertificationService.getExpiredCertifications());
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<List<EmployeeCertificationDTO>> getExpiringCertifications() {
        return ResponseEntity.ok(employeeCertificationService.getExpiringCertifications());
    }

    @GetMapping("/compliance/{employeeId}")
    public ResponseEntity<ComplianceCheckResponse> checkCompliance(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(employeeCertificationService.checkEmployeeCompliance(employeeId));
    }

    @GetMapping("/compliance/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<ComplianceSummaryDTO> getComplianceSummary() {
        return ResponseEntity.ok(employeeCertificationService.getComplianceSummary());
    }

    @DeleteMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteCertificationsByEmployee(@PathVariable UUID employeeId) {
        employeeCertificationService.deleteCertificationsByEmployeeId(employeeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request")
    public ResponseEntity<EmployeeCertificationDTO> requestLearningCertificate(@Valid @RequestBody LearningCertificateRequestDTO request) {
        EmployeeCertificationDTO created = employeeCertificationService.requestLearningCertificate(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<EmployeeCertificationDTO>> getPendingRequests() {
        return ResponseEntity.ok(employeeCertificationService.getPendingRequests());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmployeeCertificationDTO> approveRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeCertificationService.approveRequest(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmployeeCertificationDTO> rejectRequest(@PathVariable UUID id, @RequestBody(required = false) java.util.Map<String, String> payload) {
        String reason = (payload != null && payload.get("reason") != null) ? payload.get("reason") : "Rejected by Admin/HR";
        return ResponseEntity.ok(employeeCertificationService.rejectRequest(id, reason));
    }
}
