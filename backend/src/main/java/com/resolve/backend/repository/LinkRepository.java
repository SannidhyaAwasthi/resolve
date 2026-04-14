package com.resolve.backend.repository;

import com.resolve.backend.model.Link;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LinkRepository extends JpaRepository<Link, UUID> {
    
    List<Link> findByUserId(UUID userId);
    
    List<Link> findByEntityTypeAndEntityId(String entityType, UUID entityId);
    
    void deleteByEntityTypeAndEntityId(String entityType, UUID entityId);
}
