package com.ftp.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ftp.backend.dto.request.DepositRequest;
import com.ftp.backend.dto.request.WithdrawRequest;
import com.ftp.backend.dto.response.WalletResponse;
import com.ftp.backend.entity.Wallet;
import com.ftp.backend.exception.UnprocessableEntityException;
import com.ftp.backend.repository.WalletRepository;
import com.ftp.backend.service.WalletService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;

    public WalletServiceImpl(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Override
    public WalletResponse getBalance(Long userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse deposit(Long targetUserId, DepositRequest request) {
        requirePositive(request.getAmount(), "Deposit amount must be greater than zero");
        Wallet wallet = getOrCreateWalletForUpdate(targetUserId);
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(request.getAmount()));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse withdraw(Long targetUserId, WithdrawRequest request) {
        requirePositive(request.getAmount(), "Withdrawal amount must be greater than zero");
        Wallet wallet = getOrCreateWalletForUpdate(targetUserId);
        if (wallet.getAvailableBalance().compareTo(request.getAmount()) < 0) {
            throw new UnprocessableEntityException("Insufficient funds");
        }
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(request.getAmount()));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        return mapToWalletResponse(wallet);
    }

    private void requirePositive(BigDecimal amount, String message) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new UnprocessableEntityException(message);
        }
    }

    /**
     * Locks the wallet row for the duration of the surrounding transaction so
     * concurrent deposits/withdrawals cannot race and lose updates.
     */
    private Wallet getOrCreateWalletForUpdate(Long userId) {
        Optional<Wallet> existing = walletRepository.findByUserIdForUpdate(userId);
        if (existing.isPresent()) {
            return existing.get();
        }
        return createWallet(userId);
    }

    private Wallet getOrCreateWallet(Long userId) {
        Optional<Wallet> existing = walletRepository.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }
        return createWallet(userId);
    }

    private Wallet createWallet(Long userId) {
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .balance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .updatedAt(LocalDateTime.now())
                .build();
        return walletRepository.save(wallet);
    }

    private WalletResponse mapToWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUserId())
                .balance(wallet.getBalance())
                .availableBalance(wallet.getAvailableBalance())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
