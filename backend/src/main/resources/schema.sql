-- Production schema for the trading platform (PostgreSQL).
-- Apply this once before starting the application with
-- spring.jpa.hibernate.ddl-auto=validate.
--
-- NOTE: `user` is reserved in PostgreSQL, therefore the table is named `users`.

CREATE TABLE IF NOT EXISTS roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name  VARCHAR(255),
    enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id),
    role_id BIGINT NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS wallets (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT         NOT NULL UNIQUE REFERENCES users (id),
    balance           NUMERIC(19, 2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(19, 2) NOT NULL DEFAULT 0,
    currency          VARCHAR(255)   NOT NULL DEFAULT 'USD',
    created_at        TIMESTAMP      NOT NULL,
    updated_at        TIMESTAMP      NOT NULL
);

CREATE TABLE IF NOT EXISTS market_data (
    id             BIGSERIAL PRIMARY KEY,
    symbol         VARCHAR(255)   NOT NULL UNIQUE,
    company_name   VARCHAR(255),
    current_price  NUMERIC(19, 2),
    open_price     NUMERIC(19, 2),
    high_price     NUMERIC(19, 2),
    low_price      NUMERIC(19, 2),
    previous_close NUMERIC(19, 2),
    volume         BIGINT,
    change         NUMERIC(19, 2),
    change_percent NUMERIC(19, 2),
    last_updated   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT         NOT NULL REFERENCES users (id),
    order_type      VARCHAR(255)   NOT NULL,
    order_status    VARCHAR(255)   NOT NULL,
    symbol          VARCHAR(255)   NOT NULL,
    quantity        NUMERIC(19, 8) NOT NULL,
    price           NUMERIC(19, 2) NOT NULL,
    total_amount    NUMERIC(19, 2) NOT NULL,
    filled_quantity NUMERIC(19, 8) NOT NULL DEFAULT 0,
    filled_price    NUMERIC(19, 2),
    fee             NUMERIC(19, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP      NOT NULL,
    updated_at      TIMESTAMP      NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users (id),
    order_id         BIGINT         NOT NULL REFERENCES orders (id),
    transaction_type VARCHAR(255)   NOT NULL,
    symbol           VARCHAR(255)   NOT NULL,
    quantity         NUMERIC(19, 8) NOT NULL,
    price            NUMERIC(19, 2) NOT NULL,
    total_amount     NUMERIC(19, 2) NOT NULL,
    fee              NUMERIC(19, 2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP      NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT         NOT NULL REFERENCES users (id),
    symbol              VARCHAR(255)   NOT NULL,
    quantity            NUMERIC(19, 8) NOT NULL,
    avg_buy_price       NUMERIC(19, 8) NOT NULL,
    current_value       NUMERIC(19, 2) NOT NULL DEFAULT 0,
    profit_loss         NUMERIC(19, 2) NOT NULL DEFAULT 0,
    profit_loss_percent NUMERIC(19, 2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMP      NOT NULL,
    updated_at          TIMESTAMP      NOT NULL,
    CONSTRAINT uk_portfolio_user_symbol UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS watchlists (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id           BIGSERIAL PRIMARY KEY,
    watchlist_id BIGINT       NOT NULL REFERENCES watchlists (id),
    symbol       VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    added_at     TIMESTAMP    NOT NULL,
    CONSTRAINT uk_watchlist_item_symbol UNIQUE (watchlist_id, symbol)
);

-- Helpful indexes for the frequent lookups.
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
