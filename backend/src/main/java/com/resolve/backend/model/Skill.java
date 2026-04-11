package com.resolve.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Entity                          // Marks this class as a JPA entity (a persistent domain object mapped to a DB row).
@Table(name = "skills",         // Maps the entity to the "skills" table.
       schema = "public")       // Specifies the PostgreSQL schema.
@Data                            // Lombok: combines @Getter, @Setter, @ToString, @EqualsAndHashCode, and @RequiredArgsConstructor into one annotation.
@NoArgsConstructor               // Lombok: generates a no-argument constructor (required by JPA to instantiate entities via reflection).
@AllArgsConstructor              // Lombok: generates a constructor with all fields as parameters.
public class Skill {

    @Id                          // Marks this field as the primary key.
    @GeneratedValue(strategy = GenerationType.AUTO) // Auto-generates the UUID — this table creates its own IDs.
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false) // Links to the user who owns this skill group.
    private UUID userId;

    @Column(name = "category")   // e.g. "Languages", "Frameworks", "Tools"
    private String category;

    @Column(name = "items", columnDefinition = "text[]") // Maps PostgreSQL text[] array to Java String[]. e.g. ["Java", "Python", "JavaScript"]
    private String[] items;
}
