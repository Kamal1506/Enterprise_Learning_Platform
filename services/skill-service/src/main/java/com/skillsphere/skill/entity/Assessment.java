package com.skillsphere.skill.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessments")
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "skill_or_topic", nullable = false)
    private String skillOrTopic;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Boolean passed = false;

    @Column(name = "taken_at", nullable = false, updatable = false)
    private Instant takenAt = Instant.now();

    @Column(nullable = false)
    private Boolean verified = false;

    @Column(name = "verified_by")
    private String verifiedBy;

    // Default Constructor
    public Assessment() {}

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

    public String getSkillOrTopic() {
        return skillOrTopic;
    }

    public void setSkillOrTopic(String skillOrTopic) {
        this.skillOrTopic = skillOrTopic;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public Instant getTakenAt() {
        return takenAt;
    }

    public void setTakenAt(Instant takenAt) {
        this.takenAt = takenAt;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }
}
