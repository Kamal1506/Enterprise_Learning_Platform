package com.skillsphere.skill.repository;

import com.skillsphere.skill.entity.CompetencyFramework;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CompetencyFrameworkRepository extends JpaRepository<CompetencyFramework, UUID> {
    List<CompetencyFramework> findByRoleNameIgnoreCase(String roleName);
    void deleteBySkillId(UUID skillId);
}
