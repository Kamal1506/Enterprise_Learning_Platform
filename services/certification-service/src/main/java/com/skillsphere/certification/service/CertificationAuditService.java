package com.skillsphere.certification.service;

import com.skillsphere.certification.entity.CertificationAudit;
import com.skillsphere.certification.repository.CertificationAuditRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CertificationAuditService {

    final CertificationAuditRepository auditRepository;

    public CertificationAuditService(CertificationAuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @Transactional
    public void log(String actionType, UUID certificationId, UUID employeeCertificationId, UUID employeeId,
                    String previousValue, String newValue, String reason, String source) {
        String username = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "SYSTEM";

        CertificationAudit audit = new CertificationAudit();
        audit.setActionType(actionType);
        audit.setCertificationId(certificationId);
        audit.setEmployeeCertificationId(employeeCertificationId);
        audit.setEmployeeId(employeeId);
        audit.setPerformedBy(username);
        audit.setTimestamp(Instant.now());
        audit.setPreviousValue(previousValue);
        audit.setNewValue(newValue);
        audit.setReason(reason);
        audit.setSource(source != null ? source : "Web App");

        auditRepository.save(audit);
    }
}
