package com.ftp.backend.service.impl;

import com.ftp.backend.dto.request.LoginRequest;
import com.ftp.backend.dto.request.RegisterRequest;
import com.ftp.backend.dto.response.AuthResponse;
import com.ftp.backend.entity.ERole;
import com.ftp.backend.entity.Role;
import com.ftp.backend.entity.User;
import com.ftp.backend.entity.Wallet;
import com.ftp.backend.exception.ConflictException;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.repository.RoleRepository;
import com.ftp.backend.repository.UserRepository;
import com.ftp.backend.repository.WalletRepository;
import com.ftp.backend.security.JwtTokenProvider;
import com.ftp.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final WalletRepository walletRepository;

    @Value("${trading.welcome-balance:10000.00}")
    private BigDecimal welcomeBalance;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();

        Role userRole = roleRepository.findByName(ERole.ROLE_USER);
        if (userRole == null) {
            throw new NotFoundException("Default role ROLE_USER is not initialized. Please restart the server.");
        }
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Seed the wallet so a brand new account is immediately able to trade.
        BigDecimal openingBalance = welcomeBalance != null ? welcomeBalance : BigDecimal.ZERO;
        Wallet wallet = Wallet.builder()
                .userId(savedUser.getId())
                .balance(openingBalance)
                .availableBalance(openingBalance)
                .currency("USD")
                .build();
        walletRepository.save(wallet);

        String token = jwtTokenProvider.generateToken(savedUser.getUsername(), savedUser.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList()));

        return buildAuthResponse(savedUser, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .or(() -> userRepository.findByEmail(userDetails.getUsername()))
                .orElseThrow(() -> new NotFoundException("User not found"));

        String token = jwtTokenProvider.generateToken(userDetails.getUsername(), userDetails.getAuthorities().stream()
                .collect(Collectors.toList()));

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roles)
                .build();
    }
}
