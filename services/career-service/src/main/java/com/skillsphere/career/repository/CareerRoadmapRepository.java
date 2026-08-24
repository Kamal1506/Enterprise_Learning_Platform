package com.skillsphere.career.repository;

import com.skillsphere.career.entity.CareerRoadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CareerRoadmapRepository extends JpaRepository<CareerRoadmap, UUID> {
    Optional<CareerRoadmap> findByTitle(String title);
}
