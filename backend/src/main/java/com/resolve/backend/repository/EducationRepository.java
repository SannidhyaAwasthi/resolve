package com.resolve.backend.repository;

import com.resolve.backend.model.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EducationRepository extends JpaRepository<Education, UUID> {
    List<Education> findByUserId(UUID userId); // Spring generates: SELECT * FROM education WHERE user_id = ?
}
