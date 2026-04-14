package com.resolve.backend.controller;

import com.resolve.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // Combines @Controller + @ResponseBody — every method returns data directly
                // (not a view/template).
@RequestMapping("/api/test") // Base path for all endpoints in this controller.
@RequiredArgsConstructor // Lombok: generates constructor for the final field, enabling constructor
                         // injection.
public class TestController {

    private final ProfileRepository profileRepository;

    @GetMapping
    public String healthCheck() {
        return "Backend is running";
    }

    @GetMapping("/db")
    public String dbCheck() {
        long count = profileRepository.count();
        return "Database connected. Profiles count: " + count;
    }
}
