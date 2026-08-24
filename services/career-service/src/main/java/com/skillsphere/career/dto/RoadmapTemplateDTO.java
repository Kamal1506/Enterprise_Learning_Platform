package com.skillsphere.career.dto;

import java.util.List;
import java.util.UUID;

public record RoadmapTemplateDTO(
    UUID id,
    String title,
    List<String> steps
) {}
