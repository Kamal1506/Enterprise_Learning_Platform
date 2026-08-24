package com.skillsphere.skill.client;

import com.skillsphere.skill.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

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

    public void deleteLearningData(UUID employeeId) {
        try {
            restClient.delete()
                    .uri(learningServiceUrl + "/employees/" + employeeId + "/learning-data")
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound e) {
            // Idempotency: Already cleaned up or not found
        } catch (Exception e) {
            throw new ServiceUnavailableException("Learning Service is unreachable or failed to clean up data: " + e.getMessage(), e);
        }
    }
}
