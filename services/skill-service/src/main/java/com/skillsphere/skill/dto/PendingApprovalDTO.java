package com.skillsphere.skill.dto;

import java.time.Instant;
import java.util.UUID;

public record PendingApprovalDTO(
    UUID userId,
    String email,
    String role,
    String name,
    Instant createdAt
) {}
