package com.skillsphere.learning.service;

import com.skillsphere.learning.dto.LearningPathDTO;
import com.skillsphere.learning.dto.PathCourseDetailDTO;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.LearningPath;
import com.skillsphere.learning.entity.LearningPathCourse;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LearningPathService {

    private final LearningPathRepository learningPathRepository;
    private final CourseRepository courseRepository;

    public LearningPathService(LearningPathRepository learningPathRepository,
                               CourseRepository courseRepository) {
        this.learningPathRepository = learningPathRepository;
        this.courseRepository = courseRepository;
    }

    public List<LearningPathDTO> getAllLearningPaths() {
        return learningPathRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public LearningPathDTO getLearningPathById(UUID id) {
        LearningPath path = learningPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found with id: " + id));
        return mapToDTO(path);
    }

    @Transactional
    public LearningPathDTO createLearningPath(LearningPathDTO dto) {
        if (learningPathRepository.findByNameIgnoreCase(dto.name()).isPresent()) {
            throw new DuplicateResourceException("Learning path with name '" + dto.name() + "' already exists");
        }

        LearningPath path = new LearningPath();
        path.setName(dto.name());
        path.setDescription(dto.description());
        path.setCreatedAt(Instant.now());
        path.setUpdatedAt(Instant.now());

        // Process course relations
        if (dto.courseIds() != null && !dto.courseIds().isEmpty()) {
            List<LearningPathCourse> pathCourses = new ArrayList<>();
            for (int i = 0; i < dto.courseIds().size(); i++) {
                UUID courseId = dto.courseIds().get(i);
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
                LearningPathCourse lpc = new LearningPathCourse();
                lpc.setCourseId(courseId);
                lpc.setSequenceOrder(i + 1);
                lpc.setCourse(course);
                pathCourses.add(lpc);
            }
            path.setLearningPathCourses(pathCourses);
        }

        LearningPath saved = learningPathRepository.save(path);
        return mapToDTO(saved);
    }

    @Transactional
    public LearningPathDTO updateLearningPath(UUID id, LearningPathDTO dto) {
        LearningPath path = learningPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found with id: " + id));

        learningPathRepository.findByNameIgnoreCase(dto.name()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Another learning path with name '" + dto.name() + "' already exists");
            }
        });

        path.setName(dto.name());
        path.setDescription(dto.description());
        path.setUpdatedAt(Instant.now());

        // Clear existing courses and re-add in transaction
        path.getLearningPathCourses().clear();

        if (dto.courseIds() != null && !dto.courseIds().isEmpty()) {
            List<LearningPathCourse> pathCourses = new ArrayList<>();
            for (int i = 0; i < dto.courseIds().size(); i++) {
                UUID courseId = dto.courseIds().get(i);
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
                LearningPathCourse lpc = new LearningPathCourse(id, courseId, i + 1);
                lpc.setCourse(course);
                pathCourses.add(lpc);
            }
            path.getLearningPathCourses().addAll(pathCourses);
        }

        LearningPath saved = learningPathRepository.save(path);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteLearningPath(UUID id) {
        if (!learningPathRepository.existsById(id)) {
            throw new ResourceNotFoundException("Learning path not found with id: " + id);
        }
        learningPathRepository.deleteById(id);
    }

    private LearningPathDTO mapToDTO(LearningPath path) {
        List<PathCourseDetailDTO> courseDetails = path.getLearningPathCourses().stream()
                .map(lpc -> new PathCourseDetailDTO(
                        lpc.getCourseId(),
                        lpc.getCourse() != null ? lpc.getCourse().getTitle() : "Unknown Course",
                        lpc.getCourse() != null ? lpc.getCourse().getCategory().name() : "TECHNICAL",
                        lpc.getCourse() != null ? lpc.getCourse().getDurationHours() : 0,
                        lpc.getSequenceOrder()
                ))
                .collect(Collectors.toList());

        List<UUID> courseIds = path.getLearningPathCourses().stream()
                .map(LearningPathCourse::getCourseId)
                .collect(Collectors.toList());

        return new LearningPathDTO(
                path.getId(),
                path.getName(),
                path.getDescription(),
                courseDetails,
                courseIds,
                path.getCreatedAt(),
                path.getUpdatedAt()
        );
    }
}
