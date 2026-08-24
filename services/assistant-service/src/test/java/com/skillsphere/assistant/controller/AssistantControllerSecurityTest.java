package com.skillsphere.assistant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsphere.assistant.entity.Conversation;
import com.skillsphere.assistant.entity.Message;
import com.skillsphere.assistant.security.JwtTokenProvider;
import com.skillsphere.assistant.service.AssistantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AssistantControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AssistantService assistantService;

    private String validEmployeeToken;
    private UUID employeeId;

    @BeforeEach
    public void setup() {
        employeeId = UUID.randomUUID();
        validEmployeeToken = jwtTokenProvider.generateToken(employeeId, "alice@skillsphere.com", "EMPLOYEE");
        
        // Mock assistantService behaviour
        Conversation conversation = new Conversation();
        conversation.setId(UUID.randomUUID());
        conversation.setEmployeeId(employeeId);
        
        Message message = new Message();
        message.setId(UUID.randomUUID());
        message.setConversation(conversation);
        message.setRole("assistant");
        message.setContent("Hello Alice, how can I assist you today?");
        message.setCreatedAt(java.time.OffsetDateTime.now());
        
        Mockito.when(assistantService.chat(any(String.class), any())).thenReturn(message);
        Mockito.when(assistantService.chat(any(String.class), eq(conversation.getId()))).thenReturn(message);
    }

    @Test
    public void chatWithoutToken_ShouldReturnUnauthorized() throws Exception {
        AssistantController.ChatRequest request = new AssistantController.ChatRequest("Hello", null);

        mockMvc.perform(post("/api/v1/assistant/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void chatWithValidToken_ShouldReturnOk() throws Exception {
        UUID uniqueId = UUID.randomUUID();
        String uniqueToken = jwtTokenProvider.generateToken(uniqueId, "unique-alice@skillsphere.com", "EMPLOYEE");
        AssistantController.ChatRequest request = new AssistantController.ChatRequest("Hello", null);

        mockMvc.perform(post("/api/v1/assistant/chat")
                .header("Authorization", "Bearer " + uniqueToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    public void chatRateLimiter_ShouldReturnTooManyRequests() throws Exception {
        AssistantController.ChatRequest request = new AssistantController.ChatRequest("Hello", null);

        // Make 20 requests (under the limit of 20)
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/v1/assistant/chat")
                    .header("Authorization", "Bearer " + validEmployeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        // The 21st request should be rate-limited
        mockMvc.perform(post("/api/v1/assistant/chat")
                .header("Authorization", "Bearer " + validEmployeeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }
}
