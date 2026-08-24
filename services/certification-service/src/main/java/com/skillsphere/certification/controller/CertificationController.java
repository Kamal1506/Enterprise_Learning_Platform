package com.skillsphere.certification.controller;

import com.skillsphere.certification.dto.CertificationDTO;
import com.skillsphere.certification.dto.CertificationReportDTO;
import com.skillsphere.certification.dto.CertificationAuditDTO;
import com.skillsphere.certification.service.CertificationService;
import com.skillsphere.certification.service.EmployeeCertificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certifications")
public class CertificationController {

    private final CertificationService certificationService;
    private final EmployeeCertificationService employeeCertificationService;

    public CertificationController(CertificationService certificationService,
                                   EmployeeCertificationService employeeCertificationService) {
        this.certificationService = certificationService;
        this.employeeCertificationService = employeeCertificationService;
    }

    @GetMapping
    public ResponseEntity<List<CertificationDTO>> getCertifications() {
        return ResponseEntity.ok(certificationService.getAllCertifications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CertificationDTO> getCertificationById(@PathVariable UUID id) {
        return ResponseEntity.ok(certificationService.getCertificationById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<CertificationDTO> createCertification(@Valid @RequestBody CertificationDTO dto) {
        CertificationDTO created = certificationService.createCertification(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<CertificationDTO> updateCertification(@PathVariable UUID id, @Valid @RequestBody CertificationDTO dto) {
        return ResponseEntity.ok(certificationService.updateCertification(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<Void> deleteCertification(@PathVariable UUID id) {
        certificationService.deleteCertification(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CertificationDTO>> getCertificationsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(certificationService.getCertificationsByCourse(courseId));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<CertificationReportDTO> getReports() {
        return ResponseEntity.ok(employeeCertificationService.getReports());
    }

    @GetMapping("/audits")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<CertificationAuditDTO>> getAudits() {
        return ResponseEntity.ok(employeeCertificationService.getAuditHistory());
    }
}
