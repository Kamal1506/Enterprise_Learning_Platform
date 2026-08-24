package com.skillsphere.learning.dto;

import java.time.Instant;
import java.util.UUID;

public record EnrollmentDTO(
    UUID id,
    UUID employeeId,
    UUID courseId,
    String courseTitle,
    UUID learningPathId,
    String learningPathTitle,
    String status,
    Integer progressPercent,
    Integer finalScore,
    Instant enrolledAt,
    Instant completedAt,
    Instant updatedAt,
    String learningSourceUrl
) {}
