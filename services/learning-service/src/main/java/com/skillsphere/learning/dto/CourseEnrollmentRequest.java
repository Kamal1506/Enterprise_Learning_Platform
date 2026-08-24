package com.skillsphere.learning.dto;

import java.util.UUID;

public record CourseEnrollmentRequest(
    UUID courseId,
    UUID learningPathId
) {}
