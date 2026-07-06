# Activity Workflows

This document visualizes the runtime workflows and activity logs of key operations within the application.

---

## 1. User Registration & Onboarding Lifecycle

Shows the flow when a new user registers an account and sets up their initial access.

```mermaid
stateDiagram-v2
    [*] --> RegisterAccount : "User enters Username, Email, Password"
    RegisterAccount --> CreateDatabaseRow : "Hash password and insert into users table"
    CreateDatabaseRow --> GrantPremiumTrial : "Set is_premium=True, subscription_tier='premium', duration=1 Month"
    GrantPremiumTrial --> IssueAuthToken : "Generate JWT Token"
    IssueAuthToken --> LoadAppDashboard : "Redirect to Dashboard (/) & load user profile"
    LoadAppDashboard --> [*] : "Onboarding Completed"
```

---

## 2. Paper Trading Order Lifecycle

Traces the execution of a virtual order placed by a user in the Paper Trading panel.

```mermaid
flowchart TD
    Start([User triggers virtual trade order]) --> Input[Capture Symbol, Qty, Action, Price]
    Input --> FetchPortfolio[Retrieve PaperPortfolio balance]
    FetchPortfolio --> CheckAction{Action type?}
    
    CheckAction -- BUY --> CheckBalance{Balance >= Qty * Price?}
    CheckBalance -- No --> Fail[Abort trade & show Insufficient Funds error]
    CheckBalance -- Yes --> Deduct[Deduct cash balance from portfolio]
    Deduct --> OpenPosition{Existing Position for Symbol?}
    OpenPosition -- Yes --> AverageBuy[Recalculate Average Buy Price & add Qty]
    OpenPosition -- No --> NewPosition[Create new Position record]
    
    CheckAction -- SELL --> CheckQty{Position Qty >= Order Qty?}
    CheckQty -- No --> FailQty[Abort trade & show Insufficient Quantity error]
    CheckQty -- Yes --> AddCash[Credit cash balance to portfolio]
    AddCash --> SubtractQty[Reduce position quantity]
    SubtractQty --> CheckZero{Remaining Qty == 0?}
    CheckZero -- Yes --> DeletePosition[Remove Position record]
    CheckZero -- No --> LogTrade[Log PaperTrade audit record]
    
    AverageBuy --> LogTrade
    NewPosition --> LogTrade
    DeletePosition --> LogTrade
    LogTrade --> Finish([Update UI holdings grid])
```

---

## 3. Financial Goal Planner & Expense Tracker Workflow

Documents the flow of user transactions, savings goal allocation, and summary updates in the Finance subsystem.

```mermaid
flowchart TD
    Start([User opens Finance & Planning tab]) --> TabSelector{Choose tab}
    
    TabSelector -- "Savings Goals" --> CreateGoal[User fills New Savings Goal modal]
    CreateGoal --> DBGoal[Insert row in savings_goals table]
    DBGoal --> UIGoal[Render Goal Progress Bar in UI]
    UIGoal --> AddFunds[User clicks 'Add Funds']
    AddFunds --> InputAmount[User enters cash amount]
    InputAmount --> UpdateGoal[Update current_amount in DB]
    UpdateGoal --> RecalculateProgress[Update progress percentage in UI]
    
    TabSelector -- "Expense Tracker" --> LogTx[User clicks Log Transaction]
    LogTx --> TxInput[Enter Amount, Type, Category, Date, Description]
    TxInput --> DBSave[Insert row in expense_logs table]
    DBSave --> FetchSummary[Trigger API to fetch /expenses/summary]
    FetchSummary --> UpdateCharts[Update Net Worth / Expense charts in UI]
```
