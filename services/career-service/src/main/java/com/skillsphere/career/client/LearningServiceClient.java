package com.skillsphere.career.client;

import com.skillsphere.career.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class LearningServiceClient {

    private final RestClient restClient;
    private final String learningServiceUrl;

    public LearningServiceClient(RestClient restClient,
                                 @Value("${learning.service.url:http://localhost:8082/api/v1}") String learningServiceUrl) {
        this.restClient = restClient;
        this.learningServiceUrl = learningServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getEnrollmentsByEmployee(UUID employeeId) {
        try {
            return restClient.get()
                    .uri(learningServiceUrl + "/employees/" + employeeId + "/enrollments")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllCourses() {
        try {
            return restClient.get()
                    .uri(learningServiceUrl + "/courses/all")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            // Some systems might not have /courses/all, fallback to /courses or empty list
            try {
                Map<String, Object> paginated = restClient.get()
                        .uri(learningServiceUrl + "/courses?size=100")
                        .retrieve()
                        .body(Map.class);
                if (paginated != null && paginated.containsKey("content")) {
                    return (List<Map<String, Object>>) paginated.get("content");
                }
            } catch (Exception ex) {
                // ignore
            }
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getLearningPaths() {
        try {
            return restClient.get()
                    .uri(learningServiceUrl + "/learning-paths")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
