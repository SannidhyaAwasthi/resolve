package com.resolve.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Entity // Marks this class as a JPA entity (a persistent domain object mapped to a DB
        // row).
@Table(name = "experiences", // Maps the entity to the "experiences" table.
        schema = "public") // Specifies the PostgreSQL schema.
@Data // Lombok: combines @Getter, @Setter, @ToString, @EqualsAndHashCode, and
      // @RequiredArgsConstructor into one annotation.
@NoArgsConstructor // Lombok: generates a no-argument constructor (required by JPA to instantiate
                   // entities via reflection).
@AllArgsConstructor // Lombok: generates a constructor with all fields as parameters.
public class Experience {

    @Id // Marks this field as the primary key.
    @GeneratedValue(strategy = GenerationType.AUTO) // Auto-generates the UUID — this table creates its own IDs (unlike
                                                    // Profile where it's set from auth).
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false) // Links to the user who owns this experience. Not a foreign key
                                                // constraint in JPA, just a stored UUID.
    private UUID userId;

    @Column(name = "company")
    private String company;

    @Column(name = "title")
    private String title;

    @Column(name = "location")
    private String location;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "end_date")
    private String endDate;

    @Column(name = "bullets", columnDefinition = "text[]") // Maps PostgreSQL text[] array to Java String[].
                                                           // columnDefinition tells Hibernate the exact SQL type.
    private String[] bullets;
}
