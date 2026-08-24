package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.CourseCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, UUID> {
    Optional<CourseCertificate> findByEmployeeIdAndCourseId(UUID employeeId, UUID courseId);
    List<CourseCertificate> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
