package com.skillsphere.certification.dto;

import java.util.List;
import java.util.UUID;

public record ComplianceCheckResponse(
    UUID employeeId,
    String employeeName,
    String employeeDepartment,
    String complianceStatus,
    List<String> missingCertifications,
    List<EmployeeCertificationDTO> activeCertifications
) {}
