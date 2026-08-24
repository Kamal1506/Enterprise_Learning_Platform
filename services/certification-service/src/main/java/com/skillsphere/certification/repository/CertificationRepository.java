package com.skillsphere.certification.repository;

import com.skillsphere.certification.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, UUID> {
    Optional<Certification> findByNameIgnoreCase(String name);
    List<Certification> findByAssociatedSkillId(UUID skillId);
    List<Certification> findByAssociatedCourseId(UUID courseId);
    List<Certification> findByCategory(String category);
    List<Certification> findByProviderIgnoreCase(String provider);
}
