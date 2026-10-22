
package com.flowdesk.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowdesk.backend.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedBy(String createdBy);
}
