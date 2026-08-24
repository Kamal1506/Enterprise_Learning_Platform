package com.skillsphere.career.repository;

import com.skillsphere.career.entity.CareerPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CareerPlanRepository extends JpaRepository<CareerPlan, UUID> {
    Optional<CareerPlan> findByEmployeeId(UUID employeeId);
    Page<CareerPlan> findByStatus(String status, Pageable pageable);
    
    // Custom query helpers for department or target roles if needed
    List<CareerPlan> findByMentorId(UUID mentorId);
}
