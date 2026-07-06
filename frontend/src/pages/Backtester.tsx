import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { 
  Play, Plus, Trash2, TrendingUp, TrendingDown,
  ShieldCheck, Activity, Award,
  Loader2, AlertTriangle, Coins, Target, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface StrategyRule {
  indicator: string;      // "price" | "rsi" | "sma" | "ema"
  operator: string;       // "<" | ">" | "crosses_above" | "crosses_below"
  value: number;
  indicator_period: number;
}

const AVAILABLE_INDICATORS = [
  { id: 'price', label: 'Price (Close)', hasPeriod: false },
  { id: 'rsi', label: 'RSI (Relative Strength Index)', hasPeriod: true },
  { id: 'sma', label: 'SMA (Simple Moving Average)', hasPeriod: true },
  { id: 'ema', label: 'EMA (Exponential Moving Average)', hasPeriod: true },
];

const AVAILABLE_OPERATORS = [
  { id: '<', label: 'Less Than (<)' },
  { id: '>', label: 'Greater Than (>)' },
  { id: 'crosses_below', label: 'Crosses Below' },
  { id: 'crosses_above', label: 'Crosses Above' },
];

const Backtester: React.FC = () => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [period, setPeriod] = useState('1y');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [stopLossPct, setStopLossPct] = useState<number | undefined>(5);
  const [takeProfitPct, setTakeProfitPct] = useState<number | undefined>(15);

  const [buyRules, setBuyRules] = useState<StrategyRule[]>([
    { indicator: 'rsi', operator: '<', value: 30, indicator_period: 14 }
  ]);
  const [sellRules, setSellRules] = useState<StrategyRule[]>([
    { indicator: 'rsi', operator: '>', value: 70, indicator_period: 14 }
  ]);

  const addBuyRule = () => {
    setBuyRules([...buyRules, { indicator: 'rsi', operator: '<', value: 30, indicator_period: 14 }]);
  };

  const removeBuyRule = (idx: number) => {
    const updated = [...buyRules];
    updated.splice(idx, 1);
    setBuyRules(updated);
  };

  const addSellRule = () => {
    setSellRules([...sellRules, { indicator: 'rsi', operator: '>', value: 70, indicator_period: 14 }]);
  };

  const removeSellRule = (idx: number) => {
    const updated = [...sellRules];
    updated.splice(idx, 1);
    setSellRules(updated);
  };

  const updateRule = (
    type: 'buy' | 'sell', 
    idx: number, 
    field: keyof StrategyRule, 
    val: any
  ) => {
    const rules = type === 'buy' ? [...buyRules] : [...sellRules];
    rules[idx] = {
      ...rules[idx],
      [field]: field === 'value' || field === 'indicator_period' ? parseFloat(val) || 0 : val
    };
    if (type === 'buy') {
      setBuyRules(rules);
    } else {
      setSellRules(rules);
    }
  };

  // Run backtest mutation
  const backtestMutation = useMutation({
    mutationFn: (payload: any) => stockService.backtestStrategy(payload),
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to execute backtest simulation');
    }
  });

  const handleRunBacktest = () => {
    if (!symbol.trim()) {
      alert('Please enter a stock symbol');
      return;
    }
    if (buyRules.length === 0) {
      alert('Strategy must have at least one buy rule');
      return;
    }

    backtestMutation.mutate({
      symbol: symbol.toUpperCase().trim(),
      period,
      initial_capital: initialCapital,
      buy_rules: buyRules,
      sell_rules: sellRules,
      stop_loss_pct: stopLossPct || undefined,
      take_profit_pct: takeProfitPct || undefined
    });
  };

  const results = backtestMutation.data?.data;
  const summary = results?.summary;
  const trades = results?.trades || [];
  const dailyValues = results?.daily_values || [];

  // Normalize stock price to initial capital to render both lines on the same scale
  const chartData = useMemo(() => {
    if (!dailyValues || dailyValues.length === 0) return [];
    const stockStartPrice = dailyValues[0].stock_close || 1;
    return dailyValues.map((d: any) => ({
      ...d,
      stock_buy_hold: (d.stock_close / stockStartPrice) * initialCapital
    }));
  }, [dailyValues, initialCapital]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4 italic uppercase">
            <Activity className="h-10 w-10 text-blue-500" />
            Strategy Backtest Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Design proprietary strategies, validate rules on historical market data, and evaluate risk-adjusted returns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Strategy Customizer Builder Panel */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-500" />
              Strategy Parameters
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Asset Symbol</label>
                  <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                    placeholder="e.g. INFY, RELIANCE"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Capital (INR)</label>
                  <input 
                    type="number" 
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Period</label>
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="1mo">1 Month</option>
                    <option value="3mo">3 Months</option>
                    <option value="6mo">6 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="2y">2 Years</option>
                    <option value="5y">5 Years</option>
                    <option value="max">Max Period</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" title="Stop Loss %">Stop Loss %</label>
                    <input 
                      type="number" 
                      value={stopLossPct || ''}
                      onChange={(e) => setStopLossPct(parseFloat(e.target.value) || undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" title="Take Profit %">Take Profit %</label>
                    <input 
                      type="number" 
                      value={takeProfitPct || ''}
                      onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Rules Section */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Buy Entry Rules (AND)</h3>
                <button 
                  onClick={addBuyRule}
                  className="text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Buy Rule
                </button>
              </div>

              <div className="space-y-4">
                {buyRules.map((rule, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                    <button 
                      onClick={() => removeBuyRule(idx)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Indicator</label>
                        <select 
                          value={rule.indicator}
                          onChange={(e) => updateRule('buy', idx, 'indicator', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          {AVAILABLE_INDICATORS.map(ind => <option key={ind.id} value={ind.id}>{ind.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Operator</label>
                        <select 
                          value={rule.operator}
                          onChange={(e) => updateRule('buy', idx, 'operator', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          {AVAILABLE_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Threshold Value</label>
                        <input 
                          type="number" 
                          value={rule.value}
                          onChange={(e) => updateRule('buy', idx, 'value', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      {AVAILABLE_INDICATORS.find(ind => ind.id === rule.indicator)?.hasPeriod && (
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Indicator Period</label>
                          <input 
                            type="number" 
                            value={rule.indicator_period}
                            onChange={(e) => updateRule('buy', idx, 'indicator_period', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Rules Section */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Sell Exit Rules (AND)</h3>
                <button 
                  onClick={addSellRule}
                  className="text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Sell Rule
                </button>
              </div>

              <div className="space-y-4">
                {sellRules.map((rule, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                    <button 
                      onClick={() => removeSellRule(idx)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Indicator</label>
                        <select 
                          value={rule.indicator}
                          onChange={(e) => updateRule('sell', idx, 'indicator', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          {AVAILABLE_INDICATORS.map(ind => <option key={ind.id} value={ind.id}>{ind.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Operator</label>
                        <select 
                          value={rule.operator}
                          onChange={(e) => updateRule('sell', idx, 'operator', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          {AVAILABLE_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Threshold Value</label>
                        <input 
                          type="number" 
                          value={rule.value}
                          onChange={(e) => updateRule('sell', idx, 'value', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      {AVAILABLE_INDICATORS.find(ind => ind.id === rule.indicator)?.hasPeriod && (
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Indicator Period</label>
                          <input 
                            type="number" 
                            value={rule.indicator_period}
                            onChange={(e) => updateRule('sell', idx, 'indicator_period', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button 
              onClick={handleRunBacktest}
              disabled={backtestMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-8"
            >
              {backtestMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Running Simulation...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" /> Run Backtest
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right Simulation Analytics Panel */}
        <section className="lg:col-span-7 space-y-6">
          {!results && !backtestMutation.isPending && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 text-center shadow-sm">
              <Target className="h-16 w-16 text-slate-300 dark:text-slate-800 mx-auto mb-6 opacity-60" />
              <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">STUDIO IDLE</h3>
              <p className="text-slate-500 dark:text-slate-600 text-sm max-w-sm mx-auto mt-2">
                Configure your indicators, entry parameters, and exits in the left panel, and click "Run Backtest" to begin the simulation.
              </p>
            </div>
          )}

          {backtestMutation.isPending && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-32 text-center shadow-sm flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Simulating historical trades...</p>
            </div>
          )}

          {results && !backtestMutation.isPending && (
            <>
              {/* Backtesting Performance Summary Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Strategy Return</p>
                  <p className={`text-2xl font-black ${summary.strategy_return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {summary.strategy_return >= 0 ? '+' : ''}{summary.strategy_return}%
                  </p>
                  <p className="text-[9px] text-slate-500 mt-2">Final: {formatCurrency(summary.final_value)}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Buy & Hold Return</p>
                  <p className={`text-2xl font-black ${summary.benchmark_return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {summary.benchmark_return >= 0 ? '+' : ''}{summary.benchmark_return}%
                  </p>
                  <p className="text-[9px] text-slate-500 mt-2">Market Benchmark</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Alpha (Outperformance)</p>
                  <p className={`text-2xl font-black ${summary.alpha >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                    {summary.alpha >= 0 ? '+' : ''}{summary.alpha}%
                  </p>
                  <p className="text-[9px] text-slate-500 mt-2">Excess vs Market</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sharpe Ratio</p>
                  <p className={`text-2xl font-black ${summary.sharpe_ratio >= 1.5 ? 'text-emerald-500' : summary.sharpe_ratio >= 1 ? 'text-blue-500' : 'text-slate-300'}`}>
                    {summary.sharpe_ratio}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-2">Risk Adjusted Return</p>
                </div>
              </div>

              {/* Drawdown & Volatility Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-250 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Max Drawdown</span>
                    <span className="text-base font-black text-rose-500 mt-1 block">-{summary.max_drawdown}%</span>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-rose-500 opacity-60" />
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-250 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Annual Volatility</span>
                    <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{summary.volatility}%</span>
                  </div>
                  <Award className="h-5 w-5 text-purple-500 opacity-60" />
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-250 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Trades / Win Rate</span>
                    <span className="text-base font-black text-emerald-500 mt-1 block">{summary.total_trades} ({summary.win_rate}%)</span>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-500 opacity-60" />
                </div>
              </div>

              {/* Strategy Returns Graph */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6">Historical Equity Curves</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-805" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                      <Legend />
                      <Area type="monotone" dataKey="portfolio_value" name="My Strategy" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStrategy)" />
                      <Area type="monotone" dataKey="stock_buy_hold" name="Stock Buy & Hold" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorHold)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Executed Trades Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Executed Simulation Trades ({trades.length})</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-955 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">PnL %</th>
                        <th className="px-6 py-4 text-right">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {trades.map((t: any, idx: number) => {
                        const isBuy = t.action === 'BUY';
                        return (
                          <tr key={idx} className="hover:bg-slate-55 dark:hover:bg-slate-800/20">
                            <td className="px-6 py-3.5 text-slate-500 font-mono flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {t.date}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isBuy ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                                {t.action}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-bold">{formatCurrency(t.price)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{t.quantity}</td>
                            <td className="px-6 py-3.5">
                              {!isBuy ? (
                                <span className={`font-bold flex items-center gap-0.5 ${t.pnl_percentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {t.pnl_percentage >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {t.pnl_percentage}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-3.5 text-right text-slate-400 font-medium italic">{t.reason || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Backtester;
