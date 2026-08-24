package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.LearningPathDTO;
import com.skillsphere.learning.service.LearningPathService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning-paths")
public class LearningPathController {

    private final LearningPathService learningPathService;

    public LearningPathController(LearningPathService learningPathService) {
        this.learningPathService = learningPathService;
    }

    @GetMapping
    public ResponseEntity<List<LearningPathDTO>> getAllLearningPaths() {
        return ResponseEntity.ok(learningPathService.getAllLearningPaths());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPathDTO> getLearningPathById(@PathVariable UUID id) {
        return ResponseEntity.ok(learningPathService.getLearningPathById(id));
    }

    @PostMapping
    public ResponseEntity<LearningPathDTO> createLearningPath(@Valid @RequestBody LearningPathDTO dto) {
        LearningPathDTO created = learningPathService.createLearningPath(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LearningPathDTO> updateLearningPath(
            @PathVariable UUID id,
            @Valid @RequestBody LearningPathDTO dto) {
        return ResponseEntity.ok(learningPathService.updateLearningPath(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLearningPath(@PathVariable UUID id) {
        learningPathService.deleteLearningPath(id);
        return ResponseEntity.noContent().build();
    }
}
