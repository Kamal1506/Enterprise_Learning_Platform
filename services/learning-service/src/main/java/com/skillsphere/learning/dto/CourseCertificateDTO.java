package com.skillsphere.learning.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CourseCertificateDTO(
    UUID id,
    String credentialId,
    UUID employeeId,
    UUID courseId,
    String courseNameSnapshot,
    LocalDate issueDate,
    Instant completionDate,
    String status
) {}
