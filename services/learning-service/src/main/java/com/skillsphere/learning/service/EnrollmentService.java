package com.skillsphere.learning.service;

import com.skillsphere.learning.client.SkillServiceClient;
import com.skillsphere.learning.dto.CompleteEnrollmentRequest;
import com.skillsphere.learning.dto.CourseEnrollmentRequest;
import com.skillsphere.learning.dto.EnrollmentDTO;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.Enrollment;
import com.skillsphere.learning.entity.EnrollmentStatus;
import com.skillsphere.learning.entity.LearningPath;
import com.skillsphere.learning.entity.LearningPathCourse;
import com.skillsphere.learning.entity.LearningPathProgress;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.EnrollmentRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import com.skillsphere.learning.repository.LearningPathProgressRepository;
import com.skillsphere.learning.client.CertificationServiceClient;
import com.skillsphere.learning.repository.QuizQuestionRepository;
import com.skillsphere.learning.entity.QuizQuestion;
import com.skillsphere.learning.dto.AnswerSelection;
import com.skillsphere.learning.dto.QuizResultDTO;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EnrollmentService.class);

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathProgressRepository learningPathProgressRepository;
    private final SkillServiceClient skillServiceClient;
    private final CertificationServiceClient certificationServiceClient;
    private final CourseCertificateService courseCertificateService;
    private final QuizQuestionRepository quizQuestionRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             CourseRepository courseRepository,
                             LearningPathRepository learningPathRepository,
                             LearningPathProgressRepository learningPathProgressRepository,
                             SkillServiceClient skillServiceClient,
                             CertificationServiceClient certificationServiceClient,
                             @org.springframework.context.annotation.Lazy CourseCertificateService courseCertificateService,
                             QuizQuestionRepository quizQuestionRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathProgressRepository = learningPathProgressRepository;
        this.skillServiceClient = skillServiceClient;
        this.certificationServiceClient = certificationServiceClient;
        this.courseCertificateService = courseCertificateService;
        this.quizQuestionRepository = quizQuestionRepository;
    }

    public List<EnrollmentDTO> getEnrollmentsByEmployee(UUID employeeId) {
        verifyEmployeeAccess(employeeId);
        if (!skillServiceClient.employeeExists(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }
        return enrollmentRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EnrollmentDTO createEnrollment(UUID employeeId, CourseEnrollmentRequest request) {
        verifyEmployeeAccess(employeeId);
        if (!skillServiceClient.employeeExists(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        if (request.courseId() == null && request.learningPathId() == null) {
            throw new IllegalArgumentException("Either Course ID or Learning Path ID must be provided");
        }
        if (request.courseId() != null && request.learningPathId() != null) {
            throw new IllegalArgumentException("Cannot enroll in both a course and a learning path simultaneously");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setEmployeeId(employeeId);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);
        enrollment.setProgressPercent(0);
        enrollment.setEnrolledAt(Instant.now());
        enrollment.setUpdatedAt(Instant.now());

        if (request.courseId() != null) {
            Course course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.courseId()));
            
            enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, request.courseId())
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Employee is already enrolled in this course");
                    });

            enrollment.setCourseId(request.courseId());
            enrollment.setCourse(course);
        } else {
            LearningPath path = learningPathRepository.findById(request.learningPathId())
                    .orElseThrow(() -> new ResourceNotFoundException("Learning path not found with id: " + request.learningPathId()));

            enrollmentRepository.findByEmployeeIdAndLearningPathId(employeeId, request.learningPathId())
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Employee is already enrolled in this learning path");
                    });

            // Automatically enroll employee in all courses of the learning path (if not already enrolled)
            for (LearningPathCourse lpc : path.getLearningPathCourses()) {
                java.util.Optional<Enrollment> existingCourseEnrollment = enrollmentRepository.findByEmployeeIdAndCourseId(employeeId, lpc.getCourseId());
                if (existingCourseEnrollment.isEmpty()) {
                    Enrollment courseEnrollment = new Enrollment();
                    courseEnrollment.setEmployeeId(employeeId);
                    courseEnrollment.setCourseId(lpc.getCourseId());
                    courseEnrollment.setCourse(lpc.getCourse());
                    courseEnrollment.setStatus(EnrollmentStatus.ENROLLED);
                    courseEnrollment.setProgressPercent(0);
                    courseEnrollment.setEnrolledAt(Instant.now());
                    courseEnrollment.setUpdatedAt(Instant.now());
                    enrollmentRepository.save(courseEnrollment);
                }
            }

            enrollment.setLearningPathId(request.learningPathId());
            enrollment.setLearningPath(path);
        }

        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToDTO(saved);
    }

    @Transactional
    public EnrollmentDTO updateProgress(UUID id, int progressPercent) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));
        verifyEmployeeAccess(enrollment.getEmployeeId());

        EnrollmentStatus prevStatus = enrollment.getStatus();

        enrollment.setProgressPercent(progressPercent);
        enrollment.setUpdatedAt(Instant.now());

        boolean hasQuiz = false;
        if (enrollment.getCourseId() != null) {
            hasQuiz = !quizQuestionRepository.findByCourseId(enrollment.getCourseId()).isEmpty();
        }

        if (progressPercent == 100) {
            if (hasQuiz) {
                enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
            } else {
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                enrollment.setCompletedAt(Instant.now());
            }
        } else if (progressPercent > 0) {
            enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
            enrollment.setCompletedAt(null);
        } else {
            enrollment.setStatus(EnrollmentStatus.ENROLLED);
            enrollment.setCompletedAt(null);
        }

        Enrollment saved = enrollmentRepository.save(enrollment);
        
        // Recalculate learning path progresses if this was a course enrollment
        if (saved.getCourseId() != null) {
            recalculateLearningPathsProgress(saved.getEmployeeId(), saved.getCourseId());
        }

        if (prevStatus != EnrollmentStatus.COMPLETED && saved.getStatus() == EnrollmentStatus.COMPLETED) {
            courseCertificateService.generateCertificate(saved);
            triggerCertificationRegistration(saved);
        }

        return mapToDTO(saved);
    }

    @Transactional
    public EnrollmentDTO completeEnrollment(UUID id, CompleteEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));
        verifyEmployeeAccess(enrollment.getEmployeeId());

        if (request.finalScore() < 70) {
            throw new IllegalArgumentException("Cannot complete course with a failing score. Passing score is 70%.");
        }

        enrollment.setProgressPercent(100);
        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(Instant.now());
        enrollment.setFinalScore(request.finalScore());
        enrollment.setUpdatedAt(Instant.now());

        Enrollment saved = enrollmentRepository.save(enrollment);

        // Recalculate learning path progresses if this was a course enrollment
        if (saved.getCourseId() != null) {
            recalculateLearningPathsProgress(saved.getEmployeeId(), saved.getCourseId());
        }

        courseCertificateService.generateCertificate(saved);
        triggerCertificationRegistration(saved);

        return mapToDTO(saved);
    }

    @Transactional
    public int calculatePathProgress(UUID employeeId, UUID pathId) {
        verifyEmployeeAccess(employeeId);
        LearningPath path = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found with id: " + pathId));

        List<LearningPathCourse> pathCourses = path.getLearningPathCourses();
        if (pathCourses.isEmpty()) {
            savePathProgress(employeeId, pathId, 0);
            return 0;
        }

        List<UUID> courseIds = pathCourses.stream()
                .map(LearningPathCourse::getCourseId)
                .collect(Collectors.toList());

        List<Enrollment> enrollments = enrollmentRepository.findByEmployeeId(employeeId);
        int totalProgress = 0;
        for (UUID cid : courseIds) {
            Enrollment courseEnrollment = enrollments.stream()
                    .filter(e -> e.getCourseId() != null && e.getCourseId().equals(cid))
                    .findFirst()
                    .orElse(null);
            if (courseEnrollment != null) {
                if (courseEnrollment.getStatus() == EnrollmentStatus.COMPLETED) {
                    totalProgress += 100;
                } else {
                    totalProgress += courseEnrollment.getProgressPercent();
                }
            }
        }

        int progressPercent = totalProgress / courseIds.size();
        savePathProgress(employeeId, pathId, progressPercent);
        return progressPercent;
    }

    private void savePathProgress(UUID employeeId, UUID pathId, int progressPercent) {
        LearningPathProgress progress = learningPathProgressRepository.findByEmployeeIdAndPathId(employeeId, pathId)
                .orElseGet(() -> {
                    LearningPathProgress p = new LearningPathProgress();
                    p.setEmployeeId(employeeId);
                    p.setPathId(pathId);
                    return p;
                });
        progress.setProgressPercent(progressPercent);
        progress.setUpdatedAt(Instant.now());
        learningPathProgressRepository.save(progress);
    }

    private void recalculateLearningPathsProgress(UUID employeeId, UUID courseId) {
        List<LearningPath> allPaths = learningPathRepository.findAll();
        for (LearningPath lp : allPaths) {
            boolean hasCourse = lp.getLearningPathCourses().stream()
                    .anyMatch(lpc -> lpc.getCourseId().equals(courseId));
            if (hasCourse) {
                calculatePathProgress(employeeId, lp.getId());
            }
        }
    }

    public Map<String, Object> getDashboardStats(UUID employeeId) {
        verifyEmployeeAccess(employeeId);
        if (!skillServiceClient.employeeExists(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }
        
        long activeCount = enrollmentRepository.countActiveEnrollmentsByEmployeeId(employeeId);
        long completedCourses = enrollmentRepository.countCompletedCoursesByEmployeeId(employeeId);
        long completedPaths = enrollmentRepository.countCompletedPathsByEmployeeId(employeeId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeEnrollmentsCount", activeCount);
        stats.put("completedCoursesCount", completedCourses);
        stats.put("completedLearningPathsCount", completedPaths);
        return stats;
    }

    public List<EnrollmentDTO> getEnrollmentsByCourse(UUID courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLearningDataByEmployeeId(UUID employeeId) {
        enrollmentRepository.deleteByEmployeeId(employeeId);
        learningPathProgressRepository.deleteByEmployeeId(employeeId);
    }

    public void verifyEmployeeAccess(UUID employeeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            boolean isAdminOrManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") 
                            || a.getAuthority().equals("ROLE_HR_MANAGER") 
                            || a.getAuthority().equals("ROLE_TRAINING_MANAGER"));
            
            if (!isAdminOrManager) {
                java.util.Map<String, Object> emp = skillServiceClient.getEmployee(employeeId);
                if (emp == null) {
                    throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
                }
                String email = (String) emp.get("email");
                String callerEmail = auth.getName();
                if (email == null || !email.equalsIgnoreCase(callerEmail)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access data for employee " + employeeId);
                }
            }
        }
    }

    private void triggerCertificationRegistration(Enrollment enrollment) {
        if (enrollment.getCourseId() != null && enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
            try {
                java.util.List<java.util.Map<String, Object>> certs = certificationServiceClient.getCertificationsByCourse(enrollment.getCourseId());
                if (certs != null && !certs.isEmpty()) {
                    LocalDate completionDate = enrollment.getCompletedAt() != null 
                            ? LocalDate.ofInstant(enrollment.getCompletedAt(), ZoneId.systemDefault())
                            : LocalDate.now();

                    for (java.util.Map<String, Object> cert : certs) {
                        String certIdStr = (String) cert.get("id");
                        if (certIdStr != null) {
                            UUID certId = UUID.fromString(certIdStr);
                            boolean registered = certificationServiceClient.registerEmployeeCertification(
                                    enrollment.getEmployeeId(), 
                                    certId, 
                                    completionDate
                            );
                            if (registered) {
                                log.info("Successfully registered certification {} for employee {}", certId, enrollment.getEmployeeId());
                            } else {
                                log.warn("Failed to register certification {} for employee {}", certId, enrollment.getEmployeeId());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error occurred while automatically registering certification for completed enrollment {}: {}", 
                        enrollment.getId(), e.getMessage(), e);
            }
        }
    }

    private EnrollmentDTO mapToDTO(Enrollment e) {
        return new EnrollmentDTO(
                e.getId(),
                e.getEmployeeId(),
                e.getCourseId(),
                e.getCourse() != null ? e.getCourse().getTitle() : null,
                e.getLearningPathId(),
                e.getLearningPath() != null ? e.getLearningPath().getName() : null,
                e.getStatus().name(),
                e.getProgressPercent(),
                e.getFinalScore(),
                e.getEnrolledAt(),
                e.getCompletedAt(),
                e.getUpdatedAt(),
                e.getCourse() != null ? e.getCourse().getLearningSourceUrl() : null
        );
    }

    @Transactional
    public QuizResultDTO submitQuiz(UUID enrollmentId, List<AnswerSelection> answers) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + enrollmentId));
        verifyEmployeeAccess(enrollment.getEmployeeId());

        if (enrollment.getCourseId() == null) {
            throw new IllegalArgumentException("Quizzes can only be completed for course enrollments.");
        }

        List<QuizQuestion> questions = quizQuestionRepository.findByCourseId(enrollment.getCourseId());
        if (questions.isEmpty()) {
            throw new ResourceNotFoundException("No quiz configured for this course.");
        }

        int correctCount = 0;
        for (QuizQuestion q : questions) {
            String correctAns = q.getCorrectOption().trim().toUpperCase();
            String userAns = answers.stream()
                    .filter(a -> a.questionId().equals(q.getId()))
                    .map(a -> a.selectedOption() != null ? a.selectedOption().trim().toUpperCase() : "")
                    .findFirst()
                    .orElse("");

            if (correctAns.equals(userAns)) {
                correctCount++;
            }
        }

        int score = (int) Math.round((correctCount / (double) questions.size()) * 100.0);
        boolean passed = score >= 80;

        enrollment.setFinalScore(score);
        enrollment.setUpdatedAt(Instant.now());

        if (passed) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setProgressPercent(100);
            enrollment.setCompletedAt(Instant.now());
            enrollmentRepository.save(enrollment);

            courseCertificateService.generateCertificate(enrollment);
            triggerCertificationRegistration(enrollment);
        } else {
            enrollmentRepository.save(enrollment);
        }

        recalculateLearningPathsProgress(enrollment.getEmployeeId(), enrollment.getCourseId());

        return new QuizResultDTO(score, passed, enrollment.getStatus().name());
    }
}
