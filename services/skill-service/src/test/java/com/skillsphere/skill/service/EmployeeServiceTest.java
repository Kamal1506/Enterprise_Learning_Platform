package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.EmployeeDTO;
import com.skillsphere.skill.entity.Employee;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.entity.AppUser;
import com.skillsphere.skill.entity.Role;
import com.skillsphere.skill.repository.EmployeeSkillRepository;
import com.skillsphere.skill.repository.AssessmentRepository;
import com.skillsphere.skill.client.LearningServiceClient;
import com.skillsphere.skill.client.CertificationServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private EmployeeSkillRepository employeeSkillRepository;

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private LearningServiceClient learningServiceClient;

    @Mock
    private CertificationServiceClient certificationServiceClient;

    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(
                employeeRepository,
                appUserRepository,
                employeeSkillRepository,
                assessmentRepository,
                learningServiceClient,
                certificationServiceClient
        );
    }

    @Test
    void getAllEmployees_NoSkillsFilter_CallsFindFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        Employee employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Alice Smith");
        employee.setDepartment("Engineering");
        employee.setRoleTitle("Senior Engineer");
        employee.setExperienceYears(6);
        employee.setRating(BigDecimal.valueOf(4.5));

        Page<Employee> page = new PageImpl<>(Collections.singletonList(employee));
        when(employeeRepository.findFiltered("Engineering", "Senior Engineer", 5, 10, pageable))
                .thenReturn(page);

        Page<EmployeeDTO> result = employeeService.getAllEmployees(
                "Engineering", "Senior Engineer", 5, 10, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Alice Smith", result.getContent().get(0).name());
        verify(employeeRepository, times(1))
                .findFiltered("Engineering", "Senior Engineer", 5, 10, pageable);
        verify(employeeRepository, never()).findFilteredWithSkills(any(), any(), any(), any(), any(), any());
    }

    @Test
    void getAllEmployees_WithSkillsFilter_CallsFindFilteredWithSkills() {
        Pageable pageable = PageRequest.of(0, 10);
        List<UUID> skills = Arrays.asList(UUID.randomUUID(), UUID.randomUUID());
        Employee employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Bob Jones");
        employee.setDepartment("Engineering");
        employee.setRoleTitle("Developer");
        employee.setExperienceYears(2);
        employee.setRating(BigDecimal.valueOf(4.0));

        Page<Employee> page = new PageImpl<>(Collections.singletonList(employee));
        when(employeeRepository.findFilteredWithSkills("Engineering", "Developer", 1, 3, skills, pageable))
                .thenReturn(page);

        Page<EmployeeDTO> result = employeeService.getAllEmployees(
                "Engineering", "Developer", 1, 3, skills, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Bob Jones", result.getContent().get(0).name());
        verify(employeeRepository, times(1))
                .findFilteredWithSkills("Engineering", "Developer", 1, 3, skills, pageable);
        verify(employeeRepository, never()).findFiltered(any(), any(), any(), any(), any());
    }

    @Test
    void getUniqueDepartments_ReturnsDistinctDepartments() {
        List<String> depts = Arrays.asList("Engineering", "HR", "Sales");
        when(employeeRepository.findDistinctDepartments()).thenReturn(depts);

        List<String> result = employeeService.getUniqueDepartments();

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals("Engineering", result.get(0));
        verify(employeeRepository, times(1)).findDistinctDepartments();
    }

    @Test
    void getUniqueRoles_ReturnsDistinctRoles() {
        List<String> roles = Arrays.asList("Developer", "Manager");
        when(employeeRepository.findDistinctRoleTitles()).thenReturn(roles);

        List<String> result = employeeService.getUniqueRoles();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Developer", result.get(0));
        verify(employeeRepository, times(1)).findDistinctRoleTitles();
    }

    @Test
    void deleteEmployee_Success() {
        UUID id = UUID.randomUUID();
        when(employeeRepository.existsById(id)).thenReturn(true);
        when(appUserRepository.findByEmployeeId(id)).thenReturn(java.util.Optional.empty());

        employeeService.deleteEmployee(id);

        verify(learningServiceClient, times(1)).deleteLearningData(id);
        verify(certificationServiceClient, times(1)).deleteCertificationData(id);
        verify(employeeSkillRepository, times(1)).deleteByEmployeeId(id);
        verify(assessmentRepository, times(1)).deleteByEmployeeId(id);
        verify(employeeRepository, times(1)).deleteById(id);
    }

    @Test
    void getEmployeeById_AccessDeniedForDifferentEmployee() {
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
            
            when(appUserRepository.findByEmail("caller@example.com")).thenReturn(java.util.Optional.of(caller));
            
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
                employeeService.getEmployeeById(employeeId);
            });
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
