package com.skillsphere.assistant.controller;

import com.skillsphere.assistant.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@SpringBootTest
public class TestGroqRequest {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    public void testPost() {
        String token = jwtTokenProvider.generateToken(
                UUID.fromString("e0000000-0000-0000-0000-000000000001"),
                "alice@skillsphere.com",
                "EMPLOYEE"
        );
        System.out.println("Generated token: " + token);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + token);

        String json = "{\"message\":\"What skills do I possess?\",\"conversationId\":null}";
        HttpEntity<String> entity = new HttpEntity<>(json, headers);

        try {
            String response = restTemplate.postForObject("http://localhost:8085/api/v1/assistant/chat", entity, String.class);
            System.out.println("=== SERVER RESPONSE ===");
            System.out.println(response);
            System.out.println("=======================");
        } catch (Exception e) {
            System.out.println("=== SERVER ERROR ===");
            System.out.println(e.getMessage());
            if (e instanceof org.springframework.web.client.HttpStatusCodeException) {
                System.out.println("=== RESPONSE BODY ===");
                System.out.println(((org.springframework.web.client.HttpStatusCodeException) e).getResponseBodyAsString());
            }
            System.out.println("====================");
        }
    }
}
