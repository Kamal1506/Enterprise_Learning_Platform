package com.skillsphere.skill.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    String password,

    @NotBlank(message = "Role is required")
    String role,

    // Employee specific fields (optional, required if role is EMPLOYEE)
    String name,
    String roleTitle,
    String department,
    Integer experienceYears
) {}
