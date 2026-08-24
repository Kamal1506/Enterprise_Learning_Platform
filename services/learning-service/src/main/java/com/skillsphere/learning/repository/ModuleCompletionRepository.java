package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.ModuleCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModuleCompletionRepository extends JpaRepository<ModuleCompletion, UUID> {
    Optional<ModuleCompletion> findByEmployeeIdAndModuleId(UUID employeeId, UUID moduleId);
    List<ModuleCompletion> findByEmployeeIdAndCourseId(UUID employeeId, UUID courseId);
    long countByEmployeeIdAndCourseId(UUID employeeId, UUID courseId);
    void deleteByEmployeeId(UUID employeeId);
}
