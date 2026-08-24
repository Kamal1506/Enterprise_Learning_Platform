package com.skillsphere.learning.dto;

import java.util.List;

public record QuizSubmissionRequest(
    List<AnswerSelection> answers
) {}
