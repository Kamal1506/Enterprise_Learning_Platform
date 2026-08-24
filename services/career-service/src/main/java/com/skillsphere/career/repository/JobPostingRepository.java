package com.skillsphere.career.repository;

import com.skillsphere.career.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {
    List<JobPosting> findByActiveTrue();
    List<JobPosting> findByDepartmentIgnoreCase(String department);
}
