package com.resolve.backend.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;

@Component
public class TemplateLoader {

    // Cache the template content so we don't read the file from disk on every
    // request
    private String jakesResumeTemplate = null;

    public String getJakesResumeTemplate() {
        if (jakesResumeTemplate == null) {
            try {
                // Read from the "resources/templates" folder on the classpath
                ClassPathResource resource = new ClassPathResource("templates/jakes_resume.tex");
                
                try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                    jakesResumeTemplate = FileCopyUtils.copyToString(reader);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to load template from classpath: templates/jakes_resume.tex", e);
            }
        }
        return jakesResumeTemplate;
    }
}
