package com.skillsphere.learning.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "learning_path_courses", schema = "learning_service")
@IdClass(LearningPathCourseId.class)
public class LearningPathCourse {

    @Id
    @Column(name = "learning_path_id")
    private UUID learningPathId;

    @Id
    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;

    // Default Constructor
    public LearningPathCourse() {}

    public LearningPathCourse(UUID learningPathId, UUID courseId, Integer sequenceOrder) {
        this.learningPathId = learningPathId;
        this.courseId = courseId;
        this.sequenceOrder = sequenceOrder;
    }

    // Getters and Setters
    public UUID getLearningPathId() {
        return learningPathId;
    }

    public void setLearningPathId(UUID learningPathId) {
        this.learningPathId = learningPathId;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }
}
