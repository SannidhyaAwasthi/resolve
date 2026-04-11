package com.resolve.backend.repository;

import com.resolve.backend.model.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
    List<Experience> findByUserId(UUID userId); // Spring generates: SELECT * FROM experiences WHERE user_id = ?
}
