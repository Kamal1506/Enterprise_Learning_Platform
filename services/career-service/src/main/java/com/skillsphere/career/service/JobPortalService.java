package com.skillsphere.career.service;

import com.skillsphere.career.client.EmployeeServiceClient;
import com.skillsphere.career.dto.JobApplicationDTO;
import com.skillsphere.career.dto.JobMatchDTO;
import com.skillsphere.career.dto.JobPostingDTO;
import com.skillsphere.career.entity.JobApplication;
import com.skillsphere.career.entity.JobPosting;
import com.skillsphere.career.exception.DuplicateResourceException;
import com.skillsphere.career.exception.ResourceNotFoundException;
import com.skillsphere.career.repository.JobApplicationRepository;
import com.skillsphere.career.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobPortalService {

    private final JobPostingRepository jobPostingRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final EmployeeServiceClient employeeServiceClient;

    public JobPortalService(JobPostingRepository jobPostingRepository,
                            JobApplicationRepository jobApplicationRepository,
                            EmployeeServiceClient employeeServiceClient) {
        this.jobPostingRepository = jobPostingRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.employeeServiceClient = employeeServiceClient;
    }

    @Transactional(readOnly = true)
    public List<JobPostingDTO> getActiveJobs() {
        return jobPostingRepository.findByActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobPostingDTO> getAllJobs() {
        return jobPostingRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobPostingDTO getJobById(UUID id) {
        JobPosting jp = jobPostingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found with id: " + id));
        return mapToDTO(jp);
    }

    @Transactional
    public JobPostingDTO createJobPosting(JobPostingDTO dto) {
        JobPosting jp = new JobPosting();
        jp.setRoleTitle(dto.roleTitle());
        jp.setDepartment(dto.department());
        jp.setLocation(dto.location());
        jp.setExperienceRequired(dto.experienceRequired());
        jp.setRequiredSkills(dto.requiredSkills());
        jp.setSalaryBand(dto.salaryBand());
        jp.setDescription(dto.description());
        jp.setEligibility(dto.eligibility());
        jp.setActive(dto.active() != null ? dto.active() : true);

        JobPosting saved = jobPostingRepository.save(jp);
        return mapToDTO(saved);
    }

    @Transactional
    public JobPostingDTO updateJobPosting(UUID id, JobPostingDTO dto) {
        JobPosting jp = jobPostingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found with id: " + id));

        jp.setRoleTitle(dto.roleTitle());
        jp.setDepartment(dto.department());
        jp.setLocation(dto.location());
        jp.setExperienceRequired(dto.experienceRequired());
        jp.setRequiredSkills(dto.requiredSkills());
        jp.setSalaryBand(dto.salaryBand());
        jp.setDescription(dto.description());
        jp.setEligibility(dto.eligibility());
        if (dto.active() != null) {
            jp.setActive(dto.active());
        }

        return mapToDTO(jobPostingRepository.save(jp));
    }

    @Transactional
    public void deleteJobPosting(UUID id) {
        if (!jobPostingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Job posting not found with id: " + id);
        }
        jobPostingRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public JobMatchDTO getJobMatch(UUID jobId, UUID employeeId) {
        JobPosting jp = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found with id: " + jobId));

        List<Map<String, Object>> empSkills = employeeServiceClient.getEmployeeSkills(employeeId);
        Set<String> employeeSkillsSet = empSkills.stream()
                .map(s -> ((String) s.get("skillName")).trim().toLowerCase())
                .collect(Collectors.toSet());

        String reqSkillsStr = jp.getRequiredSkills();
        List<String> requiredSkills = Arrays.stream(reqSkillsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        List<String> matchingSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String req : requiredSkills) {
            if (employeeSkillsSet.contains(req.toLowerCase())) {
                matchingSkills.add(req);
            } else {
                missingSkills.add(req);
            }
        }

        int matchPercent = 100;
        if (!requiredSkills.isEmpty()) {
            matchPercent = (matchingSkills.size() * 100) / requiredSkills.size();
        }

        List<String> recommendations = missingSkills.stream()
                .map(skill -> "Enroll in courses teaching " + skill + " to complete this gap.")
                .collect(Collectors.toList());

        return new JobMatchDTO(
                mapToDTO(jp),
                matchPercent,
                matchingSkills,
                missingSkills,
                recommendations
        );
    }

    @Transactional
    public JobApplicationDTO applyForJob(UUID jobId, UUID employeeId) {
        if (jobApplicationRepository.findByEmployeeIdAndJobPostingId(employeeId, jobId).isPresent()) {
            throw new DuplicateResourceException("Employee has already applied to this job posting.");
        }

        JobPosting jp = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found with id: " + jobId));

        Map<String, Object> emp = employeeServiceClient.getEmployee(employeeId);
        if (emp == null) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        JobMatchDTO matchResult = getJobMatch(jobId, employeeId);

        JobApplication ja = new JobApplication();
        ja.setJobPosting(jp);
        ja.setEmployeeId(employeeId);
        ja.setEmployeeName((String) emp.get("name"));
        ja.setMatchPercent(matchResult.matchPercent());
        ja.setStatus("PENDING");

        JobApplication saved = jobApplicationRepository.save(ja);
        return mapToApplicationDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<JobApplicationDTO> getApplicationsForEmployee(UUID employeeId) {
        return jobApplicationRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToApplicationDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobApplicationDTO> getApplicationsForJob(UUID jobId) {
        return jobApplicationRepository.findByJobPostingId(jobId).stream()
                .map(this::mapToApplicationDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobApplicationDTO> getAllApplications() {
        return jobApplicationRepository.findAll().stream()
                .map(this::mapToApplicationDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public JobApplicationDTO updateApplicationStatus(UUID id, String status) {
        JobApplication ja = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found with id: " + id));
        ja.setStatus(status);
        return mapToApplicationDTO(jobApplicationRepository.save(ja));
    }

    private JobPostingDTO mapToDTO(JobPosting jp) {
        return new JobPostingDTO(
                jp.getId(),
                jp.getRoleTitle(),
                jp.getDepartment(),
                jp.getLocation(),
                jp.getExperienceRequired(),
                jp.getRequiredSkills(),
                jp.getSalaryBand(),
                jp.getDescription(),
                jp.getEligibility(),
                jp.getActive()
        );
    }

    private JobApplicationDTO mapToApplicationDTO(JobApplication ja) {
        return new JobApplicationDTO(
                ja.getId(),
                ja.getJobPosting().getId(),
                ja.getJobPosting().getRoleTitle(),
                ja.getJobPosting().getDepartment(),
                ja.getJobPosting().getLocation(),
                ja.getEmployeeId(),
                ja.getEmployeeName(),
                ja.getStatus(),
                ja.getAppliedAt(),
                ja.getMatchPercent()
        );
    }
}
