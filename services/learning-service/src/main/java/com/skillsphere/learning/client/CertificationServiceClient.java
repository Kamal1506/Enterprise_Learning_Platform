package com.skillsphere.learning.client;

import com.skillsphere.learning.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.*;

@Component
public class CertificationServiceClient {

    private final RestClient restClient;
    private final String certificationServiceUrl;

    public CertificationServiceClient(RestClient restClient,
                                      @Value("${certification.service.url:http://localhost:8083/api/v1}") String certificationServiceUrl) {
        this.restClient = restClient;
        this.certificationServiceUrl = certificationServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getCertificationsByCourse(UUID courseId) {
        try {
            return restClient.get()
                    .uri(certificationServiceUrl + "/certifications/course/" + courseId)
                    .retrieve()
                    .body(List.class);
        } catch (HttpClientErrorException.NotFound e) {
            return Collections.emptyList();
        } catch (Exception e) {
            throw new ServiceUnavailableException("Certification Service is currently unreachable: " + e.getMessage(), e);
        }
    }

    public boolean registerEmployeeCertification(UUID employeeId, UUID certificationId, LocalDate completionDate) {
        Map<String, Object> request = new HashMap<>();
        request.put("employeeId", employeeId);
        request.put("certificationId", certificationId);
        request.put("issueDate", completionDate);
        request.put("notes", "Automatically registered upon successful completion of associated course.");

        try {
            ResponseEntity<Void> response = restClient.post()
                    .uri(certificationServiceUrl + "/employee-certifications")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException.Conflict e) {
            // Already registered or duplicate (409 Conflict)
            return true;
        } catch (Exception e) {
            throw new ServiceUnavailableException("Certification Service is currently unreachable: " + e.getMessage(), e);
        }
    }
}
