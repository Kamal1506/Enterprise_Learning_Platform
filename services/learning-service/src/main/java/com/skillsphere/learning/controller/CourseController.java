package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.CourseDTO;
import com.skillsphere.learning.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<Page<CourseDTO>> getCourses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<CourseDTO> courses;
        
        if (search != null && !search.trim().isEmpty()) {
            courses = courseService.searchCoursesByTitle(search, pageable);
        } else if (type != null && !type.trim().isEmpty()) {
            courses = courseService.getCoursesByType(type, pageable);
        } else if (category != null && !category.trim().isEmpty()) {
            courses = courseService.getCoursesByCategory(category, pageable);
        } else {
            courses = courseService.getAllCourses(pageable);
        }
        
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/stats")
    public ResponseEntity<com.skillsphere.learning.dto.CourseStatsDTO> getGlobalStats() {
        return ResponseEntity.ok(courseService.getGlobalStats());
    }

    @GetMapping("/all")
    public ResponseEntity<List<CourseDTO>> getAllCoursesList() {
        return ResponseEntity.ok(courseService.getAllCoursesList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(@Valid @RequestBody CourseDTO dto) {
        CourseDTO created = courseService.createCourse(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(@PathVariable UUID id, @Valid @RequestBody CourseDTO dto) {
        return ResponseEntity.ok(courseService.updateCourse(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
}
