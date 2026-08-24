package com.skillsphere.certification.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CertificationRegistrationRequest(
    @NotNull(message = "Employee ID is required")
    UUID employeeId,
    
    @NotNull(message = "Certification ID is required")
    UUID certificationId,
    
    String credentialId,
    
    @NotNull(message = "Issue date is required")
    LocalDate issueDate,
    
    LocalDate expiryDate,
    
    String status,
    
    String documentUrl,
    
    String notes
) {}
