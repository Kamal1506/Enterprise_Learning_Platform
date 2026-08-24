package com.skillsphere.skill.controller;

import com.skillsphere.skill.dto.EmployeeDTO;
import com.skillsphere.skill.dto.AdminStats;
import com.skillsphere.skill.entity.Role;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.service.AssessmentService;
import com.skillsphere.skill.service.EmployeeService;
import com.skillsphere.skill.service.SkillService;
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
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final SkillService skillService;
    private final AssessmentService assessmentService;
    private final AppUserRepository appUserRepository;

    public EmployeeController(EmployeeService employeeService,
                              SkillService skillService,
                              AssessmentService assessmentService,
                              AppUserRepository appUserRepository) {
        this.employeeService = employeeService;
        this.skillService = skillService;
        this.assessmentService = assessmentService;
        this.appUserRepository = appUserRepository;
    }

    @GetMapping
    public ResponseEntity<Page<EmployeeDTO>> getEmployees(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String roleTitle,
            @RequestParam(required = false) Integer experienceMin,
            @RequestParam(required = false) Integer experienceMax,
            @RequestParam(required = false) java.util.List<UUID> skills,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<EmployeeDTO> employees = employeeService.getAllEmployees(
                department, roleTitle, experienceMin, experienceMax, skills, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/departments")
    public ResponseEntity<java.util.List<String>> getDepartments() {
        return ResponseEntity.ok(employeeService.getUniqueDepartments());
    }

    @GetMapping("/roles")
    public ResponseEntity<java.util.List<String>> getRoles() {
        return ResponseEntity.ok(employeeService.getUniqueRoles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable UUID id) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeDTO dto) {
        EmployeeDTO created = employeeService.createEmployee(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable UUID id, @Valid @RequestBody EmployeeDTO dto) {
        EmployeeDTO updated = employeeService.updateEmployee(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable UUID id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        DashboardStats stats = new DashboardStats(
                employeeService.countEmployees(),
                skillService.countDistinctSkillsTracked(),
                assessmentService.countAssessmentsThisMonth()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin-stats")
    public ResponseEntity<AdminStats> getAdminStats() {
        AdminStats stats = new AdminStats(
                appUserRepository.countByRole(Role.EMPLOYEE),
                appUserRepository.countByRole(Role.HR_MANAGER),
                skillService.countDistinctSkillsTracked(),
                appUserRepository.countByApprovedFalse()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}/role")
    public ResponseEntity<String> getEmployeeRole(@PathVariable UUID id) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        java.util.Optional<com.skillsphere.skill.entity.AppUser> userOpt = appUserRepository.findByEmail(employee.email());
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get().getRole().name());
        }
        return ResponseEntity.ok("EMPLOYEE");
    }

    public record DashboardStats(
            long employeesCount,
            long skillsTrackedCount,
            long assessmentsThisMonthCount
    ) {}
}
