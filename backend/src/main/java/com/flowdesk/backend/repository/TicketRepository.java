package com.flowdesk.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowdesk.backend.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

}