package com.skillsphere.assistant.repository;

import com.skillsphere.assistant.entity.ToolAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToolAuditLogRepository extends JpaRepository<ToolAuditLog, UUID> {
    List<ToolAuditLog> findByUserEmailOrderByTimestampDesc(String userEmail);
}
