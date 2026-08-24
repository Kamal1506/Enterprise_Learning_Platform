package com.skillsphere.skill.dto;

import java.util.UUID;

public record SkillEmployeeDTO(
    UUID employeeId,
    String name,
    String roleTitle,
    String department,
    int proficiency,
    boolean verified
) {}
