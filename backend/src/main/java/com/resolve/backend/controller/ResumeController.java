package com.resolve.backend.controller;

import com.resolve.backend.dto.GenerateResumeRequest;
import com.resolve.backend.dto.GenerateResumeResponse;
import com.resolve.backend.dto.UserDataDTO;
import com.resolve.backend.model.GeneratedResume;
import com.resolve.backend.repository.GeneratedResumeRepository;
import com.resolve.backend.service.GeminiService;
import com.resolve.backend.service.PromptBuilder;
import com.resolve.backend.service.UserDataService;
import com.resolve.backend.util.TemplateLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final UserDataService userDataService;
    private final TemplateLoader templateLoader;
    private final PromptBuilder promptBuilder;
    private final GeminiService geminiService;
    private final GeneratedResumeRepository generatedResumeRepository;

    @PostMapping("/generate")
    public ResponseEntity<?> generateResume(@RequestBody GenerateResumeRequest request) {
        try {
            // 1. Extract authenticated user's ID from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UUID userId = UUID.fromString(authentication.getName());

            // 2. Fetch UserData
            UserDataDTO userData;
            try {
                userData = userDataService.getUserData(userId);
            } catch (RuntimeException e) {
                // Return 400 if user profile data is not completely found
                return ResponseEntity.badRequest().body("User profile data could not be properly loaded. Ensure your profile is created.");
            }

            // 3. Load Template and Build Prompt
            String latexTemplate = templateLoader.getJakesResumeTemplate();
            String prompt = promptBuilder.buildPrompt(userData, request.getJobDescription(), latexTemplate);

            // 4. Send to Gemini
            String generatedLatex = geminiService.generateContent(prompt);

            // 5. Save to database
            GeneratedResume generatedResume = new GeneratedResume();
            generatedResume.setUserId(userId);
            generatedResume.setJobDescription(request.getJobDescription());
            generatedResume.setLatexCode(generatedLatex);
            generatedResume.setCreatedAt(OffsetDateTime.now());
            generatedResumeRepository.save(generatedResume);

            // 6. Return response
            return ResponseEntity.ok(new GenerateResumeResponse(generatedLatex));

        } catch (Exception e) {
            // Log the actual error stack if needed and return a 500 error
            return ResponseEntity.internalServerError().body("An error occurred while generating the resume: " + e.getMessage());
        }
    }
}
