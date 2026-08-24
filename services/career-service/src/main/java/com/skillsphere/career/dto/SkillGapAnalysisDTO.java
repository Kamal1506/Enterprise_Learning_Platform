package com.skillsphere.career.dto;

import java.util.List;
import java.util.UUID;

public record SkillGapAnalysisDTO(
    UUID skillId,
    String skillName,
    String category,
    Integer requiredLevel,
    Integer actualLevel,
    Integer gap,
    String priority,
    List<String> recommendedCourses,
    List<String> recommendedCertifications
) {}
