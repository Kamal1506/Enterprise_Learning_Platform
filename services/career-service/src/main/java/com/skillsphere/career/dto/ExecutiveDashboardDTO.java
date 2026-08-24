package com.skillsphere.career.dto;

import java.util.List;
import java.util.Map;

public record ExecutiveDashboardDTO(
    Long totalCareerPlans,
    Long promotionReadyEmployees,
    Integer averageSkillCoverage,
    Integer averageLearningCompletion,
    Integer certificationCoverage,
    Long learningCertificateCount,
    Long professionalCertificateCount,
    Map<String, Integer> departmentSkillGaps,
    Map<String, Long> topRecommendedCourses,
    List<String> topCareerGoals,
    Long internalApplicationsCount,
    Integer promotionReadyPercentage,
    List<PromotionTrendDTO> promotionTrends
) {}
