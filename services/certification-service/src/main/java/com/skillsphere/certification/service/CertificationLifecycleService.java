package com.skillsphere.certification.service;

import com.skillsphere.certification.entity.CertificationStatus;
import com.skillsphere.certification.entity.EmployeeCertification;
import com.skillsphere.certification.entity.RenewalStatus;
import com.skillsphere.certification.repository.EmployeeCertificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CertificationLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(CertificationLifecycleService.class);

    private final EmployeeCertificationRepository employeeCertificationRepository;
    private final CertificationAuditService auditService;
    private final CertificationEventProducer eventProducer;

    public CertificationLifecycleService(EmployeeCertificationRepository employeeCertificationRepository,
                                         CertificationAuditService auditService,
                                         CertificationEventProducer eventProducer) {
        this.employeeCertificationRepository = employeeCertificationRepository;
        this.auditService = auditService;
        this.eventProducer = eventProducer;
    }

    @Transactional
    public void runExpiryCheck() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        log.info("Starting automatic certification expiry check for date: {}", today);

        List<CertificationStatus> excludedForExpired = List.of(
                CertificationStatus.EXPIRED,
                CertificationStatus.REVOKED,
                CertificationStatus.RENEWED,
                CertificationStatus.RENEWAL_IN_PROGRESS
        );

        List<CertificationStatus> excludedForExpiring = List.of(
                CertificationStatus.EXPIRING_SOON,
                CertificationStatus.EXPIRED,
                CertificationStatus.REVOKED,
                CertificationStatus.RENEWED,
                CertificationStatus.RENEWAL_IN_PROGRESS
        );

        int expiredCount = 0;
        int expiringCount = 0;

        // 1. Process Expired Certifications
        try {
            List<EmployeeCertification> expiredToUpdate = employeeCertificationRepository
                    .findExpiredCertificationsToUpdate(today, excludedForExpired);
            
            for (EmployeeCertification cert : expiredToUpdate) {
                try {
                    if (cert.getExpiryDate() == null) {
                        log.warn("Null expiry date detected on certification ID: {}, skipping status update.", cert.getId());
                        continue;
                    }

                    CertificationStatus prevStatus = cert.getStatus();
                    cert.setStatus(CertificationStatus.EXPIRED);
                    if (cert.getRenewalStatus() == RenewalStatus.NOT_REQUIRED) {
                        cert.setRenewalStatus(RenewalStatus.DUE_SOON);
                    }
                    employeeCertificationRepository.save(cert);
                    expiredCount++;

                    // Audit status transition
                    String certName = cert.getCertification() != null ? cert.getCertification().getName() : "Unknown";
                    auditService.log("CERTIFICATION_EXPIRED", 
                            cert.getCertificationId(), 
                            cert.getId(), 
                            cert.getEmployeeId(),
                            "status=" + prevStatus, 
                            "status=EXPIRED", 
                            "System automatic status transition due to expiry date reach", 
                            "System Scheduler");

                    // Publish event
                    eventProducer.publishExpiredEvent(cert.getId(), cert.getEmployeeId(), certName, cert.getExpiryDate());
                } catch (Exception e) {
                    log.error("Failed to update status to EXPIRED for certification record ID: {}. Error: {}", 
                            cert.getId(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to execute expired certifications database query. Error: {}", e.getMessage(), e);
        }

        // 2. Process Expiring Soon Certifications
        try {
            List<EmployeeCertification> expiringToUpdate = employeeCertificationRepository
                    .findExpiringCertificationsToUpdate(today, thirtyDaysFromNow, excludedForExpiring);

            for (EmployeeCertification cert : expiringToUpdate) {
                try {
                    if (cert.getExpiryDate() == null) {
                        log.warn("Null expiry date detected on certification ID: {}, skipping status update.", cert.getId());
                        continue;
                    }

                    CertificationStatus prevStatus = cert.getStatus();
                    cert.setStatus(CertificationStatus.EXPIRING_SOON);
                    if (cert.getRenewalStatus() == RenewalStatus.NOT_REQUIRED) {
                        cert.setRenewalStatus(RenewalStatus.DUE_SOON);
                    }
                    employeeCertificationRepository.save(cert);
                    expiringCount++;

                    // Audit status transition
                    String certName = cert.getCertification() != null ? cert.getCertification().getName() : "Unknown";
                    auditService.log("CERTIFICATION_EXPIRING_SOON", 
                            cert.getCertificationId(), 
                            cert.getId(), 
                            cert.getEmployeeId(),
                            "status=" + prevStatus, 
                            "status=EXPIRING_SOON", 
                            "System automatic status transition due to upcoming expiry", 
                            "System Scheduler");

                    // Publish event
                    eventProducer.publishExpiryWarning(cert.getId(), cert.getEmployeeId(), certName, cert.getExpiryDate(), 30);
                } catch (Exception e) {
                    log.error("Failed to update status to EXPIRING_SOON for certification record ID: {}. Error: {}", 
                            cert.getId(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to execute expiring certifications database query. Error: {}", e.getMessage(), e);
        }

        log.info("Certification expiry check completed. Updated: {} to EXPIRED, {} to EXPIRING_SOON", 
                expiredCount, expiringCount);
    }
}
