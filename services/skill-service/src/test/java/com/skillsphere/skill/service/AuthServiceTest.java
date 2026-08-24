package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.AuthRequest;
import com.skillsphere.skill.dto.AuthResponse;
import com.skillsphere.skill.dto.RegisterRequest;
import com.skillsphere.skill.entity.AppUser;
import com.skillsphere.skill.entity.Employee;
import com.skillsphere.skill.entity.Role;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(appUserRepository, employeeRepository, passwordEncoder, jwtTokenProvider);
    }

    @Test
    void registerEmployee_Success() {
        RegisterRequest request = new RegisterRequest(
                "new@example.com", "password", "EMPLOYEE",
                "Jane Doe", "Developer", "Engineering", 3
        );

        when(appUserRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.password())).thenReturn("encoded_password");

        Employee savedEmployee = new Employee();
        UUID empId = UUID.randomUUID();
        savedEmployee.setId(empId);
        savedEmployee.setName(request.name());
        savedEmployee.setEmail(request.email());
        when(employeeRepository.save(any(Employee.class))).thenReturn(savedEmployee);

        AppUser savedUser = new AppUser();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail(request.email());
        savedUser.setRole(Role.EMPLOYEE);
        savedUser.setEmployeeId(empId);
        when(appUserRepository.save(any(AppUser.class))).thenReturn(savedUser);

        AppUser result = authService.register(request);

        assertNotNull(result);
        assertEquals(request.email(), result.getEmail());
        assertEquals(Role.EMPLOYEE, result.getRole());
        assertEquals(empId, result.getEmployeeId());
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(appUserRepository, times(1)).save(any(AppUser.class));
    }

    @Test
    void login_Success() {
        AuthRequest request = new AuthRequest("user@example.com", "password");
        AppUser user = new AppUser();
        UUID userId = UUID.randomUUID();
        user.setId(userId);
        user.setEmail(request.email());
        user.setPasswordHash("hashed_password");
        user.setRole(Role.EMPLOYEE);
        user.setEmployeeId(UUID.randomUUID());
        user.setApproved(true);

        when(appUserRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(userId, user.getEmail(), "EMPLOYEE")).thenReturn("jwt_token");
        when(jwtTokenProvider.getExpiryDate()).thenReturn(Instant.now().plusSeconds(3600));

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt_token", response.token());
        assertEquals("EMPLOYEE", response.role());
        assertEquals(request.email(), response.email());
        assertEquals(user.getEmployeeId(), response.employeeId());
    }

    @Test
    void login_Unapproved_ThrowsAccountPendingApprovalException() {
        AuthRequest request = new AuthRequest("user@example.com", "password");
        AppUser user = new AppUser();
        user.setEmail(request.email());
        user.setPasswordHash("hashed_password");
        user.setApproved(false);

        when(appUserRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);

        assertThrows(com.skillsphere.skill.exception.AccountPendingApprovalException.class, () -> authService.login(request));
    }

    @Test
    void login_InvalidPassword_ThrowsBadCredentials() {
        AuthRequest request = new AuthRequest("user@example.com", "wrong_password");
        AppUser user = new AppUser();
        user.setEmail(request.email());
        user.setPasswordHash("hashed_password");

        when(appUserRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void approveUser_Success() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setApproved(false);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.save(user)).thenReturn(user);

        authService.approveUser(userId);

        assertTrue(user.isApproved());
        verify(appUserRepository, times(1)).save(user);
    }

    @Test
    void rejectUser_Success() {
        UUID userId = UUID.randomUUID();
        UUID empId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setEmployeeId(empId);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        authService.rejectUser(userId);

        verify(employeeRepository, times(1)).deleteById(empId);
        verify(appUserRepository, times(1)).delete(user);
    }
}
