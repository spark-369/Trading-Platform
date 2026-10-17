package com.ftp.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.ftp.backend.dto.request.DepositRequest;
import com.ftp.backend.dto.request.WithdrawRequest;
import com.ftp.backend.dto.response.WalletResponse;
import com.ftp.backend.exception.ForbiddenActionException;
import com.ftp.backend.security.CurrentUserUtils;
import com.ftp.backend.service.WalletService;

@RestController
@RequestMapping("/api/wallet")
@Tag(name = "Wallet", description = "Wallet management APIs")
public class WalletController {

    private final WalletService walletService;
    private final CurrentUserUtils currentUserUtils;

    public WalletController(WalletService walletService, CurrentUserUtils currentUserUtils) {
        this.walletService = walletService;
        this.currentUserUtils = currentUserUtils;
    }

    @GetMapping("/balance")
    @Operation(summary = "Get wallet balance")
    public ResponseEntity<WalletResponse> getBalance(@RequestParam(required = false) Long userId) {
        Long targetUserId = userId != null ? userId : currentUserUtils.getCurrentUserId();
        if (userId != null && !currentUserUtils.isAdmin()) {
            throw new ForbiddenActionException("Admin only");
        }
        WalletResponse response = walletService.getBalance(targetUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deposit funds (Admin only)")
    public ResponseEntity<WalletResponse> deposit(@Valid @RequestBody DepositRequest request,
                                                  @RequestParam(required = false) Long userId) {
        Long targetUserId = userId != null ? userId : currentUserUtils.getCurrentUserId();
        WalletResponse response = walletService.deposit(targetUserId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Withdraw funds (Admin only)")
    public ResponseEntity<WalletResponse> withdraw(@Valid @RequestBody WithdrawRequest request,
                                                   @RequestParam(required = false) Long userId) {
        Long targetUserId = userId != null ? userId : currentUserUtils.getCurrentUserId();
        WalletResponse response = walletService.withdraw(targetUserId, request);
        return ResponseEntity.ok(response);
    }
}
