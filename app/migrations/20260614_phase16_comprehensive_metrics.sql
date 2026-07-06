-- Phase 16: Comprehensive Metric Filter Expansion
-- Add new columns to the stocks table for institutional-grade screening

ALTER TABLE stocks ADD COLUMN sma100 FLOAT;
ALTER TABLE stocks ADD COLUMN ema100 FLOAT;
ALTER TABLE stocks ADD COLUMN ema200 FLOAT;
ALTER TABLE stocks ADD COLUMN roc FLOAT;
ALTER TABLE stocks ADD COLUMN stoch_rsi FLOAT;
ALTER TABLE stocks ADD COLUMN earnings_yield FLOAT;
ALTER TABLE stocks ADD COLUMN cagr_3y FLOAT;
ALTER TABLE stocks ADD COLUMN ytd_return FLOAT;
ALTER TABLE stocks ADD COLUMN max_drawdown FLOAT;
ALTER TABLE stocks ADD COLUMN alpha FLOAT;
