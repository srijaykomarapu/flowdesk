
package com.flowdesk.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.flowdesk.backend.dto.StatusUpdateRequest;
import com.flowdesk.backend.dto.TicketRequest;
import com.flowdesk.backend.entity.Ticket;
import com.flowdesk.backend.entity.TicketStatus;
import com.flowdesk.backend.entity.User;
import com.flowdesk.backend.repository.TicketRepository;
import com.flowdesk.backend.repository.UserRepository;

@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(
            TicketRepository ticketRepository,
            UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public Ticket createTicket(TicketRequest request, String email) {
        Ticket ticket = new Ticket();

        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setCategory(request.category());
        ticket.setCreatedBy(email);
        ticket.setAssignedTo(null);
        ticket.setStatus(TicketStatus.OPEN);

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getAllTickets(String email, String role) {
        if ("ADMIN".equals(role) || "AGENT".equals(role)) {
            return ticketRepository.findAll();
        }

        return ticketRepository.findByCreatedBy(email);
    }

    @Transactional(readOnly = true)
    public Ticket getTicketById(Long id, String email, String role) {
        Ticket ticket = getTicketByIdForUpdate(id);

        if (!"ADMIN".equals(role)
                && !"AGENT".equals(role)
                && !email.equals(ticket.getCreatedBy())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access this ticket");
        }

        return ticket;
    }

    public Ticket updateTicketStatus(
            Long id,
            StatusUpdateRequest request) {

        Ticket ticket = getTicketByIdForUpdate(id);

        if (request == null || request.getStatus() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required");
        }

        ticket.setStatus(request.getStatus());
        return ticketRepository.save(ticket);
    }

    public Ticket assignTicket(Long id, String agentEmail) {
        Ticket ticket = getTicketByIdForUpdate(id);

        if (agentEmail == null || agentEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Agent email is required");
        }

        String normalizedEmail =
                agentEmail.trim().toLowerCase(Locale.ROOT);

        User agent = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User with this email does not exist"));

        if (agent.getRole() != User.Role.AGENT) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tickets can only be assigned to users with the AGENT role");
        }

        ticket.setAssignedTo(agent.getEmail());
        return ticketRepository.save(ticket);
    }

    private Ticket getTicketByIdForUpdate(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ticket not found with ID: " + id));
    }

    public void deleteTicket(Long id) {
        Ticket ticket = getTicketByIdForUpdate(id);
        ticketRepository.delete(ticket);
    }
}
