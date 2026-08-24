package com.skillsphere.skill.client;

import com.skillsphere.skill.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class CertificationServiceClient {

    private final RestClient restClient;
    private final String certificationServiceUrl;

    public CertificationServiceClient(RestClient restClient,
                                      @Value("${certification.service.url:http://localhost:8083/api/v1}") String certificationServiceUrl) {
        this.restClient = restClient;
        this.certificationServiceUrl = certificationServiceUrl;
    }

    public void deleteCertificationData(UUID employeeId) {
        try {
            restClient.delete()
                    .uri(certificationServiceUrl + "/employee-certifications/employee/" + employeeId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound e) {
            // Idempotency: Already cleaned up or not found
        } catch (Exception e) {
            throw new ServiceUnavailableException("Certification Service is unreachable or failed to clean up data: " + e.getMessage(), e);
        }
    }
}
