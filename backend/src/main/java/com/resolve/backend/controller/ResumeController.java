package com.resolve.backend.controller;

import com.resolve.backend.dto.CompileRequest;
import com.resolve.backend.dto.GenerateResumeRequest;
import com.resolve.backend.dto.GenerateResumeResponse;
import com.resolve.backend.dto.UserDataDTO;
import com.resolve.backend.model.GeneratedResume;
import com.resolve.backend.repository.GeneratedResumeRepository;
import com.resolve.backend.service.GeminiService;
import com.resolve.backend.service.PromptBuilder;
import com.resolve.backend.service.UserDataService;
import com.resolve.backend.util.TemplateLoader;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

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

    @PostMapping("/compile")
    public ResponseEntity<?> compileResume(@Valid @RequestBody CompileRequest request) {
        // Enforce Authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Path tempDir = null;
        try {
            // 1. Create a temporary directory
            tempDir = Files.createTempDirectory("resume_compile_");
            Path texFile = tempDir.resolve("resume.tex");
            
            // 2. Write the latexCode to a file called "resume.tex"
            Files.writeString(texFile, request.getLatexCode());

            // 3 & 4. Run the pdflatex command TWICE
            for (int i = 0; i < 2; i++) {
                ProcessBuilder pb = new ProcessBuilder("pdflatex", "-interaction=nonstopmode", "resume.tex");
                pb.directory(tempDir.toFile());
                Process process = pb.start();
                
                // 5. Wait for each run to complete with a timeout of 30 seconds
                boolean finished = process.waitFor(30, TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("LaTeX compilation timed out");
                }
            }

            // 6. Check if "resume.pdf" was created
            Path pdfFile = tempDir.resolve("resume.pdf");
            if (Files.exists(pdfFile)) {
                // 7. Read the PDF bytes and return them
                byte[] pdfBytes = Files.readAllBytes(pdfFile);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", "resume.pdf");
                return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            } else {
                // 8. Compilation failed: read "resume.log", extract errors
                Path logFile = tempDir.resolve("resume.log");
                StringBuilder errors = new StringBuilder();
                if (Files.exists(logFile)) {
                    try (BufferedReader reader = Files.newBufferedReader(logFile, StandardCharsets.UTF_8)) {
                        String line;
                        boolean nextLineIsContext = false;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("!")) {
                                errors.append(line).append("\n");
                                nextLineIsContext = true;
                            } else if (nextLineIsContext) {
                                errors.append(line).append("\n");
                                nextLineIsContext = false;
                            }
                        }
                    }
                }
                return ResponseEntity.badRequest().body("LaTeX Error:\n" + errors.toString());
            }

        } catch (IOException e) {
            if (e.getMessage() != null && e.getMessage().contains("Cannot run program \"pdflatex\"")) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("LaTeX compiler not installed on the server");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal error: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Compilation interrupted");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal error: " + e.getMessage());
        } finally {
            // 9. Clean up the temporary directory
            if (tempDir != null && Files.exists(tempDir)) {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                } catch (Exception e) {
                    // Ignore explicit cleanup failures; temp dirs will be cleared by the OS
                }
            }
        }
    }
}
