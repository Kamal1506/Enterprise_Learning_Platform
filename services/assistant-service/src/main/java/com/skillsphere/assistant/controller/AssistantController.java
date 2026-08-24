package com.skillsphere.assistant.controller;

import com.skillsphere.assistant.entity.Conversation;
import com.skillsphere.assistant.entity.Message;
import com.skillsphere.assistant.repository.ConversationRepository;
import com.skillsphere.assistant.repository.MessageRepository;
import com.skillsphere.assistant.service.AssistantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

    private final AssistantService assistantService;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @Value("${assistant.chat.rate-limit.requests:20}")
    private int rateLimitRequests;

    @Value("${assistant.chat.rate-limit.duration-ms:60000}")
    private long rateLimitDurationMs;

    // In-memory rate limiting map: email -> request timestamps
    private final Map<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();

    public AssistantController(
            AssistantService assistantService,
            ConversationRepository conversationRepository,
            MessageRepository messageRepository) {
        this.assistantService = assistantService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: Missing authentication");
        }
        String email = auth.getName();

        // Enforce rate limiting
        long now = System.currentTimeMillis();
        List<Long> timestamps = rateLimitMap.computeIfAbsent(email, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (timestamps) {
            // Remove outdated timestamps
            timestamps.removeIf(t -> now - t > rateLimitDurationMs);
            if (timestamps.size() >= rateLimitRequests) {
                log.warn("Rate limit exceeded for user: {}", email);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("{\"error\": \"Too Many Requests: Rate limit exceeded. Please try again later.\"}");
            }
            timestamps.add(now);
        }

        try {
            Message responseMsg = assistantService.chat(request.message(), request.conversationId());
            ChatResponse response = new ChatResponse(
                    responseMsg.getId(),
                    responseMsg.getConversation().getId(),
                    responseMsg.getRole(),
                    responseMsg.getContent(),
                    responseMsg.getCreatedAt() != null ? responseMsg.getCreatedAt().toString() : OffsetDateTime.now().toString()
            );
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Error in assistant chat", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Internal server error: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        String userIdStr = (String) auth.getCredentials();
        UUID employeeId = UUID.fromString(userIdStr);

        List<Conversation> list = conversationRepository.findByEmployeeIdOrderByUpdatedAtDesc(employeeId);
        List<ConversationDto> dtos = list.stream().map(c -> new ConversationDto(
                c.getId(),
                c.getEmployeeId(),
                c.getTitle(),
                c.getCreatedAt().toString(),
                c.getUpdatedAt().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<List<ChatResponse>> getConversationMessages(@PathVariable UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        String userIdStr = (String) auth.getCredentials();
        UUID callerUserId = UUID.fromString(userIdStr);
        String callerRole = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("EMPLOYEE");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.getEmployeeId().equals(callerUserId) && !List.of("ADMIN", "HR_MANAGER").contains(callerRole)) {
            throw new AccessDeniedException("Access denied to this conversation");
        }

        List<Message> list = messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
        List<ChatResponse> responses = list.stream().map(m -> new ChatResponse(
                m.getId(),
                m.getConversation().getId(),
                m.getRole(),
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : OffsetDateTime.now().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        String userIdStr = (String) auth.getCredentials();
        UUID callerUserId = UUID.fromString(userIdStr);
        String callerRole = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("EMPLOYEE");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.getEmployeeId().equals(callerUserId) && !List.of("ADMIN", "HR_MANAGER").contains(callerRole)) {
            throw new AccessDeniedException("Access denied to this conversation");
        }

        conversationRepository.delete(conversation);
        return ResponseEntity.noContent().build();
    }

    // records
    public record ChatRequest(String message, UUID conversationId) {}

    public record ChatResponse(
            UUID messageId,
            UUID conversationId,
            String role,
            String content,
            String createdAt
    ) {}

    public record ConversationDto(
            UUID id,
            UUID employeeId,
            String title,
            String createdAt,
            String updatedAt
    ) {}
}
