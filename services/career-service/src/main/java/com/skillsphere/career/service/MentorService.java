package com.skillsphere.career.service;

import com.skillsphere.career.client.EmployeeServiceClient;
import com.skillsphere.career.dto.MentorDTO;
import com.skillsphere.career.entity.Mentor;
import com.skillsphere.career.exception.DuplicateResourceException;
import com.skillsphere.career.exception.ResourceNotFoundException;
import com.skillsphere.career.repository.MentorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MentorService {

    private final MentorRepository mentorRepository;
    private final EmployeeServiceClient employeeServiceClient;

    public MentorService(MentorRepository mentorRepository,
                         EmployeeServiceClient employeeServiceClient) {
        this.mentorRepository = mentorRepository;
        this.employeeServiceClient = employeeServiceClient;
    }

    @Transactional(readOnly = true)
    public List<MentorDTO> getAllMentors() {
        return mentorRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MentorDTO getMentorById(UUID id) {
        Mentor m = mentorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + id));
        return mapToDTO(m);
    }

    @Transactional
    public MentorDTO registerMentor(UUID employeeId, String guidanceNotes) {
        if (mentorRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new DuplicateResourceException("Employee with id " + employeeId + " is already registered as a mentor.");
        }

        Map<String, Object> emp = employeeServiceClient.getEmployee(employeeId);
        if (emp == null) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        Mentor m = new Mentor();
        m.setEmployeeId(employeeId);
        m.setName((String) emp.get("name"));
        m.setDepartment((String) emp.get("department"));
        m.setExperienceYears((Integer) emp.get("experienceYears"));
        m.setGuidanceNotes(guidanceNotes);

        Mentor saved = mentorRepository.save(m);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteMentor(UUID id) {
        if (!mentorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Mentor not found with id: " + id);
        }
        mentorRepository.deleteById(id);
    }

    public MentorDTO mapToDTO(Mentor m) {
        if (m == null) return null;
        return new MentorDTO(
                m.getId(),
                m.getEmployeeId(),
                m.getName(),
                m.getDepartment(),
                m.getExperienceYears(),
                m.getGuidanceNotes()
        );
    }
}
