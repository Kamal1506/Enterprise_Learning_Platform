package com.skillsphere.learning.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learning_path_progress", schema = "learning_service")
@IdClass(LearningPathProgressId.class)
public class LearningPathProgress {

    @Id
    @Column(name = "employee_id")
    private UUID employeeId;

    @Id
    @Column(name = "path_id")
    private UUID pathId;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public LearningPathProgress() {}

    public LearningPathProgress(UUID employeeId, UUID pathId, Integer progressPercent) {
        this.employeeId = employeeId;
        this.pathId = pathId;
        this.progressPercent = progressPercent;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getPathId() {
        return pathId;
    }

    public void setPathId(UUID pathId) {
        this.pathId = pathId;
    }

    public Integer getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(Integer progressPercent) {
        this.progressPercent = progressPercent;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
