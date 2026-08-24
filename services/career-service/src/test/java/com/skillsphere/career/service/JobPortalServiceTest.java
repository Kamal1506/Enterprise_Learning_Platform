package com.skillsphere.career.service;

import com.skillsphere.career.client.EmployeeServiceClient;
import com.skillsphere.career.dto.JobMatchDTO;
import com.skillsphere.career.entity.JobPosting;
import com.skillsphere.career.repository.JobApplicationRepository;
import com.skillsphere.career.repository.JobPostingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobPortalServiceTest {

    @Mock
    private JobPostingRepository jobPostingRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private EmployeeServiceClient employeeServiceClient;

    private JobPortalService service;

    @BeforeEach
    public void setup() {
        this.service = new JobPortalService(
                jobPostingRepository,
                jobApplicationRepository,
                employeeServiceClient
        );
    }

    @Test
    public void testGetJobMatch_AllMatching() {
        UUID jobId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        JobPosting jp = new JobPosting();
        jp.setId(jobId);
        jp.setRequiredSkills("Java, Spring Boot, Angular");
        jp.setRoleTitle("Senior Full Stack Developer");

        List<Map<String, Object>> skills = new ArrayList<>();
        skills.add(Map.of("skillName", "Java", "proficiency", 8));
        skills.add(Map.of("skillName", "Spring Boot", "proficiency", 7));
        skills.add(Map.of("skillName", "Angular", "proficiency", 6));

        when(jobPostingRepository.findById(jobId)).thenReturn(Optional.of(jp));
        when(employeeServiceClient.getEmployeeSkills(employeeId)).thenReturn(skills);

        JobMatchDTO match = service.getJobMatch(jobId, employeeId);

        assertNotNull(match);
        assertEquals(100, match.matchPercent());
        assertEquals(3, match.matchingSkills().size());
        assertTrue(match.missingSkills().isEmpty());
    }

    @Test
    public void testGetJobMatch_PartialMatching() {
        UUID jobId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        JobPosting jp = new JobPosting();
        jp.setId(jobId);
        jp.setRequiredSkills("Java, Spring Boot, Angular");

        List<Map<String, Object>> skills = new ArrayList<>();
        skills.add(Map.of("skillName", "Java", "proficiency", 8));

        when(jobPostingRepository.findById(jobId)).thenReturn(Optional.of(jp));
        when(employeeServiceClient.getEmployeeSkills(employeeId)).thenReturn(skills);

        JobMatchDTO match = service.getJobMatch(jobId, employeeId);

        assertNotNull(match);
        assertEquals(33, match.matchPercent());
        assertEquals(1, match.matchingSkills().size());
        assertEquals(2, match.missingSkills().size());
        assertTrue(match.missingSkills().contains("Spring Boot"));
        assertTrue(match.missingSkills().contains("Angular"));
    }
}
