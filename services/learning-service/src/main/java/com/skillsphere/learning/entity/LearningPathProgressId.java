package com.skillsphere.learning.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class LearningPathProgressId implements Serializable {

    private UUID employeeId;
    private UUID pathId;

    public LearningPathProgressId() {}

    public LearningPathProgressId(UUID employeeId, UUID pathId) {
        this.employeeId = employeeId;
        this.pathId = pathId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public UUID getPathId() {
        return pathId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LearningPathProgressId that = (LearningPathProgressId) o;
        return Objects.equals(employeeId, that.employeeId) &&
               Objects.equals(pathId, that.pathId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(employeeId, pathId);
    }
}
