package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.LearningPathProgress;
import com.skillsphere.learning.entity.LearningPathProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningPathProgressRepository extends JpaRepository<LearningPathProgress, LearningPathProgressId> {
    List<LearningPathProgress> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
    Optional<LearningPathProgress> findByEmployeeIdAndPathId(UUID employeeId, UUID pathId);
}
