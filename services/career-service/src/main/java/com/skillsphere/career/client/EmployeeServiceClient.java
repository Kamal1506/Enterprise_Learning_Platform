package com.skillsphere.career.client;

import com.skillsphere.career.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class EmployeeServiceClient {

    private final RestClient restClient;
    private final String skillServiceUrl;

    public EmployeeServiceClient(RestClient restClient,
                                 @Value("${skill.service.url:http://localhost:8081/api/v1}") String skillServiceUrl) {
        this.restClient = restClient;
        this.skillServiceUrl = skillServiceUrl;
    }

    public boolean employeeExists(UUID employeeId) {
        try {
            ResponseEntity<Void> response = restClient.get()
                    .uri(skillServiceUrl + "/employees/" + employeeId)
                    .retrieve()
                    .toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                throw new AccessDeniedException("Access Denied for employee " + employeeId, e);
            }
            throw new ServiceUnavailableException("Error response from Skill Service: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ServiceUnavailableException("Skill Service is unreachable: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getEmployee(UUID employeeId) {
        try {
            return restClient.get()
                    .uri(skillServiceUrl + "/employees/" + employeeId)
                    .retrieve()
                    .body(Map.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        } catch (Exception e) {
            throw new ServiceUnavailableException("Skill Service is unreachable: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getEmployeeSkills(UUID employeeId) {
        try {
            return restClient.get()
                    .uri(skillServiceUrl + "/employees/" + employeeId + "/skills")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getCompetencyFramework(String role) {
        try {
            return restClient.get()
                    .uri(skillServiceUrl + "/competency-frameworks?role=" + (role == null ? "" : role))
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllSkills() {
        try {
            return restClient.get()
                    .uri(skillServiceUrl + "/skills")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
