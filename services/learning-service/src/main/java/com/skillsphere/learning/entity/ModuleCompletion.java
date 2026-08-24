package com.skillsphere.learning.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "module_completions", schema = "learning_service")
public class ModuleCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "module_id", nullable = false)
    private UUID moduleId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt = Instant.now();

    public ModuleCompletion() {}

    public ModuleCompletion(UUID employeeId, UUID moduleId, UUID courseId) {
        this.employeeId = employeeId;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.completedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getModuleId() {
        return moduleId;
    }

    public void setModuleId(UUID moduleId) {
        this.moduleId = moduleId;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
