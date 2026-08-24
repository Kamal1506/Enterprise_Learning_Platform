package com.skillsphere.learning.dto;

import java.util.UUID;

public record QuizQuestionDTO(
    UUID id,
    UUID courseId,
    String questionText,
    String optionA,
    String optionB,
    String optionC,
    String optionD,
    String correctOption // Only visible to Admins/HR
) {}
