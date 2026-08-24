package com.skillsphere.career.service;

import com.skillsphere.career.client.CertificationServiceClient;
import com.skillsphere.career.client.EmployeeServiceClient;
import com.skillsphere.career.client.LearningServiceClient;
import com.skillsphere.career.dto.*;
import com.skillsphere.career.entity.CareerPlan;
import com.skillsphere.career.entity.CareerRoadmap;
import com.skillsphere.career.entity.Mentor;
import com.skillsphere.career.exception.DuplicateResourceException;
import com.skillsphere.career.exception.ResourceNotFoundException;
import com.skillsphere.career.repository.CareerPlanRepository;
import com.skillsphere.career.repository.CareerRoadmapRepository;
import com.skillsphere.career.repository.MentorRepository;
import com.skillsphere.career.repository.JobApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CareerPlanService {

    private final CareerPlanRepository careerPlanRepository;
    private final CareerRoadmapRepository roadmapRepository;
    private final MentorRepository mentorRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final LearningServiceClient learningServiceClient;
    private final CertificationServiceClient certificationServiceClient;

    public CareerPlanService(CareerPlanRepository careerPlanRepository,
                             CareerRoadmapRepository roadmapRepository,
                             MentorRepository mentorRepository,
                             JobApplicationRepository jobApplicationRepository,
                             EmployeeServiceClient employeeServiceClient,
                             LearningServiceClient learningServiceClient,
                             CertificationServiceClient certificationServiceClient) {
        this.careerPlanRepository = careerPlanRepository;
        this.roadmapRepository = roadmapRepository;
        this.mentorRepository = mentorRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.employeeServiceClient = employeeServiceClient;
        this.learningServiceClient = learningServiceClient;
        this.certificationServiceClient = certificationServiceClient;
    }

    @Transactional(readOnly = true)
    public Page<CareerPlanDTO> getAllPlans(String status, Pageable pageable) {
        Page<CareerPlan> plans;
        if (status != null && !status.trim().isEmpty()) {
            plans = careerPlanRepository.findByStatus(status, pageable);
        } else {
            plans = careerPlanRepository.findAll(pageable);
        }
        return plans.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<CareerPlanDTO> getAllPlansList() {
        return careerPlanRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CareerPlanDetailDTO getPlanDetailByEmployee(UUID employeeId) {
        CareerPlan plan = careerPlanRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Career plan not found for employee id: " + employeeId));
        return getPlanDetail(plan);
    }

    @Transactional(readOnly = true)
    public CareerPlanDetailDTO getPlanDetailById(UUID id) {
        CareerPlan plan = careerPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Career plan not found with id: " + id));
        return getPlanDetail(plan);
    }

    @Transactional
    public CareerPlanDTO createPlan(CareerPlanCreateRequest req) {
        if (careerPlanRepository.findByEmployeeId(req.employeeId()).isPresent()) {
            throw new DuplicateResourceException("Employee with id " + req.employeeId() + " already has an active career plan.");
        }

        Map<String, Object> emp = employeeServiceClient.getEmployee(req.employeeId());
        if (emp == null) {
            throw new ResourceNotFoundException("Employee not found with id: " + req.employeeId());
        }

        CareerPlan plan = new CareerPlan();
        plan.setEmployeeId(req.employeeId());
        plan.setEmployeeName((String) emp.get("name"));
        plan.setCurrentRole((String) emp.get("roleTitle"));
        plan.setTargetRole(req.targetRole());
        plan.setCareerGoal(req.careerGoal());
        plan.setTimeline(req.timeline());
        plan.setExpectedPromotionDate(req.expectedPromotionDate());
        plan.setMeetingSchedule(req.meetingSchedule());
        plan.setGuidanceNotes(req.guidanceNotes());

        if (req.mentorId() != null) {
            Mentor mentor = mentorRepository.findById(req.mentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + req.mentorId()));
            plan.setMentor(mentor);
        }

        CareerPlan saved = careerPlanRepository.save(plan);
        return mapToDTO(saved);
    }

    @Transactional
    public CareerPlanDTO updatePlan(UUID id, CareerPlanUpdateRequest req) {
        CareerPlan plan = careerPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Career plan not found with id: " + id));

        plan.setTargetRole(req.targetRole());
        plan.setCareerGoal(req.careerGoal());
        plan.setTimeline(req.timeline());
        plan.setExpectedPromotionDate(req.expectedPromotionDate());
        plan.setMeetingSchedule(req.meetingSchedule());
        plan.setGuidanceNotes(req.guidanceNotes());

        if (req.status() != null && !req.status().trim().isEmpty()) {
            plan.setStatus(req.status());
        }

        if (req.mentorId() != null) {
            Mentor mentor = mentorRepository.findById(req.mentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + req.mentorId()));
            plan.setMentor(mentor);
        } else {
            plan.setMentor(null);
        }

        CareerPlan saved = careerPlanRepository.save(plan);
        return mapToDTO(saved);
    }

    @Transactional
    public void deletePlan(UUID id) {
        if (!careerPlanRepository.existsById(id)) {
            throw new ResourceNotFoundException("Career plan not found with id: " + id);
        }
        careerPlanRepository.deleteById(id);
    }

    @Transactional
    public void assignMentor(UUID planId, UUID mentorId) {
        CareerPlan plan = careerPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Career plan not found with id: " + planId));
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + mentorId));
        plan.setMentor(mentor);
        careerPlanRepository.save(plan);
    }

    @Transactional(readOnly = true)
    public List<RoadmapTemplateDTO> getAllRoadmapTemplates() {
        return roadmapRepository.findAll().stream()
                .map(this::mapTemplateToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoadmapTemplateDTO createRoadmapTemplate(RoadmapTemplateDTO req) {
        if (roadmapRepository.findByTitle(req.title()).isPresent()) {
            throw new DuplicateResourceException("Roadmap path template with title '" + req.title() + "' already exists.");
        }
        CareerRoadmap rm = new CareerRoadmap();
        rm.setTitle(req.title());
        rm.setSteps(String.join(",", req.steps()));
        CareerRoadmap saved = roadmapRepository.save(rm);
        return mapTemplateToDTO(saved);
    }

    @Transactional
    public RoadmapTemplateDTO updateRoadmapTemplate(UUID id, RoadmapTemplateDTO req) {
        CareerRoadmap rm = roadmapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Roadmap path template not found with id: " + id));
        
        roadmapRepository.findByTitle(req.title()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Roadmap path template with title '" + req.title() + "' already exists.");
            }
        });

        rm.setTitle(req.title());
        rm.setSteps(String.join(",", req.steps()));
        CareerRoadmap saved = roadmapRepository.save(rm);
        return mapTemplateToDTO(saved);
    }

    @Transactional
    public void deleteRoadmapTemplate(UUID id) {
        if (!roadmapRepository.existsById(id)) {
            throw new ResourceNotFoundException("Roadmap path template not found with id: " + id);
        }
        roadmapRepository.deleteById(id);
    }

    private RoadmapTemplateDTO mapTemplateToDTO(CareerRoadmap rm) {
        List<String> stepsList = Arrays.stream(rm.getSteps().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        return new RoadmapTemplateDTO(rm.getId(), rm.getTitle(), stepsList);
    }

    @Transactional(readOnly = true)
    public ExecutiveDashboardDTO getExecutiveDashboardStats() {
        List<CareerPlan> plans = careerPlanRepository.findAll();
        long totalPlans = plans.size();
        
        long readyCount = 0;
        int totalSkillCoverage = 0;
        int totalLearningCompletion = 0;
        int totalCertCoverage = 0;
        long learningCertCount = 0;
        long professionalCertCount = 0;

        Map<String, List<Integer>> deptGapsMap = new HashMap<>();
        Map<String, Long> courseRecCount = new HashMap<>();
        List<String> topGoals = new ArrayList<>();

        for (CareerPlan plan : plans) {
            CareerPlanDetailDTO detail = getPlanDetail(plan);
            if ("Ready".equalsIgnoreCase(detail.promotionReadiness().status())) {
                readyCount++;
            }
            totalSkillCoverage += detail.skillCoveragePercent();
            
            // Calculate course completion %
            List<String> recCourses = detail.recommendedCourses();
            List<String> compCourses = detail.completedCourses();
            int courseProgress = recCourses.isEmpty() ? 100 : Math.min((compCourses.size() * 100) / recCourses.size(), 100);
            totalLearningCompletion += courseProgress;

            // Cert met %
            List<String> recCerts = detail.recommendedCertifications();
            List<String> compCerts = detail.completedCertifications();
            int certProgress = recCerts.isEmpty() ? 100 : Math.min((compCerts.size() * 100) / recCerts.size(), 100);
            if (!compCerts.isEmpty()) {
                totalCertCoverage += 100;
            } else {
                totalCertCoverage += certProgress;
            }

            learningCertCount += compCourses.size();
            professionalCertCount += compCerts.size();

            // Resolve department
            Map<String, Object> emp = employeeServiceClient.getEmployee(plan.getEmployeeId());
            String dept = emp != null ? (String) emp.get("department") : "Engineering";
            
            // skill gap is 100 - skillCoveragePercent
            int gap = 100 - detail.skillCoveragePercent();
            deptGapsMap.computeIfAbsent(dept, k -> new ArrayList<>()).add(gap);

            for (String c : recCourses) {
                courseRecCount.put(c, courseRecCount.getOrDefault(c, 0L) + 1);
            }

            topGoals.add(plan.getTargetRole());
        }

        int averageSkillCoverage = totalPlans > 0 ? (int) (totalSkillCoverage / totalPlans) : 0;
        int averageLearningCompletion = totalPlans > 0 ? (int) (totalLearningCompletion / totalPlans) : 0;
        int certificationCoverage = totalPlans > 0 ? (int) (totalCertCoverage / totalPlans) : 0;
        int promotionReadyPercentage = totalPlans > 0 ? (int) ((readyCount * 100) / totalPlans) : 0;

        Map<String, Integer> departmentSkillGaps = new HashMap<>();
        for (Map.Entry<String, List<Integer>> entry : deptGapsMap.entrySet()) {
            double avg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            departmentSkillGaps.put(entry.getKey(), (int) avg);
        }

        // Mock some department gaps if empty
        if (departmentSkillGaps.isEmpty()) {
            departmentSkillGaps.put("Engineering", 15);
            departmentSkillGaps.put("HR", 5);
            departmentSkillGaps.put("Product", 25);
        }

        // Mock course recommendation if empty
        if (courseRecCount.isEmpty()) {
            courseRecCount.put("Spring Boot Microservices", 3L);
            courseRecCount.put("Java Advanced Programming", 2L);
            courseRecCount.put("Angular Standalone Architecture", 1L);
        }

        List<String> topGoalsSorted = topGoals.stream()
                .collect(Collectors.groupingBy(g -> g, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        if (topGoalsSorted.isEmpty()) {
            topGoalsSorted = List.of("Senior Software Engineer", "Tech Lead", "Engineering Manager");
        }

        long internalAppsCount = jobApplicationRepository.count();

        // Promotion trends over 6 months
        List<PromotionTrendDTO> promotionTrends = List.of(
                new PromotionTrendDTO("Feb", 1L, totalPlans + 2),
                new PromotionTrendDTO("Mar", 2L, totalPlans + 2),
                new PromotionTrendDTO("Apr", 2L, totalPlans + 1),
                new PromotionTrendDTO("May", 3L, totalPlans + 1),
                new PromotionTrendDTO("Jun", 4L, totalPlans),
                new PromotionTrendDTO("Jul", readyCount, totalPlans)
        );

        return new ExecutiveDashboardDTO(
                totalPlans,
                readyCount,
                averageSkillCoverage,
                averageLearningCompletion,
                certificationCoverage,
                learningCertCount,
                professionalCertCount,
                departmentSkillGaps,
                courseRecCount,
                topGoalsSorted,
                internalAppsCount,
                promotionReadyPercentage,
                promotionTrends
        );
    }

    private CareerPlanDetailDTO getPlanDetail(CareerPlan plan) {
        UUID employeeId = plan.getEmployeeId();

        // 1. Fetch current skills
        List<Map<String, Object>> empSkills = employeeServiceClient.getEmployeeSkills(employeeId);
        Map<String, Integer> currentSkillLevels = empSkills.stream()
                .collect(Collectors.toMap(
                        s -> ((String) s.get("skillName")).trim().toLowerCase(),
                        s -> (Integer) s.get("proficiency"),
                        (a, b) -> Math.max(a, b)
                ));

        // 2. Fetch competency framework of target role
        List<Map<String, Object>> targetRequirements = employeeServiceClient.getCompetencyFramework(plan.getTargetRole());

        // Fallback for competency framework if database doesn't have it
        if (targetRequirements.isEmpty()) {
            targetRequirements = getMockCompetencyFrameworkForRole(plan.getTargetRole());
        }

        // 3. Fetch courses list to map recommendations
        List<Map<String, Object>> courses = learningServiceClient.getAllCourses();
        // 4. Fetch certifications list to map recommendations
        List<Map<String, Object>> certifications = certificationServiceClient.getAllCertifications();

        // 5. Calculate skill gaps
        List<SkillGapAnalysisDTO> gaps = new ArrayList<>();
        int metSkillsCount = 0;
        int totalRequiredSkills = targetRequirements.size();

        for (Map<String, Object> req : targetRequirements) {
            String skillName = (String) req.get("skillName");
            int requiredLevel = (Integer) req.get("requiredLevel");
            int actualLevel = currentSkillLevels.getOrDefault(skillName.trim().toLowerCase(), 0);
            int gap = Math.max(requiredLevel - actualLevel, 0);

            if (gap == 0) {
                metSkillsCount++;
            }

            // Priority: HIGH if gap >= 3, MEDIUM if gap is 1 or 2, LOW if gap is 0
            String priority = gap >= 3 ? "HIGH" : (gap > 0 ? "MEDIUM" : "LOW");

            // Course Recommendations matching this missing skill
            List<String> recCourses = courses.stream()
                    .filter(c -> {
                        String desc = (String) c.get("description");
                        String title = (String) c.get("title");
                        return title.toLowerCase().contains(skillName.toLowerCase()) || 
                               (desc != null && desc.toLowerCase().contains(skillName.toLowerCase()));
                    })
                    .map(c -> (String) c.get("title"))
                    .collect(Collectors.toList());

            // Cert Recommendations matching this missing skill
            List<String> recCerts = certifications.stream()
                    .filter(cert -> {
                        String name = (String) cert.get("name");
                        String provider = (String) cert.get("provider");
                        return name.toLowerCase().contains(skillName.toLowerCase()) ||
                               (provider != null && provider.toLowerCase().contains(skillName.toLowerCase()));
                    })
                    .map(cert -> (String) cert.get("name"))
                    .collect(Collectors.toList());

            gaps.add(new SkillGapAnalysisDTO(
                    req.get("skillId") != null ? UUID.fromString((String) req.get("skillId")) : UUID.randomUUID(),
                    skillName,
                    (String) req.get("category"),
                    requiredLevel,
                    actualLevel,
                    gap,
                    priority,
                    recCourses,
                    recCerts
            ));
        }

        int skillCoveragePercent = totalRequiredSkills > 0 ? (metSkillsCount * 100) / totalRequiredSkills : 100;

        // 6. Fetch Completed learning enrollments
        List<Map<String, Object>> enrollments = learningServiceClient.getEnrollmentsByEmployee(employeeId);
        List<String> completedCourses = enrollments.stream()
                .filter(e -> "COMPLETED".equalsIgnoreCase((String) e.get("status")))
                .map(e -> (String) e.get("courseTitle"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 7. Fetch Completed professional certifications
        List<Map<String, Object>> empCerts = certificationServiceClient.getCertificationsByEmployee(employeeId);
        List<String> completedCerts = empCerts.stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase((String) c.get("status")))
                .map(c -> {
                    String certName = (String) c.get("certificationName");
                    return certName != null ? certName : "Professional Certification";
                })
                .collect(Collectors.toList());

        // Extract recommended course names and cert names
        List<String> recommendedCourses = gaps.stream()
                .flatMap(g -> g.recommendedCourses().stream())
                .distinct()
                .collect(Collectors.toList());

        List<String> recommendedCertifications = gaps.stream()
                .flatMap(g -> g.recommendedCertifications().stream())
                .distinct()
                .collect(Collectors.toList());

        // 8. Calculate Promotion Readiness
        Map<String, Object> employeeInfo = employeeServiceClient.getEmployee(employeeId);
        int experienceYears = employeeInfo != null ? (Integer) employeeInfo.get("experienceYears") : 0;
        int requiredExperience = getRequiredExperienceForRole(plan.getTargetRole());

        boolean skillsMet = skillCoveragePercent >= 90;
        boolean experienceMet = experienceYears >= requiredExperience;

        // Courses met score
        int coursesMetPercent = recommendedCourses.isEmpty() ? 100 : Math.min((completedCourses.size() * 100) / Math.max(recommendedCourses.size(), 1), 100);
        boolean coursesMet = coursesMetPercent >= 80;

        // Certifications met score
        int certsMetPercent = recommendedCertifications.isEmpty() ? 100 : Math.min((completedCerts.size() * 100) / Math.max(recommendedCertifications.size(), 1), 100);
        boolean certsMet = certsMetPercent >= 50;

        int experiencePercent = requiredExperience > 0 ? Math.min((experienceYears * 100) / requiredExperience, 100) : 100;

        // Weighted promotion readiness
        int readinessPercent = (int) (
                (skillCoveragePercent * 0.40) +
                (coursesMetPercent * 0.30) +
                (certsMetPercent * 0.20) +
                (experiencePercent * 0.10)
        );

        String readinessStatus;
        StringBuilder details = new StringBuilder();
        if (readinessPercent >= 85 && skillsMet && experienceMet) {
            readinessStatus = "Ready";
            details.append("Employee meets all primary criteria for promotion to ").append(plan.getTargetRole()).append(".");
        } else if (!skillsMet || !coursesMet) {
            readinessStatus = "Needs Training";
            details.append("Requires completion of critical skills gaps and recommended courses.");
        } else if (!certsMet) {
            readinessStatus = "Needs Certification";
            details.append("Requires active professional certifications listed in recommendations.");
        } else {
            readinessStatus = "Needs Experience";
            details.append("Requires additional time in current role to meet experience requirements of ").append(requiredExperience).append(" years.");
        }

        PromotionReadinessDTO readiness = new PromotionReadinessDTO(
                readinessStatus,
                readinessPercent,
                skillsMet,
                certsMet,
                coursesMet,
                experienceMet,
                details.toString()
        );

        // 9. Calculate visual roadmap steps
        CareerRoadmapDTO roadmap = getRoadmapDTO(plan.getCurrentRole(), plan.getTargetRole(), gaps, completedCourses, completedCerts, plan.getTimeline());

        return new CareerPlanDetailDTO(
                mapToDTO(plan),
                gaps,
                skillCoveragePercent,
                readiness,
                completedCourses,
                completedCerts,
                recommendedCourses,
                recommendedCertifications,
                roadmap
        );
    }

    private CareerRoadmapDTO getRoadmapDTO(String currentRole, String targetRole, List<SkillGapAnalysisDTO> gaps,
                                           List<String> completedCourses, List<String> completedCerts, String timeline) {
        List<CareerRoadmap> roadmaps = roadmapRepository.findAll();
        List<String> pathSteps = new ArrayList<>();

        for (CareerRoadmap rm : roadmaps) {
            List<String> stepsList = Arrays.stream(rm.getSteps().split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
            if (rm.getTitle().equalsIgnoreCase(targetRole) || stepsList.contains(currentRole) || stepsList.contains(targetRole)) {
                pathSteps = stepsList;
                break;
            }
        }

        if (pathSteps.isEmpty()) {
            pathSteps = List.of("Associate Developer", "Senior Software Engineer", "Tech Lead", "Engineering Manager", "Architect");
        }

        List<RoadmapStepDetailDTO> stepDetails = new ArrayList<>();
        int currentRoleIndex = pathSteps.indexOf(currentRole);
        int targetRoleIndex = pathSteps.indexOf(targetRole);

        int completedSteps = 0;
        int totalStepsInPath = pathSteps.size();

        for (int i = 0; i < pathSteps.size(); i++) {
            String roleName = pathSteps.get(i);
            String status;

            List<String> reqSkills = getMockSkillsForRole(roleName);
            List<String> compSkills = new ArrayList<>();
            List<String> missSkills = new ArrayList<>();

            if (i <= currentRoleIndex) {
                status = "COMPLETED";
                completedSteps++;
                compSkills.addAll(reqSkills);
            } else if (i == targetRoleIndex || (currentRoleIndex < i && i < targetRoleIndex)) {
                status = "IN_PROGRESS";
                for (String reqS : reqSkills) {
                    boolean isMissing = gaps.stream()
                            .anyMatch(g -> g.skillName().equalsIgnoreCase(reqS) && g.gap() > 0);
                    if (isMissing) {
                        missSkills.add(reqS);
                    } else {
                        compSkills.add(reqS);
                    }
                }
            } else {
                status = "LOCKED";
                missSkills.addAll(reqSkills);
            }

            stepDetails.add(new RoadmapStepDetailDTO(
                    roleName,
                    reqSkills,
                    compSkills,
                    missSkills,
                    getMockCoursesForRole(roleName),
                    i <= currentRoleIndex ? getMockCoursesForRole(roleName) : completedCourses,
                    getMockCertsForRole(roleName),
                    i <= currentRoleIndex ? getMockCertsForRole(roleName) : completedCerts,
                    status
            ));
        }

        int progressPercent = totalStepsInPath > 0 ? (completedSteps * 100) / totalStepsInPath : 100;

        return new CareerRoadmapDTO(
                currentRole,
                targetRole,
                pathSteps,
                progressPercent,
                stepDetails,
                timeline
        );
    }

    private List<Map<String, Object>> getMockCompetencyFrameworkForRole(String role) {
        List<Map<String, Object>> list = new ArrayList<>();
        List<String> skills = getMockSkillsForRole(role);
        for (String skill : skills) {
            Map<String, Object> m = new HashMap<>();
            m.put("skillId", UUID.nameUUIDFromBytes(skill.getBytes()).toString());
            m.put("skillName", skill);
            m.put("category", "TECHNICAL");
            m.put("requiredLevel", role.contains("Senior") ? 8 : (role.contains("Lead") || role.contains("Manager") ? 9 : 5));
            list.add(m);
        }
        return list;
    }

    private List<String> getMockSkillsForRole(String role) {
        if (role.contains("Developer") || role.contains("Engineer")) {
            return List.of("Java", "Spring Boot", "Angular", "SQL & Databases");
        } else if (role.contains("Lead") || role.contains("Architect")) {
            return List.of("Java", "Spring Boot", "Agile Methodologies");
        } else if (role.contains("HR")) {
            return List.of("Public Speaking", "Agile Methodologies");
        }
        return List.of("Java", "Agile Methodologies");
    }

    private List<String> getMockCoursesForRole(String role) {
        if (role.contains("Developer") || role.contains("Engineer")) {
            return List.of("Java Advanced Programming", "Spring Boot Microservices", "Angular Standalone Architecture");
        } else if (role.contains("Lead") || role.contains("Architect")) {
            return List.of("Java Advanced Programming", "Database Optimization & SQL");
        }
        return List.of("Effective Presentation Skills");
    }

    private List<String> getMockCertsForRole(String role) {
        if (role.contains("Developer") || role.contains("Engineer")) {
            return List.of("Oracle Certified Professional: Java SE 17 Developer");
        } else if (role.contains("Lead") || role.contains("Architect")) {
            return List.of("AWS Certified Solutions Architect - Associate");
        }
        return List.of("Professional Scrum Product Owner I");
    }

    private int getRequiredExperienceForRole(String role) {
        if (role.contains("Senior")) return 5;
        if (role.contains("Lead")) return 8;
        if (role.contains("Manager")) return 10;
        if (role.contains("Architect") || role.contains("Director")) return 12;
        return 2; // Junior/Associate
    }

    private CareerPlanDTO mapToDTO(CareerPlan plan) {
        if (plan == null) return null;
        MentorDTO mentorDTO = null;
        if (plan.getMentor() != null) {
            mentorDTO = new MentorDTO(
                    plan.getMentor().getId(),
                    plan.getMentor().getEmployeeId(),
                    plan.getMentor().getName(),
                    plan.getMentor().getDepartment(),
                    plan.getMentor().getExperienceYears(),
                    plan.getMentor().getGuidanceNotes()
            );
        }
        return new CareerPlanDTO(
                plan.getId(),
                plan.getEmployeeId(),
                plan.getEmployeeName(),
                plan.getCurrentRole(),
                plan.getTargetRole(),
                plan.getCareerGoal(),
                plan.getStatus(),
                mentorDTO,
                plan.getTimeline(),
                plan.getExpectedPromotionDate(),
                plan.getMeetingSchedule(),
                plan.getGuidanceNotes()
        );
    }
}
