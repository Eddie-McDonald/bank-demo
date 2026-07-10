package com.dynatracedemo.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LoginController {

    private final JdbcTemplate jdbcTemplate;

    public LoginController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        List<String> passwords = jdbcTemplate.query(
                "SELECT password FROM users WHERE username = ?",
                (rs, rowNum) -> rs.getString("password"),
                request.username());

        boolean success = !passwords.isEmpty() && passwords.get(0).equals(request.password());

        if (success) {
            return ResponseEntity.ok(new LoginResponse(true, "Login successful"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(false, "Invalid username or password"));
    }
}
