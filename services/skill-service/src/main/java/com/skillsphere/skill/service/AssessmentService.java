package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.AssessmentDTO;
import com.skillsphere.skill.dto.AssessmentRequest;
import com.skillsphere.skill.entity.Assessment;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.repository.AssessmentRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AppUserRepository appUserRepository;

    public AssessmentService(AssessmentRepository assessmentRepository, EmployeeRepository employeeRepository, AppUserRepository appUserRepository) {
        this.assessmentRepository = assessmentRepository;
        this.employeeRepository = employeeRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public AssessmentDTO createAssessment(UUID employeeId, AssessmentRequest request) {
        validateUserPermission(employeeId);
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        Assessment assessment = new Assessment();
        assessment.setEmployeeId(employeeId);
        assessment.setSkillOrTopic(request.skillOrTopic());
        assessment.setScore(request.score());
        assessment.setPassed(request.score() >= 70); // passing threshold is 70%
        assessment.setTakenAt(Instant.now());
        assessment.setVerified(false);

        Assessment saved = assessmentRepository.save(assessment);
        return mapToDTO(saved);
    }

    public List<AssessmentDTO> getAssessments(UUID employeeId) {
        validateUserPermission(employeeId);
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }
        return assessmentRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssessmentDTO verifyAssessment(UUID employeeId, UUID assessmentId, String verifiedBy) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + assessmentId));
        if (!assessment.getEmployeeId().equals(employeeId)) {
            throw new IllegalArgumentException("Assessment does not belong to the specified employee");
        }
        assessment.setVerified(true);
        assessment.setVerifiedBy(verifiedBy);
        Assessment saved = assessmentRepository.save(assessment);
        return mapToDTO(saved);
    }

    public long countAssessmentsThisMonth() {
        Instant firstDayOfMonth = Instant.now().atZone(ZoneOffset.UTC)
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0)
                .toInstant();
        return assessmentRepository.countByTakenAtAfter(firstDayOfMonth);
    }

    private AssessmentDTO mapToDTO(Assessment a) {
        return new AssessmentDTO(
                a.getId(),
                a.getEmployeeId(),
                a.getSkillOrTopic(),
                a.getScore(),
                a.getPassed(),
                a.getTakenAt(),
                a.getVerified(),
                a.getVerifiedBy()
        );
    }

    private void validateUserPermission(UUID employeeId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            com.skillsphere.skill.entity.AppUser caller = appUserRepository.findByEmail(email)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User context not found."));
            
            if (caller.getRole() == com.skillsphere.skill.entity.Role.EMPLOYEE) {
                if (caller.getEmployeeId() == null || !caller.getEmployeeId().equals(employeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Employees can only map or assess skills on their own profile.");
                }
            }
        }
    }
}
