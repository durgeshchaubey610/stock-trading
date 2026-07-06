# End-to-End Test Cases: Financial Independence (FIRE) Platform

This document outlines the test cases for verifying the core subsystems of the platform.

---

## 1. Authentication & User Management
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | User Registration | Success message, redirected to dashboard, 1-month Premium trial granted. | Pass |
| **AUTH-02** | User Login | Success, JWT token stored, user object contains subscription metadata. | Pass |
| **AUTH-03** | JWT Expiration | 401 response from API triggers redirect to `/login`. | Pass |
| **AUTH-04** | Protected Routes | Unauthenticated users redirected to `/login` when accessing `/` or `/profile`. | Pass |

## 2. Market Screener (Primary Hub)
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **SCR-01** | Hero Stats Rendering | Total Stocks shows dynamic count; F&O/Value Gems links filter list. | Pass |
| **SCR-02** | Stock Search | Searching for "RELIANCE" filters the list correctly. | Pass |
| **SCR-03** | Advanced Filtering | Adding custom indicator filters updates stock count and list. | Pass |
| **SCR-04** | Sorting | Clicking "Market Cap" header sorts list desc/asc correctly. | Pass |
| **SCR-05** | Pagination | Navigating between pages fetches the next/previous set of stocks. | Pass |
| **SCR-06** | CSV Export | Clicking export downloads a valid .csv file with visible results. | Pass |

## 3. Stock Detailed Analysis
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **DET-01** | Page Load | All data (Overview, Technicals, etc.) loaded for a valid symbol. | Pass |
| **DET-02** | Price Chart | Recharts AreaChart renders historical OHLCV data without errors. | Pass |
| **DET-03** | Financials Tab | BarChart shows Annual Revenue and Net Profit correctly. | Pass |
| **DET-04** | Peers Tab | Lists stocks in same sector; links to their detail pages. | Pass |
| **DET-05** | Buy/Sell Order | Modal shows available cash; submitting virtual order updates portfolio. | Pass |

## 4. Paper Trading Portfolio
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **PTP-01** | Portfolio Overview | Shows Available Cash, Invested Value, and Total P&L. | Pass |
| **PTP-02** | Position Logging | Successful buying of virtual quantity shows in Current Positions. | Pass |
| **PTP-03** | Watchlist | Adding stock to watchlist displays it in Watchlist grid. | Pass |
| **PTP-04** | Trade History | Completed mock orders show up in the History ledger with timestamps. | Pass |

## 5. Savings Goal Planner & Expense Tracker
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **FIN-01** | Savings Goals | Creating a goal with deadline shows a progress bar. Adding funds updates progress. | Pass |
| **FIN-02** | Expense Tracking | Logging monthly income/expenses updates summary reports and categories. | Pass |
| **FIN-03** | Insurance Planner | Entering active policies shows coverages, premiums, and renewal dates. | Pass |

## 6. Subscription & Billing
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **SUB-01** | Tier Gating | Premium features (e.g. detailed Insurance page) show upgrade prompt if tier is low. | Pass |
| **SUB-02** | Simulated Payment | Clicking "Pay Now" image triggers simulated Razorpay flow and updates tier. | Pass |
