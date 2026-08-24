package com.skillsphere.certification.client;

import com.skillsphere.certification.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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

    public boolean courseExists(UUID courseId) {
        try {
            ResponseEntity<Void> response = restClient.get()
                    .uri(learningServiceUrl + "/courses/" + courseId)
                    .retrieve()
                    .toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (Exception e) {
            throw new ServiceUnavailableException("Learning Service is currently unreachable: " + e.getMessage(), e);
        }
    }
}
