package com.resolve.backend.service;

import com.resolve.backend.dto.UserDataDTO;
import com.resolve.backend.model.Achievement;
import com.resolve.backend.model.Education;
import com.resolve.backend.model.Experience;
import com.resolve.backend.model.Profile;
import com.resolve.backend.model.Project;
import com.resolve.backend.model.Skill;
import com.resolve.backend.model.Link;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PromptBuilder {

    public String buildPrompt(UserDataDTO userData, String jobDescription, String latexTemplate) {
        StringBuilder sb = new StringBuilder();

        List<Link> allLinks = userData.getLinks();

        // SECTION 1 - ROLE INSTRUCTION
        sb.append(
                "You are an expert resume writer and LaTeX developer. Your job is to generate a tailored, ATS-friendly, one-page resume in LaTeX format using the exact template provided.\n\n");

        // SECTION 2 - THE TEMPLATE
        sb.append("===== START OF LATEX TEMPLATE =====\n");
        if (latexTemplate != null) {
            sb.append(latexTemplate);
        }
        sb.append("\n===== END OF LATEX TEMPLATE =====\n\n");

        // SECTION 3 - USER'S INFORMATION
        sb.append("===== USER INFORMATION =====\n");

        Profile profile = userData.getProfile();
        if (profile != null) {
            appendIfNotNull(sb, "Full Name: ", profile.getFullName());
            appendIfNotNull(sb, "Email: ", profile.getEmail());
            appendIfNotNull(sb, "Phone: ", profile.getPhone());
            appendIfNotNull(sb, "LinkedIn: ", profile.getLinkedin());
            appendIfNotNull(sb, "GitHub: ", profile.getGithub());
            appendIfNotNull(sb, "Portfolio: ", profile.getPortfolio());
            sb.append("\n");
        }

        List<Experience> experiences = userData.getExperiences();
        if (experiences != null && !experiences.isEmpty()) {
            sb.append("--- EXPERIENCES ---\n");
            for (Experience exp : experiences) {
                appendIfNotNull(sb, "Company: ", exp.getCompany());
                appendIfNotNull(sb, "Title: ", exp.getTitle());
                appendIfNotNull(sb, "Location: ", exp.getLocation());
                appendIfNotNull(sb, "Start Date: ", exp.getStartDate());
                appendIfNotNull(sb, "End Date: ", exp.getEndDate());

                if (exp.getBullets() != null && exp.getBullets().length > 0) {
                    sb.append("Bullets:\n");
                    for (String bullet : exp.getBullets()) {
                        if (bullet != null && !bullet.trim().isEmpty()) {
                            sb.append("  - ").append(bullet.trim()).append("\n");
                        }
                    }
                }
                appendLinksIfPresent(sb, allLinks, "experience", exp.getId());
                sb.append("\n");
            }
        }

        List<Education> educationList = userData.getEducation();
        if (educationList != null && !educationList.isEmpty()) {
            sb.append("--- EDUCATION ---\n");
            for (Education edu : educationList) {
                appendIfNotNull(sb, "Institution: ", edu.getInstitution());
                appendIfNotNull(sb, "Degree: ", edu.getDegree());
                appendIfNotNull(sb, "Field: ", edu.getField());
                appendIfNotNull(sb, "Start Date: ", edu.getStartDate());
                appendIfNotNull(sb, "End Date: ", edu.getEndDate());
                appendIfNotNull(sb, "GPA: ", edu.getGpa());

                if (edu.getCoursework() != null && edu.getCoursework().length > 0) {
                    sb.append("Coursework: ").append(String.join(", ", edu.getCoursework())).append("\n");
                }
                appendLinksIfPresent(sb, allLinks, "education", edu.getId());
                sb.append("\n");
            }
        }

        List<Skill> skills = userData.getSkills();
        if (skills != null && !skills.isEmpty()) {
            sb.append("--- SKILLS ---\n");
            for (Skill skill : skills) {
                if (skill.getCategory() != null) {
                    sb.append(skill.getCategory()).append(": ");
                    if (skill.getItems() != null && skill.getItems().length > 0) {
                        sb.append(String.join(", ", skill.getItems()));
                    }
                    sb.append("\n");
                }
            }
            sb.append("\n");
        }

        List<Project> projects = userData.getProjects();
        if (projects != null && !projects.isEmpty()) {
            sb.append("--- PROJECTS ---\n");
            for (Project proj : projects) {
                appendIfNotNull(sb, "Project Name: ", proj.getName());
                appendIfNotNull(sb, "Tech Stack: ", proj.getTechStack());
                appendIfNotNull(sb, "URL: ", proj.getUrl());

                if (proj.getBullets() != null && proj.getBullets().length > 0) {
                    sb.append("Bullets:\n");
                    for (String bullet : proj.getBullets()) {
                        if (bullet != null && !bullet.trim().isEmpty()) {
                            sb.append("  - ").append(bullet.trim()).append("\n");
                        }
                    }
                }
                appendLinksIfPresent(sb, allLinks, "project", proj.getId());
                sb.append("\n");
            }
        }

        List<Achievement> achievements = userData.getAchievements();
        if (achievements != null && !achievements.isEmpty()) {
            sb.append("--- ACHIEVEMENTS ---\n");
            for (Achievement ach : achievements) {
                appendIfNotNull(sb, "Title: ", ach.getTitle());
                appendIfNotNull(sb, "Issuer: ", ach.getIssuer());
                appendIfNotNull(sb, "Date: ", ach.getDate());
                appendIfNotNull(sb, "Description: ", ach.getDescription());

                if (ach.getBullets() != null && ach.getBullets().length > 0) {
                    sb.append("Bullets:\n");
                    for (String bullet : ach.getBullets()) {
                        if (bullet != null && !bullet.trim().isEmpty()) {
                            sb.append("  - ").append(bullet.trim()).append("\n");
                        }
                    }
                }
                appendLinksIfPresent(sb, allLinks, "achievement", ach.getId());
                sb.append("\n");
            }
        }

        // SECTION 4 - JOB DESCRIPTION
        sb.append("===== JOB DESCRIPTION =====\n");
        if (jobDescription != null && !jobDescription.trim().isEmpty()) {
            sb.append(jobDescription.trim());
        } else {
            sb.append("No specific job description provided. Prioritize general best practices.");
        }
        sb.append("\n\n");

        // SECTION 5 - INSTRUCTIONS
        sb.append("===== FINAL INSTRUCTIONS =====\n");
        sb.append("1. Use EXACTLY the LaTeX template structure and custom commands provided above.\n");
        sb.append("2. Fill in ALL sections of the template with the user's real information.\n");
        sb.append(
                "3. Tailor the bullet points to emphasize skills and experiences that match keywords and requirements from the job description.\n");
        sb.append(
                "4. Rewrite and improve bullet points to be achievement-oriented and quantified where possible. Use the STAR method (Situation, Task, Action, Result).\n");
        sb.append(
                "5. Prioritize the most relevant experiences, skills, and projects for this specific job. Less relevant items can be shortened or omitted if space is tight.\n");
        sb.append("6. Keep the resume to EXACTLY one page. Do not exceed one page.\n");
        sb.append("7. Output ONLY valid, compilable LaTeX code in plaintext.\n");
        sb.append(
                "8. Do NOT include any explanations, comments, markdown formatting, code fences (```), or any text before or after the LaTeX code.\n");
        sb.append(
                "9. The first characters of your response should be \\documentclass and the last characters should be \\end{document}.\n");
        sb.append(
                "10. Include links (including LinkedIn, Github, etc) that are attached to entries as hyperlinks in the resume. Use the LaTeX \\href{url}{label} command to embed them naturally. For example, a certificate link can appear as '\\href{url}{Certificate}' next to the relevant entry. A project demo link can appear next to the project name. Make them look natural and professional — do not dump raw URLs. If there are too many links and space is tight, prioritize the most relevant ones for the job.\n");
        sb.append(
                "11. Make sure all special LaTeX characters in the user's data are properly escaped (e.g. & becomes \\&, % becomes \\%, # becomes \\#).\n");

        return sb.toString();
    }

    private void appendIfNotNull(StringBuilder sb, String label, String value) {
        if (value != null && !value.trim().isEmpty()) {
            sb.append(label).append(value.trim()).append("\n");
        }
    }

    private void appendLinksIfPresent(StringBuilder sb, List<Link> allLinks, String entityType, UUID entityId) {
        if (allLinks == null || allLinks.isEmpty() || entityId == null)
            return;
        boolean titleAdded = false;

        for (Link link : allLinks) {
            if (entityType.equalsIgnoreCase(link.getEntityType()) && entityId.equals(link.getEntityId())) {
                if (!titleAdded) {
                    sb.append("Links:\n");
                    titleAdded = true;
                }
                String label = (link.getLabel() != null && !link.getLabel().trim().isEmpty()) ? link.getLabel().trim()
                        : "URL";
                sb.append("  - Link: [").append(label).append("] - [").append(link.getUrl()).append("]\n");
            }
        }
    }
}
