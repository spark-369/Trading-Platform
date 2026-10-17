package com.ftp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ftp.backend.entity.WatchlistItem;

import java.util.List;
import java.util.Optional;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByWatchlistId(Long watchlistId);
    Optional<WatchlistItem> findByWatchlistIdAndSymbol(Long watchlistId, String symbol);
    void deleteByWatchlistId(Long watchlistId);
}
