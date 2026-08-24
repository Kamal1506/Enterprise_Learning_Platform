package com.skillsphere.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CompleteEnrollmentRequest(
    @NotNull(message = "Final score is required")
    @Min(value = 0, message = "Final score must be at least 0")
    @Max(value = 100, message = "Final score cannot exceed 100")
    Integer finalScore
) {}
