
package com.flowdesk.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AssignTicketRequest(
        @NotBlank(message = "Agent email is required")
        @Email(message = "Enter a valid agent email")
        String agentEmail
) {}
