package com.skillsphere.career.dto;

import java.time.Instant;
import java.util.UUID;

public record JobApplicationDTO(
    UUID id,
    UUID jobPostingId,
    String jobPostingRoleTitle,
    String jobPostingDepartment,
    String jobPostingLocation,
    UUID employeeId,
    String employeeName,
    String status,
    Instant appliedAt,
    Integer matchPercent
) {}
