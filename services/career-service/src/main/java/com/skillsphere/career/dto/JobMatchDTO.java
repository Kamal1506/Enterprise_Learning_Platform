package com.skillsphere.career.dto;

import java.util.List;

public record JobMatchDTO(
    JobPostingDTO jobPosting,
    Integer matchPercent,
    List<String> matchingSkills,
    List<String> missingSkills,
    List<String> recommendations
) {}
