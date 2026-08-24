package com.skillsphere.skill.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class EmployeeSkillId implements Serializable {
    
    private UUID employeeId;
    private UUID skillId;

    public EmployeeSkillId() {}

    public EmployeeSkillId(UUID employeeId, UUID skillId) {
        this.employeeId = employeeId;
        this.skillId = skillId;
    }

    // Getters
    public UUID getEmployeeId() { return employeeId; }
    public UUID getSkillId() { return skillId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EmployeeSkillId that = (EmployeeSkillId) o;
        return Objects.equals(employeeId, that.employeeId) &&
               Objects.equals(skillId, that.skillId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(employeeId, skillId);
    }
}
