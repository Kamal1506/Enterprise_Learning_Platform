package com.skillsphere.learning.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "course_certificates", schema = "learning_service")
public class CourseCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "credential_id", nullable = false, unique = true)
    private String credentialId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "course_name_snapshot", nullable = false)
    private String courseNameSnapshot;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "completion_date", nullable = false)
    private Instant completionDate = Instant.now();

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public CourseCertificate() {}

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        completionDate = Instant.now();
        issueDate = LocalDate.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(String credentialId) {
        this.credentialId = credentialId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public String getCourseNameSnapshot() {
        return courseNameSnapshot;
    }

    public void setCourseNameSnapshot(String courseNameSnapshot) {
        this.courseNameSnapshot = courseNameSnapshot;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public Instant getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(Instant completionDate) {
        this.completionDate = completionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
