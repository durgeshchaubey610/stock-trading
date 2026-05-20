-- Portfolio lot integrity constraints for row identity.
-- Review existing data before running unique index creation.

CREATE INDEX ix_portfolio_user_symbol ON portfolio (user_id, stock_symbol);

CREATE UNIQUE INDEX uq_portfolio_user_symbol_buy_number
    ON portfolio (user_id, stock_symbol, buy_number);
