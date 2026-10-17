package com.ftp.backend.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ftp.backend.entity.Portfolio;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    List<Portfolio> findByUserId(Long userId);
    Portfolio findByUserIdAndSymbol(Long userId, String symbol);

    void deleteByUserId(Long userId);

    /**
     * Row level write lock for the (user, symbol) holding so concurrent
     * buy/sell requests cannot corrupt quantity or average price.
     * Must be called inside a transaction.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Portfolio p where p.user.id = :userId and p.symbol = :symbol")
    Optional<Portfolio> findByUserIdAndSymbolForUpdate(@Param("userId") Long userId,
                                                        @Param("symbol") String symbol);
}
