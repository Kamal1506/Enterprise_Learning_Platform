package com.skillsphere.certification.client;

import com.skillsphere.certification.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import org.springframework.security.access.AccessDeniedException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class SkillServiceClient {

    private final RestClient restClient;
    private final String skillServiceUrl;

    public SkillServiceClient(RestClient restClient,
                              @Value("${skill.service.url:http://localhost:8081/api/v1}") String skillServiceUrl) {
        this.restClient = restClient;
        this.skillServiceUrl = skillServiceUrl;
    }

    public String skillServiceUrl() {
        return skillServiceUrl;
    }

    public RestClient restClient() {
        return restClient;
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
                throw new AccessDeniedException("Access Denied: You do not have permission to access data for employee " + employeeId, e);
            }
            throw new ServiceUnavailableException("Error response from Skill Service: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ServiceUnavailableException("Skill Service is currently unreachable: " + e.getMessage(), e);
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
            throw new ServiceUnavailableException("Skill Service is currently unreachable: " + e.getMessage(), e);
        }
    }

    public String getEmployeeRole(UUID employeeId) {
        try {
            return restClient.get()
                    .uri(skillServiceUrl + "/employees/" + employeeId + "/role")
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            return "EMPLOYEE";
        }
    }

    @SuppressWarnings("unchecked")
    public boolean skillExists(UUID skillId) {
        try {
            List<Map<String, Object>> skills = restClient.get()
                    .uri(skillServiceUrl + "/skills")
                    .retrieve()
                    .body(List.class);
            if (skills != null) {
                for (Map<String, Object> skill : skills) {
                    String idStr = (String) skill.get("id");
                    if (idStr != null && UUID.fromString(idStr).equals(skillId)) {
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception e) {
            throw new ServiceUnavailableException("Skill Service is currently unreachable: " + e.getMessage(), e);
        }
    }
}
