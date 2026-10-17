package com.ftp.backend.service.impl;

import org.springframework.stereotype.Service;

import com.ftp.backend.dto.response.TransactionResponse;
import com.ftp.backend.entity.Transaction;
import com.ftp.backend.exception.ForbiddenActionException;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.repository.TransactionRepository;
import com.ftp.backend.service.TransactionService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    public List<TransactionResponse> getTransactionHistory(Long userId) {
        return transactionRepository.findByUserId(userId).stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TransactionResponse getTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new ForbiddenActionException("You are not allowed to view this transaction");
        }
        return mapToTransactionResponse(transaction);
    }

    private TransactionResponse mapToTransactionResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .userId(transaction.getUser().getId())
                .orderId(transaction.getOrder().getId())
                .transactionType(transaction.getTransactionType())
                .symbol(transaction.getSymbol())
                .quantity(transaction.getQuantity())
                .price(transaction.getPrice())
                .totalAmount(transaction.getTotalAmount())
                .fee(transaction.getFee())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
