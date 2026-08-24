package com.skillsphere.career.controller;

import com.skillsphere.career.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/career/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam String format,
            @RequestParam String type) {

        byte[] reportBytes;
        String filename;
        MediaType mediaType;

        if ("PDF".equalsIgnoreCase(format)) {
            mediaType = MediaType.APPLICATION_PDF;
            if ("applications".equalsIgnoreCase(type)) {
                reportBytes = reportService.generateJobApplicationsPdf();
                filename = "Job_Applications_Report.pdf";
            } else {
                reportBytes = reportService.generateCareerPlansPdf();
                filename = "Career_Plans_Report.pdf";
            }
        } else {
            mediaType = MediaType.parseMediaType("text/csv");
            if ("applications".equalsIgnoreCase(type)) {
                reportBytes = reportService.generateJobApplicationsCsv();
                filename = "Job_Applications_Report.csv";
            } else {
                reportBytes = reportService.generateCareerPlansCsv();
                filename = "Career_Plans_Report.csv";
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(reportBytes, headers, HttpStatus.OK);
    }
}
