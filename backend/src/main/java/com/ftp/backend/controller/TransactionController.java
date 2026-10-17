package com.ftp.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ftp.backend.dto.response.TransactionResponse;
import com.ftp.backend.exception.ForbiddenActionException;
import com.ftp.backend.security.CurrentUserUtils;
import com.ftp.backend.service.TransactionService;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transaction", description = "Transaction history APIs")
public class TransactionController {

    private final TransactionService transactionService;
    private final CurrentUserUtils currentUserUtils;

    public TransactionController(TransactionService transactionService, CurrentUserUtils currentUserUtils) {
        this.transactionService = transactionService;
        this.currentUserUtils = currentUserUtils;
    }

    @GetMapping("/history")
    @Operation(summary = "Get transaction history")
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory(@RequestParam(required = false) Long userId) {
        Long targetUserId = userId != null ? userId : currentUserUtils.getCurrentUserId();
        if (userId != null && !currentUserUtils.isAdmin()) {
            throw new ForbiddenActionException("Admin only");
        }
        List<TransactionResponse> response = transactionService.getTransactionHistory(targetUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{transactionId}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable Long transactionId) {
        Long userId = currentUserUtils.getCurrentUserId();
        TransactionResponse response = transactionService.getTransaction(userId, transactionId);
        return ResponseEntity.ok(response);
    }
}
