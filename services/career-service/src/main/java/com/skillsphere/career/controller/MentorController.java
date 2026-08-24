package com.skillsphere.career.controller;

import com.skillsphere.career.dto.MentorDTO;
import com.skillsphere.career.service.MentorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mentors")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @GetMapping
    public ResponseEntity<List<MentorDTO>> getMentors() {
        return ResponseEntity.ok(mentorService.getAllMentors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MentorDTO> getMentorById(@PathVariable UUID id) {
        return ResponseEntity.ok(mentorService.getMentorById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<MentorDTO> registerMentor(@RequestBody Map<String, String> payload) {
        UUID employeeId = UUID.fromString(payload.get("employeeId"));
        String notes = payload.get("guidanceNotes");
        MentorDTO created = mentorService.registerMentor(employeeId, notes);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteMentor(@PathVariable UUID id) {
        mentorService.deleteMentor(id);
        return ResponseEntity.noContent().build();
    }
}
