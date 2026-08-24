package com.skillsphere.skill.controller;

import com.skillsphere.skill.dto.AuthRequest;
import com.skillsphere.skill.dto.AuthResponse;
import com.skillsphere.skill.dto.RegisterRequest;
import com.skillsphere.skill.dto.PendingApprovalDTO;
import com.skillsphere.skill.entity.AppUser;
import com.skillsphere.skill.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AppUser> register(@Valid @RequestBody RegisterRequest request) {
        AppUser user = authService.register(request);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<List<PendingApprovalDTO>> getPendingApprovals() {
        return ResponseEntity.ok(authService.getPendingApprovals());
    }

    @PostMapping("/approve/{userId}")
    public ResponseEntity<Void> approveUser(@PathVariable UUID userId) {
        authService.approveUser(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{userId}")
    public ResponseEntity<Void> rejectUser(@PathVariable UUID userId) {
        authService.rejectUser(userId);
        return ResponseEntity.ok().build();
    }
}
