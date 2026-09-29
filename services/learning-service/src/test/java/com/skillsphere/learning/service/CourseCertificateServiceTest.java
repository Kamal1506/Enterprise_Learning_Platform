package com.skillsphere.learning.service;

import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCertificate;
import com.skillsphere.learning.entity.Enrollment;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseCertificateRepository;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.client.SkillServiceClient;
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
public class CourseCertificateServiceTest {

    @Mock
    private CourseCertificateRepository certificateRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private SkillServiceClient skillServiceClient;

    @Mock
    private EnrollmentService enrollmentService;

    private CourseCertificateService certificateService;

    @BeforeEach
    void setUp() {
        certificateService = new CourseCertificateService(
                certificateRepository, courseRepository, skillServiceClient, enrollmentService
        );
    }

    @Test
    void generateCertificate_New_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = new Enrollment();
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);

        Course course = new Course();
        course.setId(courseId);
        course.setTitle("Java Programming");

        when(certificateRepository.findByEmployeeIdAndCourseId(employeeId, courseId)).thenReturn(Optional.empty());
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        
        CourseCertificate mockSaved = new CourseCertificate();
        mockSaved.setId(UUID.randomUUID());
        mockSaved.setCredentialId("SSN-CERT-2026-TEST");
        mockSaved.setEmployeeId(employeeId);
        mockSaved.setCourseId(courseId);
        mockSaved.setCourseNameSnapshot("Java Programming");
        mockSaved.setIssueDate(LocalDate.now());

        when(certificateRepository.save(any(CourseCertificate.class))).thenReturn(mockSaved);

        CourseCertificate result = certificateService.generateCertificate(enrollment);

        assertNotNull(result);
        assertEquals("SSN-CERT-2026-TEST", result.getCredentialId());
        assertEquals(employeeId, result.getEmployeeId());
        assertEquals(courseId, result.getCourseId());
        assertEquals("Java Programming", result.getCourseNameSnapshot());
        verify(certificateRepository, times(1)).save(any(CourseCertificate.class));
    }

    @Test
    void generateCertificate_Existing_ReturnsExisting() {
        UUID employeeId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = new Enrollment();
        enrollment.setEmployeeId(employeeId);
        enrollment.setCourseId(courseId);

        CourseCertificate existing = new CourseCertificate();
        existing.setId(UUID.randomUUID());
        existing.setCredentialId("SSN-CERT-2026-EXISTING");

        when(certificateRepository.findByEmployeeIdAndCourseId(employeeId, courseId)).thenReturn(Optional.of(existing));

        CourseCertificate result = certificateService.generateCertificate(enrollment);

        assertNotNull(result);
        assertEquals("SSN-CERT-2026-EXISTING", result.getCredentialId());
        verify(courseRepository, never()).findById(any());
        verify(certificateRepository, never()).save(any());
    }

    @Test
    void getCertificateById_Success() {
        UUID id = UUID.randomUUID();
        CourseCertificate cert = new CourseCertificate();
        cert.setId(id);
        cert.setEmployeeId(UUID.randomUUID());

        when(certificateRepository.findById(id)).thenReturn(Optional.of(cert));

        CourseCertificate result = certificateService.getCertificateById(id);

        assertNotNull(result);
        assertEquals(id, result.getId());
        verify(enrollmentService, times(1)).verifyEmployeeAccess(cert.getEmployeeId());
    }

    @Test
    void getCertificateById_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        when(certificateRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> certificateService.getCertificateById(id));
    }

    @Test
    void getCertificatesByEmployee_Success() {
        UUID employeeId = UUID.randomUUID();
        List<CourseCertificate> certs = List.of(new CourseCertificate());

        when(certificateRepository.findByEmployeeId(employeeId)).thenReturn(certs);

        List<CourseCertificate> result = certificateService.getCertificatesByEmployee(employeeId);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(enrollmentService, times(1)).verifyEmployeeAccess(employeeId);
    }

    @Test
    void generateCertificatePdf_Success() {
        UUID id = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        
        CourseCertificate cert = new CourseCertificate();
        cert.setId(id);
        cert.setEmployeeId(employeeId);
        cert.setCredentialId("SSN-CERT-2026-ABCDEF12");
        cert.setCourseNameSnapshot("Testing Frameworks");
        cert.setIssueDate(LocalDate.now());

        when(certificateRepository.findById(id)).thenReturn(Optional.of(cert));
        
        Map<String, Object> empDetails = new HashMap<>();
        empDetails.put("name", "John Doe");
        when(skillServiceClient.getEmployee(employeeId)).thenReturn(empDetails);

        byte[] pdfBytes = certificateService.generateCertificatePdf(id);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        verify(enrollmentService, times(1)).verifyEmployeeAccess(employeeId);
    }
}
