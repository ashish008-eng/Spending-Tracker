package com.example.spendingTracker.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "expenses")
@Data
public class Expense {

    @Id
    private String id;

    private String title;
    private Double amount;
    private String category;
    private LocalDate date;
    private String userId;
}