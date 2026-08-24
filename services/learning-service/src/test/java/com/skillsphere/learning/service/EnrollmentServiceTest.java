package com.skillsphere.learning.service;

import com.skillsphere.learning.client.SkillServiceClient;
import com.skillsphere.learning.client.CertificationServiceClient;
import com.skillsphere.learning.dto.CompleteEnrollmentRequest;
import com.skillsphere.learning.dto.CourseEnrollmentRequest;
import com.skillsphere.learning.dto.EnrollmentDTO;
import com.skillsphere.learning.entity.*;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.EnrollmentRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import com.skillsphere.learning.repository.LearningPathProgressRepository;
import com.skillsphere.learning.repository.QuizQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private LearningPathProgressRepository learningPathProgressRepository;

    @Mock
    private SkillServiceClient skillServiceClient;

    @Mock
    private CertificationServiceClient certificationServiceClient;

    @Mock
    private CourseCertificateService courseCertificateService;

    @Mock
    private QuizQuestionRepository quizQuestionRepository;

    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentService = new EnrollmentService(
                enrollmentRepository, courseRepository, learningPathRepository, learningPathProgressRepository, skillServiceClient, certificationServiceClient, courseCertificateService, quizQuestionRepository
        );
    }

    @Test
    void createEnrollment_Course_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CourseEnrollmentRequest request = new CourseEnrollmentRequest(courseId, null);

        when(skillServiceClient.employeeExists(employeeId)).thenReturn(true);
        
        Course course = new Course();
        course.setId(courseId);
        course.setTitle("Java Programming");
        course.setCategory(CourseCategory.TECHNICAL);
        course.setDurationHours(20);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        
        when(enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, courseId)).thenReturn(Optional.empty());

        Enrollment saved = new Enrollment();
        saved.setId(UUID.randomUUID());
        saved.setEmployeeId(employeeId);
        saved.setCourseId(courseId);
        saved.setCourse(course);
        saved.setStatus(EnrollmentStatus.ENROLLED);
        saved.setProgressPercent(0);

        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(saved);

        EnrollmentDTO result = enrollmentService.createEnrollment(employeeId, request);

        assertNotNull(result);
        assertEquals(employeeId, result.employeeId());
        assertEquals(courseId, result.courseId());
        assertEquals("Java Programming", result.courseTitle());
        assertEquals("ENROLLED", result.status());
        assertEquals(0, result.progressPercent());
        verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
    }

    @Test
    void createEnrollment_EmployeeNotFound_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        CourseEnrollmentRequest request = new CourseEnrollmentRequest(UUID.randomUUID(), null);

        when(skillServiceClient.employeeExists(employeeId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> enrollmentService.createEnrollment(employeeId, request));
    }

    @Test
    void createEnrollment_AlreadyEnrolled_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CourseEnrollmentRequest request = new CourseEnrollmentRequest(courseId, null);

        when(skillServiceClient.employeeExists(employeeId)).thenReturn(true);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(new Course()));
        when(enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, courseId)).thenReturn(Optional.of(new Enrollment()));

        assertThrows(DuplicateResourceException.class, () -> enrollmentService.createEnrollment(employeeId, request));
    }

    @Test
    void updateProgress_Completes_Success() {
        UUID id = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(id);
        enrollment.setEmployeeId(UUID.randomUUID());
        enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
        enrollment.setProgressPercent(50);

        when(enrollmentRepository.findById(id)).thenReturn(Optional.of(enrollment));

        Enrollment saved = new Enrollment();
        saved.setId(id);
        saved.setEmployeeId(enrollment.getEmployeeId());
        saved.setStatus(EnrollmentStatus.COMPLETED);
        saved.setProgressPercent(100);

        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(saved);

        EnrollmentDTO result = enrollmentService.updateProgress(id, 100);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        assertEquals(100, result.progressPercent());
        verify(enrollmentRepository, times(1)).save(enrollment);
    }

    @Test
    void completeEnrollment_WithScore_Success() {
        UUID id = UUID.randomUUID();
        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(85);

        Enrollment enrollment = new Enrollment();
        enrollment.setId(id);
        enrollment.setEmployeeId(UUID.randomUUID());
        enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
        enrollment.setProgressPercent(50);

        when(enrollmentRepository.findById(id)).thenReturn(Optional.of(enrollment));

        Enrollment saved = new Enrollment();
        saved.setId(id);
        saved.setEmployeeId(enrollment.getEmployeeId());
        saved.setStatus(EnrollmentStatus.COMPLETED);
        saved.setProgressPercent(100);
        saved.setFinalScore(85);

        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(saved);

        EnrollmentDTO result = enrollmentService.completeEnrollment(id, request);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        assertEquals(100, result.progressPercent());
        assertEquals(85, result.finalScore());
        verify(enrollmentRepository, times(1)).save(enrollment);
    }

    @Test
    void calculatePathProgress_WithCompletedCourses() {
        UUID employeeId = UUID.randomUUID();
        UUID pathId = UUID.randomUUID();
        UUID courseId1 = UUID.randomUUID();
        UUID courseId2 = UUID.randomUUID();

        LearningPath path = new LearningPath();
        path.setId(pathId);
        path.setName("Fullstack Path");
        
        LearningPathCourse lpc1 = new LearningPathCourse(pathId, courseId1, 1);
        LearningPathCourse lpc2 = new LearningPathCourse(pathId, courseId2, 2);
        path.setLearningPathCourses(List.of(lpc1, lpc2));

        when(learningPathRepository.findById(pathId)).thenReturn(Optional.of(path));

        Enrollment e1 = new Enrollment();
        e1.setCourseId(courseId1);
        e1.setStatus(EnrollmentStatus.COMPLETED);

        Enrollment e2 = new Enrollment();
        e2.setCourseId(courseId2);
        e2.setStatus(EnrollmentStatus.IN_PROGRESS);

        when(enrollmentRepository.findByEmployeeId(employeeId)).thenReturn(List.of(e1, e2));
        when(learningPathProgressRepository.findByEmployeeIdAndPathId(employeeId, pathId)).thenReturn(Optional.empty());

        int progress = enrollmentService.calculatePathProgress(employeeId, pathId);

        assertEquals(50, progress);
        verify(learningPathProgressRepository, times(1)).save(any(LearningPathProgress.class));
    }

    @Test
    void getEnrollmentsByCourse_Success() {
        UUID courseId = UUID.randomUUID();
        Enrollment e1 = new Enrollment();
        e1.setCourseId(courseId);
        
        when(enrollmentRepository.findByCourseId(courseId)).thenReturn(List.of(e1));
        
        List<EnrollmentDTO> result = enrollmentService.getEnrollmentsByCourse(courseId);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(courseId, result.get(0).courseId());
    }

    @Test
    void deleteLearningDataByEmployeeId_Success() {
        UUID employeeId = UUID.randomUUID();

        enrollmentService.deleteLearningDataByEmployeeId(employeeId);

        verify(enrollmentRepository, times(1)).deleteByEmployeeId(employeeId);
        verify(learningPathProgressRepository, times(1)).deleteByEmployeeId(employeeId);
    }

    @Test
    void getEnrollmentsByEmployee_AccessDeniedForDifferentEmployee() {
        UUID employeeId = UUID.randomUUID();
        
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("employee@skillsphere.com");
        
        org.springframework.security.core.authority.SimpleGrantedAuthority authority = new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_EMPLOYEE");
        doReturn(List.of(authority)).when(auth).getAuthorities();
        
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        
        try {
            when(skillServiceClient.getEmployee(employeeId)).thenReturn(java.util.Map.of("email", "other@skillsphere.com"));
            
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
                enrollmentService.getEnrollmentsByEmployee(employeeId);
            });
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    void completeEnrollment_WithCertification_Success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID certId = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        Course course = new Course();
        course.setId(courseId);
        course.setTitle("Java Programming");
        enrollment.setCourse(course);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock certification lookup: returns an associated certification
        java.util.Map<String, Object> certMap = new java.util.HashMap<>();
        certMap.put("id", certId.toString());
        certMap.put("name", "Java Cert");
        when(certificationServiceClient.getCertificationsByCourse(courseId)).thenReturn(List.of(certMap));
        when(certificationServiceClient.registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class))).thenReturn(true);

        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(95);
        EnrollmentDTO result = enrollmentService.completeEnrollment(enrollmentId, request);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        verify(certificationServiceClient, times(1)).registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class));
    }

    @Test
    void completeEnrollment_WithoutCertification_Success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock certification lookup: returns empty (no cert associated)
        when(certificationServiceClient.getCertificationsByCourse(courseId)).thenReturn(Collections.emptyList());

        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(90);
        EnrollmentDTO result = enrollmentService.completeEnrollment(enrollmentId, request);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        verify(certificationServiceClient, never()).registerEmployeeCertification(any(), any(), any());
    }

    @Test
    void completeEnrollment_CertificationConflict_HandlesGracefully() {
        UUID enrollmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID certId = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, Object> certMap = new java.util.HashMap<>();
        certMap.put("id", certId.toString());
        when(certificationServiceClient.getCertificationsByCourse(courseId)).thenReturn(List.of(certMap));
        // Conflict returns true (treated as idempotent success)
        when(certificationServiceClient.registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class))).thenReturn(true);

        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(90);
        EnrollmentDTO result = enrollmentService.completeEnrollment(enrollmentId, request);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        verify(certificationServiceClient, times(1)).registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class));
    }

    @Test
    void completeEnrollment_CertificationServiceUnavailable_KeepsCompletionValid() {
        UUID enrollmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID certId = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, Object> certMap = new java.util.HashMap<>();
        certMap.put("id", certId.toString());
        when(certificationServiceClient.getCertificationsByCourse(courseId)).thenReturn(List.of(certMap));
        // Unavailable throws exception
        when(certificationServiceClient.registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class)))
                .thenThrow(new com.skillsphere.learning.exception.ServiceUnavailableException("Unreachable"));

        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(90);
        // Completion must succeed even if integration fails
        EnrollmentDTO result = enrollmentService.completeEnrollment(enrollmentId, request);

        assertNotNull(result);
        assertEquals("COMPLETED", result.status());
        verify(certificationServiceClient, times(1)).registerEmployeeCertification(eq(employeeId), eq(certId), any(LocalDate.class));
    }

    @Test
    void completeEnrollment_FailsPassingScoreThreshold() {
        UUID enrollmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setEmployeeId(employeeId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        CompleteEnrollmentRequest request = new CompleteEnrollmentRequest(60); // failing score

        assertThrows(IllegalArgumentException.class, () -> 
            enrollmentService.completeEnrollment(enrollmentId, request)
        );
        verify(enrollmentRepository, never()).save(any());
    }
}
