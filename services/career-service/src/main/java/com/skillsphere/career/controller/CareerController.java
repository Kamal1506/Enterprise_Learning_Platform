package com.skillsphere.career.controller;

import com.skillsphere.career.dto.*;
import com.skillsphere.career.service.CareerPlanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/career-plans")
public class CareerController {

    private final CareerPlanService careerPlanService;

    public CareerController(CareerPlanService careerPlanService) {
        this.careerPlanService = careerPlanService;
    }

    @GetMapping
    public ResponseEntity<Page<CareerPlanDTO>> getCareerPlans(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("employeeName").ascending());
        return ResponseEntity.ok(careerPlanService.getAllPlans(status, pageable));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<CareerPlanDetailDTO> getPlanDetailByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(careerPlanService.getPlanDetailByEmployee(employeeId));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<CareerPlanDetailDTO> getPlanDetailById(@PathVariable UUID id) {
        return ResponseEntity.ok(careerPlanService.getPlanDetailById(id));
    }

    @PostMapping
    public ResponseEntity<CareerPlanDTO> createPlan(@Valid @RequestBody CareerPlanCreateRequest req) {
        CareerPlanDTO created = careerPlanService.createPlan(req);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CareerPlanDTO> updatePlan(@PathVariable UUID id, @Valid @RequestBody CareerPlanUpdateRequest req) {
        return ResponseEntity.ok(careerPlanService.updatePlan(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID id) {
        careerPlanService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign-mentor")
    public ResponseEntity<Void> assignMentor(@PathVariable UUID id, @RequestParam UUID mentorId) {
        careerPlanService.assignMentor(id, mentorId);
        return ResponseEntity.ok().build();
    }
}
