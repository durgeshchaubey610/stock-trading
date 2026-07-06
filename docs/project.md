# Project Vision: AI-Powered Personal Financial Independence (FIRE) Platform

Position the platform as an **AI-Powered Personal Financial Independence (FIRE) Platform** that consolidates wealth management, budget planning, and investment research to guide users toward financial freedom.

---

## 1. Core Platform Modules

The platform is focused entirely on wealth tracking, stock analytics, and financial planning:

### Wealth Management & Stock Screener
*   **Stock Screener**: Real-time filters and metrics (Market Cap, P/E, P/B, Debt/Equity, Promoter Holdings, etc.).
*   **Technical Indicators**: Integrated RSI, MFI, SMA, EMA, MACD, and 52W range analytics.
*   **Curated Baskets**: Predefined expert screens like *High Quality Value Gems* and *F&O Candidates*.
*   **Daily AI Picks**: High-visibility ticker banner highlighting AI-generated swing trade signals.

### Paper Trading Portfolio
*   **Virtual Portfolio**: Sandbox environment showing Invested Value, Current Value, cash balances, and overall P&L.
*   **Holdings & Watchlist**: Live tracking of positions and custom watchlists.
*   **Transaction Auditing**: Simulated buy/sell executions with average price recalculation and trade history logs.
*   **Smart Sale Recommendations**: Auto-triggered suggestions to scale out when a stock hits its target or shows bearish momentum at a 52W high.

### Savings Optimizer & Budget Tracker
*   **Income & Expense Tracking**: Real-time logging of financial inflows and outflows with category-wise breakdown charts.
*   **Goal Planner**: Set milestones (Emergency Fund, House Purchase, etc.) with automated progress tracking and deadlines.
*   **Insurance Registry**: Log active health/life insurance coverage details, track premiums, and schedule renewal alerts.

### FIRE & Retirement Planner (Upcoming)
*   **Financial Independence Score**: Tracking current progress % towards target FI Number (Annual Expenses × 25).
*   **Retirement Gap Analyzer**: Calculate required monthly SIP allocations to offset inflation and achieve retirement goals.
*   **Wealth Projection Charts**: Year-by-year simulations mapping Best, Average, and Worst-case growth curves.
*   **Alternative Protection Planning**: Direct cost/benefit analysis comparing traditional insurance against dividend portfolios, agricultural assets, and rental options.

### AI Financial Coach (Upcoming)
*   **Task Engine**: Dynamically logs priorities based on user balance sheets (e.g., "Priority 1: Top up Emergency Fund").
*   **Correlation Engine**: Highlights links between spending habits and progress toward FI.
*   **Gamified FI Roadmap**: Lock/unlock levels from *Financial Foundation* (Level 1) to *Financial Independence Achieved* (Level 7) to incentivize healthy financial behavior.

---

## 2. Subscription & Pricing Tiers

The application implements a premium model with tiered gates enforced by backend middleware (`require_pro`, `require_premium` dependencies):

### Free Plan
*   Basic stock screening.
*   Basic budget and transaction logging.
*   Single active savings goal.

### Pro Plan (₹299 / Month)
*   Advanced stock screener filters.
*   Virtual Paper Trading sandbox.
*   Daily AI Pick recommendations.

### Premium Plan (₹999 / Month)
*   Insurance policy optimization tools.
*   Advanced FIRE / Retirement Gap planners.
*   AI Financial Coach interactive widget.
*   *Promotion*: First-time registered users automatically receive a **1-month trial** with full Premium access.

### Payment Integration
*   Simulated payment gateway flow.
*   Supports Razorpay and Google Pay mocks using the billing checkout interface (`docs/paynow.png`).
