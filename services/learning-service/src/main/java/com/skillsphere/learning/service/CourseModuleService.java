package com.skillsphere.learning.service;

import com.skillsphere.learning.dto.CourseModuleDTO;
import com.skillsphere.learning.dto.ModuleCompletionDTO;
import com.skillsphere.learning.entity.*;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseModuleService {

    private final CourseModuleRepository courseModuleRepository;
    private final ModuleCompletionRepository moduleCompletionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final CourseRepository courseRepository;

    public CourseModuleService(CourseModuleRepository courseModuleRepository,
                               ModuleCompletionRepository moduleCompletionRepository,
                               EnrollmentRepository enrollmentRepository,
                               EnrollmentService enrollmentService,
                               CourseRepository courseRepository) {
        this.courseModuleRepository = courseModuleRepository;
        this.moduleCompletionRepository = moduleCompletionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.courseRepository = courseRepository;
    }

    public List<CourseModuleDTO> getModulesByCourse(UUID courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CourseModuleDTO getModuleById(UUID id) {
        CourseModule module = courseModuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course module not found with id: " + id));
        return mapToDTO(module);
    }

    @Transactional
    public CourseModuleDTO createModule(UUID courseId, CourseModuleDTO dto) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        CourseModule module = new CourseModule();
        module.setCourseId(courseId);
        module.setTitle(dto.title());
        module.setDescription(dto.description());
        module.setContent(dto.content());
        module.setSequenceOrder(dto.sequenceOrder());
        module.setDurationHours(dto.durationHours());
        module.setActive(dto.active());

        CourseModule saved = courseModuleRepository.save(module);
        return mapToDTO(saved);
    }

    @Transactional
    public CourseModuleDTO updateModule(UUID id, CourseModuleDTO dto) {
        CourseModule module = courseModuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course module not found with id: " + id));
        module.setTitle(dto.title());
        module.setDescription(dto.description());
        module.setContent(dto.content());
        module.setSequenceOrder(dto.sequenceOrder());
        module.setDurationHours(dto.durationHours());
        module.setActive(dto.active());

        CourseModule saved = courseModuleRepository.save(module);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteModule(UUID id) {
        if (!courseModuleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course module not found with id: " + id);
        }
        courseModuleRepository.deleteById(id);
    }

    @Transactional
    public ModuleCompletionDTO completeModule(UUID employeeId, UUID moduleId) {
        enrollmentService.verifyEmployeeAccess(employeeId);

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Course module not found with id: " + moduleId));

        Enrollment enrollment = enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, module.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee is not enrolled in course: " + module.getCourseId()));

        moduleCompletionRepository.findByEmployeeIdAndModuleId(employeeId, moduleId)
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Module is already completed by employee");
                });

        ModuleCompletion completion = new ModuleCompletion(employeeId, moduleId, module.getCourseId());
        ModuleCompletion saved = moduleCompletionRepository.save(completion);

        // Recalculate progress
        long totalModules = courseModuleRepository.countByCourseId(module.getCourseId());
        long completedModules = moduleCompletionRepository.countByEmployeeIdAndCourseId(employeeId, module.getCourseId());

        int progressPercent = 0;
        if (totalModules > 0) {
            progressPercent = (int) ((completedModules * 100) / totalModules);
        }

        // Enforce max 100%
        if (progressPercent > 100) {
            progressPercent = 100;
        }

        enrollmentService.updateProgress(enrollment.getId(), progressPercent);

        return mapToCompletionDTO(saved);
    }

    public List<UUID> getCompletedModuleIds(UUID employeeId, UUID courseId) {
        enrollmentService.verifyEmployeeAccess(employeeId);
        return moduleCompletionRepository.findByEmployeeIdAndCourseId(employeeId, courseId).stream()
                .map(ModuleCompletion::getModuleId)
                .collect(Collectors.toList());
    }

    private CourseModuleDTO mapToDTO(CourseModule m) {
        return new CourseModuleDTO(
                m.getId(),
                m.getCourseId(),
                m.getTitle(),
                m.getDescription(),
                m.getContent(),
                m.getSequenceOrder(),
                m.getDurationHours(),
                m.isActive()
        );
    }

    private ModuleCompletionDTO mapToCompletionDTO(ModuleCompletion c) {
        return new ModuleCompletionDTO(
                c.getId(),
                c.getEmployeeId(),
                c.getModuleId(),
                c.getCourseId(),
                c.getCompletedAt()
        );
    }
}
