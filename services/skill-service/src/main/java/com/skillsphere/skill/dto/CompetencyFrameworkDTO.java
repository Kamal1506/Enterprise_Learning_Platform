package com.skillsphere.skill.dto;

import java.util.UUID;

public record CompetencyFrameworkDTO(
    UUID id,
    String roleName,
    UUID skillId,
    String skillName,
    String category,
    Integer requiredLevel
) {}
