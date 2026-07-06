import logging
from sqlalchemy.orm import Session
from app.models.stock import Stock
from app.models.stock_details import StockScores
import numpy as np

logger = logging.getLogger(__name__)

class ScoringService:
    @staticmethod
    def calculate_and_save_scores(db: Session, stock: Stock):
        """
        Calculates proprietary scores (0-100) based on various fundamental and technical metrics.
        """
        try:
            # 1. Quality Score (ROE, ROCE, Debt/Equity, Margins)
            quality_score = ScoringService._calculate_quality_score(stock)
            
            # 2. Growth Score (Revenue Growth, EPS Growth)
            growth_score = ScoringService._calculate_growth_score(stock)
            
            # 3. Value Score (PE, PB, PEG, Dividend Yield)
            value_score = ScoringService._calculate_value_score(stock)
            
            # 4. Momentum Score (RSI, MFI, Price vs MAs)
            momentum_score = ScoringService._calculate_momentum_score(stock)
            
            # 5. Risk Score (Beta, Debt/Equity, Volatility)
            risk_score = ScoringService._calculate_risk_score(stock)
            
            # 6. Ownership Score (Promoter, FII, DII Holdings)
            ownership_score = ScoringService._calculate_ownership_score(stock)
            
            # 7. Fundamental Score (Average of Quality, Growth, Value)
            fundamental_score = int((quality_score + growth_score + value_score) / 3)
            
            # 8. Overall Score (Weighted average)
            # Value(30%), Growth(30%), Technical(20%), Ownership(20%)
            overall_score = int(
                (value_score * 0.3) + 
                (growth_score * 0.3) + 
                (momentum_score * 0.2) + 
                (ownership_score * 0.2)
            )
            
            # Save to DB
            scores = db.query(StockScores).filter(StockScores.stock_id == stock.id).first()
            if not scores:
                scores = StockScores(stock_id=stock.id)
                db.add(scores)
            
            scores.quality_score = quality_score
            scores.growth_score = growth_score
            scores.value_score = value_score
            scores.momentum_score = momentum_score
            scores.risk_score = risk_score
            scores.ownership_score = ownership_score
            scores.fundamental_score = fundamental_score
            scores.overall_score = overall_score
            scores.intrinsic_value_score = ScoringService._calculate_intrinsic_score(stock)
            
            return scores
            
        except Exception as e:
            logger.error(f"Error calculating scores for {stock.symbol}: {e}")
            return None

    @staticmethod
    def _calculate_ownership_score(stock):
        # Promoter (0-50 pts), FII+DII (0-50 pts)
        score = 0
        if stock.promoter_holding:
            score += min(max(stock.promoter_holding, 0), 50)
        
        inst_holding = (stock.fii_holding or 0) + (stock.dii_holding or 0)
        score += min(max(inst_holding * 2, 0), 50) # 25% inst = 50 pts
        
        return int(min(score, 100))

    @staticmethod
    def _calculate_quality_score(stock):
        # ROE (0-40 pts), ROCE (0-40 pts), Debt/Equity (0-20 pts)
        score = 0
        if stock.roe:
            score += min(max(stock.roe * 2, 0), 40)
        if stock.roce:
            score += min(max(stock.roce * 2, 0), 40)
        if stock.debt_to_equity is not None:
            score += max(20 - (stock.debt_to_equity * 10), 0)
        return int(min(score, 100))

    @staticmethod
    def _calculate_growth_score(stock):
        # Rev Growth (0-50 pts), EPS Growth (0-50 pts)
        score = 0
        if stock.revenue_growth_5y:
            score += min(max(stock.revenue_growth_5y * 2, 0), 50)
        elif stock.revenue_growth_3y:
            score += min(max(stock.revenue_growth_3y * 2, 0), 50)
            
        if stock.profit_growth_5y:
            score += min(max(stock.profit_growth_5y * 2, 0), 50)
        return int(min(score, 100))

    @staticmethod
    def _calculate_value_score(stock):
        # PE (0-40 pts), PB (0-30 pts), Div Yield (0-30 pts)
        score = 0
        if stock.pe_ratio and stock.pe_ratio > 0:
            score += max(40 - (stock.pe_ratio / 2), 0)
        if stock.pb_ratio and stock.pb_ratio > 0:
            score += max(30 - (stock.pb_ratio * 3), 0)
        if stock.dividend_yield:
            score += min(stock.dividend_yield * 5, 30)
        return int(min(score, 100))

    @staticmethod
    def _calculate_momentum_score(stock):
        # RSI (0-50 pts), Distance from SMA50 (0-50 pts)
        score = 0
        if stock.rsi:
            # Optimal RSI for momentum is 50-70
            if 50 <= stock.rsi <= 75:
                score += 50
            elif stock.rsi > 75:
                score += 30 # Overbought
            else:
                score += max(stock.rsi - 20, 0)
                
        if stock.sma50 and stock.close_price:
            perf = (stock.close_price / stock.sma50 - 1) * 100
            score += min(max(perf * 2, 0), 50)
            
        return int(min(score, 100))

    @staticmethod
    def _calculate_risk_score(stock):
        # Beta (0-50 pts), Debt (0-50 pts)
        score = 0
        if stock.beta:
            score += min(max(stock.beta * 20, 0), 50) # High beta = high risk
        if stock.debt_to_equity:
            score += min(max(stock.debt_to_equity * 20, 0), 50)
        return int(min(score, 100))

    @staticmethod
    def _calculate_intrinsic_score(stock):
        # Simplified intrinsic value check (Market Cap vs Enterprise Value vs Cash)
        if not stock.enterprise_value or not stock.market_cap:
            return 50
        ratio = stock.enterprise_value / stock.market_cap
        if ratio < 1: return 80 # Undervalued (High cash)
        if ratio < 1.2: return 60
        return 40
