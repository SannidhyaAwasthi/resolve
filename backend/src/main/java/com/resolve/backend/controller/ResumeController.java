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
                return ResponseEntity.badRequest()
                        .body("User profile data could not be properly loaded. Ensure your profile is created.");
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
            return ResponseEntity.internalServerError()
                    .body("An error occurred while generating the resume: " + e.getMessage());
        }
    }

    @PostMapping("/compile")
    public ResponseEntity<?> compileResume(@Valid @RequestBody CompileRequest request) {
        System.out.println("=== COMPILE ENDPOINT HIT ===");

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

            // 3. Run the "tectonic" command
            ProcessBuilder pb = new ProcessBuilder("tectonic", "resume.tex");
            pb.directory(tempDir.toFile());
            // Merge stderr and stdout so we capture everything in one stream
            pb.redirectErrorStream(true);

            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                if (e.getMessage() != null && e.getMessage().contains("Cannot run program \"tectonic\"")) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("LaTeX compiler not installed on the server");
                }
                throw e;
            }

            // 4. Wait for it to complete with a timeout of 60 seconds
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("LaTeX compilation timed out");
            }

            // Read the process output (stdout + stderr due to redirectErrorStream)
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            System.out.println("=== TECTONIC EXIT CODE: " + process.exitValue() + " ===");
            System.out.println("=== TECTONIC OUTPUT: " + output + " ===");


            // 5. Check if "resume.pdf" was created
            Path pdfFile = tempDir.resolve("resume.pdf");
            if (Files.exists(pdfFile)) {
                // 6. Read the PDF bytes and return them
                byte[] pdfBytes = Files.readAllBytes(pdfFile);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                // "inline" allows browser to display in-page; "attachment" forces download
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=resume.pdf");
                return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            } else {
                // 7. Compilation failed: return the output from tectonic
                return ResponseEntity.badRequest().body("LaTeX compilation failed:\n" + output);
            }

        } catch (IOException e) {
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
            // 8. Clean up: delete the temporary directory and all files inside
            if (tempDir != null && Files.exists(tempDir)) {
                try (var walk = Files.walk(tempDir)) {
                    walk.sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                } catch (Exception e) {
                    // Ignore explicit cleanup failures
                }
            }
        }
    }
}
