package com.ftp.backend.service;

import com.ftp.backend.dto.request.RegisterRequest;
import com.ftp.backend.dto.response.AuthResponse;
import com.ftp.backend.entity.ERole;
import com.ftp.backend.entity.Role;
import com.ftp.backend.entity.Wallet;
import com.ftp.backend.exception.ConflictException;
import com.ftp.backend.repository.MarketDataRepository;
import com.ftp.backend.repository.OrderRepository;
import com.ftp.backend.repository.PortfolioRepository;
import com.ftp.backend.repository.RoleRepository;
import com.ftp.backend.repository.TransactionRepository;
import com.ftp.backend.repository.UserRepository;
import com.ftp.backend.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Registration behaviour: roles are assigned, a funded wallet is created and
 * duplicate identities are rejected with a conflict.
 */
@SpringBootTest
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private PortfolioRepository portfolioRepository;
    @Autowired
    private MarketDataRepository marketDataRepository;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        orderRepository.deleteAll();
        portfolioRepository.deleteAll();
        marketDataRepository.deleteAll();
        walletRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role userRole = new Role();
        userRole.setName(ERole.ROLE_USER);
        roleRepository.save(userRole);
    }

    @Test
    void registerCreatesFundedWalletAndReturnsToken() {
        AuthResponse response = authService.register(RegisterRequest.builder()
                .username("newbie")
                .email("newbie@example.com")
                .password("secret123")
                .firstName("New")
                .lastName("Bie")
                .build());

        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getRoles()).containsExactly("ROLE_USER");

        Wallet wallet = walletRepository.findByUserId(response.getUserId()).orElseThrow();
        assertThat(wallet.getAvailableBalance()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(wallet.getBalance()).isEqualByComparingTo(new BigDecimal("10000.00"));
    }

    @Test
    void registerRejectsDuplicateUsernameWithConflict() {
        authService.register(RegisterRequest.builder()
                .username("dupe")
                .email("dupe@example.com")
                .password("secret123")
                .firstName("Dup")
                .lastName("Lic")
                .build());

        assertThatThrownBy(() -> authService.register(RegisterRequest.builder()
                .username("dupe")
                .email("other@example.com")
                .password("secret123")
                .firstName("Dup")
                .lastName("Other")
                .build()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Username is already taken");
    }
}
