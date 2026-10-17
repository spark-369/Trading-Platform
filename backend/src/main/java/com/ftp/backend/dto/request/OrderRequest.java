package com.ftp.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

import com.ftp.backend.entity.OrderType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotNull(message = "Order type is required")
    private OrderType orderType;

    @NotBlank(message = "Symbol is required")
    @Size(max = 20)
    private String symbol;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.00000001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    /**
     * Optional. Present for backwards compatibility with existing clients but
     * ignored — orders always execute at the server side market price.
     */
    private BigDecimal price;
}
