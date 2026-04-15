package com.example.spendingTracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class healthCheck {


    @GetMapping("/check")
    public String abc(){

        return "My spending tracker project has started.";
    }


}
