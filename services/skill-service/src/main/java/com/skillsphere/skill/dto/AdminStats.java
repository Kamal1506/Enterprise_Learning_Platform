package com.skillsphere.skill.dto;

public record AdminStats(
    long employeesCount,
    long hrManagersCount,
    long skillsCount,
    long pendingApprovalsCount
) {}
