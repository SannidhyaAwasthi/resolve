package com.resolve.backend.service;

import com.resolve.backend.dto.UserDataDTO;
import com.resolve.backend.model.*;
import com.resolve.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service // Marks this class as a Spring service bean — a component that holds business logic.
@RequiredArgsConstructor // Lombok: generates a constructor with all 'final' fields as parameters — enabling constructor injection.
public class UserDataService {

    private final ProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;

    public UserDataDTO getUserData(UUID userId) {
        // 1. Find profile — the profile's id IS the userId
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));

        // 2. Find all related data by userId
        List<Experience> experiences = experienceRepository.findByUserId(userId);
        List<Education> education = educationRepository.findByUserId(userId);
        List<Skill> skills = skillRepository.findByUserId(userId);
        List<Project> projects = projectRepository.findByUserId(userId);

        // 3. Package into DTO and return
        return new UserDataDTO(profile, experiences, education, skills, projects);
    }
}
