package com.skillsphere.career.controller;

import com.skillsphere.career.dto.JobApplicationDTO;
import com.skillsphere.career.dto.JobMatchDTO;
import com.skillsphere.career.dto.JobPostingDTO;
import com.skillsphere.career.service.JobPortalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class JobPortalController {

    private final JobPortalService jobPortalService;

    public JobPortalController(JobPortalService jobPortalService) {
        this.jobPortalService = jobPortalService;
    }

    @GetMapping("/job-postings")
    public ResponseEntity<List<JobPostingDTO>> getActiveJobs() {
        return ResponseEntity.ok(jobPortalService.getActiveJobs());
    }

    @GetMapping("/job-postings/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<JobPostingDTO>> getAllJobs() {
        return ResponseEntity.ok(jobPortalService.getAllJobs());
    }

    @GetMapping("/job-postings/{id}")
    public ResponseEntity<JobPostingDTO> getJobById(@PathVariable UUID id) {
        return ResponseEntity.ok(jobPortalService.getJobById(id));
    }

    @PostMapping("/job-postings")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<JobPostingDTO> createJobPosting(@Valid @RequestBody JobPostingDTO dto) {
        JobPostingDTO created = jobPortalService.createJobPosting(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/job-postings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<JobPostingDTO> updateJobPosting(@PathVariable UUID id, @Valid @RequestBody JobPostingDTO dto) {
        return ResponseEntity.ok(jobPortalService.updateJobPosting(id, dto));
    }

    @DeleteMapping("/job-postings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteJobPosting(@PathVariable UUID id) {
        jobPortalService.deleteJobPosting(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/job-postings/{id}/match/{employeeId}")
    public ResponseEntity<JobMatchDTO> getJobMatch(@PathVariable UUID id, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(jobPortalService.getJobMatch(id, employeeId));
    }

    @PostMapping("/job-postings/{id}/apply")
    public ResponseEntity<JobApplicationDTO> applyForJob(@PathVariable UUID id, @RequestParam UUID employeeId) {
        JobApplicationDTO created = jobPortalService.applyForJob(id, employeeId);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/job-applications")
    public ResponseEntity<List<JobApplicationDTO>> getJobApplications(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID jobId) {
        if (employeeId != null) {
            return ResponseEntity.ok(jobPortalService.getApplicationsForEmployee(employeeId));
        } else if (jobId != null) {
            return ResponseEntity.ok(jobPortalService.getApplicationsForJob(jobId));
        }
        return ResponseEntity.ok(jobPortalService.getAllApplications());
    }

    @PutMapping("/job-applications/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<JobApplicationDTO> updateApplicationStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(jobPortalService.updateApplicationStatus(id, status));
    }
}
