package com.skillsphere.career.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CareerPlanCreateRequest(
    @NotNull(message = "Employee ID is required")
    UUID employeeId,
    
    @NotBlank(message = "Target role is required")
    String targetRole,
    
    String careerGoal,
    
    UUID mentorId,
    
    @NotBlank(message = "Timeline is required")
    String timeline,
    
    LocalDate expectedPromotionDate,
    
    String meetingSchedule,
    String guidanceNotes
) {}
