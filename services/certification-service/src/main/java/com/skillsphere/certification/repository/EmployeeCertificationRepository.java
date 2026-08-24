package com.skillsphere.certification.repository;

import com.skillsphere.certification.entity.EmployeeCertification;
import com.skillsphere.certification.entity.CertificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeCertificationRepository extends JpaRepository<EmployeeCertification, UUID> {
    List<EmployeeCertification> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
    List<EmployeeCertification> findByCertificationId(UUID certificationId);
    Optional<EmployeeCertification> findByEmployeeIdAndCertificationId(UUID employeeId, UUID certificationId);
    List<EmployeeCertification> findByStatus(CertificationStatus status);
    List<EmployeeCertification> findByExpiryDateBefore(LocalDate date);
    List<EmployeeCertification> findByExpiryDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT ec FROM EmployeeCertification ec JOIN ec.certification c WHERE c.associatedSkillId = :skillId")
    List<EmployeeCertification> findByAssociatedSkillId(UUID skillId);

    @Query("SELECT ec FROM EmployeeCertification ec WHERE ec.expiryDate < :today AND ec.status NOT IN :excludedStatuses")
    List<EmployeeCertification> findExpiredCertificationsToUpdate(
            @org.springframework.data.repository.query.Param("today") LocalDate today, 
            @org.springframework.data.repository.query.Param("excludedStatuses") List<com.skillsphere.certification.entity.CertificationStatus> excludedStatuses);

    @Query("SELECT ec FROM EmployeeCertification ec WHERE ec.expiryDate BETWEEN :today AND :thirtyDaysFromNow AND ec.status NOT IN :excludedStatuses")
    List<EmployeeCertification> findExpiringCertificationsToUpdate(
            @org.springframework.data.repository.query.Param("today") LocalDate today, 
            @org.springframework.data.repository.query.Param("thirtyDaysFromNow") LocalDate thirtyDaysFromNow, 
            @org.springframework.data.repository.query.Param("excludedStatuses") List<com.skillsphere.certification.entity.CertificationStatus> excludedStatuses);
}
