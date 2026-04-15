package com.example.spendingTracker.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenseRequest {

    private String title;
    private Double amount;
    private String category;
    private LocalDate date;
}