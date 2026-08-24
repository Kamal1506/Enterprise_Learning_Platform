package com.skillsphere.skill.repository;

import com.skillsphere.skill.entity.EmployeeSkill;
import com.skillsphere.skill.entity.EmployeeSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, EmployeeSkillId> {
    List<EmployeeSkill> findByEmployeeId(UUID employeeId);
    Optional<EmployeeSkill> findByEmployeeIdAndSkillId(UUID employeeId, UUID skillId);
    List<EmployeeSkill> findBySkillId(UUID skillId);
    void deleteByEmployeeId(UUID employeeId);
    void deleteBySkillId(UUID skillId);
    
    @Query("SELECT COUNT(DISTINCT es.skillId) FROM EmployeeSkill es")
    long countDistinctSkillsTracked();
}
