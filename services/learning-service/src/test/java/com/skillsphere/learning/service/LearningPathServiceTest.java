package com.skillsphere.learning.service;

import com.skillsphere.learning.dto.LearningPathDTO;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCategory;
import com.skillsphere.learning.entity.CourseType;
import com.skillsphere.learning.entity.LearningPath;
import com.skillsphere.learning.entity.LearningPathCourse;
import com.skillsphere.learning.exception.DuplicateResourceException;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.repository.LearningPathRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LearningPathServiceTest {

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private CourseRepository courseRepository;

    private LearningPathService learningPathService;

    @BeforeEach
    void setUp() {
        learningPathService = new LearningPathService(learningPathRepository, courseRepository);
    }

    @Test
    void createLearningPath_Success() {
        UUID courseId = UUID.randomUUID();
        LearningPathDTO request = new LearningPathDTO(null, "Full-stack Path", "Desc", null, List.of(courseId), null, null);

        when(learningPathRepository.findByNameIgnoreCase("Full-stack Path")).thenReturn(Optional.empty());
        
        Course course = new Course();
        course.setId(courseId);
        course.setTitle("Java");
        course.setCategory(CourseCategory.TECHNICAL);
        course.setType(CourseType.ONLINE);
        course.setInstructor("Dr. James Gosling");
        course.setRating(4.8);
        course.setDurationHours(20);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        LearningPath saved = new LearningPath();
        saved.setId(UUID.randomUUID());
        saved.setName("Full-stack Path");
        saved.setDescription("Desc");
        
        LearningPathCourse lpc = new LearningPathCourse();
        lpc.setCourseId(courseId);
        lpc.setSequenceOrder(1);
        lpc.setCourse(course);
        saved.setLearningPathCourses(List.of(lpc));

        when(learningPathRepository.save(any(LearningPath.class))).thenReturn(saved);

        LearningPathDTO result = learningPathService.createLearningPath(request);

        assertNotNull(result);
        assertEquals("Full-stack Path", result.name());
        assertEquals(1, result.courses().size());
        assertEquals("Java", result.courses().get(0).title());
        verify(learningPathRepository, times(1)).save(any(LearningPath.class));
    }

    @Test
    void createLearningPath_Duplicate_ThrowsException() {
        LearningPathDTO request = new LearningPathDTO(null, "Full-stack Path", "Desc", null, null, null, null);
        when(learningPathRepository.findByNameIgnoreCase("Full-stack Path")).thenReturn(Optional.of(new LearningPath()));

        assertThrows(DuplicateResourceException.class, () -> learningPathService.createLearningPath(request));
    }
}
