import logging
from typing import List, Dict, Optional
import statistics

logger = logging.getLogger(__name__)

class SectorService:
    """
    Service for calculating sector-wise benchmarks and performance metrics.
    """
    
    @staticmethod
    def calculate_benchmarks(scan_results: List[dict]) -> Dict[str, dict]:
        """
        Aggregates data from scanner results to calculate sector benchmarks.
        """
        sector_data = {}
        
        for stock in scan_results:
            sector = stock.get("sector") or "Other"
            if sector not in sector_data:
                sector_data[sector] = {
                    "pe_ratios": [],
                    "rsi_values": [],
                    "dividend_yields": [],
                    "scores": [],
                    "stock_count": 0
                }
            
            data = sector_data[sector]
            data["stock_count"] += 1
            
            if stock.get("pe_ratio"):
                data["pe_ratios"].append(stock["pe_ratio"])
            if stock.get("rsi"):
                data["rsi_values"].append(stock["rsi"])
            if stock.get("dividend_yield"):
                data["dividend_yields"].append(stock["dividend_yield"])
            if stock.get("score"):
                data["scores"].append(stock["score"])
                
        benchmarks = {}
        for sector, metrics in sector_data.items():
            benchmarks[sector] = {
                "sector_name": sector,
                "stock_count": metrics["stock_count"],
                "avg_pe": statistics.mean(metrics["pe_ratios"]) if metrics["pe_ratios"] else None,
                "median_pe": statistics.median(metrics["pe_ratios"]) if metrics["pe_ratios"] else None,
                "avg_rsi": statistics.mean(metrics["rsi_values"]) if metrics["rsi_values"] else None,
                "avg_dividend_yield": statistics.mean(metrics["dividend_yields"]) if metrics["dividend_yields"] else 0,
                "avg_score": statistics.mean(metrics["scores"]) if metrics["scores"] else 0
            }
            
        return benchmarks

    @staticmethod
    def get_stock_comparison(stock_data: dict, sector_benchmarks: dict) -> dict:
        """
        Compares a single stock against its sector benchmark.
        """
        sector = stock_data.get("sector") or "Other"
        benchmark = sector_benchmarks.get(sector)
        
        if not benchmark:
            return {"message": "No benchmark data available for this sector"}
            
        comparison = {
            "symbol": stock_data["symbol"],
            "sector": sector,
            "metrics": []
        }
        
        # P/E Comparison
        if stock_data.get("pe_ratio") and benchmark["avg_pe"]:
            diff = ((stock_data["pe_ratio"] - benchmark["avg_pe"]) / benchmark["avg_pe"]) * 100
            comparison["metrics"].append({
                "name": "P/E Ratio",
                "value": stock_data["pe_ratio"],
                "sector_avg": benchmark["avg_pe"],
                "difference_pct": round(diff, 2),
                "status": "Overvalued" if diff > 10 else "Undervalued" if diff < -10 else "Fair"
            })
            
        # RSI Comparison
        if stock_data.get("rsi") and benchmark["avg_rsi"]:
            diff = stock_data["rsi"] - benchmark["avg_rsi"]
            comparison["metrics"].append({
                "name": "RSI",
                "value": stock_data["rsi"],
                "sector_avg": benchmark["avg_rsi"],
                "difference": round(diff, 2),
                "status": "Overbought" if stock_data["rsi"] > 70 else "Oversold" if stock_data["rsi"] < 30 else "Neutral"
            })
            
        return comparison
