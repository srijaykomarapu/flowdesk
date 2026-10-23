
package com.flowdesk.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.flowdesk.backend.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, exception) ->
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth

                // Allow CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public authentication endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // User Management: admins only
                .requestMatchers(
                    HttpMethod.GET, "/api/users"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PATCH, "/api/users/*/role"
                ).hasRole("ADMIN")

                // Only agents and admins can fetch the agent list
                .requestMatchers(
                    HttpMethod.GET, "/api/users/agents"
                ).hasAnyRole("AGENT", "ADMIN")

                // Only agents and admins can update ticket status or assignment
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/tickets/*/status",
                    "/api/tickets/*/assignment"
                ).hasAnyRole("AGENT", "ADMIN")

                // Only admins can delete tickets
                .requestMatchers(
                    HttpMethod.DELETE, "/api/tickets/**"
                ).hasRole("ADMIN")

                // Authenticated users can view and create tickets
                .requestMatchers(
                    HttpMethod.GET, "/api/tickets/**"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.POST, "/api/tickets/**"
                ).authenticated()

                // Protect other ticket endpoints
                .requestMatchers("/api/tickets/**").authenticated()

                // Other endpoints follow their own controller rules
                .anyRequest().permitAll()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );

        config.setAllowedHeaders(
            List.of("Authorization", "Content-Type")
        );

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
