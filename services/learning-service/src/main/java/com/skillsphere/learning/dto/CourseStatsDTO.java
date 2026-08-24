package com.skillsphere.learning.dto;

public record CourseStatsDTO(
    long totalCourses,
    long monthlyEnrollments,
    double overallCompletionRate
) {}
