package com.resolve.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity // Marks this class as a JPA entity (a persistent domain object mapped to a DB
        // row).
@Table(name = "generated_resumes", // Maps the entity to the "generated_resumes" table.
        schema = "public") // Specifies the PostgreSQL schema.
@Data // Lombok: combines @Getter, @Setter, @ToString, @EqualsAndHashCode, and
      // @RequiredArgsConstructor into one annotation.
@NoArgsConstructor // Lombok: generates a no-argument constructor (required by JPA to instantiate
                   // entities via reflection).
@AllArgsConstructor // Lombok: generates a constructor with all fields as parameters.
public class GeneratedResume {

    @Id // Marks this field as the primary key.
    @GeneratedValue(strategy = GenerationType.AUTO) // Auto-generates the UUID — this table creates its own IDs.
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false) // Links to the user who owns this generated resume.
    private UUID userId;

    @Column(name = "job_description", columnDefinition = "text")
    private String jobDescription;

    @Column(name = "latex_code", columnDefinition = "text")
    private String latexCode;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "created_at") // timestamptz in PostgreSQL — OffsetDateTime preserves timezone info.
    private OffsetDateTime createdAt;
}