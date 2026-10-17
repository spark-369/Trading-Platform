package com.ftp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ftp.backend.entity.Order;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByUserIdAndSymbol(Long userId, String symbol);
    void deleteByUserId(Long userId);
}
