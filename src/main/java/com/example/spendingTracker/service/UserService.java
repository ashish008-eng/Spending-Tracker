package com.example.spendingTracker.service;

import com.example.spendingTracker.entity.User;
import com.example.spendingTracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {



    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public String register(User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER");

        userRepository.save(user);

        return "User Registered Successfully";
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}