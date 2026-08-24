package com.skillsphere.assistant.client;

import com.skillsphere.assistant.dto.GroqDto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final RestClient restClient;
    private final String groqUrl;
    private final String groqKey;
    private final String groqModel;

    public GroqClient(
            @Value("${groq.api.url}") String groqUrl,
            @Value("${groq.api.key}") String groqKey,
            @Value("${groq.api.model:openai/gpt-oss-120b}") String groqModel) {
        this.restClient = RestClient.builder().build();
        this.groqUrl = groqUrl;
        this.groqKey = groqKey;
        this.groqModel = groqModel;
    }

    public ChatCompletionResponse getChatCompletion(List<MessageDto> messages, List<ToolDto> tools) {
        log.info("Sending chat completion request to Groq API for model: {}", groqModel);
        
        ChatCompletionRequest request = new ChatCompletionRequest(
                groqModel,
                messages,
                tools != null && !tools.isEmpty() ? tools : null,
                null
        );

        try {
            return restClient.post()
                    .uri(groqUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ChatCompletionResponse.class);
        } catch (Exception e) {
            log.error("Failed to fetch chat completion from Groq API", e);
            throw new RuntimeException("AI service communication failure: " + e.getMessage(), e);
        }
    }
}
