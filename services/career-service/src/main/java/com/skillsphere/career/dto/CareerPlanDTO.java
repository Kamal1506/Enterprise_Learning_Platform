package com.skillsphere.career.dto;

import java.time.LocalDate;
import java.util.UUID;

public record CareerPlanDTO(
    UUID id,
    UUID employeeId,
    String employeeName,
    String currentRole,
    String targetRole,
    String careerGoal,
    String status,
    MentorDTO mentor,
    String timeline,
    LocalDate expectedPromotionDate,
    String meetingSchedule,
    String guidanceNotes
) {}
