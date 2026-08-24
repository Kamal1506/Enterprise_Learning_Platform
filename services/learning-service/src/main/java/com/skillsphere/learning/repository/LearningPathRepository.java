package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    Optional<LearningPath> findByNameIgnoreCase(String name);
}
