package com.example.spendingTracker.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}