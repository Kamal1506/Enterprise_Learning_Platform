package com.skillsphere.skill.repository;

import com.skillsphere.skill.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    List<Assessment> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
    long countByTakenAtAfter(Instant startOfPeriod);
}
