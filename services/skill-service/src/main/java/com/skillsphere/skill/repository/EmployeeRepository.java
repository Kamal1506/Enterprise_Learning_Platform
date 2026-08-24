package com.skillsphere.skill.repository;

import com.skillsphere.skill.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmail(String email);
    Page<Employee> findByDepartmentIgnoreCase(String department, Pageable pageable);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL AND e.department <> '' ORDER BY e.department")
    List<String> findDistinctDepartments();

    @Query("SELECT DISTINCT e.roleTitle FROM Employee e WHERE e.roleTitle IS NOT NULL AND e.roleTitle <> '' ORDER BY e.roleTitle")
    List<String> findDistinctRoleTitles();

    @Query("SELECT DISTINCT e FROM Employee e " +
           "WHERE (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department)) " +
           "AND (:roleTitle IS NULL OR :roleTitle = '' OR LOWER(e.roleTitle) = LOWER(:roleTitle)) " +
           "AND (:experienceMin IS NULL OR e.experienceYears >= :experienceMin) " +
           "AND (:experienceMax IS NULL OR e.experienceYears <= :experienceMax)")
    Page<Employee> findFiltered(
            @Param("department") String department,
            @Param("roleTitle") String roleTitle,
            @Param("experienceMin") Integer experienceMin,
            @Param("experienceMax") Integer experienceMax,
            Pageable pageable);

    @Query("SELECT DISTINCT e FROM Employee e " +
           "WHERE (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department)) " +
           "AND (:roleTitle IS NULL OR :roleTitle = '' OR LOWER(e.roleTitle) = LOWER(:roleTitle)) " +
           "AND (:experienceMin IS NULL OR e.experienceYears >= :experienceMin) " +
           "AND (:experienceMax IS NULL OR e.experienceYears <= :experienceMax) " +
           "AND (e.id IN (SELECT es.employeeId FROM EmployeeSkill es WHERE es.skillId IN :skills))")
    Page<Employee> findFilteredWithSkills(
            @Param("department") String department,
            @Param("roleTitle") String roleTitle,
            @Param("experienceMin") Integer experienceMin,
            @Param("experienceMax") Integer experienceMax,
            @Param("skills") List<UUID> skills,
            Pageable pageable);
}
