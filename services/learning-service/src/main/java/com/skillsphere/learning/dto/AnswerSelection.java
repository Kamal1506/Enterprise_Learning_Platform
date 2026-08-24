package com.skillsphere.learning.dto;

import java.util.UUID;

public record AnswerSelection(
    UUID questionId,
    String selectedOption // 'A', 'B', 'C', 'D'
) {}
