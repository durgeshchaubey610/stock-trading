# Data Flow Diagram (DFD)

This document maps the flow of data within the application system, illustrating the boundaries, processes, data stores, and data movements.

---

## Level 0: Context Diagram

The Level 0 diagram shows the core application system and its interactions with external entities.

```mermaid
graph TD
    User["Primary User"]
    MarketAPI["External Market API (Yahoo Finance)"]
    PaymentGateway["Payment Gateway (Razorpay / GPay)"]
    System[("AI Financial Independence Platform")]

    User -- "Registers, logs expenses, sets savings goals, places paper trades" --> System
    System -- "Renders screener grid, charts, portfolio analytics, and metrics" --> User
    MarketAPI -- "Feeds live stock prices and technical data" --> System
    User -- "Initiates premium upgrade payment" --> PaymentGateway
    PaymentGateway -- "Sends payment confirmation signature" --> System
```

---

## Level 1: Key Subsystems Data Flow

The Level 1 diagram breaks the system into core processing modules and databases.

```mermaid
graph TD
    %% Entities
    User["Primary User"]
    MarketAPI["Yahoo Finance API"]
    PaymentGateway["Razorpay / GPay API"]

    %% Processes
    P1["1.0 Auth & Subscriptions"]
    P2["2.0 Market Screener & Daily Picks"]
    P3["3.0 virtual Paper Trading"]
    P4["4.0 Savings Optimizer & Expenses"]

    %% Data Stores
    D1[("D1: User Accounts & Invoices")]
    D2[("D2: Stocks & Technicals DB")]
    D3[("D3: Paper Portfolios & Trades DB")]
    D4[("D4: Savings, Expenses, & Insurance DB")]

    %% Flows
    User -- "Login credentials" --> P1
    P1 -- "Read/Write user credentials" --> D1
    P1 -- "Issue Auth token & Subscription tier" --> User
    User -- "Make payment" --> PaymentGateway
    PaymentGateway -- "Payment signature verification" --> P1

    MarketAPI -- "Live price feeds" --> P2
    P2 -- "Update prices & indicators" --> D2
    User -- "Screener filters query" --> P2
    P2 -- "Retrieve matching stocks" --> D2
    P2 -- "Filtered stock grid & AI picks ticker" --> User

    User -- "Place virtual trade orders" --> P3
    P3 -- "Verify cash balance & update positions" --> D3
    P3 -- "Transaction confirmation & performance charts" --> User

    User -- "Logs income, expenses, savings goals, insurance" --> P4
    P4 -- "Read/Write financial profiles, logs, and goals" --> D4
    P4 -- "Summary metrics & progress visualizer" --> User
```

---

## Data Flow Descriptions

### 1. User Authentication & Subscription Gates (1.0)
*   **Input**: User submits email/password to login, or completes payment verification via external gateway.
*   **Flow**: Process queries **D1 (User Accounts)** to verify credentials and check subscription expiration timestamps. On payment success, updates user tier in database.
*   **Output**: Issues a JWT token indicating user tier (Free, Pro, Premium) to the client web browser.

### 2. Market Data Screening (2.0)
*   **Input**: Background APScheduler triggers request live feeds from **Yahoo Finance API**.
*   **Flow**: Process writes raw price points, indicators (RSI, MFI, SMA, EMA, MACD, 52W Range) into **D2 (Stocks DB)**. When a user queries custom screener formulas, the process queries **D2** and applies filter parameters.
*   **Output**: Renders filtered tables, tickers, and triggers user alerts.

### 3. virtual Paper Trading (3.0)
*   **Input**: User places a paper trade order.
*   **Flow**: Process reads current balance from **D3 (Trades DB)** to check affordability, registers transaction log, and computes average buy price and open position quantities.
*   **Output**: Renders real-time holdings and overall P&L charts.

### 4. Savings Optimizer & Financial Tracker (4.0)
*   **Input**: User inputs active savings milestones, monthly income/expense transactions, or insurance policy details.
*   **Flow**: Process writes records to **D4 (Savings, Expenses, & Insurance DB)**, updating the balance sheets.
*   **Output**: Renders progress visualizers, remaining budget balances, and premium renewal reminders in the UI dashboard.
