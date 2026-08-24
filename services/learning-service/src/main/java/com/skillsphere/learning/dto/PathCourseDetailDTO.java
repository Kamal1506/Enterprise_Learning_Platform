package com.skillsphere.learning.dto;

import java.util.UUID;

public record PathCourseDetailDTO(
    UUID courseId,
    String title,
    String category,
    Integer durationHours,
    Integer sequenceOrder
) {}
