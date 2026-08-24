package com.skillsphere.learning.dto;

import java.time.Instant;
import java.util.UUID;

public record ModuleCompletionDTO(
    UUID id,
    UUID employeeId,
    UUID moduleId,
    UUID courseId,
    Instant completedAt
) {}
