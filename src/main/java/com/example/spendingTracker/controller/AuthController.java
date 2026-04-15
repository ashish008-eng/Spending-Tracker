package com.example.spendingTracker.controller;

import com.example.spendingTracker.dto.GoogleRequest;
import com.example.spendingTracker.dto.LoginRequest;
import com.example.spendingTracker.entity.User;
import com.example.spendingTracker.repository.UserRepository;
import com.example.spendingTracker.service.AuthService;
import com.example.spendingTracker.service.GoogleAuthService;
import com.example.spendingTracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
//@CrossOrigin(origins = {"http://127.0.0.1:5500", "http://localhost:5500"})
public class AuthController {


    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final UserService userService;

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;



    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }



    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

//        user.setPassword(passwordEncoder.encode(user.getPassword()));
//        user.setRole("USER");
//
//        userRepository.save(user);


        return ResponseEntity.ok(userService.register(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }




    @PostMapping("/google")
    public String googleLogin(@RequestBody GoogleRequest request) {
        return googleAuthService.verifyToken(request.getToken());
    }
}