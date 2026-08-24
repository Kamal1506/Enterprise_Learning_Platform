package com.skillsphere.career.controller;

import com.skillsphere.career.dto.RoadmapTemplateDTO;
import com.skillsphere.career.service.CareerPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roadmaps")
public class RoadmapController {

    private final CareerPlanService careerPlanService;

    public RoadmapController(CareerPlanService careerPlanService) {
        this.careerPlanService = careerPlanService;
    }

    @GetMapping
    public ResponseEntity<List<RoadmapTemplateDTO>> getAllRoadmaps() {
        return ResponseEntity.ok(careerPlanService.getAllRoadmapTemplates());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RoadmapTemplateDTO> createRoadmap(@Valid @RequestBody RoadmapTemplateDTO req) {
        RoadmapTemplateDTO created = careerPlanService.createRoadmapTemplate(req);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RoadmapTemplateDTO> updateRoadmap(
            @PathVariable UUID id,
            @Valid @RequestBody RoadmapTemplateDTO req) {
        return ResponseEntity.ok(careerPlanService.updateRoadmapTemplate(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteRoadmap(@PathVariable UUID id) {
        careerPlanService.deleteRoadmapTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
