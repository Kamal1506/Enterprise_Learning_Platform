package com.skillsphere.learning.repository;

import com.skillsphere.learning.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByCourseId(UUID courseId);
    void deleteByCourseId(UUID courseId);
}
