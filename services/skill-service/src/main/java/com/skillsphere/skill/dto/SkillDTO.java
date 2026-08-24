package com.skillsphere.skill.dto;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public record SkillDTO(
    UUID id,
    
    @NotBlank(message = "Skill name is required")
    String name,
    
    @NotBlank(message = "Skill category is required")
    String category,
    
    Instant createdAt
) {}
