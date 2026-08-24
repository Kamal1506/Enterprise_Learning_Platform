package com.skillsphere.certification.service;

import com.skillsphere.certification.client.LearningServiceClient;
import com.skillsphere.certification.client.SkillServiceClient;
import com.skillsphere.certification.dto.CertificationDTO;
import com.skillsphere.certification.entity.Certification;
import com.skillsphere.certification.exception.DuplicateResourceException;
import com.skillsphere.certification.exception.ResourceNotFoundException;
import com.skillsphere.certification.repository.CertificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CertificationService {

    private final CertificationRepository certificationRepository;
    private final SkillServiceClient skillServiceClient;
    private final LearningServiceClient learningServiceClient;

    public CertificationService(CertificationRepository certificationRepository,
                                SkillServiceClient skillServiceClient,
                                LearningServiceClient learningServiceClient) {
        this.certificationRepository = certificationRepository;
        this.skillServiceClient = skillServiceClient;
        this.learningServiceClient = learningServiceClient;
    }

    public List<CertificationDTO> getAllCertifications() {
        return certificationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CertificationDTO getCertificationById(UUID id) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification definition not found with id: " + id));
        return mapToDTO(cert);
    }

    @Transactional
    public CertificationDTO createCertification(CertificationDTO dto) {
        if (certificationRepository.findByNameIgnoreCase(dto.name()).isPresent()) {
            throw new DuplicateResourceException("Certification definition with name '" + dto.name() + "' already exists.");
        }

        if (dto.associatedSkillId() != null && !skillServiceClient.skillExists(dto.associatedSkillId())) {
            throw new ResourceNotFoundException("Associated Skill not found with ID: " + dto.associatedSkillId());
        }

        if (dto.associatedCourseId() != null && !learningServiceClient.courseExists(dto.associatedCourseId())) {
            throw new ResourceNotFoundException("Associated Course not found with ID: " + dto.associatedCourseId());
        }

        Certification cert = new Certification();
        cert.setName(dto.name());
        cert.setProvider(dto.provider());
        cert.setValidityMonths(dto.validityMonths());
        cert.setCategory(dto.category());
        cert.setAssociatedSkillId(dto.associatedSkillId());
        cert.setAssociatedCourseId(dto.associatedCourseId());

        Certification saved = certificationRepository.save(cert);
        return mapToDTO(saved);
    }

    @Transactional
    public CertificationDTO updateCertification(UUID id, CertificationDTO dto) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification definition not found with id: " + id));

        certificationRepository.findByNameIgnoreCase(dto.name()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Another certification definition with name '" + dto.name() + "' already exists.");
            }
        });

        if (dto.associatedSkillId() != null && !skillServiceClient.skillExists(dto.associatedSkillId())) {
            throw new ResourceNotFoundException("Associated Skill not found with ID: " + dto.associatedSkillId());
        }

        if (dto.associatedCourseId() != null && !learningServiceClient.courseExists(dto.associatedCourseId())) {
            throw new ResourceNotFoundException("Associated Course not found with ID: " + dto.associatedCourseId());
        }

        cert.setName(dto.name());
        cert.setProvider(dto.provider());
        cert.setValidityMonths(dto.validityMonths());
        cert.setCategory(dto.category());
        cert.setAssociatedSkillId(dto.associatedSkillId());
        cert.setAssociatedCourseId(dto.associatedCourseId());

        Certification updated = certificationRepository.save(cert);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCertification(UUID id) {
        if (!certificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Certification definition not found with id: " + id);
        }
        certificationRepository.deleteById(id);
    }

    public List<CertificationDTO> getCertificationsByCourse(UUID courseId) {
        return certificationRepository.findByAssociatedCourseId(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CertificationDTO mapToDTO(Certification entity) {
        return new CertificationDTO(
                entity.getId(),
                entity.getName(),
                entity.getProvider(),
                entity.getValidityMonths(),
                entity.getCategory(),
                entity.getAssociatedSkillId(),
                entity.getAssociatedCourseId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
