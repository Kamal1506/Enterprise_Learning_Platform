package com.skillsphere.skill.dto;

import java.time.Instant;
import java.util.UUID;

public record EmployeeSkillDTO(
    UUID employeeId,
    UUID skillId,
    String skillName,
    String category,
    Integer proficiency,
    Boolean verified,
    Instant updatedAt
) {}
