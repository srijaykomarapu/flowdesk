
package com.flowdesk.backend.dto;

import java.time.LocalDateTime;

import com.flowdesk.backend.entity.User;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    User.Role role,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
}
