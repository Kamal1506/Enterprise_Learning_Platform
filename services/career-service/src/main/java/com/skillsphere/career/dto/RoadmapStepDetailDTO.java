package com.skillsphere.career.dto;

import java.util.List;

public record RoadmapStepDetailDTO(
    String roleName,
    List<String> requiredSkills,
    List<String> completedSkills,
    List<String> missingSkills,
    List<String> requiredCourses,
    List<String> completedCourses,
    List<String> requiredCertifications,
    List<String> completedCertifications,
    String status // COMPLETED, IN_PROGRESS, LOCKED
) {}
