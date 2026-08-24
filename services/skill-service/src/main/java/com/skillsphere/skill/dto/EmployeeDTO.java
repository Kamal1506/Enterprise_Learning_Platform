package com.skillsphere.skill.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EmployeeDTO(
    UUID id,
    String name,
    String email,
    String roleTitle,
    String department,
    Integer experienceYears,
    BigDecimal rating,
    Instant createdAt,
    Instant updatedAt
) {}
