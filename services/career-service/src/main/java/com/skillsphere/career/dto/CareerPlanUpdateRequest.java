package com.skillsphere.career.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public record CareerPlanUpdateRequest(
    @NotBlank(message = "Target role is required")
    String targetRole,
    
    String careerGoal,
    
    String status,
    
    UUID mentorId,
    
    @NotBlank(message = "Timeline is required")
    String timeline,
    
    LocalDate expectedPromotionDate,
    
    String meetingSchedule,
    String guidanceNotes
) {}
