package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.CourseDTO;
import com.skillsphere.learning.service.CourseService;
import com.skillsphere.learning.security.JwtTokenProvider;
import com.skillsphere.learning.security.JwtAuthFilter;
import com.skillsphere.learning.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CourseController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
public class CourseControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CourseService courseService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void createCourse_EmployeeRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/courses")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Forbidden Course\",\"category\":\"TECHNICAL\",\"type\":\"ONLINE\",\"durationHours\":10}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TRAINING_MANAGER")
    void createCourse_ManagerRole_Succeeds() throws Exception {
        CourseDTO dummy = new CourseDTO(
                java.util.UUID.randomUUID(),
                "Allowed Course",
                "Desc",
                "TECHNICAL",
                "ONLINE",
                "Instructor",
                5.0,
                0L,
                0L,
                null,
                null,
                null,
                null,
                10,
                java.time.Instant.now(),
                java.time.Instant.now()
        );
        org.mockito.Mockito.when(courseService.createCourse(org.mockito.ArgumentMatchers.any())).thenReturn(dummy);

        mockMvc.perform(post("/api/v1/courses")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Allowed Course\",\"category\":\"TECHNICAL\",\"type\":\"ONLINE\",\"durationHours\":10}"))
                .andExpect(status().isCreated());
    }
}
