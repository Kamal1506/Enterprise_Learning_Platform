package com.skillsphere.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsphere.assistant.client.GroqClient;
import com.skillsphere.assistant.dto.GroqDto.*;
import com.skillsphere.assistant.entity.Conversation;
import com.skillsphere.assistant.entity.Message;
import com.skillsphere.assistant.repository.ConversationRepository;
import com.skillsphere.assistant.repository.MessageRepository;
import com.skillsphere.assistant.repository.ToolAuditLogRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestClient;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
public class AssistantServiceTest {

    @Autowired
    private AssistantService assistantService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConversationRepository conversationRepository;

    @MockBean
    private MessageRepository messageRepository;

    @MockBean
    private ToolAuditLogRepository toolAuditLogRepository;

    @MockBean
    private GroqClient groqClient;

    @MockBean
    private RestClient restClient;

    private RestClient.RequestHeadersUriSpec uriSpec;
    private UUID callerUserId;
    private UUID targetUserId;

    @BeforeEach
    public void setup() {
        callerUserId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();
        
        Conversation conversation = new Conversation();
        conversation.setId(UUID.randomUUID());
        conversation.setEmployeeId(callerUserId);
        conversation.setTitle("Test chat");

        Mockito.when(conversationRepository.findById(any())).thenReturn(Optional.of(conversation));
        Mockito.when(conversationRepository.save(any())).thenReturn(conversation);
        Mockito.when(messageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock restClient GET method chain
        uriSpec = Mockito.mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = Mockito.mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = Mockito.mock(RestClient.ResponseSpec.class);
        ResponseEntity<String> mockResponse = ResponseEntity.ok("{\"name\": \"Alice Smith\", \"experienceYears\": 6}");

        Mockito.when(restClient.get()).thenReturn(uriSpec);
        Mockito.when(uriSpec.uri(any(String.class))).thenReturn(headersSpec);
        Mockito.when(headersSpec.retrieve()).thenReturn(responseSpec);
        Mockito.when(responseSpec.toEntity(String.class)).thenReturn(mockResponse);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void chatWithEmployeeRole_DefaultsEmployeeIdToSubject() throws Exception {
        // Mock Authentication for EMPLOYEE
        Authentication auth = Mockito.mock(Authentication.class);
        Mockito.when(auth.getName()).thenReturn("alice@skillsphere.com");
        Mockito.when(auth.getCredentials()).thenReturn(callerUserId.toString());
        Mockito.doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .when(auth).getAuthorities();
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Mock Groq requesting get_employee_profile with ANOTHER employee ID
        List<ChoiceDto> choices = List.of(new ChoiceDto(0, new MessageDto(
                "assistant",
                null,
                null,
                null,
                List.of(new ToolCallDto(
                        "call-1",
                        "function",
                        new FunctionCallDto("get_employee_profile", "{\"employeeId\":\"" + targetUserId.toString() + "\"}")
                ))
        ), "tool_calls"));

        ChatCompletionResponse groqFirstResponse = new ChatCompletionResponse(
                "resp-1", "chat.completion", System.currentTimeMillis(), "openai/gpt-oss-120b", choices
        );

        ChatCompletionResponse groqSecondResponse = new ChatCompletionResponse(
                "resp-2", "chat.completion", System.currentTimeMillis(), "openai/gpt-oss-120b",
                List.of(new ChoiceDto(0, new MessageDto(
                        "assistant",
                        "Here is your profile.",
                        null,
                        null,
                        null
                ), "stop"))
        );

        Mockito.when(groqClient.getChatCompletion(any(), any()))
                .thenReturn(groqFirstResponse)
                .thenReturn(groqSecondResponse);

        // Run chat
        Message responseMsg = assistantService.chat("Show my profile", null);
        assertNotNull(responseMsg);
        assertEquals("Here is your profile.", responseMsg.getContent());

        // Capture RestClient URI and verify it was forced to callerUserId, NOT targetUserId
        ArgumentCaptor<String> uriCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(uriSpec).uri(uriCaptor.capture());
        String invokedUrl = uriCaptor.getValue();
        
        // Assert that the URL contains the callerUserId (subject), not the targetUserId
        assertTrue(invokedUrl.contains(callerUserId.toString()), "Endpoint should invoke caller userId due to defaulting rule");
        assertFalse(invokedUrl.contains(targetUserId.toString()), "Employee should not be allowed to bypass and query targetUserId");
    }

    @Test
    public void chatWithAdminRole_AllowsTargetEmployeeId() throws Exception {
        // Mock Authentication for ADMIN
        Authentication auth = Mockito.mock(Authentication.class);
        Mockito.when(auth.getName()).thenReturn("admin@skillsphere.com");
        Mockito.when(auth.getCredentials()).thenReturn(callerUserId.toString());
        Mockito.doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(auth).getAuthorities();
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Mock Groq requesting get_employee_profile with ANOTHER employee ID
        List<ChoiceDto> choices = List.of(new ChoiceDto(0, new MessageDto(
                "assistant",
                null,
                null,
                null,
                List.of(new ToolCallDto(
                        "call-1",
                        "function",
                        new FunctionCallDto("get_employee_profile", "{\"employeeId\":\"" + targetUserId.toString() + "\"}")
                ))
        ), "tool_calls"));

        ChatCompletionResponse groqFirstResponse = new ChatCompletionResponse(
                "resp-1", "chat.completion", System.currentTimeMillis(), "openai/gpt-oss-120b", choices
        );

        ChatCompletionResponse groqSecondResponse = new ChatCompletionResponse(
                "resp-2", "chat.completion", System.currentTimeMillis(), "openai/gpt-oss-120b",
                List.of(new ChoiceDto(0, new MessageDto(
                        "assistant",
                        "Here is the user profile.",
                        null,
                        null,
                        null
                ), "stop"))
        );

        Mockito.when(groqClient.getChatCompletion(any(), any()))
                .thenReturn(groqFirstResponse)
                .thenReturn(groqSecondResponse);

        // Run chat
        Message responseMsg = assistantService.chat("Show John's profile", null);
        assertNotNull(responseMsg);

        // Capture RestClient URI and verify it queried targetUserId
        ArgumentCaptor<String> uriCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(uriSpec).uri(uriCaptor.capture());
        String invokedUrl = uriCaptor.getValue();
        
        assertTrue(invokedUrl.contains(targetUserId.toString()), "Admin should be allowed to query targetUserId");
    }
}
