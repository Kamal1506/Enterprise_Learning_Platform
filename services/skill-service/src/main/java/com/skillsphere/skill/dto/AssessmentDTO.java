package com.skillsphere.skill.dto;

import java.time.Instant;
import java.util.UUID;

public record AssessmentDTO(
    UUID id,
    UUID employeeId,
    String skillOrTopic,
    Integer score,
    Boolean passed,
    Instant takenAt,
    Boolean verified,
    String verifiedBy
) {}
