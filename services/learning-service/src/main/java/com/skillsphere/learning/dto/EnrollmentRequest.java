package com.skillsphere.learning.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record EnrollmentRequest(
    @NotNull(message = "Employee ID is required")
    UUID employeeId,
    
    UUID courseId,
    UUID learningPathId
) {}
