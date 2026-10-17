package com.ftp.backend.service;

import com.ftp.backend.dto.request.OrderRequest;
import com.ftp.backend.dto.response.OrderResponse;
import com.ftp.backend.entity.ERole;
import com.ftp.backend.entity.MarketData;
import com.ftp.backend.entity.OrderStatus;
import com.ftp.backend.entity.OrderType;
import com.ftp.backend.entity.Role;
import com.ftp.backend.entity.User;
import com.ftp.backend.entity.Wallet;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.exception.UnprocessableEntityException;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies the money-safety guarantees of the trading engine:
 * server side pricing, symbol validation, balance integrity and position handling.
 */
@SpringBootTest
class TradingServiceIntegrationTest {

    @Autowired
    private TradingService tradingService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private MarketDataRepository marketDataRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PortfolioRepository portfolioRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long userId;

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

        User user = User.builder()
                .username("trader")
                .email("trader@example.com")
                .password(passwordEncoder.encode("secret123"))
                .firstName("Trader")
                .lastName("One")
                .build();
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
        user = userRepository.save(user);
        userId = user.getId();

        walletRepository.save(Wallet.builder()
                .userId(userId)
                .balance(new BigDecimal("1000.00"))
                .availableBalance(new BigDecimal("1000.00"))
                .currency("USD")
                .build());

        marketDataRepository.save(MarketData.builder()
                .symbol("AAPL")
                .companyName("Apple Inc.")
                .currentPrice(new BigDecimal("200.00"))
                .lastUpdated(LocalDateTime.now())
                .build());
    }

    @Test
    void buyUsesServerSideMarketPriceAndIgnoresClientPrice() {
        // Client tries to pay 0.01 for a $200 instrument.
        OrderRequest request = OrderRequest.builder()
                .orderType(OrderType.BUY)
                .symbol("AAPL")
                .quantity(new BigDecimal("1"))
                .price(new BigDecimal("0.01"))
                .build();

        OrderResponse response = tradingService.placeOrder(userId, request);

        assertThat(response.getPrice()).isEqualByComparingTo("200.00");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("200.00");
        assertThat(response.getOrderStatus()).isEqualTo(OrderStatus.FILLED);

        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow();
        // 1000 - 200 - 0.20 fee
        assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("799.80");
    }

    @Test
    void buyRejectsUnknownSymbol() {
        OrderRequest request = OrderRequest.builder()
                .orderType(OrderType.BUY)
                .symbol("NOPE")
                .quantity(BigDecimal.ONE)
                .price(BigDecimal.TEN)
                .build();

        assertThatThrownBy(() -> tradingService.placeOrder(userId, request))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Unknown symbol");
    }

    @Test
    void buyRejectsWhenInsufficientFunds() {
        OrderRequest request = OrderRequest.builder()
                .orderType(OrderType.BUY)
                .symbol("AAPL")
                .quantity(new BigDecimal("100"))
                .price(new BigDecimal("200.00"))
                .build();

        assertThatThrownBy(() -> tradingService.placeOrder(userId, request))
                .isInstanceOf(UnprocessableEntityException.class)
                .hasMessageContaining("Insufficient funds");

        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow();
        assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    void sellReducesPositionAndRejectsOversell() {
        tradingService.placeOrder(userId, OrderRequest.builder()
                .orderType(OrderType.BUY)
                .symbol("AAPL")
                .quantity(new BigDecimal("2"))
                .price(new BigDecimal("200.00"))
                .build());

        tradingService.placeOrder(userId, OrderRequest.builder()
                .orderType(OrderType.SELL)
                .symbol("AAPL")
                .quantity(BigDecimal.ONE)
                .price(new BigDecimal("200.00"))
                .build());

        assertThat(portfolioRepository.findByUserIdAndSymbol(userId, "AAPL").getQuantity())
                .isEqualByComparingTo("1");

        assertThatThrownBy(() -> tradingService.placeOrder(userId, OrderRequest.builder()
                .orderType(OrderType.SELL)
                .symbol("AAPL")
                .quantity(new BigDecimal("5"))
                .price(new BigDecimal("200.00"))
                .build()))
                .isInstanceOf(UnprocessableEntityException.class)
                .hasMessageContaining("Insufficient holdings");
    }
}
