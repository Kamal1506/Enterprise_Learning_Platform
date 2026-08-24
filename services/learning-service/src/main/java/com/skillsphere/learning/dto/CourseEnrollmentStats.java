package com.skillsphere.learning.dto;

import java.util.UUID;

public interface CourseEnrollmentStats {
    UUID getCourseId();
    long getEnrolledCount();
    long getCompletedCount();
}
