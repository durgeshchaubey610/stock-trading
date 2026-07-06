# Project Activity Diagrams

This document outlines the core operational workflows of the AI-Powered Financial Independence (FIRE) Platform using standard Mermaid diagrams.

---

## 1. User Registration & Login Workflow

This diagram illustrates the sequence of actions when a user registers a new account and subsequently logs in.

```mermaid
sequenceDiagram
    actor User
    participant AuthAPI as Auth & Billing API
    participant DB as MySQL Database

    %% Registration
    User->>AuthAPI: Register (username, email, password, DOB)
    AuthAPI->>DB: Check if Email exists
    alt Email exists
        DB-->>AuthAPI: User exists
        AuthAPI-->>User: Error: Email already registered
    else Email is unique
        DB-->>AuthAPI: Available
        AuthAPI->>AuthAPI: Hash Password (bcrypt)
        AuthAPI->>DB: Insert User with 1-Month Premium trial
        DB-->>AuthAPI: Success
        AuthAPI-->>User: Success: Account created
    end

    %% Login
    User->>AuthAPI: Login (email, password)
    AuthAPI->>DB: Query User by Email
    alt User not found
        DB-->>AuthAPI: None
        AuthAPI-->>User: Error: Invalid Credentials
    else User found
        DB-->>AuthAPI: User details (Hashed password, subscription status)
        AuthAPI->>AuthAPI: Verify password match
        alt Password Match
            AuthAPI->>AuthAPI: Generate JWT Token (with user_id, username, subscription_tier)
            AuthAPI-->>User: Success (Return JWT token)
        else Password Mismatch
            AuthAPI-->>User: Error: Invalid Credentials
        end
    end
```

---

## 2. Stock Scanner & Indicators Workflow

This flow illustrates how background schedulers fetch stock data and how users query the Screener.

```mermaid
flowchart TD
    Start([Background Scheduler Triggered]) --> GetStocks[Fetch Stock Symbols from DB]
    GetStocks --> LoopStocks{For each stock symbol}
    LoopStocks -- "Fetch Price & Financials" --> FetchYF[Query Yahoo Finance API]
    FetchYF --> CalcIndicators[Calculate RSI, MFI, SMA, EMA, MACD, 52W Range]
    CalcIndicators --> DBUpdate[Write stats to stocks and stock_details tables]
    DBUpdate --> LoopStocks
    
    %% User Query Path
    UserScreener([User opens Screener /]) --> FilterQuery[User applies custom filters e.g. MFI > 70]
    FilterQuery --> DBSearch[Query database stocks table]
    DBSearch --> RenderGrid[Render matching stocks and Daily AI Picks Ticker]
```

---

## 3. Paper Trading Order Execution Workflow

This diagram traces the execution and balance checks for virtual transactions.

```mermaid
flowchart TD
    Start([User triggers virtual Order]) --> CaptureDetails[Capture Symbol, Qty, Action, Price]
    CaptureDetails --> FetchPortfolio[Retrieve available_cash from paper_portfolios]
    FetchPortfolio --> CheckAction{Action Type?}
    
    %% Buy Order Flow
    CheckAction -- BUY --> CheckCash{available_cash >= Qty * Price?}
    CheckCash -- No --> FailBuy[Abort: Insufficient cash balance]
    CheckCash -- Yes --> DeductCash[Deduct total cost from available_cash]
    DeductCash --> CheckPosition{Existing position for Symbol?}
    CheckPosition -- Yes --> AveragePrice[Recalculate avg_buy_price & add Quantity]
    CheckPosition -- No --> CreatePosition[Insert new row in paper_positions]
    AveragePrice --> LogTrade[Log Trade details in paper_trades]
    CreatePosition --> LogTrade
    
    %% Sell Order Flow
    CheckAction -- SELL --> CheckHoldings{Do we own Position Qty >= Order Qty?}
    CheckHoldings -- No --> FailSell[Abort: Insufficient quantity in holdings]
    CheckHoldings -- Yes --> CreditCash[Credit sale revenue to available_cash]
    CreditCash --> SubtractQty[Reduce paper_positions quantity]
    SubtractQty --> CheckZero{Remaining Qty == 0?}
    CheckZero -- Yes --> DeletePosition[Remove position row from DB]
    CheckZero -- No --> LogTrade
    DeletePosition --> LogTrade
    
    LogTrade --> UpdateUI([Refresh Holdings Grid and current P&L in UI])
```
