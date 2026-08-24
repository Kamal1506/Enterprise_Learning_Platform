package com.skillsphere.learning.dto;

import java.util.UUID;

public record CourseModuleDTO(
    UUID id,
    UUID courseId,
    String title,
    String description,
    String content,
    Integer sequenceOrder,
    Integer durationHours,
    boolean active
) {}
