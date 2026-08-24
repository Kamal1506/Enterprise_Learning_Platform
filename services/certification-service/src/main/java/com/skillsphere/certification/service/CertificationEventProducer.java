package com.skillsphere.certification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class CertificationEventProducer {

    private static final Logger log = LoggerFactory.getLogger(CertificationEventProducer.class);

    public void publishExpiryWarning(UUID employeeCertificationId, UUID employeeId, String certName, LocalDate expiryDate, int daysRemaining) {
        log.info("EVENT_PUBLISHED: Certification Expiry Warning Event -> ID: {}, Employee: {}, Title: '{}', Expiry: {}, Days Remaining: {}",
                employeeCertificationId, employeeId, certName, expiryDate, daysRemaining);
    }

    public void publishExpiredEvent(UUID employeeCertificationId, UUID employeeId, String certName, LocalDate expiryDate) {
        log.info("EVENT_PUBLISHED: Certification Expired Event -> ID: {}, Employee: {}, Title: '{}', Expiry: {}",
                employeeCertificationId, employeeId, certName, expiryDate);
    }

    public void publishRenewalStarted(UUID employeeCertificationId, UUID employeeId, String certName) {
        log.info("EVENT_PUBLISHED: Certification Renewal Started -> ID: {}, Employee: {}, Title: '{}'",
                employeeCertificationId, employeeId, certName);
    }

    public void publishRenewalCompleted(UUID employeeCertificationId, UUID employeeId, String certName, LocalDate newExpiryDate) {
        log.info("EVENT_PUBLISHED: Certification Renewal Completed -> ID: {}, Employee: {}, Title: '{}', New Expiry: {}",
                employeeCertificationId, employeeId, certName, newExpiryDate);
    }
}
