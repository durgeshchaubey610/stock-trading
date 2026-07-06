-- Phase 14: Institutional-Grade Screening Metrics & Automation

-- 1. Update stocks table with missing institutional metrics
ALTER TABLE stocks
ADD COLUMN return_1d FLOAT AFTER book_value,
ADD COLUMN return_1w FLOAT AFTER return_1d,
ADD COLUMN return_1m FLOAT AFTER return_1w,
ADD COLUMN return_1y FLOAT AFTER return_1m,
ADD COLUMN volatility FLOAT AFTER return_1y,
ADD COLUMN sharpe_ratio FLOAT AFTER volatility,
ADD COLUMN fcf_yield FLOAT AFTER sharpe_ratio,
ADD COLUMN promoter_pledge_pct FLOAT AFTER fcf_yield;

-- 2. Update stock_scores table
ALTER TABLE stock_scores
ADD COLUMN ownership_score INT AFTER risk_score;
