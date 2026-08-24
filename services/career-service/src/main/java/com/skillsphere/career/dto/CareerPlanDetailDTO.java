package com.skillsphere.career.dto;

import java.util.List;

public record CareerPlanDetailDTO(
    CareerPlanDTO plan,
    List<SkillGapAnalysisDTO> skillGap,
    Integer skillCoveragePercent,
    PromotionReadinessDTO promotionReadiness,
    List<String> completedCourses,
    List<String> completedCertifications,
    List<String> recommendedCourses,
    List<String> recommendedCertifications,
    CareerRoadmapDTO roadmap
) {}
