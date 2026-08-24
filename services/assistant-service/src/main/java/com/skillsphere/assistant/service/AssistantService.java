package com.skillsphere.assistant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsphere.assistant.client.GroqClient;
import com.skillsphere.assistant.dto.GroqDto.*;
import com.skillsphere.assistant.entity.Conversation;
import com.skillsphere.assistant.entity.Message;
import com.skillsphere.assistant.entity.ToolAuditLog;
import com.skillsphere.assistant.repository.ConversationRepository;
import com.skillsphere.assistant.repository.MessageRepository;
import com.skillsphere.assistant.repository.ToolAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    private static final int MAX_LOOP_ITERATIONS = 5;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ToolAuditLogRepository toolAuditLogRepository;
    private final GroqClient groqClient;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final jakarta.persistence.EntityManager entityManager;

    @Value("${assistant.chat.max-history:10}")
    private int maxHistory;

    @Value("${skill.service.url}")
    private String skillServiceUrl;

    @Value("${learning.service.url}")
    private String learningServiceUrl;

    @Value("${certification.service.url}")
    private String certificationServiceUrl;

    @Value("${career.service.url}")
    private String careerServiceUrl;

    public AssistantService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            ToolAuditLogRepository toolAuditLogRepository,
            GroqClient groqClient,
            RestClient restClient,
            ObjectMapper objectMapper,
            jakarta.persistence.EntityManager entityManager) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.toolAuditLogRepository = toolAuditLogRepository;
        this.groqClient = groqClient;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public Message chat(String userMessageContent, UUID conversationId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        String email = auth.getName();
        String userIdStr = (String) auth.getCredentials();
        UUID callerUserId = UUID.fromString(userIdStr);
        String callerRole = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("EMPLOYEE");

        // Resolve or create Conversation
        Conversation conversation;
        if (conversationId != null) {
            conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found with id: " + conversationId));
            if (!conversation.getEmployeeId().equals(callerUserId) && !List.of("ADMIN", "HR_MANAGER").contains(callerRole)) {
                throw new AccessDeniedException("Access denied to this conversation thread");
            }
        } else {
            conversation = new Conversation();
            conversation.setEmployeeId(callerUserId);
            conversation.setTitle(userMessageContent.length() > 30 ? userMessageContent.substring(0, 30) + "..." : userMessageContent);
            conversation = conversationRepository.save(conversation);
        }

        // 1. Persist User Message
        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setRole("user");
        userMessage.setContent(userMessageContent);
        messageRepository.save(userMessage);

        // 2. Fetch last N messages as context (maxHistory / 2 turns)
        List<Message> recentMessages = messageRepository.findRecentByConversationId(conversation.getId(), PageRequest.of(0, maxHistory));
        Collections.reverse(recentMessages); // get chronologically

        // Construct message history DTOs
        List<MessageDto> requestMessages = new ArrayList<>();
        // Add System Prompt
        requestMessages.add(new MessageDto(
                "system",
                "You are Levi, the Conversational AI Career & Learning Assistant for SkillSphere Nexus. You are helpful, professional, and speak in a clear tone.\n" +
                "Crucial rule: Only state facts that are explicitly returned by tool/function calls. If a tool call fails or returns empty/null, say so - do not guess or invent any details about an employee's skills, certifications, courses, or career details.\n" +
                "Never perform write/mutating actions on behalf of the user. Only use the tools provided to fetch data.\n" +
                "Respond strictly in Markdown formatting.\n" +
                "Whenever you present tabular data (such as catalogs, lists of skills, certifications, courses, or compliance records), you MUST format it as a standard Markdown table using pipes (e.g., | Header 1 | Header 2 |) with a separator line (|---|---|). Do not output tables as plain text spacing, tabs, or preformatted text blocks.",
                null, null, null
        ));

        for (Message msg : recentMessages) {
            List<ToolCallDto> savedToolCalls = null;
            if (msg.getToolCallsJson() != null) {
                try {
                    savedToolCalls = objectMapper.readValue(msg.getToolCallsJson(), new TypeReference<List<ToolCallDto>>() {});
                } catch (Exception e) {
                    // Ignore
                }
            }
            requestMessages.add(new MessageDto(
                    msg.getRole(),
                    msg.getContent(),
                    null, null,
                    savedToolCalls
            ));
        }

        List<ToolDto> tools = getToolDefinitions();

        // 3. Start Reasoning Loop
        ChatCompletionResponse response = null;
        int loopCount = 0;
        
        while (loopCount < MAX_LOOP_ITERATIONS) {
            response = groqClient.getChatCompletion(requestMessages, tools);
            if (response.choices() == null || response.choices().isEmpty()) {
                throw new RuntimeException("AI service returned empty response");
            }
            
            ChoiceDto choice = response.choices().get(0);
            MessageDto responseMsg = choice.message();
            
            // Check if Groq requests a tool call
            if (responseMsg.toolCalls() != null && !responseMsg.toolCalls().isEmpty()) {
                // Add Assistant's request to message history
                requestMessages.add(responseMsg);
                
                // Execute each tool call requested
                for (ToolCallDto tc : responseMsg.toolCalls()) {
                    String toolResultJson = executeToolCall(tc, email, callerUserId, callerRole);
                    
                    // Add tool result to requestMessages history
                    requestMessages.add(new MessageDto(
                            "tool",
                            toolResultJson,
                            tc.function().name(),
                            tc.id(),
                            null
                    ));
                }
                
                loopCount++;
            } else {
                // Final answer generated
                break;
            }
        }

        // 4. Save and return final assistant reply
        ChoiceDto finalChoice = response.choices().get(0);
        MessageDto finalMsg = finalChoice.message();

        Message assistantMessage = new Message();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(finalMsg.content());
        if (finalMsg.toolCalls() != null && !finalMsg.toolCalls().isEmpty()) {
            try {
                assistantMessage.setToolCallsJson(objectMapper.writeValueAsString(finalMsg.toolCalls()));
            } catch (Exception e) {
                // Ignore
            }
        }
        
        return messageRepository.save(assistantMessage);
    }

    private UUID getEmployeeIdByEmail(String email) {
        try {
            Object result = entityManager.createNativeQuery(
                    "SELECT employee_id FROM skill_service.app_users WHERE email = :email")
                    .setParameter("email", email)
                    .getSingleResult();
            if (result != null) {
                return UUID.fromString(result.toString());
            }
        } catch (Exception e) {
            log.error("Failed to fetch employeeId for email: " + email, e);
        }
        return null;
    }

    private String executeToolCall(ToolCallDto tc, String userEmail, UUID callerUserId, String callerRole) {
        String toolName = tc.function().name();
        String argumentsStr = tc.function().arguments();
        log.info("Executing tool call: {} for user: {} with arguments: {}", toolName, userEmail, argumentsStr);

        try {
            Map<String, Object> args = objectMapper.readValue(argumentsStr, new TypeReference<Map<String, Object>>() {});
            String targetEndpoint = "";
            String responseBody = "";
            int statusCode = 200;

            // Resolve target employee ID based on user authorization
            UUID callerEmployeeId = getEmployeeIdByEmail(userEmail);
            if (callerEmployeeId == null) {
                callerEmployeeId = callerUserId; // Fallback
            }

            UUID targetEmployeeId = callerEmployeeId; // Default
            if (args.containsKey("employeeId") && args.get("employeeId") != null) {
                String reqIdStr = args.get("employeeId").toString();
                try {
                    UUID requestedId = UUID.fromString(reqIdStr);
                    // Manager / Admin authorization logic
                    if (List.of("ADMIN", "HR_MANAGER", "TRAINING_MANAGER").contains(callerRole)) {
                        targetEmployeeId = requestedId;
                    } else {
                        // Normal employee gets overridden to own ID
                        targetEmployeeId = callerEmployeeId;
                        log.warn("Unauthorized attempt by employee {} to access data of {}. Overriding to own ID.", callerEmployeeId, requestedId);
                    }
                } catch (IllegalArgumentException e) {
                    return "{\"error\": \"Invalid UUID format for employeeId\"}";
                }
            }

            // Route to appropriate microservice
            switch (toolName) {
                case "get_employee_profile":
                    targetEndpoint = skillServiceUrl + "/employees/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_employee_skills":
                    targetEndpoint = skillServiceUrl + "/employees/" + targetEmployeeId + "/skills";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_skill_catalog":
                    targetEndpoint = skillServiceUrl + "/skills";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_competency_framework":
                    String role = (args.get("role") != null) ? args.get("role").toString() : "";
                    targetEndpoint = skillServiceUrl + "/competency-frameworks?role=" + role;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_employee_assessments":
                    targetEndpoint = skillServiceUrl + "/employees/" + targetEmployeeId + "/assessments";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "list_courses":
                    targetEndpoint = learningServiceUrl + "/courses";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_course_detail":
                    String courseId = (args.get("courseId") != null) ? args.get("courseId").toString() : "";
                    targetEndpoint = learningServiceUrl + "/courses/" + courseId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_employee_enrollments":
                    targetEndpoint = learningServiceUrl + "/enroll/employee/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_learning_paths":
                    targetEndpoint = learningServiceUrl + "/learning-paths";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_employee_certifications":
                    targetEndpoint = certificationServiceUrl + "/employee-certifications/employee/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_compliance_status":
                    targetEndpoint = certificationServiceUrl + "/employee-certifications/compliance/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_career_plan":
                    targetEndpoint = careerServiceUrl + "/career-plans/employee/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_job_match":
                    String jobId = (args.get("jobId") != null) ? args.get("jobId").toString() : "";
                    targetEndpoint = careerServiceUrl + "/job-postings/" + jobId + "/match/" + targetEmployeeId;
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "list_job_postings":
                    targetEndpoint = careerServiceUrl + "/job-postings";
                    responseBody = callEndpoint(targetEndpoint);
                    break;
                case "get_compliance_summary":
                    // HR/Admin role restriction check
                    if (!List.of("ADMIN", "HR_MANAGER", "TRAINING_MANAGER").contains(callerRole)) {
                        statusCode = 403;
                        responseBody = "{\"error\": \"Access denied: Requires HR, Admin, or Training Manager privilege.\"}";
                    } else {
                        targetEndpoint = certificationServiceUrl + "/employee-certifications/compliance/summary";
                        responseBody = callEndpoint(targetEndpoint);
                    }
                    break;
                case "get_career_analytics":
                    // HR/Admin role restriction check
                    if (!List.of("ADMIN", "HR_MANAGER").contains(callerRole)) {
                        statusCode = 403;
                        responseBody = "{\"error\": \"Access denied: Requires HR or Admin privilege.\"}";
                    } else {
                        targetEndpoint = careerServiceUrl + "/career/dashboard-stats";
                        responseBody = callEndpoint(targetEndpoint);
                    }
                    break;
                default:
                    statusCode = 400;
                    responseBody = "{\"error\": \"Unknown tool name: " + toolName + "\"}";
            }

            // Write Tool Audit Log
            ToolAuditLog auditLog = new ToolAuditLog();
            auditLog.setToolName(toolName);
            auditLog.setEndpointInvoked(targetEndpoint.isEmpty() ? "INTERNAL_RULE_BLOCKED" : targetEndpoint);
            auditLog.setUserEmail(userEmail);
            auditLog.setRequestPayload(argumentsStr);
            auditLog.setResponseStatus(statusCode);
            auditLog.setResponseSummary(responseBody.length() > 500 ? responseBody.substring(0, 500) + "..." : responseBody);
            toolAuditLogRepository.save(auditLog);

            return responseBody;

        } catch (Exception e) {
            log.error("Error executing tool call " + toolName, e);
            // Log failed execution audit log
            try {
                ToolAuditLog auditLog = new ToolAuditLog();
                auditLog.setToolName(toolName);
                auditLog.setEndpointInvoked("ERROR");
                auditLog.setUserEmail(userEmail);
                auditLog.setRequestPayload(argumentsStr);
                auditLog.setResponseStatus(500);
                auditLog.setResponseSummary(e.getMessage());
                toolAuditLogRepository.save(auditLog);
            } catch (Exception ex) {
                // Ignore audit logger error
            }
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }

    private String callEndpoint(String url) {
        log.info("Forwarding endpoint REST call to: {}", url);
        try {
            ResponseEntity<String> response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .toEntity(String.class);
            return response.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException.Forbidden fe) {
            log.error("Endpoint returned Forbidden 403: {}", url);
            return "{\"error\": \"Access denied: Downstream endpoint forbidden\"}";
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound ne) {
            log.error("Endpoint returned Not Found 404: {}", url);
            return "{\"error\": \"Data not found\"}";
        } catch (Exception e) {
            log.error("Error calling endpoint: " + url, e);
            throw new RuntimeException("Downstream request failed: " + e.getMessage(), e);
        }
    }

    private List<ToolDto> getToolDefinitions() {
        // Construct standard openai functional JSON schemas
        List<ToolDto> tools = new ArrayList<>();

        // 1. get_employee_profile
        tools.add(new ToolDto("function", new FunctionDto(
                "get_employee_profile",
                "Retrieve employee profile metadata (department, role title, rating, experience). Supports retrieving requesting user or target user.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 2. get_employee_skills
        tools.add(new ToolDto("function", new FunctionDto(
                "get_employee_skills",
                "Retrieve employee mapped skills, proficiency levels, and verification status.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 3. get_skill_catalog
        tools.add(new ToolDto("function", new FunctionDto(
                "get_skill_catalog",
                "Fetch list of all master skills defined in SkillSphere.",
                Map.of("type", "object", "properties", Map.of())
        )));

        // 4. get_competency_framework
        tools.add(new ToolDto("function", new FunctionDto(
                "get_competency_framework",
                "Retrieve required skill levels and frameworks for a specific role title.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "role", Map.of(
                                        "type", "string",
                                        "description", "Required role title search query (e.g. 'Tech Lead')."
                                )
                        ),
                        "required", List.of("role")
                )
        )));

        // 5. get_employee_assessments
        tools.add(new ToolDto("function", new FunctionDto(
                "get_employee_assessments",
                "Retrieve assessments and scores of an employee.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 6. list_courses
        tools.add(new ToolDto("function", new FunctionDto(
                "list_courses",
                "List all active learning courses in the catalog.",
                Map.of("type", "object", "properties", Map.of())
        )));

        // 7. get_course_detail
        tools.add(new ToolDto("function", new FunctionDto(
                "get_course_detail",
                "Fetch a single course's details, including modules and descriptions.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "courseId", Map.of(
                                        "type", "string",
                                        "description", "Required course UUID."
                                )
                        ),
                        "required", List.of("courseId")
                )
        )));

        // 8. get_employee_enrollments
        tools.add(new ToolDto("function", new FunctionDto(
                "get_employee_enrollments",
                "Fetch enrolled courses and path completion percentages for an employee.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 9. get_learning_paths
        tools.add(new ToolDto("function", new FunctionDto(
                "get_learning_paths",
                "List all structured learning path curricula.",
                Map.of("type", "object", "properties", Map.of())
        )));

        // 10. get_employee_certifications
        tools.add(new ToolDto("function", new FunctionDto(
                "get_employee_certifications",
                "Fetch registered professional external certifications for an employee.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 11. get_compliance_status
        tools.add(new ToolDto("function", new FunctionDto(
                "get_compliance_status",
                "Check details of compliance and certification validity calculations.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 12. get_career_plan
        tools.add(new ToolDto("function", new FunctionDto(
                "get_career_plan",
                "Fetch current career path plans, promotion timeline targets, and mentor assignments.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        )
                )
        )));

        // 13. get_job_match
        tools.add(new ToolDto("function", new FunctionDto(
                "get_job_match",
                "Calculate skill alignment percentage between an internal job posting and the employee's skills.",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "jobId", Map.of(
                                        "type", "string",
                                        "description", "Required job posting UUID."
                                ),
                                "employeeId", Map.of(
                                        "type", List.of("string", "null"),
                                        "description", "Optional employee UUID. Defaults to the requesting user's employee ID."
                                )
                        ),
                        "required", List.of("jobId")
                )
        )));

        // 14. list_job_postings
        tools.add(new ToolDto("function", new FunctionDto(
                "list_job_postings",
                "List open internal career openings.",
                Map.of("type", "object", "properties", Map.of())
        )));

        // 15. get_compliance_summary
        tools.add(new ToolDto("function", new FunctionDto(
                "get_compliance_summary",
                "Retrieve corporate compliance overview summary across all departments. (HR / Admin role required).",
                Map.of("type", "object", "properties", Map.of())
        )));

        // 16. get_career_analytics
        tools.add(new ToolDto("function", new FunctionDto(
                "get_career_analytics",
                "Fetch executive career progression metrics. (HR / Admin role required).",
                Map.of("type", "object", "properties", Map.of())
        )));

        return tools;
    }
}
