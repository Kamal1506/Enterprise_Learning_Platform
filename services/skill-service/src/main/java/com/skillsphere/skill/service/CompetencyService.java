package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.CompetencyFrameworkDTO;
import com.skillsphere.skill.dto.SkillGapDTO;
import com.skillsphere.skill.entity.CompetencyFramework;
import com.skillsphere.skill.entity.Employee;
import com.skillsphere.skill.entity.EmployeeSkill;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.repository.CompetencyFrameworkRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.EmployeeSkillRepository;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CompetencyService {

    private final CompetencyFrameworkRepository frameworkRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final AppUserRepository appUserRepository;
    private final SkillRepository skillRepository;

    public CompetencyService(CompetencyFrameworkRepository frameworkRepository,
                             EmployeeRepository employeeRepository,
                             EmployeeSkillRepository employeeSkillRepository,
                             AppUserRepository appUserRepository,
                             SkillRepository skillRepository) {
        this.frameworkRepository = frameworkRepository;
        this.employeeRepository = employeeRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.appUserRepository = appUserRepository;
        this.skillRepository = skillRepository;
    }

    public List<CompetencyFrameworkDTO> getFrameworkByRole(String role) {
        String cleanRole = role != null ? role.trim() : "Tech Lead";
        return frameworkRepository.findByRoleNameIgnoreCase(cleanRole).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public CompetencyFrameworkDTO createCompetencyFramework(CompetencyFrameworkDTO dto) {
        com.skillsphere.skill.entity.Skill skill = skillRepository.findById(dto.skillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + dto.skillId()));

        CompetencyFramework cf = new CompetencyFramework();
        cf.setRoleName(dto.roleName());
        cf.setSkillId(dto.skillId());
        cf.setRequiredLevel(dto.requiredLevel());
        
        CompetencyFramework saved = frameworkRepository.save(cf);
        saved.setSkill(skill);
        return mapToDTO(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCompetencyFramework(UUID id) {
        if (!frameworkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Competency framework not found with id: " + id);
        }
        frameworkRepository.deleteById(id);
    }

    public List<SkillGapDTO> calculateSkillGaps(UUID employeeId) {
        validateUserPermission(employeeId);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        // Use employee's roleTitle (e.g. "Tech Lead") as target role
        String targetRole = employee.getRoleTitle();
        List<CompetencyFramework> requirements = frameworkRepository.findByRoleNameIgnoreCase(targetRole);

        // Fetch employee's current skills
        List<EmployeeSkill> actualSkills = employeeSkillRepository.findByEmployeeId(employeeId);
        Map<UUID, EmployeeSkill> actualSkillMap = actualSkills.stream()
                .collect(Collectors.toMap(EmployeeSkill::getSkillId, Function.identity()));

        List<SkillGapDTO> gaps = new ArrayList<>();
        for (CompetencyFramework req : requirements) {
            int actualLevel = 0;
            if (actualSkillMap.containsKey(req.getSkillId())) {
                actualLevel = actualSkillMap.get(req.getSkillId()).getProficiency();
            }

            int gapValue = req.getRequiredLevel() - actualLevel;
            // Gap is 0 if employee has equal or higher proficiency than required
            int gap = Math.max(gapValue, 0);

            gaps.add(new SkillGapDTO(
                    req.getSkillId(),
                    req.getSkill() != null ? req.getSkill().getName() : "Unknown Skill",
                    req.getSkill() != null ? req.getSkill().getCategory().name() : "TECHNICAL",
                    req.getRequiredLevel(),
                    actualLevel,
                    gap
            ));
        }

        return gaps;
    }

    private void validateUserPermission(UUID employeeId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            com.skillsphere.skill.entity.AppUser caller = appUserRepository.findByEmail(email)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User context not found."));
            
            if (caller.getRole() == com.skillsphere.skill.entity.Role.EMPLOYEE) {
                if (caller.getEmployeeId() == null || !caller.getEmployeeId().equals(employeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access Denied: Employees can only check their own skill gaps.");
                }
            }
        }
    }

    private CompetencyFrameworkDTO mapToDTO(CompetencyFramework cf) {
        return new CompetencyFrameworkDTO(
                cf.getId(),
                cf.getRoleName(),
                cf.getSkillId(),
                cf.getSkill() != null ? cf.getSkill().getName() : "Unknown Skill",
                cf.getSkill() != null ? cf.getSkill().getCategory().name() : "TECHNICAL",
                cf.getRequiredLevel()
        );
    }
}
