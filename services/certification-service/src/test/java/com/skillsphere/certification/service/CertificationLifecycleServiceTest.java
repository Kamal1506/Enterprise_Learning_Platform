package com.skillsphere.certification.service;

import com.skillsphere.certification.entity.Certification;
import com.skillsphere.certification.entity.CertificationStatus;
import com.skillsphere.certification.entity.EmployeeCertification;
import com.skillsphere.certification.entity.RenewalStatus;
import com.skillsphere.certification.repository.EmployeeCertificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CertificationLifecycleServiceTest {

    @Mock
    private EmployeeCertificationRepository repository;

    @Mock
    private CertificationAuditService auditService;

    @Mock
    private CertificationEventProducer eventProducer;

    private CertificationLifecycleService service;

    @BeforeEach
    void setUp() {
        this.service = new CertificationLifecycleService(repository, auditService, eventProducer);
    }

    @Test
    void runExpiryCheck_MoreThan30Days_NoChange() {
        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        service.runExpiryCheck();

        verify(repository, never()).save(any());
        verify(auditService, never()).log(any(), any(), any(), any(), any(), any(), any(), any());
        verify(eventProducer, never()).publishExpiryWarning(any(), any(), any(), any(), anyInt());
    }

    @Test
    void runExpiryCheck_Exactly30Days_TransitionsToExpiringSoon() {
        LocalDate expiry = LocalDate.now().plusDays(30);
        EmployeeCertification cert = createMockCert(expiry, CertificationStatus.ACTIVE);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(List.of(cert));

        service.runExpiryCheck();

        assertEquals(CertificationStatus.EXPIRING_SOON, cert.getStatus());
        assertEquals(RenewalStatus.DUE_SOON, cert.getRenewalStatus());
        verify(repository, times(1)).save(cert);
        verify(auditService, times(1)).log(eq("CERTIFICATION_EXPIRING_SOON"), any(), eq(cert.getId()), eq(cert.getEmployeeId()), any(), any(), any(), any());
        verify(eventProducer, times(1)).publishExpiryWarning(eq(cert.getId()), eq(cert.getEmployeeId()), any(), eq(expiry), eq(30));
    }

    @Test
    void runExpiryCheck_15DaysRemaining_TransitionsToExpiringSoon() {
        LocalDate expiry = LocalDate.now().plusDays(15);
        EmployeeCertification cert = createMockCert(expiry, CertificationStatus.ACTIVE);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(List.of(cert));

        service.runExpiryCheck();

        assertEquals(CertificationStatus.EXPIRING_SOON, cert.getStatus());
        assertEquals(RenewalStatus.DUE_SOON, cert.getRenewalStatus());
        verify(repository, times(1)).save(cert);
    }

    @Test
    void runExpiryCheck_ExpiryToday_TransitionsToExpired() {
        LocalDate expiry = LocalDate.now();
        EmployeeCertification cert = createMockCert(expiry, CertificationStatus.EXPIRING_SOON);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(List.of(cert));
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        service.runExpiryCheck();

        assertEquals(CertificationStatus.EXPIRED, cert.getStatus());
        assertEquals(RenewalStatus.DUE_SOON, cert.getRenewalStatus());
        verify(repository, times(1)).save(cert);
        verify(auditService, times(1)).log(eq("CERTIFICATION_EXPIRED"), any(), eq(cert.getId()), eq(cert.getEmployeeId()), any(), any(), any(), any());
        verify(eventProducer, times(1)).publishExpiredEvent(eq(cert.getId()), eq(cert.getEmployeeId()), any(), eq(expiry));
    }

    @Test
    void runExpiryCheck_AlreadyExpired_TransitionsToExpired() {
        LocalDate expiry = LocalDate.now().minusDays(1);
        EmployeeCertification cert = createMockCert(expiry, CertificationStatus.ACTIVE);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(List.of(cert));
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        service.runExpiryCheck();

        assertEquals(CertificationStatus.EXPIRED, cert.getStatus());
        verify(repository, times(1)).save(cert);
    }

    @Test
    void runExpiryCheck_RevokedState_NotOverwritten() {
        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        service.runExpiryCheck();

        verify(repository, never()).save(any());
    }

    @Test
    void runExpiryCheck_Idempotency_NoChangeOnSecondRun() {
        LocalDate expiry = LocalDate.now().plusDays(30);
        EmployeeCertification cert = createMockCert(expiry, CertificationStatus.ACTIVE);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(List.of(cert));

        service.runExpiryCheck();

        assertEquals(CertificationStatus.EXPIRING_SOON, cert.getStatus());
        verify(repository, times(1)).save(cert);
        verify(auditService, times(1)).log(eq("CERTIFICATION_EXPIRING_SOON"), any(), any(), any(), any(), any(), any(), any());

        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        service.runExpiryCheck();

        verify(repository, times(1)).save(cert);
        verify(auditService, times(1)).log(eq("CERTIFICATION_EXPIRING_SOON"), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void runExpiryCheck_NullExpiry_HandledSafely() {
        EmployeeCertification cert = createMockCert(null, CertificationStatus.ACTIVE);

        when(repository.findExpiredCertificationsToUpdate(any(), any())).thenReturn(List.of(cert));
        when(repository.findExpiringCertificationsToUpdate(any(), any(), any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> service.runExpiryCheck());
        verify(repository, never()).save(cert);
    }

    private EmployeeCertification createMockCert(LocalDate expiryDate, CertificationStatus status) {
        EmployeeCertification ec = new EmployeeCertification();
        ec.setId(UUID.randomUUID());
        ec.setEmployeeId(UUID.randomUUID());
        ec.setCertificationId(UUID.randomUUID());
        ec.setExpiryDate(expiryDate);
        ec.setStatus(status);
        ec.setRenewalStatus(RenewalStatus.NOT_REQUIRED);

        Certification certDef = new Certification();
        certDef.setId(ec.getCertificationId());
        certDef.setName("Scrum Master Certification");
        ec.setCertification(certDef);

        return ec;
    }
}
