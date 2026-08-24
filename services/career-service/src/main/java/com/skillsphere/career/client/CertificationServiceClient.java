package com.skillsphere.career.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class CertificationServiceClient {

    private final RestClient restClient;
    private final String certServiceUrl;

    public CertificationServiceClient(RestClient restClient,
                                      @Value("${certification.service.url:http://localhost:8083/api/v1}") String certServiceUrl) {
        this.restClient = restClient;
        this.certServiceUrl = certServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getCertificationsByEmployee(UUID employeeId) {
        try {
            return restClient.get()
                    .uri(certServiceUrl + "/employee-certifications/employee/" + employeeId)
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllCertifications() {
        try {
            return restClient.get()
                    .uri(certServiceUrl + "/certifications")
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getComplianceSummary() {
        try {
            return restClient.get()
                    .uri(certServiceUrl + "/employee-certifications/compliance/summary")
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
