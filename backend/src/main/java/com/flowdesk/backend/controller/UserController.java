
package com.flowdesk.backend.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flowdesk.backend.dto.UserResponse;
import com.flowdesk.backend.entity.User;
import com.flowdesk.backend.repository.UserRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/role")
    @Transactional
    public UserResponse updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        User.Role newRole;

        try {
            newRole = User.Role.valueOf(
                    request.role().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Role must be ADMIN, AGENT, or EMPLOYEE");
        }

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String authenticatedEmail = authentication.getName();

        // Prevent an admin from demoting their own account.
        if (user.getEmail().equalsIgnoreCase(authenticatedEmail)
                && newRole != User.Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You cannot demote your own admin account");
        }

        // Prevent the last administrator from being demoted.
        if (user.getRole() == User.Role.ADMIN
                && newRole != User.Role.ADMIN) {

            long adminCount = userRepository.findByRole(User.Role.ADMIN)
                    .size();

            if (adminCount <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The last admin cannot be demoted. Promote another user first.");
            }
        }

        user.setRole(newRole);

        return UserResponse.from(userRepository.save(user));
    }

    public record UpdateUserRoleRequest(
            @NotBlank(message = "Role is required") String role) {
    }
}
