package com.resolve.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String primaryModel;

    @Value("${gemini.fallback.model}")
    private String fallbackModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String generateContent(String prompt) {
        try {
            // Attempt with Primary Model
            log.info("Attempting content generation with primary model: {}", primaryModel);
            return callGeminiApi(primaryModel, prompt);
        } catch (Exception primaryEx) {
            log.warn("Primary model {} failed. Waiting 10 seconds before trying fallback. Error: {}",
                    primaryModel, primaryEx.getMessage());

            try {
                // Wait 10 seconds
                Thread.sleep(10000);
                
                // Attempt with Fallback Model
                log.info("Attempting content generation with fallback model: {}", fallbackModel);
                return callGeminiApi(fallbackModel, prompt);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Wait interrupted", ie);
            } catch (Exception fallbackEx) {
                log.error("Fallback model {} also failed. Error: {}",
                        fallbackModel, fallbackEx.getMessage());

                throw new RuntimeException(
                        "Gemini API is currently overloaded or unavailable. Please try again after some time.");
            }
        }
    }


    private String callGeminiApi(String model, String prompt) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey);

        // Build request
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)))));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String responseBody = response.getBody();

            if (responseBody == null) {
                throw new RuntimeException("Empty response body from model: " + model);
            }

            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode candidates = rootNode.path("candidates");

            if (candidates.isMissingNode() || !candidates.isArray() || candidates.size() == 0) {
                throw new RuntimeException("No candidates returned from model: " + model);
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isMissingNode() || !parts.isArray() || parts.size() == 0) {
                throw new RuntimeException("No parts found in response from model: " + model);
            }

            JsonNode textNode = parts.get(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isEmpty()) {
                throw new RuntimeException("No text found in response from model: " + model);
            }

            return textNode.asText();

        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            String errorMessage = String.format("Gemini API error (%s): %s", model, e.getStatusCode());

            try {
                JsonNode errorNode = objectMapper.readTree(errorBody).path("error");
                if (!errorNode.isMissingNode() && errorNode.has("message")) {
                    errorMessage += " - " + errorNode.get("message").asText();
                }
            } catch (Exception ignored) {
            }

            throw new RuntimeException(errorMessage);
        }
    }
}
