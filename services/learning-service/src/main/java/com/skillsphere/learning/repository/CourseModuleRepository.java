package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseModuleRepository extends JpaRepository<CourseModule, UUID> {
    List<CourseModule> findByCourseIdOrderBySequenceOrderAsc(UUID courseId);
    long countByCourseId(UUID courseId);
}
