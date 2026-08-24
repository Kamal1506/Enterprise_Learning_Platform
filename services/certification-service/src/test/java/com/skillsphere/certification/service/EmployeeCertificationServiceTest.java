package com.skillsphere.certification.service;

import com.skillsphere.certification.client.SkillServiceClient;
import com.skillsphere.certification.dto.CertificationRegistrationRequest;
import com.skillsphere.certification.dto.EmployeeCertificationDTO;
import com.skillsphere.certification.dto.RenewalProgressUpdateDTO;
import com.skillsphere.certification.entity.Certification;
import com.skillsphere.certification.entity.CertificationStatus;
import com.skillsphere.certification.entity.EmployeeCertification;
import com.skillsphere.certification.entity.RenewalStatus;
import com.skillsphere.certification.exception.DuplicateResourceException;
import com.skillsphere.certification.exception.ResourceNotFoundException;
import com.skillsphere.certification.repository.CertificationRepository;
import com.skillsphere.certification.repository.EmployeeCertificationRepository;
import com.skillsphere.certification.repository.CertificationAuditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeCertificationServiceTest {

    @Mock
    private EmployeeCertificationRepository employeeCertificationRepository;
    @Mock
    private CertificationRepository certificationRepository;
    @Mock
    private SkillServiceClient skillServiceClient;
    @Mock
    private CertificationAuditService auditService;
    @Mock
    private CertificationAuditRepository auditRepository;
    @Mock
    private CertificationEventProducer eventProducer;

    private EmployeeCertificationService service;

    @BeforeEach
    public void setup() {
        this.service = new EmployeeCertificationService(
                employeeCertificationRepository,
                certificationRepository,
                skillServiceClient,
                auditService,
                auditRepository,
                eventProducer
        );
    }

    @Test
    public void testRegisterCertification_Success() {
        UUID employeeId = UUID.randomUUID();
        UUID certificationId = UUID.randomUUID();

        CertificationRegistrationRequest req = new CertificationRegistrationRequest(
                employeeId,
                certificationId,
                "CRED-123",
                LocalDate.now().minusDays(5),
                null,
                null,
                "http://doc.url",
                "notes"
        );

        Map<String, Object> emp = new HashMap<>();
        emp.put("id", employeeId.toString());
        emp.put("name", "Alice");
        emp.put("department", "Engineering");

        Certification definition = new Certification();
        definition.setId(certificationId);
        definition.setName("AWS Associate");
        definition.setValidityMonths(36);

        when(skillServiceClient.getEmployee(employeeId)).thenReturn(emp);
        when(certificationRepository.findById(certificationId)).thenReturn(Optional.of(definition));
        when(employeeCertificationRepository.findByEmployeeIdAndCertificationId(employeeId, certificationId)).thenReturn(Optional.empty());
        when(employeeCertificationRepository.save(any(EmployeeCertification.class))).thenAnswer(i -> {
            EmployeeCertification saved = i.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCertification(definition);
            return saved;
        });

        EmployeeCertificationDTO res = service.registerCertification(req);

        assertNotNull(res);
        assertEquals(employeeId, res.employeeId());
        assertEquals("AWS Associate", res.certificationName());
        assertEquals(CertificationStatus.ACTIVE.name(), res.status());
        verify(employeeCertificationRepository).save(any(EmployeeCertification.class));
    }

    @Test
    public void testRegisterCertification_FutureDate_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        UUID certificationId = UUID.randomUUID();

        CertificationRegistrationRequest req = new CertificationRegistrationRequest(
                employeeId,
                certificationId,
                "CRED-123",
                LocalDate.now().plusDays(5),
                null,
                null,
                "http://doc.url",
                "notes"
        );

        assertThrows(IllegalArgumentException.class, () -> {
            service.registerCertification(req);
        });
    }

    @Test
    public void testRegisterCertification_EmployeeNotFound_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        UUID certificationId = UUID.randomUUID();

        CertificationRegistrationRequest req = new CertificationRegistrationRequest(
                employeeId,
                certificationId,
                "CRED-123",
                LocalDate.now().minusDays(5),
                null,
                null,
                "http://doc.url",
                "notes"
        );

        when(skillServiceClient.getEmployee(employeeId)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () -> {
            service.registerCertification(req);
        });
    }

    @Test
    public void testRegisterCertification_DuplicateActive_ThrowsException() {
        UUID employeeId = UUID.randomUUID();
        UUID certificationId = UUID.randomUUID();

        CertificationRegistrationRequest req = new CertificationRegistrationRequest(
                employeeId,
                certificationId,
                "CRED-123",
                LocalDate.now().minusDays(5),
                null,
                null,
                "http://doc.url",
                "notes"
        );

        Map<String, Object> emp = new HashMap<>();
        emp.put("id", employeeId.toString());

        Certification definition = new Certification();
        definition.setId(certificationId);
        definition.setValidityMonths(36);

        EmployeeCertification existing = new EmployeeCertification();
        existing.setId(UUID.randomUUID());
        existing.setExpiryDate(LocalDate.now().plusDays(20));
        existing.setStatus(CertificationStatus.ACTIVE);

        when(skillServiceClient.getEmployee(employeeId)).thenReturn(emp);
        when(certificationRepository.findById(certificationId)).thenReturn(Optional.of(definition));
        when(employeeCertificationRepository.findByEmployeeIdAndCertificationId(employeeId, certificationId))
                .thenReturn(Optional.of(existing));

        assertThrows(DuplicateResourceException.class, () -> {
            service.registerCertification(req);
        });
    }

    @Test
    public void testCompleteRenewal_Success() {
        UUID awardId = UUID.randomUUID();

        EmployeeCertification oldCert = new EmployeeCertification();
        oldCert.setId(awardId);
        oldCert.setEmployeeId(UUID.randomUUID());
        oldCert.setCertificationId(UUID.randomUUID());
        oldCert.setStatus(CertificationStatus.RENEWAL_IN_PROGRESS);
        oldCert.setRenewalStatus(RenewalStatus.RENEWAL_REQUESTED);

        Certification definition = new Certification();
        definition.setId(oldCert.getCertificationId());
        definition.setName("AWS Certified");
        definition.setValidityMonths(36);
        oldCert.setCertification(definition);

        RenewalProgressUpdateDTO updateDto = new RenewalProgressUpdateDTO(
                "RENEWED",
                "Renewed successfully",
                LocalDate.now(),
                "NEW-CRED-123",
                "http://new.doc"
        );

        when(employeeCertificationRepository.findById(awardId)).thenReturn(Optional.of(oldCert));
        when(employeeCertificationRepository.save(any(EmployeeCertification.class))).thenAnswer(i -> {
            EmployeeCertification val = i.getArgument(0);
            val.setCertification(definition);
            return val;
        });

        EmployeeCertificationDTO res = service.completeRenewal(awardId, updateDto);

        assertNotNull(res);
        assertEquals(CertificationStatus.ACTIVE.name(), res.status());
        assertEquals(RenewalStatus.NOT_REQUIRED.name(), res.renewalStatus());
        verify(employeeCertificationRepository, times(2)).save(any(EmployeeCertification.class));
    }

    @Test
    public void testDeleteCertificationsByEmployeeId_Success() {
        UUID employeeId = UUID.randomUUID();

        service.deleteCertificationsByEmployeeId(employeeId);

        verify(employeeCertificationRepository, times(1)).deleteByEmployeeId(employeeId);
        verify(auditRepository, times(1)).deleteByEmployeeId(employeeId);
    }

    @Test
    public void getCertificationsByEmployee_AccessDeniedForDifferentEmployee() {
        UUID employeeId = UUID.randomUUID();
        
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("employee@skillsphere.com");
        
        org.springframework.security.core.authority.SimpleGrantedAuthority authority = new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_EMPLOYEE");
        doReturn(java.util.List.of(authority)).when(auth).getAuthorities();
        
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        
        try {
            when(skillServiceClient.getEmployee(employeeId)).thenReturn(java.util.Map.of("email", "other@skillsphere.com"));
            
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
                service.getCertificationsByEmployee(employeeId);
            });
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
