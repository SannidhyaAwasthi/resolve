package com.resolve.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String generateContent(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key="
                + apiKey;

        try {
            // Build the nested JSON request body
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)))));

            // Configure HTTP Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Wrap headers and body inside an HttpEntity
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Perform the HTTP POST request to the endpoint
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            // Verify a successful response
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Parse the response body into a JsonNode tree for easy navigation
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidates = rootNode.path("candidates");

                // Extract the generated text if available
                if (!candidates.isMissingNode() && candidates.isArray() && candidates.size() > 0) {
                    JsonNode textNode = candidates.get(0)
                            .path("content")
                            .path("parts")
                            .get(0)
                            .path("text");

                    if (!textNode.isMissingNode()) {
                        return textNode.asText();
                    }
                }
                throw new RuntimeException("Unexpected response format from Gemini API: " + response.getBody());
            } else {
                throw new RuntimeException(
                        "Failed to call Gemini API. HTTP Status code: " + response.getStatusCode().value());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Google Gemini API: " + e.getMessage(), e);
        }
    }
}
