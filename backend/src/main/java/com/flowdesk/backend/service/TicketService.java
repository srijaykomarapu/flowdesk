package com.flowdesk.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.flowdesk.backend.dto.StatusUpdateRequest;
import com.flowdesk.backend.dto.TicketRequest;
import com.flowdesk.backend.entity.Ticket;
import com.flowdesk.backend.entity.TicketStatus;
import com.flowdesk.backend.repository.TicketRepository;

@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public Ticket createTicket(TicketRequest request) {
        Ticket ticket = new Ticket();

        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setCategory(request.category());
        ticket.setCreatedBy(request.createdBy());
        ticket.setAssignedTo(request.assignedTo());
        ticket.setStatus(TicketStatus.OPEN);

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    
    @Transactional(readOnly = true)
    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Ticket not found with ID: " + id
                        )
                );
    }
    
    public Ticket updateTicketStatus(
        Long id,
        StatusUpdateRequest request) {
        Ticket ticket = getTicketById(id);
        if (request == null || request.getStatus() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required"
            );
        }
        ticket.setStatus(request.getStatus());
        return ticketRepository.save(ticket);
    }

    public void deleteTicket(Long id) {
        Ticket ticket = getTicketById(id);
        ticketRepository.delete(ticket);
    }
}
