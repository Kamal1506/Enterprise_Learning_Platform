package com.skillsphere.certification.dto;

import java.util.Map;

public record CertificationReportDTO(
    long totalCount,
    long activeCount,
    long expiredCount,
    long expiringCount,
    double renewalRate,
    Map<String, Long> providerDistribution,
    Map<String, Long> categoryDistribution,
    Map<String, Long> departmentDistribution,
    Map<String, Long> skillDistribution
) {}
