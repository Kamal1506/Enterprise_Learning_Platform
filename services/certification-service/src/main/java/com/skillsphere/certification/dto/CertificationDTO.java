package com.skillsphere.certification.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CertificationDTO(
    UUID id,
    
    @NotBlank(message = "Certification name is required")
    String name,
    
    @NotBlank(message = "Provider is required")
    String provider,
    
    @NotNull(message = "Validity in months is required")
    @Min(value = 1, message = "Validity must be at least 1 month")
    Integer validityMonths,
    
    @NotBlank(message = "Category is required")
    String category,
    
    UUID associatedSkillId,
    
    UUID associatedCourseId,
    
    Instant createdAt,
    
    Instant updatedAt
) {}
