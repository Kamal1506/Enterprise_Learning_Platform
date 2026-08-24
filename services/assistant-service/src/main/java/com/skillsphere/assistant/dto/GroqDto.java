package com.skillsphere.assistant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public final class GroqDto {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChatCompletionRequest(
            String model,
            List<MessageDto> messages,
            List<ToolDto> tools,
            @JsonProperty("tool_choice") Object toolChoice
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MessageDto(
            String role, // 'system', 'user', 'assistant', 'tool'
            String content,
            String name, // Name of the tool, required if role is 'tool'
            @JsonProperty("tool_call_id") String toolCallId, // ID of the tool call, required if role is 'tool'
            @JsonProperty("tool_calls") List<ToolCallDto> toolCalls
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ToolDto(
            String type, // 'function'
            FunctionDto function
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record FunctionDto(
            String name,
            String description,
            Map<String, Object> parameters // JSON Schema map
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ToolCallDto(
            String id,
            String type, // 'function'
            FunctionCallDto function
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record FunctionCallDto(
            String name,
            String arguments // JSON string of arguments
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChatCompletionResponse(
            String id,
            String object,
            long created,
            String model,
            List<ChoiceDto> choices
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChoiceDto(
            int index,
            MessageDto message,
            @JsonProperty("finish_reason") String finishReason
    ) {}
}
