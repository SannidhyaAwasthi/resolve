package com.resolve.backend.repository;

import com.resolve.backend.model.GeneratedResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GeneratedResumeRepository extends JpaRepository<GeneratedResume, UUID> {
    List<GeneratedResume> findByUserId(UUID userId); // Spring generates: SELECT * FROM generated_resumes WHERE user_id
                                                     // = ?

    List<GeneratedResume> findByUserIdOrderByCreatedAtDesc(UUID userId); // Spring generates: SELECT * FROM
                                                                         // generated_resumes WHERE user_id = ? ORDER BY
                                                                         // created_at DESC
}