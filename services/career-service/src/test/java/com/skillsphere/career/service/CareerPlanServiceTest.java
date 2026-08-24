package com.skillsphere.career.service;

import com.skillsphere.career.client.CertificationServiceClient;
import com.skillsphere.career.client.EmployeeServiceClient;
import com.skillsphere.career.client.LearningServiceClient;
import com.skillsphere.career.dto.*;
import com.skillsphere.career.entity.CareerPlan;
import com.skillsphere.career.entity.CareerRoadmap;
import com.skillsphere.career.exception.DuplicateResourceException;
import com.skillsphere.career.repository.CareerPlanRepository;
import com.skillsphere.career.repository.CareerRoadmapRepository;
import com.skillsphere.career.repository.JobApplicationRepository;
import com.skillsphere.career.repository.MentorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CareerPlanServiceTest {

    @Mock
    private CareerPlanRepository careerPlanRepository;
    @Mock
    private CareerRoadmapRepository roadmapRepository;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private EmployeeServiceClient employeeServiceClient;
    @Mock
    private LearningServiceClient learningServiceClient;
    @Mock
    private CertificationServiceClient certificationServiceClient;

    private CareerPlanService service;

    @BeforeEach
    public void setup() {
        this.service = new CareerPlanService(
                careerPlanRepository,
                roadmapRepository,
                mentorRepository,
                jobApplicationRepository,
                employeeServiceClient,
                learningServiceClient,
                certificationServiceClient
        );
    }

    @Test
    public void testCreatePlan_Success() {
        UUID employeeId = UUID.randomUUID();
        CareerPlanCreateRequest req = new CareerPlanCreateRequest(
                employeeId,
                "Senior Software Engineer",
                "Learn advanced architecture",
                null,
                "12 months",
                LocalDate.now().plusMonths(12),
                "Monthly",
                "Start training"
        );

        Map<String, Object> emp = new HashMap<>();
        emp.put("id", employeeId.toString());
        emp.put("name", "Bob Jones");
        emp.put("roleTitle", "Associate Developer");
        emp.put("department", "Engineering");
        emp.put("experienceYears", 2);

        when(careerPlanRepository.findByEmployeeId(employeeId)).thenReturn(Optional.empty());
        when(employeeServiceClient.getEmployee(employeeId)).thenReturn(emp);
        when(careerPlanRepository.save(any(CareerPlan.class))).thenAnswer(i -> {
            CareerPlan saved = i.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CareerPlanDTO res = service.createPlan(req);

        assertNotNull(res);
        assertEquals("Bob Jones", res.employeeName());
        assertEquals("Associate Developer", res.currentRole());
        assertEquals("Senior Software Engineer", res.targetRole());
        verify(careerPlanRepository, times(1)).save(any(CareerPlan.class));
    }

    @Test
    public void testCreatePlan_Duplicate() {
        UUID employeeId = UUID.randomUUID();
        CareerPlanCreateRequest req = new CareerPlanCreateRequest(
                employeeId,
                "Senior Software Engineer",
                "Goal",
                null,
                "12 months",
                null,
                null,
                null
        );

        when(careerPlanRepository.findByEmployeeId(employeeId)).thenReturn(Optional.of(new CareerPlan()));

        assertThrows(DuplicateResourceException.class, () -> service.createPlan(req));
        verify(careerPlanRepository, never()).save(any(CareerPlan.class));
    }

    @Test
    public void testCreateRoadmapTemplate_Success() {
        RoadmapTemplateDTO req = new RoadmapTemplateDTO(
                null,
                "Quality Assurance Path",
                List.of("QA Analyst", "Senior QA Analyst", "QA Lead")
        );

        when(roadmapRepository.findByTitle("Quality Assurance Path")).thenReturn(Optional.empty());
        when(roadmapRepository.save(any(CareerRoadmap.class))).thenAnswer(i -> {
            CareerRoadmap saved = i.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        RoadmapTemplateDTO res = service.createRoadmapTemplate(req);

        assertNotNull(res);
        assertNotNull(res.id());
        assertEquals("Quality Assurance Path", res.title());
        assertEquals(3, res.steps().size());
        assertEquals("QA Lead", res.steps().get(2));
        verify(roadmapRepository, times(1)).save(any(CareerRoadmap.class));
    }

    @Test
    public void testCreateRoadmapTemplate_Duplicate() {
        RoadmapTemplateDTO req = new RoadmapTemplateDTO(
                null,
                "Engineering Path",
                List.of("Associate Developer", "Senior Developer")
        );

        when(roadmapRepository.findByTitle("Engineering Path")).thenReturn(Optional.of(new CareerRoadmap()));

        assertThrows(DuplicateResourceException.class, () -> service.createRoadmapTemplate(req));
        verify(roadmapRepository, never()).save(any(CareerRoadmap.class));
    }
}
