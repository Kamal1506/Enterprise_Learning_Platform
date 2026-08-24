package com.skillsphere.certification.dto;

import java.time.Instant;
import java.util.UUID;

public record CertificationAuditDTO(
    UUID id,
    String actionType,
    UUID certificationId,
    String certificationName,
    UUID employeeCertificationId,
    UUID employeeId,
    String performedBy,
    Instant timestamp,
    String previousValue,
    String newValue,
    String reason,
    String source
) {}
