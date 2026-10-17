package com.ftp.backend.service.impl;

import org.springframework.stereotype.Service;

import com.ftp.backend.dto.response.MarketDataResponse;
import com.ftp.backend.entity.MarketData;
import com.ftp.backend.exception.NotFoundException;
import com.ftp.backend.repository.MarketDataRepository;
import com.ftp.backend.service.MarketDataService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketDataServiceImpl implements MarketDataService {

    private final MarketDataRepository marketDataRepository;

    public MarketDataServiceImpl(MarketDataRepository marketDataRepository) {
        this.marketDataRepository = marketDataRepository;
    }

    @Override
    public MarketDataResponse getMarketData(String symbol) {
        MarketData marketData = marketDataRepository.findBySymbol(symbol)
                .orElseThrow(() -> new NotFoundException("Market data not found for symbol: " + symbol));
        return mapToMarketDataResponse(marketData);
    }

    @Override
    public List<MarketDataResponse> getAllMarketData() {
        return marketDataRepository.findAll().stream()
                .map(this::mapToMarketDataResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MarketDataResponse> searchMarketData(String query) {
        return marketDataRepository.findByCompanyNameContainingIgnoreCaseOrSymbolContainingIgnoreCase(query, query).stream()
                .map(this::mapToMarketDataResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MarketDataResponse createOrUpdateMarketData(MarketData marketData) {
        marketData.setLastUpdated(LocalDateTime.now());
        return mapToMarketDataResponse(marketDataRepository.save(marketData));
    }

    @Override
    public MarketDataResponse createMarketData(MarketData marketData) {
        marketData.setLastUpdated(LocalDateTime.now());
        return mapToMarketDataResponse(marketDataRepository.save(marketData));
    }

    @Override
    public MarketDataResponse updateMarketData(String symbol, MarketData marketData) {
        MarketData existing = marketDataRepository.findBySymbol(symbol)
                .orElseThrow(() -> new NotFoundException("Market data not found for symbol: " + symbol));
        existing.setCompanyName(marketData.getCompanyName());
        existing.setCurrentPrice(marketData.getCurrentPrice());
        existing.setOpenPrice(marketData.getOpenPrice());
        existing.setHighPrice(marketData.getHighPrice());
        existing.setLowPrice(marketData.getLowPrice());
        existing.setPreviousClose(marketData.getPreviousClose());
        existing.setVolume(marketData.getVolume());
        existing.setChange(marketData.getChange());
        existing.setChangePercent(marketData.getChangePercent());
        existing.setLastUpdated(LocalDateTime.now());
        return mapToMarketDataResponse(marketDataRepository.save(existing));
    }

    @Override
    public void deleteMarketData(String symbol) {
        MarketData marketData = marketDataRepository.findBySymbol(symbol)
                .orElseThrow(() -> new NotFoundException("Market data not found for symbol: " + symbol));
        marketDataRepository.delete(marketData);
    }

    private MarketDataResponse mapToMarketDataResponse(MarketData marketData) {
        return MarketDataResponse.builder()
                .symbol(marketData.getSymbol())
                .companyName(marketData.getCompanyName())
                .currentPrice(marketData.getCurrentPrice())
                .openPrice(marketData.getOpenPrice())
                .highPrice(marketData.getHighPrice())
                .lowPrice(marketData.getLowPrice())
                .previousClose(marketData.getPreviousClose())
                .volume(marketData.getVolume())
                .change(marketData.getChange())
                .changePercent(marketData.getChangePercent())
                .lastUpdated(marketData.getLastUpdated())
                .build();
    }
}
