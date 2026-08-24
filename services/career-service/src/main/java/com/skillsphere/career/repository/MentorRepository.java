package com.skillsphere.career.repository;

import com.skillsphere.career.entity.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorRepository extends JpaRepository<Mentor, UUID> {
    Optional<Mentor> findByEmployeeId(UUID employeeId);
}
