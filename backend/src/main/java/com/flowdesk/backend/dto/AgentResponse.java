package com.flowdesk.backend.dto;

public record AgentResponse(
    Long id,
    String fullName,
    String email
) {}