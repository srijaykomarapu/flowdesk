
package com.flowdesk.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flowdesk.backend.dto.AssignTicketRequest;
import com.flowdesk.backend.dto.StatusUpdateRequest;
import com.flowdesk.backend.dto.TicketRequest;
import com.flowdesk.backend.entity.Ticket;
import com.flowdesk.backend.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    private String getAuthenticatedEmail() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    private String getAuthenticatedRole() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        return authentication.getAuthorities()
                .stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .findFirst()
                .orElse("EMPLOYEE");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Ticket createTicket(@Valid @RequestBody TicketRequest request) {
        return ticketService.createTicket(request, getAuthenticatedEmail());
    }

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets(
                getAuthenticatedEmail(), getAuthenticatedRole());
    }

    @GetMapping("/{id}")
    public Ticket getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(
                id, getAuthenticatedEmail(), getAuthenticatedRole());
    }

    @PatchMapping("/{id}/status")
    public Ticket updateTicketStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ticketService.updateTicketStatus(id, request);
    }

    @PatchMapping("/{id}/assignment")
    public Ticket assignTicket(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request) {

        String role = getAuthenticatedRole();

        if (!"ADMIN".equals(role) && !"AGENT".equals(role)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only agents and admins can assign tickets");
        }

        return ticketService.assignTicket(id, request.agentEmail());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
    }
}
