# Project Activity Diagrams

This document outlines the core operational workflows of the AI Trading System using Mermaid activity diagrams.

## 1. User Registration & Authentication

This diagram shows the flow of a user registering a new account and subsequently logging in.

```mermaid
activityDiagram
    participant User
    participant AuthAPI
    participant Database

    User -> AuthAPI: Register (username, email, password)
    AuthAPI -> Database: Check if Email Exists
    alt Email Exists
        Database -> AuthAPI: Found
        AuthAPI -> User: Error (Email already registered)
    else Email Not Found
        Database -> AuthAPI: Not Found
        AuthAPI -> AuthAPI: Hash Password (bcrypt)
        AuthAPI -> Database: Save New User
        Database -> AuthAPI: Success
        AuthAPI -> User: Success (User Registered)
    end

    User -> AuthAPI: Login (email, password)
    AuthAPI -> Database: Get User by Email
    alt User Not Found
        Database -> AuthAPI: Empty
        AuthAPI -> User: Error (Invalid Credentials)
    else User Found
        Database -> AuthAPI: User Data
        AuthAPI -> AuthAPI: Verify Password
        alt Password Match
            AuthAPI -> AuthAPI: Generate JWT Token
            AuthAPI -> User: Success (Return Token & User Info)
        else Password Mismatch
            AuthAPI -> User: Error (Invalid Credentials)
        end
    end
```

## 2. Stock Scanning Workflow

This diagram illustrates how the `run_scanner` process identifies potential trading opportunities.

```mermaid
activityDiagram
    start
    :Fetch Nifty 500 Tickers;
    :Initialize ThreadPoolExecutor;
    fork
        :Fetch 1y Historical Data (yfinance);
        :Calculate Technical Indicators (ta);
        :Generate Trading Signals;
        if (At least 3 signals true?) then (yes)
            :Calculate Opportunity Score;
            :Add to Results;
        else (no)
            :Discard Stock;
        endif
    end fork
    :Sort Results by Score (Descending);
    stop
```

## 3. Weekly Strategy Execution (Low-52 Week)

This flow describes the logic within `Low52Strategy.execute`, which is called for each stock identified by the scanner.

```mermaid
activityDiagram
    start
    :Strategy Triggered (Manual or Scheduled);
    :Check Current Time;
    if (Hour < MARKET_BUY_TIME?) then (yes)
        :Skip (Wait for Market Close);
        stop
    else (no)
        :Fetch Last Purchase for Symbol;
        if (No Previous Purchase?) then (yes)
            :Set Quantity = BASE_BUY_QTY;
            :Set Buy Number = 1;
            :Execute NEW_BUY;
        else (yes)
            :Calculate Price Drop from Last Buy;
            if (Drop >= 5%?) then (yes)
                :Set Quantity = Last Quantity * 2;
                :Set Buy Number = Last Buy Number + 1;
                :Execute AVERAGING BUY;
            else (no)
                :HOLD (Price hasn't dropped enough);
                stop
            endif
        endif
        :Record Investment in Database;
        :Commit Transaction;
        stop
    endif
```

## 4. Automated Strategy Scheduler

This diagram shows the background process that executes user-selected strategies.

```mermaid
activityDiagram
    start
    :Scheduler Triggers (Daily at 15:05);
    :Fetch All Active User Strategies;
    :Perform Global Stock Scan;
    while (For each User/Strategy) is (Remaining)
        while (For each Scanned Stock) is (Remaining)
            :Execute Strategy Logic;
            if (Buy/Sell Signal Triggered?) then (yes)
                :Log Opportunity / Execute Trade;
            else (no)
                :Continue;
            endif
        endwhile (Next User)
    endwhile (Done)
    stop
```

## 5. Portfolio Management

How users interact with their holdings.

```mermaid
activityDiagram
    start
    :User Request (View/Add/Remove);
    if (Action == View) then
        :Query Database for User Portfolio;
        :Calculate Current Value / P&L;
        :Return Portfolio List;
    else if (Action == Add) then
        :Validate Stock Symbol;
        :Record Lot Purchase;
        :Update Database;
    else if (Action == Remove) then
        :Identify Specific Lot (Buy Number);
        :Validate Quantity;
        if (Quantity == Total?) then (yes)
            :Delete Entry;
        else (no)
            :Update Lot Quantity;
        endif
    endif
    stop
```
