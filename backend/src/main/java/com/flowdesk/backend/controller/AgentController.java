package com.flowdesk.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowdesk.backend.dto.AgentResponse;
import com.flowdesk.backend.entity.User;
import com.flowdesk.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class AgentController {

    private final UserRepository userRepository;

    public AgentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/agents")
    public List<AgentResponse> getAgents() {
        return userRepository.findByRole(User.Role.AGENT)
            .stream()
            .map(user -> new AgentResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail()
            ))
            .toList();
    }
}