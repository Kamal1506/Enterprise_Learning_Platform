package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.EmployeeSkillDTO;
import com.skillsphere.skill.dto.MapSkillRequest;
import com.skillsphere.skill.entity.EmployeeSkill;
import com.skillsphere.skill.entity.Skill;
import com.skillsphere.skill.entity.SkillCategory;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.exception.DuplicateResourceException;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.EmployeeSkillRepository;
import com.skillsphere.skill.repository.SkillRepository;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.repository.CompetencyFrameworkRepository;
import com.skillsphere.skill.dto.SkillDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SkillServiceTest {

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private EmployeeSkillRepository employeeSkillRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private CompetencyFrameworkRepository frameworkRepository;

    private SkillService skillService;

    @BeforeEach
    void setUp() {
        skillService = new SkillService(skillRepository, employeeSkillRepository, employeeRepository, appUserRepository, frameworkRepository);
    }

    @Test
    void mapEmployeeSkill_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();
        MapSkillRequest request = new MapSkillRequest(skillId, 8, true);

        Skill skill = new Skill();
        skill.setId(skillId);
        skill.setName("Java");
        skill.setCategory(SkillCategory.TECHNICAL);

        when(employeeRepository.existsById(employeeId)).thenReturn(true);
        when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));
        when(employeeSkillRepository.findByEmployeeIdAndSkillId(employeeId, skillId)).thenReturn(Optional.empty());

        EmployeeSkill savedEs = new EmployeeSkill(employeeId, skillId, 8, true);
        savedEs.setSkill(skill);
        when(employeeSkillRepository.save(any(EmployeeSkill.class))).thenReturn(savedEs);

        EmployeeSkillDTO result = skillService.mapEmployeeSkill(employeeId, request);

        assertNotNull(result);
        assertEquals(employeeId, result.employeeId());
        assertEquals(skillId, result.skillId());
        assertEquals("Java", result.skillName());
        assertEquals("TECHNICAL", result.category());
        assertEquals(8, result.proficiency());
        assertTrue(result.verified());
        verify(employeeSkillRepository, times(1)).save(any(EmployeeSkill.class));
    }

    @Test
    void mapEmployeeSkill_EmployeeNotFound_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();
        MapSkillRequest request = new MapSkillRequest(skillId, 8, true);

        when(employeeRepository.existsById(employeeId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> skillService.mapEmployeeSkill(employeeId, request));
    }

    @Test
    void mapEmployeeSkill_DifferentEmployee_ThrowsAccessDenied() {
        UUID employeeId = UUID.randomUUID();
        UUID callerEmployeeId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();
        MapSkillRequest request = new MapSkillRequest(skillId, 8, true);

        // Setup security context with standard EMPLOYEE caller
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("caller@skillsphere.com");
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn("caller@skillsphere.com");

        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(securityContext);

        com.skillsphere.skill.entity.AppUser caller = new com.skillsphere.skill.entity.AppUser();
        caller.setEmail("caller@skillsphere.com");
        caller.setRole(com.skillsphere.skill.entity.Role.EMPLOYEE);
        caller.setEmployeeId(callerEmployeeId);

        when(appUserRepository.findByEmail("caller@skillsphere.com")).thenReturn(Optional.of(caller));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> 
            skillService.mapEmployeeSkill(employeeId, request)
        );

        // Clear security context after test
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void getSkillById_Success() {
        UUID id = UUID.randomUUID();
        Skill skill = new Skill();
        skill.setId(id);
        skill.setName("Docker");
        skill.setCategory(SkillCategory.TECHNICAL);

        when(skillRepository.findById(id)).thenReturn(Optional.of(skill));

        SkillDTO result = skillService.getSkillById(id);

        assertNotNull(result);
        assertEquals("Docker", result.name());
        assertEquals("TECHNICAL", result.category());
    }

    @Test
    void getSkillById_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        when(skillRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> skillService.getSkillById(id));
    }

    @Test
    void updateSkill_Success() {
        UUID id = UUID.randomUUID();
        Skill skill = new Skill();
        skill.setId(id);
        skill.setName("Docker Old");
        skill.setCategory(SkillCategory.TECHNICAL);

        when(skillRepository.findById(id)).thenReturn(Optional.of(skill));
        when(skillRepository.findByNameIgnoreCase("Docker New")).thenReturn(Optional.empty());
        when(skillRepository.save(any(Skill.class))).thenAnswer(i -> i.getArgument(0));

        SkillDTO result = skillService.updateSkill(id, new SkillDTO(id, "Docker New", "TECHNICAL", null));

        assertNotNull(result);
        assertEquals("Docker New", result.name());
    }

    @Test
    void updateSkill_DuplicateName_ThrowsException() {
        UUID id = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        Skill skill = new Skill();
        skill.setId(id);

        Skill otherSkill = new Skill();
        otherSkill.setId(otherId);
        otherSkill.setName("Docker Dup");

        when(skillRepository.findById(id)).thenReturn(Optional.of(skill));
        when(skillRepository.findByNameIgnoreCase("Docker Dup")).thenReturn(Optional.of(otherSkill));

        assertThrows(DuplicateResourceException.class, () -> 
            skillService.updateSkill(id, new SkillDTO(id, "Docker Dup", "TECHNICAL", null))
        );
    }

    @Test
    void updateSkill_InvalidCategory_ThrowsException() {
        UUID id = UUID.randomUUID();
        Skill skill = new Skill();
        skill.setId(id);

        when(skillRepository.findById(id)).thenReturn(Optional.of(skill));

        assertThrows(IllegalArgumentException.class, () -> 
            skillService.updateSkill(id, new SkillDTO(id, "Docker", "INVALID_CAT", null))
        );
    }

    @Test
    void deleteSkill_Success() {
        UUID id = UUID.randomUUID();
        when(skillRepository.existsById(id)).thenReturn(true);

        skillService.deleteSkill(id);

        verify(employeeSkillRepository, times(1)).deleteBySkillId(id);
        verify(frameworkRepository, times(1)).deleteBySkillId(id);
        verify(skillRepository, times(1)).deleteById(id);
    }

    @Test
    void unmapEmployeeSkill_Success() {
        UUID empId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();

        when(employeeRepository.existsById(empId)).thenReturn(true);
        when(skillRepository.existsById(skillId)).thenReturn(true);

        EmployeeSkill es = new EmployeeSkill();
        when(employeeSkillRepository.findByEmployeeIdAndSkillId(empId, skillId)).thenReturn(Optional.of(es));

        skillService.unmapEmployeeSkill(empId, skillId);

        verify(employeeSkillRepository, times(1)).delete(es);
    }

    @Test
    void verifyEmployeeSkill_Success() {
        UUID empId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();

        when(employeeRepository.existsById(empId)).thenReturn(true);
        EmployeeSkill es = new EmployeeSkill();
        es.setVerified(false);
        when(employeeSkillRepository.findByEmployeeIdAndSkillId(empId, skillId)).thenReturn(Optional.of(es));
        when(employeeSkillRepository.save(any(EmployeeSkill.class))).thenAnswer(i -> i.getArgument(0));

        EmployeeSkillDTO result = skillService.verifyEmployeeSkill(empId, skillId);

        assertNotNull(result);
        assertTrue(result.verified());
    }
}
