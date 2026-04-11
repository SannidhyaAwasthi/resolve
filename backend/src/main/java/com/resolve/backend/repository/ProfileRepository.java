package com.resolve.backend.repository;

import com.resolve.backend.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    // No extra methods needed — findById(UUID id) is inherited from JpaRepository.
}
