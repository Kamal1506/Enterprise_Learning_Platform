package com.skillsphere.skill.controller;

import com.skillsphere.skill.dto.CompetencyFrameworkDTO;
import com.skillsphere.skill.dto.SkillGapDTO;
import com.skillsphere.skill.service.CompetencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class CompetencyController {

    private final CompetencyService competencyService;

    public CompetencyController(CompetencyService competencyService) {
        this.competencyService = competencyService;
    }

    @GetMapping("/competency-frameworks")
    public ResponseEntity<List<CompetencyFrameworkDTO>> getCompetencyFrameworks(@RequestParam(required = false) String role) {
        List<CompetencyFrameworkDTO> frameworks = competencyService.getFrameworkByRole(role);
        return ResponseEntity.ok(frameworks);
    }

    @GetMapping("/employees/{id}/skill-gaps")
    public ResponseEntity<List<SkillGapDTO>> getEmployeeSkillGaps(@PathVariable UUID id) {
        List<SkillGapDTO> gaps = competencyService.calculateSkillGaps(id);
        return ResponseEntity.ok(gaps);
    }

    @PostMapping("/competency-frameworks")
    public ResponseEntity<CompetencyFrameworkDTO> createCompetencyFramework(@RequestBody CompetencyFrameworkDTO dto) {
        return ResponseEntity.ok(competencyService.createCompetencyFramework(dto));
    }

    @DeleteMapping("/competency-frameworks/{id}")
    public ResponseEntity<Void> deleteCompetencyFramework(@PathVariable UUID id) {
        competencyService.deleteCompetencyFramework(id);
        return ResponseEntity.noContent().build();
    }
}
