package com.skillsphere.career.dto;

import java.util.UUID;

public record JobPostingDTO(
    UUID id,
    String roleTitle,
    String department,
    String location,
    Integer experienceRequired,
    String requiredSkills, // Comma-separated
    String salaryBand,
    String description,
    String eligibility,
    Boolean active
) {}
