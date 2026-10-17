package com.ftp.backend.service.impl;

import com.ftp.backend.dto.request.UpdateUserRequest;
import com.ftp.backend.dto.response.UserResponse;
import com.ftp.backend.entity.User;
import com.ftp.backend.exception.ConflictException;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.repository.OrderRepository;
import com.ftp.backend.repository.PortfolioRepository;
import com.ftp.backend.repository.TransactionRepository;
import com.ftp.backend.repository.UserRepository;
import com.ftp.backend.repository.WalletRepository;
import com.ftp.backend.repository.WatchlistItemRepository;
import com.ftp.backend.repository.WatchlistRepository;
import com.ftp.backend.service.UserService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final PortfolioRepository portfolioRepository;
    private final WatchlistRepository watchlistRepository;
    private final WatchlistItemRepository watchlistItemRepository;

    public UserServiceImpl(UserRepository userRepository,
                           WalletRepository walletRepository,
                           OrderRepository orderRepository,
                           TransactionRepository transactionRepository,
                           PortfolioRepository portfolioRepository,
                           WatchlistRepository watchlistRepository,
                           WatchlistItemRepository watchlistItemRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.portfolioRepository = portfolioRepository;
        this.watchlistRepository = watchlistRepository;
        this.watchlistItemRepository = watchlistItemRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }

    @Override
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateUser(String username, UpdateUserRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail())
                    && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
                throw new ConflictException("Email is already in use");
            }
            user.setEmail(request.getEmail());
        }
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("User not found");
        }
        // Dependent rows (wallet, orders, transactions, portfolios, watchlists)
        // are removed first so the delete cannot fail on foreign key constraints.
        walletRepository.deleteByUserId(userId);
        orderRepository.deleteByUserId(userId);
        transactionRepository.deleteByUserId(userId);
        portfolioRepository.deleteByUserId(userId);
        watchlistRepository.findByUserId(userId).forEach(watchlist -> {
            watchlistItemRepository.deleteByWatchlistId(watchlist.getId());
            watchlistRepository.delete(watchlist);
        });
        userRepository.deleteById(userId);
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(roles)
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
