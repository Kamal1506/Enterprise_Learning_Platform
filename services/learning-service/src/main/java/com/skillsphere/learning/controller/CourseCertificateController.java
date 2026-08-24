package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.CourseCertificateDTO;
import com.skillsphere.learning.entity.CourseCertificate;
import com.skillsphere.learning.service.CourseCertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/certificates")
public class CourseCertificateController {

    private final CourseCertificateService certificateService;

    public CourseCertificateController(CourseCertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<CourseCertificateDTO>> getCertificatesByEmployee(@PathVariable UUID employeeId) {
        List<CourseCertificateDTO> list = certificateService.getCertificatesByEmployee(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseCertificateDTO> getCertificateById(@PathVariable UUID id) {
        CourseCertificate cert = certificateService.getCertificateById(id);
        return ResponseEntity.ok(mapToDTO(cert));
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<CourseCertificateDTO> previewCertificate(@PathVariable UUID id) {
        CourseCertificate cert = certificateService.getCertificateById(id);
        return ResponseEntity.ok(mapToDTO(cert));
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable UUID id) {
        byte[] pdfBytes = certificateService.generateCertificatePdf(id);
        CourseCertificate cert = certificateService.getCertificateById(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String filename = "Certificate-" + cert.getCredentialId() + ".pdf";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    private CourseCertificateDTO mapToDTO(CourseCertificate c) {
        return new CourseCertificateDTO(
                c.getId(),
                c.getCredentialId(),
                c.getEmployeeId(),
                c.getCourseId(),
                c.getCourseNameSnapshot(),
                c.getIssueDate(),
                c.getCompletionDate(),
                c.getStatus()
        );
    }
}
