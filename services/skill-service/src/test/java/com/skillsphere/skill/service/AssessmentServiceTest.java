package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.AssessmentDTO;
import com.skillsphere.skill.dto.AssessmentRequest;
import com.skillsphere.skill.entity.Assessment;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.repository.AssessmentRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.repository.AppUserRepository;
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
public class AssessmentServiceTest {

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AppUserRepository appUserRepository;

    private AssessmentService assessmentService;

    @BeforeEach
    void setUp() {
        assessmentService = new AssessmentService(assessmentRepository, employeeRepository, appUserRepository);
    }

    @Test
    void createAssessment_Success() {
        UUID employeeId = UUID.randomUUID();
        AssessmentRequest request = new AssessmentRequest("Spring Boot", 85);

        when(employeeRepository.existsById(employeeId)).thenReturn(true);
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(i -> {
            Assessment a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AssessmentDTO result = assessmentService.createAssessment(employeeId, request);

        assertNotNull(result);
        assertEquals(employeeId, result.employeeId());
        assertEquals("Spring Boot", result.skillOrTopic());
        assertEquals(85, result.score());
        assertTrue(result.passed());
        assertFalse(result.verified());
    }

    @Test
    void verifyAssessment_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID assessmentId = UUID.randomUUID();

        Assessment a = new Assessment();
        a.setId(assessmentId);
        a.setEmployeeId(employeeId);
        a.setSkillOrTopic("Cloud Architecture");
        a.setScore(90);
        a.setVerified(false);

        when(employeeRepository.existsById(employeeId)).thenReturn(true);
        when(assessmentRepository.findById(assessmentId)).thenReturn(Optional.of(a));
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(i -> i.getArgument(0));

        AssessmentDTO result = assessmentService.verifyAssessment(employeeId, assessmentId, "hr_manager_1");

        assertNotNull(result);
        assertTrue(result.verified());
        assertEquals("hr_manager_1", result.verifiedBy());
    }
}
