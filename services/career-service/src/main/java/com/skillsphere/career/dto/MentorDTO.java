package com.skillsphere.career.dto;

import java.util.UUID;

public record MentorDTO(
    UUID id,
    UUID employeeId,
    String name,
    String department,
    Integer experienceYears,
    String guidanceNotes
) {}
