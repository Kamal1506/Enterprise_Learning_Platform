package com.skillsphere.certification.dto;

import java.time.Instant;
import java.util.UUID;

public record LearningCertificateRequestDTO(
    UUID employeeId,
    UUID courseId,
    UUID courseCompletionId,
    Instant completionDate,
    Integer assessmentScore,
    Integer completionPercentage,
    String instructor,
    String courseName,
    String category
) {}
