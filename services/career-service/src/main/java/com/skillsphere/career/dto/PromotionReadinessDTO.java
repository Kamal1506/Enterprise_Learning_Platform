package com.skillsphere.career.dto;

public record PromotionReadinessDTO(
    String status, // Ready, Needs Training, Needs Certification, Needs Experience
    Integer readinessPercent,
    Boolean skillsMet,
    Boolean certificationsMet,
    Boolean coursesMet,
    Boolean experienceMet,
    String details
) {}
