package com.skillsphere.career.repository;

import com.skillsphere.career.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    List<JobApplication> findByEmployeeId(UUID employeeId);
    List<JobApplication> findByJobPostingId(UUID jobPostingId);
    Optional<JobApplication> findByEmployeeIdAndJobPostingId(UUID employeeId, UUID jobPostingId);
}
