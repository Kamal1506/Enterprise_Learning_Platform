package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCategory;
import com.skillsphere.learning.entity.CourseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByTitleIgnoreCase(String title);
    Page<Course> findByCategory(CourseCategory category, Pageable pageable);
    Page<Course> findByType(CourseType type, Pageable pageable);
    Page<Course> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
