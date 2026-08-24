package com.skillsphere.learning.controller;

import com.skillsphere.learning.dto.*;
import com.skillsphere.learning.entity.QuizQuestion;
import com.skillsphere.learning.repository.QuizQuestionRepository;
import com.skillsphere.learning.service.EnrollmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class QuizController {

    private final QuizQuestionRepository quizQuestionRepository;
    private final EnrollmentService enrollmentService;

    public QuizController(QuizQuestionRepository quizQuestionRepository, EnrollmentService enrollmentService) {
        this.quizQuestionRepository = quizQuestionRepository;
        this.enrollmentService = enrollmentService;
    }

    @GetMapping("/courses/{courseId}/quiz")
    public ResponseEntity<List<QuizQuestionDTO>> getQuizQuestions(@PathVariable UUID courseId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminOrManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_HR_MANAGER")
                        || a.getAuthority().equals("ROLE_TRAINING_MANAGER"));

        List<QuizQuestion> questions = quizQuestionRepository.findByCourseId(courseId);
        List<QuizQuestionDTO> dtos = questions.stream()
                .map(q -> new QuizQuestionDTO(
                        q.getId(),
                        q.getCourseId(),
                        q.getQuestionText(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        isAdminOrManager ? q.getCorrectOption() : null // Hide correct option for employees
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/courses/{courseId}/quiz")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    @Transactional
    public ResponseEntity<List<QuizQuestionDTO>> saveQuiz(
            @PathVariable UUID courseId,
            @RequestBody List<QuizQuestionDTO> questionDTOs) {

        if (questionDTOs.size() != 10) {
            throw new IllegalArgumentException("A quiz must consist of exactly 10 questions.");
        }

        // Delete old quiz questions
        quizQuestionRepository.deleteByCourseId(courseId);

        List<QuizQuestion> toSave = new ArrayList<>();
        for (QuizQuestionDTO dto : questionDTOs) {
            QuizQuestion q = new QuizQuestion();
            q.setCourseId(courseId);
            q.setQuestionText(dto.questionText());
            q.setOptionA(dto.optionA());
            q.setOptionB(dto.optionB());
            q.setOptionC(dto.optionC());
            q.setOptionD(dto.optionD());
            q.setCorrectOption(dto.correctOption().trim().toUpperCase());
            toSave.add(q);
        }

        List<QuizQuestion> saved = quizQuestionRepository.saveAll(toSave);
        List<QuizQuestionDTO> result = saved.stream()
                .map(q -> new QuizQuestionDTO(
                        q.getId(),
                        q.getCourseId(),
                        q.getQuestionText(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        q.getCorrectOption()
                ))
                .collect(Collectors.toList());

        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PostMapping("/courses/{courseId}/quiz/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TRAINING_MANAGER')")
    @Transactional
    public ResponseEntity<List<QuizQuestionDTO>> uploadQuizCsv(
            @PathVariable UUID courseId,
            @RequestParam("file") MultipartFile file) {

        try (InputStream is = file.getInputStream()) {
            List<QuizQuestion> parsedQuestions = parseCsv(is, courseId);
            
            if (parsedQuestions.size() != 10) {
                throw new IllegalArgumentException("CSV file must contain exactly 10 quiz questions. Found: " + parsedQuestions.size());
            }

            // Delete old quiz questions
            quizQuestionRepository.deleteByCourseId(courseId);

            List<QuizQuestion> saved = quizQuestionRepository.saveAll(parsedQuestions);
            List<QuizQuestionDTO> result = saved.stream()
                    .map(q -> new QuizQuestionDTO(
                            q.getId(),
                            q.getCourseId(),
                            q.getQuestionText(),
                            q.getOptionA(),
                            q.getOptionB(),
                            q.getOptionC(),
                            q.getOptionD(),
                            q.getCorrectOption()
                    ))
                    .collect(Collectors.toList());

            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse quiz CSV: " + e.getMessage(), e);
        }
    }

    @PostMapping("/enrollments/{enrollmentId}/quiz/submit")
    public ResponseEntity<QuizResultDTO> submitQuiz(
            @PathVariable UUID enrollmentId,
            @RequestBody QuizSubmissionRequest request) {
        
        QuizResultDTO result = enrollmentService.submitQuiz(enrollmentId, request.answers());
        return ResponseEntity.ok(result);
    }

    private List<QuizQuestion> parseCsv(InputStream is, UUID courseId) throws Exception {
        List<QuizQuestion> questions = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }
                // Skip header row if it contains headers
                if (firstLine) {
                    firstLine = false;
                    if (line.toLowerCase().contains("question") || line.toLowerCase().contains("option")) {
                        continue;
                    }
                }
                
                String[] parts = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                if (parts.length < 6) {
                    throw new IllegalArgumentException("Invalid CSV row. Expected 6 columns (question_text, option_a, option_b, option_c, option_d, correct_option).");
                }
                
                QuizQuestion q = new QuizQuestion();
                q.setCourseId(courseId);
                q.setQuestionText(cleanCsvValue(parts[0]));
                q.setOptionA(cleanCsvValue(parts[1]));
                q.setOptionB(cleanCsvValue(parts[2]));
                q.setOptionC(cleanCsvValue(parts[3]));
                q.setOptionD(cleanCsvValue(parts[4]));
                
                String correctOpt = cleanCsvValue(parts[5]).trim().toUpperCase();
                if (!correctOpt.equals("A") && !correctOpt.equals("B") && !correctOpt.equals("C") && !correctOpt.equals("D")) {
                    throw new IllegalArgumentException("Invalid correct option '" + correctOpt + "'. Must be A, B, C, or D.");
                }
                q.setCorrectOption(correctOpt);
                questions.add(q);
            }
        }
        return questions;
    }

    private String cleanCsvValue(String val) {
        val = val.trim();
        if (val.startsWith("\"") && val.endsWith("\"")) {
            val = val.substring(1, val.length() - 1);
        }
        return val.replace("\"\"", "\"");
    }
}
