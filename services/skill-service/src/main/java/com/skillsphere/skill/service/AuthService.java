package com.skillsphere.skill.service;

import com.skillsphere.skill.dto.AuthRequest;
import com.skillsphere.skill.dto.AuthResponse;
import com.skillsphere.skill.dto.RegisterRequest;
import com.skillsphere.skill.dto.PendingApprovalDTO;
import com.skillsphere.skill.entity.AppUser;
import com.skillsphere.skill.entity.Employee;
import com.skillsphere.skill.entity.Role;
import com.skillsphere.skill.exception.DuplicateResourceException;
import com.skillsphere.skill.exception.ResourceNotFoundException;
import com.skillsphere.skill.exception.AccountPendingApprovalException;
import com.skillsphere.skill.repository.AppUserRepository;
import com.skillsphere.skill.repository.EmployeeRepository;
import com.skillsphere.skill.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(AppUserRepository appUserRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.appUserRepository = appUserRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AppUser register(RegisterRequest request) {
        if (appUserRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateResourceException("Email is already registered");
        }

        Role role;
        try {
            role = Role.valueOf(request.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role specified. Supported: ADMIN, HR_MANAGER, TRAINING_MANAGER, EMPLOYEE");
        }

        UUID employeeId = null;

        // Create an Employee record for all roles to allow participation in learning flows
        if (true) {
            Employee employee = new Employee();
            employee.setName(request.name() != null && !request.name().isBlank() ? request.name() : request.email().split("@")[0]);
            employee.setEmail(request.email());
            employee.setRoleTitle(request.roleTitle() != null && !request.roleTitle().isBlank() ? request.roleTitle() : role.name());
            employee.setDepartment(request.department() != null && !request.department().isBlank() ? request.department() : "Management");
            employee.setExperienceYears(request.experienceYears() != null ? request.experienceYears() : 0);
            employee.setRating(BigDecimal.valueOf(5.00)); // default rating
            employee = employeeRepository.save(employee);
            employeeId = employee.getId();
        }

        AppUser user = new AppUser();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setEmployeeId(employeeId);
        user.setApproved(role == Role.ADMIN); // Admin is automatically approved, others need approval

        return appUserRepository.save(user);
    }

    public AuthResponse login(AuthRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isApproved()) {
            throw new AccountPendingApprovalException("Your account is pending approval by the Admin.");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                jwtTokenProvider.getExpiryDate(),
                user.getRole().name(),
                user.getEmail(),
                user.getEmployeeId()
        );
    }

    @Transactional(readOnly = true)
    public List<PendingApprovalDTO> getPendingApprovals() {
        return appUserRepository.findByApprovedFalse().stream()
                .map(user -> {
                    String name = "";
                    if (user.getEmployeeId() != null) {
                        name = employeeRepository.findById(user.getEmployeeId())
                                .map(Employee::getName)
                                .orElse("");
                    }
                    return new PendingApprovalDTO(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name(),
                            name,
                            user.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveUser(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setApproved(true);
        appUserRepository.save(user);
    }

    @Transactional
    public void rejectUser(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getEmployeeId() != null) {
            employeeRepository.deleteById(user.getEmployeeId());
        }
        appUserRepository.delete(user);
    }
}
