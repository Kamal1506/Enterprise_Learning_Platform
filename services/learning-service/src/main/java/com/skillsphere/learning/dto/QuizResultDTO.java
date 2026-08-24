package com.skillsphere.learning.dto;

public record QuizResultDTO(
    Integer score,
    Boolean passed,
    String status
) {}
