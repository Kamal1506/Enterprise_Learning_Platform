package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.EmployeeDTO;
import com.skillsphere.skill.entity.Employee;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.client.LearningServiceClient;
import com.skillsphere.skill.client.CertificationServiceClient;
import com.skillsphere.skill.repository.EmployeeSkillRepository;
import com.skillsphere.skill.repository.AssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final AppUserRepository appUserRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final AssessmentRepository assessmentRepository;
    private final LearningServiceClient learningServiceClient;
    private final CertificationServiceClient certificationServiceClient;

    public EmployeeService(EmployeeRepository employeeRepository,
                           AppUserRepository appUserRepository,
                           EmployeeSkillRepository employeeSkillRepository,
                           AssessmentRepository assessmentRepository,
                           LearningServiceClient learningServiceClient,
                           CertificationServiceClient certificationServiceClient) {
        this.employeeRepository = employeeRepository;
        this.appUserRepository = appUserRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.assessmentRepository = assessmentRepository;
        this.learningServiceClient = learningServiceClient;
        this.certificationServiceClient = certificationServiceClient;
    }

    public Page<EmployeeDTO> getAllEmployees(
            String department,
            String roleTitle,
            Integer experienceMin,
            Integer experienceMax,
            java.util.List<UUID> skills,
            Pageable pageable) {
        Page<Employee> employeePage;
        if (skills != null && !skills.isEmpty()) {
            employeePage = employeeRepository.findFilteredWithSkills(
                    department, roleTitle, experienceMin, experienceMax, skills, pageable);
        } else {
            employeePage = employeeRepository.findFiltered(
                    department, roleTitle, experienceMin, experienceMax, pageable);
        }
        return employeePage.map(this::mapToDTO);
    }

    public java.util.List<String> getUniqueDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    public java.util.List<String> getUniqueRoles() {
        return employeeRepository.findDistinctRoleTitles();
    }

    public EmployeeDTO getEmployeeById(UUID id) {
        validateUserPermission(id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDTO(employee);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setName(dto.name());
        employee.setEmail(dto.email());
        employee.setRoleTitle(dto.roleTitle());
        employee.setDepartment(dto.department());
        employee.setExperienceYears(dto.experienceYears());
        employee.setRating(dto.rating());
        employee.setCreatedAt(Instant.now());
        employee.setUpdatedAt(Instant.now());

        Employee saved = employeeRepository.save(employee);
        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeDTO updateEmployee(UUID id, EmployeeDTO dto) {
        validateUserPermission(id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Enforce HR Managers can only change details/ratings for standard employees, not other HRs or Admins.
        appUserRepository.findByEmployeeId(id).ifPresent(targetUser -> {
            if (targetUser.getRole() == com.skillsphere.skill.entity.Role.HR_MANAGER || targetUser.getRole() == com.skillsphere.skill.entity.Role.ADMIN) {
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null) {
                    boolean isCallerHR = auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_HR_MANAGER"));
                    if (isCallerHR) {
                        throw new org.springframework.security.access.AccessDeniedException("HR Managers can only update standard employee profiles.");
                    }
                }
            }
        });

        employee.setName(dto.name());
        employee.setEmail(dto.email());
        employee.setRoleTitle(dto.roleTitle());
        employee.setDepartment(dto.department());
        employee.setExperienceYears(dto.experienceYears());
        employee.setRating(dto.rating());

        Employee saved = employeeRepository.save(employee);
        return mapToDTO(saved);
    }

    public long countEmployees() {
        return employeeRepository.count();
    }

    @Transactional
    public void deleteEmployee(UUID id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }

        log.info("Employee deletion initiated for ID: {}", id);

        try {
            log.info("Employee learning cleanup initiated for ID: {}", id);
            learningServiceClient.deleteLearningData(id);
            log.info("Employee learning cleanup completed for ID: {}", id);

            log.info("Employee certification cleanup initiated for ID: {}", id);
            certificationServiceClient.deleteCertificationData(id);
            log.info("Employee certification cleanup completed for ID: {}", id);
        } catch (Exception e) {
            log.error("Employee cleanup failed for ID: {}. Error: {}", id, e.getMessage());
            throw e;
        }

        // Delete local employee skills junction records
        employeeSkillRepository.deleteByEmployeeId(id);

        // Delete local employee assessments records
        assessmentRepository.deleteByEmployeeId(id);

        // Delete associated AppUser
        appUserRepository.findByEmployeeId(id).ifPresent(appUserRepository::delete);

        // Delete employee
        employeeRepository.deleteById(id);

        log.info("Employee deletion completed for ID: {}", id);
    }

    private void validateUserPermission(UUID employeeId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            com.skillsphere.skill.entity.AppUser caller = appUserRepository.findByEmail(email)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User context not found."));
            
            if (caller.getRole() == com.skillsphere.skill.entity.Role.EMPLOYEE) {
                if (caller.getEmployeeId() == null || !caller.getEmployeeId().equals(employeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access Denied: Employees can only access their own profile details.");
                }
            }
        }
    }

    public EmployeeDTO mapToDTO(Employee employee) {
        return new EmployeeDTO(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getRoleTitle(),
                employee.getDepartment(),
                employee.getExperienceYears(),
                employee.getRating(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
