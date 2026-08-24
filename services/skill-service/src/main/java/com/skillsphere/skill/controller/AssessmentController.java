package com.skillsphere.skill.controller;

import com.skillsphere.skill.dto.AssessmentDTO;
import com.skillsphere.skill.dto.AssessmentRequest;
import com.skillsphere.skill.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/{id}/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping
    public ResponseEntity<AssessmentDTO> createAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody AssessmentRequest request) {
        AssessmentDTO created = assessmentService.createAssessment(id, request);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<AssessmentDTO>> getAssessments(@PathVariable UUID id) {
        return ResponseEntity.ok(assessmentService.getAssessments(id));
    }

    @PostMapping("/{assessmentId}/verify")
    public ResponseEntity<AssessmentDTO> verifyAssessment(
            @PathVariable UUID id,
            @PathVariable UUID assessmentId,
            org.springframework.security.core.Authentication authentication) {
        String assessor = authentication != null ? authentication.getName() : "Assessor";
        AssessmentDTO verified = assessmentService.verifyAssessment(id, assessmentId, assessor);
        return ResponseEntity.ok(verified);
    }
}
