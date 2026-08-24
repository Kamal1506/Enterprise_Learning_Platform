package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.SkillGapDTO;
import com.skillsphere.skill.entity.*;
import com.skillsphere.skill.repository.CompetencyFrameworkRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.EmployeeSkillRepository;
import com.skillsphere.skill.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CompetencyServiceTest {

    @Mock
    private CompetencyFrameworkRepository frameworkRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeSkillRepository employeeSkillRepository;

    @Mock
    private com.skillsphere.skill.repository.AppUserRepository appUserRepository;

    @Mock
    private SkillRepository skillRepository;

    private CompetencyService competencyService;

    @BeforeEach
    void setUp() {
        competencyService = new CompetencyService(frameworkRepository, employeeRepository, employeeSkillRepository, appUserRepository, skillRepository);
    }

    @Test
    void calculateSkillGaps_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID javaSkillId = UUID.randomUUID();
        UUID springSkillId = UUID.randomUUID();

        Employee employee = new Employee();
        employee.setId(employeeId);
        employee.setName("Alice Smith");
        employee.setRoleTitle("Tech Lead");
        employee.setEmail("alice@example.com");
        employee.setDepartment("Engineering");
        employee.setExperienceYears(6);
        employee.setRating(BigDecimal.valueOf(4.5));

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        // Framework requirements: Java level 8, Spring Boot level 8
        Skill javaSkill = new Skill();
        javaSkill.setId(javaSkillId);
        javaSkill.setName("Java");
        javaSkill.setCategory(SkillCategory.TECHNICAL);

        Skill springSkill = new Skill();
        springSkill.setId(springSkillId);
        springSkill.setName("Spring Boot");
        springSkill.setCategory(SkillCategory.TECHNICAL);

        CompetencyFramework reqJava = new CompetencyFramework();
        reqJava.setId(UUID.randomUUID());
        reqJava.setRoleName("Tech Lead");
        reqJava.setSkillId(javaSkillId);
        reqJava.setRequiredLevel(8);
        reqJava.setSkill(javaSkill);

        CompetencyFramework reqSpring = new CompetencyFramework();
        reqSpring.setId(UUID.randomUUID());
        reqSpring.setRoleName("Tech Lead");
        reqSpring.setSkillId(springSkillId);
        reqSpring.setRequiredLevel(8);
        reqSpring.setSkill(springSkill);

        when(frameworkRepository.findByRoleNameIgnoreCase("Tech Lead"))
                .thenReturn(List.of(reqJava, reqSpring));

        // Actual skills: Alice has Java level 9 (meets requirement), Spring Boot not mapped (proficiency 0, gap 8)
        EmployeeSkill hasJava = new EmployeeSkill(employeeId, javaSkillId, 9, true);
        hasJava.setSkill(javaSkill);
        when(employeeSkillRepository.findByEmployeeId(employeeId)).thenReturn(List.of(hasJava));

        List<SkillGapDTO> result = competencyService.calculateSkillGaps(employeeId);

        assertNotNull(result);
        assertEquals(2, result.size());

        // Check Java gap (actual 9, required 8 -> gap should be 0)
        SkillGapDTO javaGap = result.stream()
                .filter(g -> g.skillId().equals(javaSkillId))
                .findFirst().orElseThrow();
        assertEquals(9, javaGap.actualLevel());
        assertEquals(8, javaGap.requiredLevel());
        assertEquals(0, javaGap.gap());

        // Check Spring Boot gap (actual 0, required 8 -> gap should be 8)
        SkillGapDTO springGap = result.stream()
                .filter(g -> g.skillId().equals(springSkillId))
                .findFirst().orElseThrow();
        assertEquals(0, springGap.actualLevel());
        assertEquals(8, springGap.requiredLevel());
        assertEquals(8, springGap.gap());
    }

    @Test
    void calculateSkillGaps_AccessDeniedForDifferentEmployee() {
        UUID employeeId = UUID.randomUUID();
        UUID callerEmployeeId = UUID.randomUUID();
        
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("caller@example.com");
        
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        
        try {
            AppUser caller = new AppUser();
            caller.setEmail("caller@example.com");
            caller.setRole(Role.EMPLOYEE);
            caller.setEmployeeId(callerEmployeeId);
            
            when(appUserRepository.findByEmail("caller@example.com")).thenReturn(Optional.of(caller));
            
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
                competencyService.calculateSkillGaps(employeeId);
            });
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
