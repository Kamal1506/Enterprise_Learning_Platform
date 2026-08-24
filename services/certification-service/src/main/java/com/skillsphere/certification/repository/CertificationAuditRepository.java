package com.skillsphere.certification.repository;

import com.skillsphere.certification.entity.CertificationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CertificationAuditRepository extends JpaRepository<CertificationAudit, UUID> {
    List<CertificationAudit> findByEmployeeCertificationId(UUID employeeCertificationId);
    List<CertificationAudit> findByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
    List<CertificationAudit> findAllByOrderByTimestampDesc();
}
