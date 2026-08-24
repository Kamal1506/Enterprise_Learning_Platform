package com.skillsphere.learning.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class LearningPathCourseId implements Serializable {

    private UUID learningPathId;
    private UUID courseId;

    public LearningPathCourseId() {}

    public LearningPathCourseId(UUID learningPathId, UUID courseId) {
        this.learningPathId = learningPathId;
        this.courseId = courseId;
    }

    public UUID getLearningPathId() {
        return learningPathId;
    }

    public UUID getCourseId() {
        return courseId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LearningPathCourseId that = (LearningPathCourseId) o;
        return Objects.equals(learningPathId, that.learningPathId) &&
               Objects.equals(courseId, that.courseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(learningPathId, courseId);
    }
}
