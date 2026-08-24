package com.skillsphere.skill.dto;

import java.time.Instant;
import java.util.UUID;

public record AuthResponse(
    String token,
    Instant expiresAt,
    String role,
    String email,
    UUID employeeId
) {}
