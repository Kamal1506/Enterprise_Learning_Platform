package com.skillsphere.skill.repository;

import com.skillsphere.skill.entity.AppUser;
import com.skillsphere.skill.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmployeeId(UUID employeeId);
    List<AppUser> findByApprovedFalse();
    long countByRole(Role role);
    long countByApprovedFalse();
}
