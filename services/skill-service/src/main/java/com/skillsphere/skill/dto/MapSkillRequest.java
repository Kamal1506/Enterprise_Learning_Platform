package com.skillsphere.skill.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MapSkillRequest(
    @NotNull(message = "Skill ID is required")
    UUID skillId,

    @NotNull(message = "Proficiency is required")
    @Min(value = 0, message = "Proficiency must be at least 0")
    @Max(value = 10, message = "Proficiency cannot exceed 10")
    Integer proficiency,

    Boolean verified
) {}
