package com.skillsphere.learning.service;

import com.skillsphere.learning.dto.CourseDTO;
import com.skillsphere.learning.dto.CourseEnrollmentStats;
import com.skillsphere.learning.dto.CourseStatsDTO;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCategory;
import com.skillsphere.learning.entity.CourseType;
import com.skillsphere.learning.entity.Enrollment;
import com.skillsphere.learning.entity.EnrollmentStatus;
import com.skillsphere.learning.entity.LearningPath;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.EnrollmentRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import com.skillsphere.learning.repository.LearningPathProgressRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathProgressRepository learningPathProgressRepository;

    public CourseService(CourseRepository courseRepository,
                         EnrollmentRepository enrollmentRepository,
                         LearningPathRepository learningPathRepository,
                         LearningPathProgressRepository learningPathProgressRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathProgressRepository = learningPathProgressRepository;
    }

    public List<CourseDTO> getAllCoursesList() {
        List<Course> courses = courseRepository.findAll();
        Page<Course> page = new org.springframework.data.domain.PageImpl<>(courses);
        return mapPageToDTOs(page).getContent();
    }

    public Page<CourseDTO> getAllCourses(Pageable pageable) {
        return mapPageToDTOs(courseRepository.findAll(pageable));
    }

    public Page<CourseDTO> getCoursesByCategory(String category, Pageable pageable) {
        try {
            CourseCategory cat = CourseCategory.valueOf(category.toUpperCase());
            return mapPageToDTOs(courseRepository.findByCategory(cat, pageable));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category. Supported values: TECHNICAL, DOMAIN, SOFT");
        }
    }

    public Page<CourseDTO> getCoursesByType(String type, Pageable pageable) {
        try {
            CourseType t = CourseType.valueOf(type.toUpperCase());
            return mapPageToDTOs(courseRepository.findByType(t, pageable));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid type. Supported values: ONLINE, WORKSHOP, WEBINAR, BOOTCAMP");
        }
    }

    public Page<CourseDTO> searchCoursesByTitle(String query, Pageable pageable) {
        return mapPageToDTOs(courseRepository.findByTitleContainingIgnoreCase(query, pageable));
    }

    public CourseDTO getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        List<CourseEnrollmentStats> statsList = enrollmentRepository.getStatsForCourses(List.of(id));
        long enrolled = 0;
        long completed = 0;
        if (statsList != null && !statsList.isEmpty()) {
            enrolled = statsList.get(0).getEnrolledCount();
            completed = statsList.get(0).getCompletedCount();
        }

        UUID employeeId = getCurrentEmployeeId();
        Integer lastScore = null;
        if (employeeId != null) {
            Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, id);
            if (enrollmentOpt.isPresent()) {
                lastScore = enrollmentOpt.get().getFinalScore();
            }
        }

        String pathName = null;
        Double pathProgress = null;
        List<LearningPath> allPaths = learningPathRepository.findAll();
        for (LearningPath lp : allPaths) {
            boolean containsCourse = lp.getLearningPathCourses().stream()
                    .anyMatch(lpc -> lpc.getCourseId().equals(id));
            if (containsCourse) {
                pathName = lp.getName();
                if (employeeId != null) {
                    var progressOpt = learningPathProgressRepository.findByEmployeeIdAndPathId(employeeId, lp.getId());
                    if (progressOpt.isPresent()) {
                        pathProgress = progressOpt.get().getProgressPercent().doubleValue();
                    }
                }
                break;
            }
        }

        return new CourseDTO(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCategory().name(),
                course.getType().name(),
                course.getInstructor(),
                course.getRating(),
                enrolled,
                completed,
                pathName,
                pathProgress,
                lastScore,
                course.getLearningSourceUrl(),
                course.getDurationHours(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    @Transactional
    public CourseDTO createCourse(CourseDTO dto) {
        if (courseRepository.findByTitleIgnoreCase(dto.title()).isPresent()) {
            throw new DuplicateResourceException("Course with title '" + dto.title() + "' already exists");
        }

        CourseCategory category;
        try {
            category = CourseCategory.valueOf(dto.category().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category. Supported values: TECHNICAL, DOMAIN, SOFT");
        }

        CourseType type;
        try {
            type = CourseType.valueOf(dto.type().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid type. Supported values: ONLINE, WORKSHOP, WEBINAR, BOOTCAMP");
        }

        Course course = new Course();
        course.setTitle(dto.title());
        course.setDescription(dto.description());
        course.setCategory(category);
        course.setType(type);
        course.setInstructor(dto.instructor());
        course.setRating(dto.rating() != null ? dto.rating() : 0.0);
        course.setLearningSourceUrl(dto.learningSourceUrl());
        course.setDurationHours(dto.durationHours());
        course.setCreatedAt(Instant.now());
        course.setUpdatedAt(Instant.now());

        Course saved = courseRepository.save(course);
        return getCourseById(saved.getId());
    }

    @Transactional
    public CourseDTO updateCourse(UUID id, CourseDTO dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        courseRepository.findByTitleIgnoreCase(dto.title()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Another course with title '" + dto.title() + "' already exists");
            }
        });

        CourseCategory category;
        try {
            category = CourseCategory.valueOf(dto.category().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category. Supported values: TECHNICAL, DOMAIN, SOFT");
        }

        CourseType type;
        try {
            type = CourseType.valueOf(dto.type().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid type. Supported values: ONLINE, WORKSHOP, WEBINAR, BOOTCAMP");
        }

        course.setTitle(dto.title());
        course.setDescription(dto.description());
        course.setCategory(category);
        course.setType(type);
        course.setInstructor(dto.instructor());
        course.setRating(dto.rating() != null ? dto.rating() : 0.0);
        course.setLearningSourceUrl(dto.learningSourceUrl());
        course.setDurationHours(dto.durationHours());
        course.setUpdatedAt(Instant.now());

        courseRepository.save(course);
        return getCourseById(id);
    }

    @Transactional
    public void deleteCourse(UUID id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course not found with id: " + id);
        }
        courseRepository.deleteById(id);
    }

    public CourseStatsDTO getGlobalStats() {
        long totalCourses = courseRepository.count();

        ZonedDateTime startOfMonthZDT = ZonedDateTime.now(ZoneId.of("UTC"))
                .with(TemporalAdjusters.firstDayOfMonth())
                .truncatedTo(ChronoUnit.DAYS);
        long monthlyEnrollments = enrollmentRepository.countMonthlyEnrollments(startOfMonthZDT.toInstant());

        long totalEnrollments = enrollmentRepository.count();
        long completedEnrollments = enrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED);

        double overallCompletionRate = totalEnrollments > 0
                ? (double) completedEnrollments / totalEnrollments * 100.0
                : 0.0;

        return new CourseStatsDTO(totalCourses, monthlyEnrollments, overallCompletionRate);
    }

    private Page<CourseDTO> mapPageToDTOs(Page<Course> coursePage) {
        List<Course> courses = coursePage.getContent();
        List<UUID> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

        // 1. Batch fetch course enrollment stats to prevent N+1 queries
        Map<UUID, CourseEnrollmentStats> statsMap = new HashMap<>();
        if (!courseIds.isEmpty()) {
            List<CourseEnrollmentStats> statsList = enrollmentRepository.getStatsForCourses(courseIds);
            if (statsList != null) {
                for (CourseEnrollmentStats s : statsList) {
                    statsMap.put(s.getCourseId(), s);
                }
            }
        }

        // 2. Fetch current employee's enrollments to determine progress & score
        UUID employeeId = getCurrentEmployeeId();
        Map<UUID, Enrollment> userEnrollmentsMap = new HashMap<>();
        if (employeeId != null && !courseIds.isEmpty()) {
            List<Enrollment> enrollments = enrollmentRepository.findByEmployeeId(employeeId);
            for (Enrollment e : enrollments) {
                if (e.getCourseId() != null) {
                    userEnrollmentsMap.put(e.getCourseId(), e);
                }
            }
        }

        // 3. Find associated learning path name and progress
        List<LearningPath> allPaths = learningPathRepository.findAll();

        return coursePage.map(course -> {
            CourseEnrollmentStats stats = statsMap.get(course.getId());
            long enrolled = stats != null ? stats.getEnrolledCount() : 0L;
            long completed = stats != null ? stats.getCompletedCount() : 0L;

            Enrollment userEnrollment = userEnrollmentsMap.get(course.getId());
            Integer lastScore = userEnrollment != null ? userEnrollment.getFinalScore() : null;

            String pathName = null;
            Double pathProgress = null;

            // Find first path mapping
            for (LearningPath lp : allPaths) {
                boolean containsCourse = lp.getLearningPathCourses().stream()
                        .anyMatch(lpc -> lpc.getCourseId().equals(course.getId()));
                if (containsCourse) {
                    pathName = lp.getName();
                    if (employeeId != null) {
                        var progressOpt = learningPathProgressRepository.findByEmployeeIdAndPathId(employeeId, lp.getId());
                        if (progressOpt.isPresent()) {
                            pathProgress = progressOpt.get().getProgressPercent().doubleValue();
                        }
                    }
                    break;
                }
            }

            return new CourseDTO(
                    course.getId(),
                    course.getTitle(),
                    course.getDescription(),
                    course.getCategory().name(),
                    course.getType().name(),
                    course.getInstructor(),
                    course.getRating(),
                    enrolled,
                    completed,
                    pathName,
                    pathProgress,
                    lastScore,
                    course.getLearningSourceUrl(),
                    course.getDurationHours(),
                    course.getCreatedAt(),
                    course.getUpdatedAt()
            );
        });
    }

    private UUID getCurrentEmployeeId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() instanceof String credentials) {
            try {
                return UUID.fromString(credentials);
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
