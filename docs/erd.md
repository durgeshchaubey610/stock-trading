# Entity Relationship Diagram (ERD)

This document visualizes the complete database schema for the application, representing entities, properties, primary/foreign keys, and structural relationships.

---

## Core Schema Visualization

```mermaid
erDiagram
    USERS ||--o{ ALERTS : "sets"
    USERS ||--o{ SCREENER_TEMPLATES : "saves"
    USERS ||--o{ WATCHLIST : "adds to"
    USERS ||--o{ PAPER_PORTFOLIOS : "owns virtual trading account"
    USERS ||--o{ PAPER_POSITIONS : "has current positions"
    USERS ||--o{ PAPER_ORDERS : "places"
    USERS ||--o{ PAPER_TRADES : "executes"
    USERS ||--o{ PAPER_JOURNAL : "writes notes for"
    USERS ||--o{ SAVINGS_GOALS : "plans for"
    USERS ||--o{ EXPENSE_LOGS : "logs income/expenses"
    USERS ||--o{ INSURANCE_POLICIES : "registers coverage"
    USERS ||--o{ USER_INVOICES : "receives"

    STOCKS ||--o{ ALERTS : "monitored in"
    STOCKS ||--o{ WATCHLIST : "listed in"
    STOCKS ||--|| STOCK_FINANCIALS : "has reports"
    STOCKS ||--|| STOCK_GROWTH : "has growth rate history"
    STOCKS ||--|| STOCK_VALUATION : "has valuation ratios"
    STOCKS ||--o{ STOCK_OWNERSHIP : "held by institutional type"
    STOCKS ||--|| STOCK_TECHNICALS : "has moving averages"

    PAPER_ORDERS ||--o{ PAPER_TRADES : "results in"
    PAPER_TRADES ||--o{ PAPER_JOURNAL : "documented in"
    SUBSCRIPTION_PLANS ||--o{ USER_INVOICES : "billed under"

    USERS {
        int id PK
        string username
        string email
        string password
        date date_of_birth
        boolean is_public
        string profile_slug
        boolean is_premium
        string subscription_tier
        datetime subscription_expiry
        datetime created_at
    }

    STOCKS {
        int id PK
        string symbol
        string name
        string sector
        double close_price
        bigint volume
        double rsi
        double mfi
        int is_fno
        double promoter_holding
        double fii_holding
        double dii_holding
        double retail_holding
        double debt_to_equity
        double roe
        double roce
        double pb_ratio
        double peg_ratio
        double ev_to_ebitda
        double ev_to_sales
        double price_to_sales
        double dividend_yield
        double enterprise_value
        double roa
        double ebitda_margin
        double operating_margin
        double gross_margin
        double net_profit_margin
        double revenue_growth_3y
        double revenue_growth_5y
        double profit_growth_3y
        double profit_growth_5y
        double current_ratio
        double quick_ratio
        double interest_coverage_ratio
        double total_debt
        double total_cash
        double beta
        double vwap
        double target_price
        double upside_pct
        int recommendation_count
        string recommendation_key
        bigint shares_outstanding
        double face_value
        double book_value
    }

    SAVINGS_GOALS {
        int id PK
        int user_id FK
        string goal_name
        double target_amount
        double current_amount
        date target_date
        string category
        datetime created_at
    }

    EXPENSE_LOGS {
        int id PK
        int user_id FK
        double amount
        string category
        string type
        date date
        string description
        datetime created_at
    }

    INSURANCE_POLICIES {
        int id PK
        int user_id FK
        string provider_name
        string policy_name
        string policy_type
        double coverage_amount
        double premium_amount
        string premium_frequency
        date renewal_date
        double claim_ratio
        text notes
        datetime created_at
    }

    PAPER_PORTFOLIOS {
        int id PK
        int user_id FK
        double available_cash
        double invested_amount
        double realized_profit
        datetime created_at
        datetime updated_at
    }

    PAPER_POSITIONS {
        int id PK
        int user_id FK
        string stock_symbol
        int quantity
        double avg_buy_price
        datetime created_at
        datetime updated_at
    }

    PAPER_ORDERS {
        int id PK
        int user_id FK
        string stock_symbol
        int quantity
        double price
        string order_type
        string action
        string status
        datetime created_at
        datetime updated_at
    }

    PAPER_TRADES {
        int id PK
        int order_id FK
        int user_id FK
        string stock_symbol
        int quantity
        double execution_price
        string action
        datetime transaction_date
    }

    PAPER_JOURNAL {
        int id PK
        int user_id FK
        string stock_symbol
        int trade_id FK
        text notes
        text lessons_learned
        text reasoning
        datetime created_at
        datetime updated_at
    }

    SUBSCRIPTION_PLANS {
        int id PK
        string name
        string display_name
        double price
        string currency
        int duration_days
        text features
        boolean is_active
        datetime created_at
    }

    USER_INVOICES {
        int id PK
        int user_id FK
        int plan_id FK
        double amount
        string currency
        string payment_status
        string payment_id
        string order_id
        string signature
        string billing_email
        string billing_name
        datetime invoice_date
    }
```

---

## Schema Entities & Descriptions

### 1. User & Access Control
*   **`users` Table**: The parent table representing active accounts. Tracks credentials, profile visibility, and subscription status.
*   **`subscription_plans` / `user_invoices` Tables**: Catalog of available subscription tiers and log of user checkout transactions.

### 2. Market Screener & Stock Insights
*   **`stocks` Table**: Primary data store for market equities, holding price points, sectors, ownership distributions, and key oscillators (RSI, MFI).
*   **`stock_details` Tables**: Dimensional tables (`StockFinancials`, `StockGrowth`, `StockValuation`, `StockOwnership`, `StockTechnicals`) storing deep financial ratios.
*   **`screener_templates` Table**: User-defined custom filters.
*   **`alerts` / `watchlist` Tables**: Monitored symbols and price triggers.

### 3. virtual Paper Trading
*   **`paper_portfolios` Table**: Tracks sandbox account balances.
*   **`paper_positions` Table**: Logs open equity holdings.
*   **`paper_orders` / `paper_trades` Tables**: Audit trail of simulated transaction executions.
*   **`paper_journal` Table**: User notes summarizing trade reasons and lessons.

### 4. Savings Optimizer & Expenses
*   **`savings_goals` Table**: Active financial goals (e.g. Emergency Fund).
*   **`expense_logs` Table**: Flow of transaction records (incomes/expenses).
*   **`insurance_policies` Table**: Medical, term, and vehicle protection policy registry.
