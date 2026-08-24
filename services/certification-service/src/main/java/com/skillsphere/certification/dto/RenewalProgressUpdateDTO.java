package com.skillsphere.certification.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record RenewalProgressUpdateDTO(
    @NotBlank(message = "Renewal status is required")
    String status,
    
    String notes,
    
    LocalDate newIssueDate,
    
    String newCredentialId,
    
    String newDocumentUrl
) {}
