# Project Roadmap: AI-Powered Financial Independence (FIRE) Platform

This document serves as the single source of truth for the project lifecycle. Note that the project has transitioned from a general "Life Intelligence Platform" to a dedicated **AI-Powered Financial Independence (FIRE) Platform**. Non-financial modules (Health, Career, SOS) have been pruned/deferred to keep the scope tightly aligned with wealth management.

---

## Phase 1: Foundation (Status: Completed)
- [x] Basic FastAPI project structure.
- [x] Database models for Users, Stocks, and Portfolio.
- [x] Stock scanner engine with basic indicators (RSI, MA).
- [x] JWT Authentication.

## Phase 2: Enhanced Screener & Data (Status: Completed)
- [x] Integration with real-time stock price APIs (Yahoo Finance API).
- [x] Support for custom screener filters (P/E, Market Cap, Dividend Yield).
- [x] Advanced charting data endpoints (OHLCV time-series).
- [x] Sector-wise benchmarking.

## Phase 3: Advanced Portfolio Analytics (Status: Completed)
- [x] Unrealized and Realized P&L tracking.
- [x] Portfolio diversification visualization (Sector breakdown).
- [x] Performance benchmarking.

## Phase 4: Intelligence & Automation (Status: Completed)
- [x] Automated Daily AI signal generation (Technical + Sentiment).
- [x] Alert system (triggers on custom criteria).
- [x] Webhook support structure.

## Phase 5: Social & Community (Status: Completed)
- [x] Shared portfolio tracking structures.
- [x] Screener templates storage (`screener_templates` table).
- [x] Predefined expert strategies (*High Quality Value Gems* & *F&O Candidates*).

## Phase 6: Core UI Development (Status: Completed)
- [x] Frontend React/TypeScript skeleton.
- [x] Main Stock Screener interactive grid.
- [x] Login, Register, Profile, and Subscription views.
- [x] Multi-metric filter panel and dynamic column selection.
- [x] Recharts integration for price and financial trends.

## Phase 7: Subscription & Billing System (Status: Completed)
- [x] Database schemas for `subscription_plans` and `user_invoices`.
- [x] Tiered Access Control dependencies (`require_pro`, `require_premium`).
- [x] Simulated Google Pay/Razorpay billing checkout utilizing `docs/paynow.png`.
- [x] Registration promotion (1-month free Premium trial for first-time signups).

## Phase 8: Portfolio Module Streamlining (Status: Completed)
- [x] Refactored legacy 'Baskets' into 'Paper Trading Portfolio'.
- [x] Rebranded overall navigation to emphasize virtual trading.
- [x] Implemented dynamic sell recommendations ("Scale out X% since stock hit target").

## Phase 9: Global Design Standardization (Status: Completed)
- [x] Centralized width constraints in layout containers.
- [x] Implemented dark/light mode toggle with full contrast audit (resolving text visibility issues in day mode).

---

## Pruned / Deferred Modules (Deferred Out of Scope)
The following modules, which were part of the legacy "Life Intelligence" specification, have been **pruned and deferred** from the active codebase to focus exclusively on the core Financial Independence (FIRE) engine:
- [ ] **Personal & Family Health Intelligence** (Phases 18, 19, 31, 40, 41 - Deferred)
- [ ] **Career & Education Roadmap** (Phases 21, 23, 27, 33 - Deferred)
- [ ] **Emergency SOS AI** (Phase 24 - Deferred)
- [ ] **Personal AI Assistant (General lifestyle recommendations)** (Phase 28 - Re-scoped to AI Financial Coach)

---

## Phase 10: Wealth & Net Worth Dashboard (FIRE Command Center) (Status: Completed)
- [x] **Wealth & Net Worth Tracking Database Schemas**
  - Create database models for assets (Stocks, Mutual Funds, Gold, Real Estate, cash, pension funds EPF/PPF/NPS) and liabilities (Home/Car Loans, Credit Cards).
- [x] **FIRE Command Center API**
  - Implement `/finance/networth` endpoint consolidating user assets, liabilities, and current net worth.
- [x] **Interactive Net Worth Dashboard UI**
  - Design premium UI to visualize Net Worth = Assets - Liabilities with interactive charts showing asset allocation and liability breakdown.

## Phase 11: Financial Independence (FIRE) & Retirement Gap Planner (Status: Completed)
- [x] **Gap Analysis Logic & Scoring Engine**
  - Implement scoring engine to calculate:
    - **Financial Health Score** & **Protection Score** based on emergency funds and active insurance coverage.
    - **Retirement Readiness Score** calculating the retirement savings gap and necessary monthly SIP based on inflation.
    - **Financial Independence Score** calculating current progress % towards target FI Number (Annual Expenses × 25).
- [x] **Interactive Goal Planner UI**
  - Build frontend dashboard for creating and tracking life goals with monthly target trajectories and achievement probabilities.
- [x] **Interactive Wealth Projection Charts**
  - Show year-by-year projections (Best, Average, Worst case scenarios) for net worth growth with interactive slider controls.

## Phase 12: Alternative Asset Planning (Status: Completed)
- [x] **Alternative Protection Plan Models**
  - Build backend analysis to compare traditional insurance policies against alternative financial protection vehicles (Dividend portfolios, income funds).
- [x] **Alternative Assets UI**
  - Build comparison planner grid displaying cost, expected returns, risk levels, and liquidity details of alternative assets.


---

**Continuation Checkpoint**
* **Last Completed Task:** Net Worth Asset & Liability log manager implementation (adding and deleting active assets & liabilities).
* **Current Status:** Main frontend and backend apps compiling and running without errors.
* **Next Immediate Step:** Phase 13 - Advanced Stock Screener filters & AI Valuation engine.