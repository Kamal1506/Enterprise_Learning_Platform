package com.skillsphere.career.dto;

import java.util.List;

public record CareerRoadmapDTO(
    String currentPosition,
    String targetPosition,
    List<String> steps,
    Integer roadmapProgressPercent,
    List<RoadmapStepDetailDTO> stepDetails,
    String estimatedTimeline
) {}
