package com.skillsphere.learning.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CourseDTO(
    UUID id,
    
    @NotBlank(message = "Course title is required")
    String title,
    
    String description,
    
    @NotBlank(message = "Course category is required (TECHNICAL, DOMAIN, SOFT)")
    String category,

    @NotBlank(message = "Course type is required (ONLINE, WORKSHOP, WEBINAR, BOOTCAMP)")
    String type,

    String instructor,

    Double rating,

    Long enrolledCount,

    Long completedCount,

    String learningPathName,

    Double learningPathProgress,

    /**
     * The enrollment's own finalScore for the current employee's most recent enrollment in this course.
     * This is the Learning Service's own data, not an external call to Skill Service's Assessment entity.
     */
    Integer lastAssessmentScore,
    String learningSourceUrl,

    @NotNull(message = "Duration in hours is required")
    @Min(value = 1, message = "Duration must be at least 1 hour")
    Integer durationHours,
    
    Instant createdAt,
    Instant updatedAt
) {}
