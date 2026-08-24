package com.skillsphere.skill.dto;

import java.util.UUID;

public record SkillGapDTO(
    UUID skillId,
    String skillName,
    String category,
    Integer requiredLevel,
    Integer actualLevel,
    Integer gap
) {}
