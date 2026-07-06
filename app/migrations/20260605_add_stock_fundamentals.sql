-- Add fundamental indicators to stocks table
ALTER TABLE stocks ADD COLUMN debt_to_equity FLOAT DEFAULT 0.0 AFTER is_fno;
ALTER TABLE stocks ADD COLUMN roe FLOAT DEFAULT 0.0 AFTER debt_to_equity;
ALTER TABLE stocks ADD COLUMN roce FLOAT DEFAULT 0.0 AFTER roe;
