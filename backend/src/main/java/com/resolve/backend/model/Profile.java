package com.resolve.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity                          // Marks this class as a JPA entity (a persistent domain object mapped to a DB row).
@Table(name = "profiles",       // Maps the entity to the "Profiles" table (capital P, matching the exact DB table name).
       schema = "public")       // Specifies the PostgreSQL schema.
@Data                            // Lombok: combines @Getter, @Setter, @ToString, @EqualsAndHashCode, and @RequiredArgsConstructor into one annotation.
@NoArgsConstructor               // Lombok: generates a no-argument constructor (required by JPA to instantiate entities via reflection).
@AllArgsConstructor              // Lombok: generates a constructor with all fields as parameters.
public class Profile {

    @Id                          // Marks this field as the primary key. No @GeneratedValue — the ID is set manually to match the auth user's ID.
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "linkedin")
    private String linkedin;

    @Column(name = "github")
    private String github;

    @Column(name = "portfolio")
    private String portfolio;

    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
