package com.example.spendingTracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.spendingTracker")
public class SpendingTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpendingTrackerApplication.class, args);
	}

}
