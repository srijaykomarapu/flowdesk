
package com.flowdesk.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketRequest(

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    String title,

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    String description,

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    String category,

    @NotBlank(message = "Created by is required")
    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    String createdBy,

    @Size(max = 100, message = "Assigned to cannot exceed 100 characters")
    String assignedTo
) {
}
