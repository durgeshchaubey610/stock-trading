-- Phase 1: Database Normalization for StockTrader Pro

-- 1. stock_financials
CREATE TABLE IF NOT EXISTS stock_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    roe FLOAT,
    roce FLOAT,
    roa FLOAT,
    ebitda_margin FLOAT,
    operating_margin FLOAT,
    gross_margin FLOAT,
    net_profit_margin FLOAT,
    debt_to_equity FLOAT,
    interest_coverage_ratio FLOAT,
    current_ratio FLOAT,
    quick_ratio FLOAT,
    total_debt FLOAT,
    total_cash FLOAT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 2. stock_growth
CREATE TABLE IF NOT EXISTS stock_growth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    revenue_growth_3y FLOAT,
    revenue_growth_5y FLOAT,
    ebitda_growth_3y FLOAT,
    ebitda_growth_5y FLOAT,
    eps_growth_3y FLOAT,
    eps_growth_5y FLOAT,
    profit_growth_3y FLOAT,
    profit_growth_5y FLOAT,
    forward_1y_revenue_growth FLOAT,
    forward_1y_ebitda_growth FLOAT,
    forward_1y_eps_growth FLOAT,
    forward_1y_ocf_growth FLOAT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 3. stock_valuation
CREATE TABLE IF NOT EXISTS stock_valuation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    pe_ratio FLOAT,
    forward_pe_ratio FLOAT,
    pb_ratio FLOAT,
    peg_ratio FLOAT,
    ev_to_ebitda FLOAT,
    ev_to_sales FLOAT,
    price_to_sales FLOAT,
    dividend_yield FLOAT,
    enterprise_value FLOAT,
    intrinsic_value FLOAT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 4. stock_ownership
CREATE TABLE IF NOT EXISTS stock_ownership (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT,
    promoter_holding FLOAT,
    fii_holding FLOAT,
    dii_holding FLOAT,
    mf_holding FLOAT,
    retail_holding FLOAT,
    public_holding FLOAT,
    period VARCHAR(50),
    promoter_change_3m FLOAT,
    promoter_change_6m FLOAT,
    promoter_change_1y FLOAT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 5. stock_technicals
CREATE TABLE IF NOT EXISTS stock_technicals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    rsi FLOAT,
    mfi FLOAT,
    macd FLOAT,
    macd_signal FLOAT,
    vwap FLOAT,
    obv FLOAT,
    atr FLOAT,
    beta FLOAT,
    adx FLOAT,
    williams_r FLOAT,
    stochastic_k FLOAT,
    stochastic_d FLOAT,
    bollinger_high FLOAT,
    bollinger_low FLOAT,
    sma20 FLOAT,
    sma50 FLOAT,
    sma100 FLOAT,
    sma200 FLOAT,
    ema20 FLOAT,
    ema50 FLOAT,
    ema100 FLOAT,
    ema200 FLOAT,
    signal VARCHAR(50),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 6. stock_scores
CREATE TABLE IF NOT EXISTS stock_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    fundamental_score INT,
    growth_score INT,
    value_score INT,
    quality_score INT,
    momentum_score INT,
    risk_score INT,
    intrinsic_value_score INT,
    overall_score INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 7. stock_forecasts
CREATE TABLE IF NOT EXISTS stock_forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT UNIQUE,
    buy_pct FLOAT,
    hold_pct FLOAT,
    sell_pct FLOAT,
    analyst_count INT,
    consensus_rating VARCHAR(100),
    target_mean FLOAT,
    target_high FLOAT,
    target_low FLOAT,
    upside_pct FLOAT,
    rev_estimate BIGINT,
    ebitda_estimate BIGINT,
    eps_estimate FLOAT,
    profit_estimate BIGINT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 8. stock_news
CREATE TABLE IF NOT EXISTS stock_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT,
    title VARCHAR(500),
    summary TEXT,
    source VARCHAR(100),
    url VARCHAR(1000),
    sentiment VARCHAR(20),
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 9. stock_events
CREATE TABLE IF NOT EXISTS stock_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT,
    event_type VARCHAR(100),
    title VARCHAR(500),
    event_date DATETIME,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- 10. Paper Trading Tables
CREATE TABLE IF NOT EXISTS paper_portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    available_cash FLOAT DEFAULT 1000000.0,
    invested_amount FLOAT DEFAULT 0.0,
    realized_profit FLOAT DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paper_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    stock_symbol VARCHAR(50),
    quantity INT,
    avg_buy_price FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paper_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    stock_symbol VARCHAR(50),
    quantity INT,
    price FLOAT,
    order_type VARCHAR(20),
    action VARCHAR(10),
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paper_trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    user_id INT,
    stock_symbol VARCHAR(50),
    quantity INT,
    execution_price FLOAT,
    action VARCHAR(10),
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES paper_orders(id)
);

CREATE TABLE IF NOT EXISTS paper_journal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    stock_symbol VARCHAR(50),
    trade_id INT,
    notes TEXT,
    lessons_learned TEXT,
    reasoning TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trade_id) REFERENCES paper_trades(id)
);
