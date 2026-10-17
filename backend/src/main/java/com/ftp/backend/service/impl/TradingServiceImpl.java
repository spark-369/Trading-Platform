package com.ftp.backend.service.impl;

import com.ftp.backend.dto.request.OrderRequest;
import com.ftp.backend.dto.response.OrderResponse;
import com.ftp.backend.entity.*;
import com.ftp.backend.exception.ForbiddenActionException;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.exception.UnprocessableEntityException;
import com.ftp.backend.repository.*;
import com.ftp.backend.service.TradingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class TradingServiceImpl implements TradingService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final PortfolioRepository portfolioRepository;
    private final MarketDataRepository marketDataRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BigDecimal feeRate;

    public TradingServiceImpl(OrderRepository orderRepository,
                              WalletRepository walletRepository,
                              PortfolioRepository portfolioRepository,
                              MarketDataRepository marketDataRepository,
                              TransactionRepository transactionRepository,
                              UserRepository userRepository,
                              @Value("${trading.fee-rate:0.001}") BigDecimal feeRate) {
        this.orderRepository = orderRepository;
        this.walletRepository = walletRepository;
        this.portfolioRepository = portfolioRepository;
        this.marketDataRepository = marketDataRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.feeRate = feeRate;
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String symbol = request.getSymbol().trim().toUpperCase(Locale.ROOT);

        // The traded price comes from the server side market data, never from the
        // client. Trusting a client supplied price allows buying an expensive
        // instrument for a nominal amount.
        MarketData marketData = marketDataRepository.findBySymbol(symbol)
                .orElseThrow(() -> new NotFoundException("Unknown symbol: " + symbol));
        BigDecimal executionPrice = marketData.getCurrentPrice();
        if (executionPrice == null || executionPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new UnprocessableEntityException("No valid market price available for symbol: " + symbol);
        }
        executionPrice = executionPrice.setScale(2, RoundingMode.HALF_UP);

        BigDecimal quantity = request.getQuantity();
        BigDecimal totalAmount = executionPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal fee = totalAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);

        // Serialize concurrent mutations of the same wallet.
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new NotFoundException("Wallet not found"));

        if (request.getOrderType() == OrderType.BUY) {
            BigDecimal totalCost = totalAmount.add(fee);
            if (wallet.getAvailableBalance().compareTo(totalCost) < 0) {
                throw new UnprocessableEntityException("Insufficient funds");
            }
            wallet.setBalance(wallet.getBalance().subtract(totalCost));
            wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(totalCost));
        } else {
            Portfolio portfolio = portfolioRepository.findByUserIdAndSymbolForUpdate(userId, symbol)
                    .orElse(null);
            if (portfolio == null || portfolio.getQuantity().compareTo(quantity) < 0) {
                throw new UnprocessableEntityException("Insufficient holdings");
            }
        }
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        Order order = Order.builder()
                .user(user)
                .orderType(request.getOrderType())
                .orderStatus(OrderStatus.FILLED)
                .symbol(symbol)
                .quantity(quantity)
                .price(executionPrice)
                .totalAmount(totalAmount)
                .filledQuantity(quantity)
                .filledPrice(executionPrice)
                .fee(fee)
                .build();

        orderRepository.save(order);

        if (request.getOrderType() == OrderType.BUY) {
            updatePortfolioForBuy(userId, symbol, quantity, executionPrice);
        } else {
            updatePortfolioForSell(userId, symbol, quantity, executionPrice);
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .order(order)
                .transactionType(request.getOrderType() == OrderType.BUY ? TransactionType.BUY : TransactionType.SELL)
                .symbol(symbol)
                .quantity(quantity)
                .price(executionPrice)
                .totalAmount(totalAmount)
                .fee(fee)
                .build();
        transactionRepository.save(transaction);

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenActionException("You are not allowed to cancel this order");
        }
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new UnprocessableEntityException("Cannot cancel order with status: " + order.getOrderStatus());
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return mapToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getOrders(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse getOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenActionException("You are not allowed to view this order");
        }
        return mapToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse cancelAnyOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new UnprocessableEntityException("Cannot cancel order with status: " + order.getOrderStatus());
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return mapToOrderResponse(order);
    }

    private void updatePortfolioForBuy(Long userId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = portfolioRepository.findByUserIdAndSymbolForUpdate(userId, symbol)
                .orElse(null);
        if (portfolio == null) {
            portfolio = Portfolio.builder()
                    .user(User.builder().id(userId).build())
                    .symbol(symbol)
                    .quantity(quantity)
                    .avgBuyPrice(price)
                    .currentValue(price.multiply(quantity))
                    .build();
        } else {
            BigDecimal totalCost = portfolio.getAvgBuyPrice().multiply(portfolio.getQuantity())
                    .add(price.multiply(quantity));
            BigDecimal totalQty = portfolio.getQuantity().add(quantity);
            portfolio.setAvgBuyPrice(totalCost.divide(totalQty, new MathContext(8, RoundingMode.HALF_UP)));
            portfolio.setQuantity(totalQty);
            portfolio.setCurrentValue(price.multiply(totalQty));
        }
        BigDecimal costBasis = portfolio.getAvgBuyPrice().multiply(portfolio.getQuantity());
        portfolio.setProfitLoss(portfolio.getCurrentValue().subtract(costBasis));
        if (costBasis.compareTo(BigDecimal.ZERO) > 0) {
            portfolio.setProfitLossPercent(
                    portfolio.getProfitLoss().divide(costBasis, new MathContext(4, RoundingMode.HALF_UP))
                            .multiply(HUNDRED)
            );
        }
        portfolio.setUpdatedAt(LocalDateTime.now());
        portfolioRepository.save(portfolio);
    }

    private void updatePortfolioForSell(Long userId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = portfolioRepository.findByUserIdAndSymbolForUpdate(userId, symbol)
                .orElse(null);
        if (portfolio != null) {
            portfolio.setQuantity(portfolio.getQuantity().subtract(quantity));
            portfolio.setCurrentValue(price.multiply(portfolio.getQuantity()));
            BigDecimal costBasis = portfolio.getAvgBuyPrice().multiply(portfolio.getQuantity());
            portfolio.setProfitLoss(portfolio.getCurrentValue().subtract(costBasis));
            if (costBasis.compareTo(BigDecimal.ZERO) > 0) {
                portfolio.setProfitLossPercent(
                        portfolio.getProfitLoss().divide(costBasis, new MathContext(4, RoundingMode.HALF_UP))
                                .multiply(HUNDRED)
                );
            }
            if (portfolio.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
                portfolioRepository.delete(portfolio);
                return;
            }
            portfolio.setUpdatedAt(LocalDateTime.now());
            portfolioRepository.save(portfolio);
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .orderType(order.getOrderType())
                .orderStatus(order.getOrderStatus())
                .symbol(order.getSymbol())
                .quantity(order.getQuantity())
                .price(order.getPrice())
                .totalAmount(order.getTotalAmount())
                .filledQuantity(order.getFilledQuantity())
                .filledPrice(order.getFilledPrice())
                .fee(order.getFee())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
