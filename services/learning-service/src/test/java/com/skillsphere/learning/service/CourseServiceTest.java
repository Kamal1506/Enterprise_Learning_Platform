package com.skillsphere.learning.service;

import com.skillsphere.learning.dto.CourseDTO;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCategory;
import com.skillsphere.learning.entity.CourseType;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.EnrollmentRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import com.skillsphere.learning.repository.LearningPathProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private LearningPathProgressRepository learningPathProgressRepository;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(
                courseRepository, enrollmentRepository, learningPathRepository, learningPathProgressRepository
        );
    }

    @Test
    void createCourse_Success() {
        CourseDTO request = new CourseDTO(
                null, "Java Advanced Programming", "Deep dive into Java",
                "TECHNICAL", "ONLINE", "Dr. James Gosling", 4.8,
                null, null, null, null, null, null, 30, null, null
        );
        
        when(courseRepository.findByTitleIgnoreCase("Java Advanced Programming")).thenReturn(Optional.empty());
        
        Course saved = new Course();
        saved.setId(UUID.randomUUID());
        saved.setTitle("Java Advanced Programming");
        saved.setDescription("Deep dive into Java");
        saved.setCategory(CourseCategory.TECHNICAL);
        saved.setType(CourseType.ONLINE);
        saved.setInstructor("Dr. James Gosling");
        saved.setRating(4.8);
        saved.setDurationHours(30);
        
        when(courseRepository.save(any(Course.class))).thenReturn(saved);
        when(courseRepository.findById(saved.getId())).thenReturn(Optional.of(saved));

        CourseDTO result = courseService.createCourse(request);

        assertNotNull(result);
        assertNotNull(result.id());
        assertEquals("Java Advanced Programming", result.title());
        assertEquals("TECHNICAL", result.category());
        assertEquals("ONLINE", result.type());
        assertEquals("Dr. James Gosling", result.instructor());
        assertEquals(4.8, result.rating());
        assertEquals(30, result.durationHours());
        verify(courseRepository, times(1)).save(any(Course.class));
    }

    @Test
    void createCourse_DuplicateTitle_ThrowsException() {
        CourseDTO request = new CourseDTO(
                null, "Java Advanced Programming", "Deep dive into Java",
                "TECHNICAL", "ONLINE", "Dr. James Gosling", 4.8,
                null, null, null, null, null, null, 30, null, null
        );
        
        when(courseRepository.findByTitleIgnoreCase("Java Advanced Programming")).thenReturn(Optional.of(new Course()));

        assertThrows(DuplicateResourceException.class, () -> courseService.createCourse(request));
    }

    @Test
    void getCourseById_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        when(courseRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> courseService.getCourseById(id));
    }
}
