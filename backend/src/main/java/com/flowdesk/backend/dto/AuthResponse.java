package com.flowdesk.backend.dto;

public record AuthResponse(
    String token,
    Long id,
    String fullName,
    String email,
    String role
) {}