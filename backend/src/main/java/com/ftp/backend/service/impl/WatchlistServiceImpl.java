package com.ftp.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ftp.backend.dto.request.WatchlistRequest;
import com.ftp.backend.dto.response.WatchlistItemResponse;
import com.ftp.backend.dto.response.WatchlistResponse;
import com.ftp.backend.entity.User;
import com.ftp.backend.entity.Watchlist;
import com.ftp.backend.entity.WatchlistItem;
import com.ftp.backend.exception.ConflictException;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.repository.WatchlistItemRepository;
import com.ftp.backend.repository.WatchlistRepository;
import com.ftp.backend.service.WatchlistService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WatchlistServiceImpl implements WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final WatchlistItemRepository watchlistItemRepository;

    public WatchlistServiceImpl(WatchlistRepository watchlistRepository,
                                WatchlistItemRepository watchlistItemRepository) {
        this.watchlistRepository = watchlistRepository;
        this.watchlistItemRepository = watchlistItemRepository;
    }

    @Override
    @Transactional
    public WatchlistResponse createWatchlist(Long userId, WatchlistRequest request) {
        User user = User.builder().id(userId).build();
        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .name(request.getName())
                .createdAt(LocalDateTime.now())
                .build();
        watchlistRepository.save(watchlist);
        return mapToWatchlistResponse(watchlist);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WatchlistResponse> getWatchlists(Long userId) {
        return watchlistRepository.findByUserId(userId).stream()
                .map(this::mapToWatchlistResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WatchlistResponse addItem(Long userId, Long watchlistId, String symbol, String companyName) {
        Watchlist watchlist = watchlistRepository.findByIdAndUserId(watchlistId, userId);
        if (watchlist == null) {
            throw new NotFoundException("Watchlist not found");
        }
        Optional<WatchlistItem> existing = watchlistItemRepository.findByWatchlistIdAndSymbol(watchlistId, symbol);
        if (existing.isPresent()) {
            throw new ConflictException("Symbol already in watchlist");
        }
        WatchlistItem item = WatchlistItem.builder()
                .watchlist(watchlist)
                .symbol(symbol)
                .companyName(companyName)
                .build();
        watchlistItemRepository.save(item);
        return mapToWatchlistResponse(watchlist);
    }

    @Override
    @Transactional
    public WatchlistResponse removeItem(Long userId, Long watchlistId, String symbol) {
        Watchlist watchlist = watchlistRepository.findByIdAndUserId(watchlistId, userId);
        if (watchlist == null) {
            throw new NotFoundException("Watchlist not found");
        }
        watchlistItemRepository.findByWatchlistIdAndSymbol(watchlistId, symbol)
                .ifPresent(watchlistItemRepository::delete);
        return mapToWatchlistResponse(watchlist);
    }

    @Override
    @Transactional
    public void deleteWatchlist(Long userId, Long watchlistId) {
        Watchlist watchlist = watchlistRepository.findByIdAndUserId(watchlistId, userId);
        if (watchlist == null) {
            throw new NotFoundException("Watchlist not found");
        }
        watchlistItemRepository.findByWatchlistId(watchlistId).forEach(watchlistItemRepository::delete);
        watchlistRepository.delete(watchlist);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WatchlistResponse> getAllWatchlists() {
        return watchlistRepository.findAll().stream()
                .map(this::mapToWatchlistResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WatchlistResponse> getWatchlistsByUserId(Long userId) {
        return watchlistRepository.findByUserId(userId).stream()
                .map(this::mapToWatchlistResponse)
                .collect(Collectors.toList());
    }

    private WatchlistResponse mapToWatchlistResponse(Watchlist watchlist) {
        List<WatchlistItemResponse> items = watchlistItemRepository.findByWatchlistId(watchlist.getId()).stream()
                .map(item -> WatchlistItemResponse.builder()
                        .id(item.getId())
                        .symbol(item.getSymbol())
                        .companyName(item.getCompanyName())
                        .addedAt(item.getAddedAt())
                        .build())
                .collect(Collectors.toList());
        return WatchlistResponse.builder()
                .id(watchlist.getId())
                .userId(watchlist.getUser().getId())
                .name(watchlist.getName())
                .items(items)
                .createdAt(watchlist.getCreatedAt())
                .build();
    }
}
