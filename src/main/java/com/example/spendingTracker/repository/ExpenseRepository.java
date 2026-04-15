package com.example.spendingTracker.repository;

import com.example.spendingTracker.entity.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExpenseRepository extends MongoRepository<Expense, String> {

    List<Expense> findByUserId(String userId);
}