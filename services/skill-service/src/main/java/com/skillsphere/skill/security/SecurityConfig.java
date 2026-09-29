package com.skillsphere.skill.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Admin stats and approval endpoints (secured first to avoid wildcard match bypass)
                .requestMatchers("/api/v1/employees/admin-stats").hasRole("ADMIN")
                .requestMatchers("/api/v1/auth/pending-approvals").hasRole("ADMIN")
                .requestMatchers("/api/v1/auth/approve/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/auth/reject/**").hasRole("ADMIN")

                // Competency frameworks rules
                .requestMatchers(HttpMethod.POST, "/api/v1/competency-frameworks").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/competency-frameworks/**").hasAnyRole("ADMIN", "HR_MANAGER")

                // Skill and assessment verification rules
                .requestMatchers(HttpMethod.POST, "/api/v1/employees/*/assessments/*/verify").hasAnyRole("ADMIN", "HR_MANAGER", "TRAINING_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/v1/employees/*/skills/*/verify").hasAnyRole("ADMIN", "HR_MANAGER", "TRAINING_MANAGER")

                // Public endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()
                
                // Skill endpoints rules
                .requestMatchers(HttpMethod.POST, "/api/v1/skills").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/skills/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/skills/**").hasRole("ADMIN")
                
                // Employee creation and updates rules
                .requestMatchers(HttpMethod.POST, "/api/v1/employees").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/v1/employees/{id}").hasAnyRole("ADMIN", "HR_MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/employees/{id}").hasAnyRole("ADMIN", "HR_MANAGER")
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:4200", "http://127.0.0.1:4200", "https://*.onrender.com", "*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
