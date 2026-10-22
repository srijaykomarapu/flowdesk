package com.flowdesk.backend.service;

import com.flowdesk.backend.dto.AuthResponse;
import com.flowdesk.backend.dto.LoginRequest;
import com.flowdesk.backend.dto.RegisterRequest;
import com.flowdesk.backend.entity.User;
import com.flowdesk.backend.repository.UserRepository;
import com.flowdesk.backend.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        // Public registration always creates an employee.
        user.setRole(User.Role.EMPLOYEE);

        User savedUser = userRepository.save(user);

        return createResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {

        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Invalid email or password"));

        if (!passwordEncoder.matches(
                request.password(), user.getPassword())) {
            throw new BadCredentialsException(
                    "Invalid email or password");
        }

        return createResponse(user);
    }

    private AuthResponse createResponse(User user) {

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name());

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name());
    }
}