package com.skillsphere.assistant.repository;

import com.skillsphere.assistant.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByEmployeeIdOrderByUpdatedAtDesc(UUID employeeId);
}
