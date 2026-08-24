package com.skillsphere.learning.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LearningPathDTO(
    UUID id,
    
    @NotBlank(message = "Learning path name is required")
    String name,
    
    String description,
    
    List<PathCourseDetailDTO> courses,
    
    List<UUID> courseIds,
    
    Instant createdAt,
    Instant updatedAt
) {}
