package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.Enrollment;
import com.skillsphere.learning.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.skillsphere.learning.dto.CourseEnrollmentStats;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    List<Enrollment> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
    
    List<Enrollment> findByCourseId(UUID courseId);
    
    Optional<Enrollment> findByEmployeeIdAndCourseId(UUID employeeId, UUID courseId);
    
    Optional<Enrollment> findByEmployeeIdAndLearningPathId(UUID employeeId, UUID learningPathId);

    long countByEmployeeIdAndStatus(UUID employeeId, EnrollmentStatus status);

    long countByStatus(EnrollmentStatus status);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.employeeId = :employeeId AND e.courseId IS NOT NULL AND e.status = 'COMPLETED'")
    long countCompletedCoursesByEmployeeId(UUID employeeId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.employeeId = :employeeId AND e.learningPathId IS NOT NULL AND e.status = 'COMPLETED'")
    long countCompletedPathsByEmployeeId(UUID employeeId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.employeeId = :employeeId AND (e.status = 'ENROLLED' OR e.status = 'IN_PROGRESS')")
    long countActiveEnrollmentsByEmployeeId(UUID employeeId);

    @Query("SELECT e.courseId as courseId, COUNT(e) as enrolledCount, SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedCount FROM Enrollment e WHERE e.courseId IN :courseIds GROUP BY e.courseId")
    List<CourseEnrollmentStats> getStatsForCourses(@Param("courseIds") List<UUID> courseIds);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.enrolledAt >= :startOfMonth")
    long countMonthlyEnrollments(@Param("startOfMonth") Instant startOfMonth);
}
