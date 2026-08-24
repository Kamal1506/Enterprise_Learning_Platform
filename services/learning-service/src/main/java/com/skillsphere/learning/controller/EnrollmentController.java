package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.CompleteEnrollmentRequest;
import com.skillsphere.learning.dto.CourseEnrollmentRequest;
import com.skillsphere.learning.dto.EnrollmentDTO;
import com.skillsphere.learning.dto.ProgressUpdateRequest;
import com.skillsphere.learning.service.EnrollmentService;
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
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    // Spec: GET /api/v1/employees/{employeeId}/enrollments
    @GetMapping("/employees/{employeeId}/enrollments")
    public ResponseEntity<List<EnrollmentDTO>> getEnrollmentsByEmployeeSpec(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByEmployee(employeeId));
    }

    // Spec: POST /api/v1/employees/{employeeId}/enrollments
    @PostMapping("/employees/{employeeId}/enrollments")
    public ResponseEntity<EnrollmentDTO> createEnrollmentSpec(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CourseEnrollmentRequest request) {
        EnrollmentDTO created = enrollmentService.createEnrollment(employeeId, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // Spec: PATCH /api/v1/enrollments/{id}/complete
    @PatchMapping("/enrollments/{id}/complete")
    public ResponseEntity<EnrollmentDTO> completeEnrollment(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteEnrollmentRequest request) {
        return ResponseEntity.ok(enrollmentService.completeEnrollment(id, request));
    }

    // Spec: GET /api/v1/employees/{employeeId}/learning-paths/{pathId}/progress
    @GetMapping("/employees/{employeeId}/learning-paths/{pathId}/progress")
    public ResponseEntity<Map<String, Object>> getLearningPathProgress(
            @PathVariable UUID employeeId,
            @PathVariable UUID pathId) {
        int progress = enrollmentService.calculatePathProgress(employeeId, pathId);
        return ResponseEntity.ok(Map.of("progressPercent", progress));
    }

    // Keep compatible routes for dashboard and legacy frontends
    @GetMapping("/enrollments/employee/{employeeId}")
    public ResponseEntity<List<EnrollmentDTO>> getEnrollmentsByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByEmployee(employeeId));
    }

    @PutMapping("/enrollments/{id}/progress")
    public ResponseEntity<EnrollmentDTO> updateProgress(
            @PathVariable UUID id,
            @Valid @RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok(enrollmentService.updateProgress(id, request.progressPercent()));
    }

    @GetMapping("/enrollments/employee/{employeeId}/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getDashboardStats(employeeId));
    }

    @GetMapping("/courses/{courseId}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    public ResponseEntity<List<EnrollmentDTO>> getEnrollmentsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId));
    }

    @DeleteMapping("/employees/{employeeId}/learning-data")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteLearningData(@PathVariable UUID employeeId) {
        enrollmentService.deleteLearningDataByEmployeeId(employeeId);
        return ResponseEntity.noContent().build();
    }
}
