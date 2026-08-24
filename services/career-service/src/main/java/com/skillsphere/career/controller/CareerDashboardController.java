package com.skillsphere.career.controller;

import com.skillsphere.career.dto.ExecutiveDashboardDTO;
import com.skillsphere.career.service.CareerPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/career")
public class CareerDashboardController {

    private final CareerPlanService careerPlanService;

    public CareerDashboardController(CareerPlanService careerPlanService) {
        this.careerPlanService = careerPlanService;
    }

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ExecutiveDashboardDTO> getExecutiveDashboardStats() {
        return ResponseEntity.ok(careerPlanService.getExecutiveDashboardStats());
    }
}
