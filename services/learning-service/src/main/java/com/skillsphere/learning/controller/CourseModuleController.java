package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.CourseModuleDTO;
import com.skillsphere.learning.dto.ModuleCompletionDTO;
import com.skillsphere.learning.service.CourseModuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class CourseModuleController {

    private final CourseModuleService courseModuleService;

    public CourseModuleController(CourseModuleService courseModuleService) {
        this.courseModuleService = courseModuleService;
    }

    @GetMapping("/courses/{courseId}/modules")
    public ResponseEntity<List<CourseModuleDTO>> getModulesByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseModuleService.getModulesByCourse(courseId));
    }

    @GetMapping("/modules/{id}")
    public ResponseEntity<CourseModuleDTO> getModuleById(@PathVariable UUID id) {
        return ResponseEntity.ok(courseModuleService.getModuleById(id));
    }

    @PostMapping("/courses/{courseId}/modules")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public ResponseEntity<CourseModuleDTO> createModule(@PathVariable UUID courseId, @Valid @RequestBody CourseModuleDTO dto) {
        CourseModuleDTO created = courseModuleService.createModule(courseId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/modules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public ResponseEntity<CourseModuleDTO> updateModule(@PathVariable UUID id, @Valid @RequestBody CourseModuleDTO dto) {
        return ResponseEntity.ok(courseModuleService.updateModule(id, dto));
    }

    @DeleteMapping("/modules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID id) {
        courseModuleService.deleteModule(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/employees/{employeeId}/modules/{moduleId}/complete")
    public ResponseEntity<ModuleCompletionDTO> completeModule(@PathVariable UUID employeeId, @PathVariable UUID moduleId) {
        ModuleCompletionDTO completed = courseModuleService.completeModule(employeeId, moduleId);
        return new ResponseEntity<>(completed, HttpStatus.CREATED);
    }

    @GetMapping("/employees/{employeeId}/courses/{courseId}/completed-modules")
    public ResponseEntity<List<UUID>> getCompletedModuleIds(@PathVariable UUID employeeId, @PathVariable UUID courseId) {
        return ResponseEntity.ok(courseModuleService.getCompletedModuleIds(employeeId, courseId));
    }
}
