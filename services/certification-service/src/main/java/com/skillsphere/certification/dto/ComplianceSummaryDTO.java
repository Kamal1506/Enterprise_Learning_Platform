package com.skillsphere.certification.dto;

public record ComplianceSummaryDTO(
    long compliantCount,
    long expiringCount,
    long nonCompliantCount,
    double complianceRate
) {}
