package com.ftp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ftp.backend.entity.Transaction;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByUserIdAndSymbol(Long userId, String symbol);
    void deleteByUserId(Long userId);
}
