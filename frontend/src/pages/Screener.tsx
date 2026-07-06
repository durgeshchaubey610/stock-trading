import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpRight, 
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  X,
  Plus,
  Settings2,
  BarChart4,
  Target,
  Download,
  Zap,
  Gem,
  Award
} from 'lucide-react';
import type { Stock } from '../types';

interface FilterRule {
  field: string;
  operator: string;
  value: any;
  label: string;
  type?: string;
}

const AVAILABLE_METRICS = [
  { id: 'market_cap', label: 'Market Cap', type: 'number', category: 'Basic' },
  { id: 'close_price', label: 'Price', type: 'number', category: 'Basic' },
  { id: 'volume', label: 'Daily Volume', type: 'number', category: 'Basic' },
  { id: 'avg_volume_20d', label: 'Avg Volume (20D)', type: 'number', category: 'Basic' },
  { id: 'sub_sector', label: 'Sector', type: 'string', category: 'Basic' },
  { id: 'high_52_week', label: '52W High', type: 'number', category: 'Basic' },
  { id: 'low_52_week', label: '52W Low', type: 'number', category: 'Basic' },
  { id: 'range_progress', label: '52W Range %', type: 'number', category: 'Basic' },

  { id: 'pb_ratio', label: 'P/B Ratio', type: 'number', category: 'Valuation' },
  { id: 'dividend_yield', label: 'Div Yield %', type: 'number', category: 'Valuation' },
  { id: 'ev_to_ebitda', label: 'EV/EBITDA', type: 'number', category: 'Valuation' },
  { id: 'price_to_sales', label: 'P/S Ratio', type: 'number', category: 'Valuation' },
  { id: 'earnings_yield', label: 'Earnings Yield %', type: 'number', category: 'Valuation' },
  { id: 'fcf_yield', label: 'FCF Yield %', type: 'number', category: 'Valuation' },

  { id: 'rsi', label: 'RSI (14)', type: 'number', category: 'Technical' },
  { id: 'mfi', label: 'MFI (14)', type: 'number', category: 'Technical' },
  { id: 'adx', label: 'ADX (14)', type: 'number', category: 'Technical' },
  { id: 'roc', label: 'ROC', type: 'number', category: 'Technical' },
  { id: 'stoch_rsi', label: 'Stoch RSI', type: 'number', category: 'Technical' },
  { id: 'macd', label: 'MACD', type: 'number', category: 'Technical' },
  { id: 'atr14', label: 'ATR (14)', type: 'number', category: 'Technical' },

  { id: 'sma20', label: 'SMA 20', type: 'number', category: 'Moving Average' },
  { id: 'sma50', label: 'SMA 50', type: 'number', category: 'Moving Average' },
  { id: 'sma100', label: 'SMA 100', type: 'number', category: 'Moving Average' },
  { id: 'sma200', label: 'SMA 200', type: 'number', category: 'Moving Average' },
  { id: 'ema20', label: 'EMA 20', type: 'number', category: 'Moving Average' },
  { id: 'ema50', label: 'EMA 50', type: 'number', category: 'Moving Average' },
  { id: 'ema100', label: 'EMA 100', type: 'number', category: 'Moving Average' },
  { id: 'ema200', label: 'EMA 200', type: 'number', category: 'Moving Average' },

  { id: 'roce', label: 'ROCE %', type: 'number', category: 'Fundamental' },
  { id: 'debt_to_equity', label: 'Debt to Equity', type: 'number', category: 'Fundamental' },
  { id: 'current_ratio', label: 'Current Ratio', type: 'number', category: 'Fundamental' },
  { id: 'promoter_holding', label: 'Promoter %', type: 'number', category: 'Fundamental' },
  { id: 'fii_holding', label: 'FII %', type: 'number', category: 'Fundamental' },
  { id: 'dii_holding', label: 'DII %', type: 'number', category: 'Fundamental' },

  { id: 'revenue_growth_5y', label: '5Y Revenue Growth %', type: 'number', category: 'Growth' },
  { id: 'profit_growth_5y', label: '5Y Profit Growth %', type: 'number', category: 'Growth' },
  { id: 'ebitda_growth', label: 'EBITDA Growth %', type: 'number', category: 'Growth' },
  { id: 'cagr_3y', label: '3Y CAGR %', type: 'number', category: 'Growth' },

  { id: 'return_1w', label: '1W Return %', type: 'number', category: 'Performance' },
  { id: 'return_1m', label: '1M Return %', type: 'number', category: 'Performance' },
  { id: 'ytd_return', label: 'YTD Return %', type: 'number', category: 'Performance' },
  { id: 'alpha', label: 'Alpha (vs Market)', type: 'number', category: 'Performance' },
  { id: 'sharpe_ratio', label: 'Sharpe Ratio', type: 'number', category: 'Performance' },
  { id: 'max_drawdown', label: 'Max Drawdown %', type: 'number', category: 'Performance' },
  { id: 'beta', label: 'Beta', type: 'number', category: 'Performance' },
  { id: 'is_fno', label: 'F&O Stock', type: 'number', category: 'Special' },
];


const PREDEFINED_STRATEGIES = [
  {
    name: 'High Quality Value Gems',
    description: 'Promoter > 50%, FII > 5%, RSI > 69, Growth > 5%',
    filters: [
      { field: 'promoter_holding', operator: '>', value: '50', label: 'Promoter %', type: 'number' },
      { field: 'fii_holding', operator: '>', value: '5', label: 'FII %', type: 'number' },
      { field: 'rsi', operator: '>', value: '69', label: 'RSI (14)', type: 'number' },
      { field: 'mfi', operator: '>', value: '79', label: 'MFI (14)', type: 'number' },
      { field: 'forward_1y_growth', operator: '>', value: '5', label: 'Forward Growth %', type: 'number' },
    ]
  },
  {
    name: 'F&O Stocks',
    description: 'Stocks available in Derivatives segment',
    filters: [
      { field: 'is_fno', operator: '=', value: '1', label: 'F&O Stock', type: 'number' },
    ]
  },
  {
    name: 'Value Investing',
    description: 'Low P/E, High Dividend, Strong ROE',
    filters: [
      { field: 'pe_ratio', operator: '<', value: '20', label: 'P/E Ratio', type: 'number' },
      { field: 'dividend_yield', operator: '>', value: '2', label: 'Div Yield %', type: 'number' },
      { field: 'roe', operator: '>', value: '15', label: 'ROE %', type: 'number' },
    ]
  },
  {
    name: 'Growth Stocks',
    description: 'High Revenue & Profit Growth',
    filters: [
      { field: 'revenue_growth_5y', operator: '>', value: '20', label: '5Y Revenue Growth %', type: 'number' },
      { field: 'profit_growth_5y', operator: '>', value: '15', label: '5Y Profit Growth %', type: 'number' },
    ]
  },
  {
    name: 'Momentum Breakout',
    description: 'Strong RSI and Price Momentum',
    filters: [
      { field: 'rsi', operator: '>', value: '60', label: 'RSI (14)', type: 'number' },
      { field: 'return_1y', operator: '>', value: '30', label: '1Y Return %', type: 'number' },
    ]
  }
];

const Screener = () => {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([]);
  const [newFilterMetric, setNewFilterMetric] = useState(AVAILABLE_METRICS[0].id);
  const [newFilterOp, setNewFilterOp] = useState('>');
  const [newFilterVal, setNewFilterVal] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Default columns as requested
  const DEFAULT_COLUMNS = ['symbol', 'close_price', 'signal', 'market_cap', 'mfi', 'rsi', 'range_progress'];

  // Combine default columns with columns from active filters
  const activeColumns = Array.from(new Set([
    ...DEFAULT_COLUMNS,
    ...activeFilters.map(f => f.field)
  ]));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const buildFilters = () => {
    const rules: any[] = [];
    if (debouncedSearch) {
      rules.push({
        condition: 'OR',
        rules: [
          { field: 'symbol', operator: 'contains', value: debouncedSearch },
          { field: 'name', operator: 'contains', value: debouncedSearch }
        ]
      });
    }
    activeFilters.forEach(f => {
      rules.push({ field: f.field, operator: f.operator, value: f.type === 'number' ? parseFloat(f.value) : f.value });
    });
    return rules.length > 0 ? { condition: 'AND', rules } : null;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['stocks-screen', page, debouncedSearch, activeFilters, sortBy, sortOrder],
    queryFn: () => stockService.screenStocks({ 
      page, 
      page_size: pageSize, 
      filters: buildFilters(),
      sort_by: sortBy,
      sort_order: sortOrder
    }),
  });

  const stocks: Stock[] = data?.data?.stocks || [];
  const totalCount = data?.data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleAddFilter = () => {
    const metric = AVAILABLE_METRICS.find(m => m.id === newFilterMetric);
    if (!metric) return;
    setActiveFilters([...activeFilters, {
      field: newFilterMetric,
      operator: newFilterOp,
      value: newFilterVal,
      label: metric.label,
      type: metric.type
    }]);
    setNewFilterVal('');
    setPage(1);
  };

  const removeFilter = (index: number) => {
    const updated = [...activeFilters];
    updated.splice(index, 1);
    setActiveFilters(updated);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const exportToCSV = () => {
    if (stocks.length === 0) return;
    const headers = ['Symbol', 'Name', 'Price', 'Signal', 'Market Cap', 'MFI', 'RSI', '52W Low', '52W High', 'Sector'];
    const rows = stocks.map(s => [s.symbol, s.name, s.close_price, s.signal, s.market_cap, s.mfi, s.rsi, s.low_52_week, s.high_52_week, s.sub_sector]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `screener_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const formatCompact = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  };

  const getSignalColor = (signal: string | null) => {
    if (!signal) return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    switch (signal.toLowerCase()) {
      case 'strong buy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'buy': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'sale': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'strong sale': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const SortHeader = ({ label, field, center = false, className = "" }: { label: string, field: string, center?: boolean, className?: string }) => (
    <th className={`px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group ${center ? 'text-center' : ''} ${className}`} onClick={() => handleSort(field)}>
      <div className={`flex items-center gap-1 ${center ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortBy === field ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-50'}`} />
      </div>
    </th>
  );

  const renderCell = (stock: Stock, columnId: string) => {
    switch (columnId) {
      case 'symbol':
        return (
          <div className="flex flex-col min-w-[150px]">
            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{stock.symbol}</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[140px] font-medium">{stock.name}</span>
          </div>
        );
      case 'close_price':
        return (
          <div className="flex flex-col min-w-[100px]">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(stock.close_price)}</span>
            <span className={`text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${stock.return_1d && stock.return_1d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stock.return_1d && stock.return_1d >= 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
              {stock.return_1d?.toFixed(2)}%
            </span>
          </div>
        );
      case 'signal':
        return <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getSignalColor(stock.signal)}`}>{stock.signal || 'Neutral'}</span>;
      case 'market_cap':
        return (
          <div className="flex flex-col min-w-[100px]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{formatCompact(stock.market_cap)}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-tight truncate max-w-[80px]">{stock.sub_sector || 'General'}</span>
          </div>
        );
      case 'mfi':
        return (
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className={`text-[10px] font-black ${(stock.mfi || 0) > 80 ? 'text-rose-500' : (stock.mfi || 0) < 20 ? 'text-emerald-500' : 'text-slate-400'}`}>{stock.mfi?.toFixed(1) || '-'}</span>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
              <div className={`h-full ${(stock.mfi || 0) > 80 ? 'bg-rose-500' : (stock.mfi || 0) < 20 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stock.mfi || 0}%` }}></div>
            </div>
          </div>
        );
      case 'rsi':
        return (
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className={`text-[10px] font-black ${(stock.rsi || 0) > 70 ? 'text-rose-500' : (stock.rsi || 0) < 30 ? 'text-emerald-500' : 'text-slate-400'}`}>{stock.rsi?.toFixed(1) || '-'}</span>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
              <div className={`h-full ${(stock.rsi || 0) > 70 ? 'bg-rose-500' : (stock.rsi || 0) < 30 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${stock.rsi || 0}%` }}></div>
            </div>
          </div>
        );
      case 'range_progress':
        const rangeProgress = stock.low_52_week && stock.high_52_week && stock.high_52_week !== stock.low_52_week
          ? ((stock.close_price - stock.low_52_week) / (stock.high_52_week - stock.low_52_week)) * 100
          : 0;
        return (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <div className="flex justify-between text-[8px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
              <span>L: {formatCompact(stock.low_52_week)}</span>
              <span>H: {formatCompact(stock.high_52_week)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-20"></div>
              <div className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] relative z-10 transition-all duration-1000" style={{ width: `${rangeProgress}%` }}></div>
            </div>
            <span className="text-[9px] text-center font-bold text-blue-600 dark:text-blue-400">{rangeProgress.toFixed(1)}% of Range</span>
          </div>
        );
      default:
        const metric = AVAILABLE_METRICS.find(m => m.id === columnId);
        const value = (stock as any)[columnId];
        return (
          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {typeof value === 'number' ? (metric?.type === 'number' ? value.toFixed(2) : value) : (value || '-')}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all group cursor-default shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <TrendingUp className="text-blue-500 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Stocks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</h3>
            </div>
          </div>
        </div>
        <button onClick={() => { setActiveFilters([{ field: 'is_fno', operator: '=', value: '1', label: 'F&O Stock', type: 'number' }]); setPage(1); }} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all group text-left shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="text-emerald-500 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">FNO Candidates</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">100</h3>
            </div>
          </div>
        </button>
        <button onClick={() => { setActiveFilters(PREDEFINED_STRATEGIES[0].filters as any); setPage(1); }} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all group text-left shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <Gem className="text-amber-500 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Value Gems</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">High Quality</h3>
            </div>
          </div>
        </button>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all group cursor-default shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <Award className="text-purple-500 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI Signal</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Institutional</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 30% Width Filter Sidebar */}
        <aside className={`lg:w-[30%] space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-500" />
                Advanced Filters
              </h2>
              <button onClick={() => setActiveFilters([])} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Reset All</button>
            </div>
            {/* ... rest of filter logic ... */}
            <div className="space-y-3 mb-6">
              {activeFilters.map((filter, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-2 group">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{filter.label}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate">{filter.operator} {filter.value}</span>
                  </div>
                  <button onClick={() => removeFilter(idx)} className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {activeFilters.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No active filters.</p>}
            </div>
            <div className="space-y-4 mb-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Predefined Strategies</h3>
              <div className="grid grid-cols-1 gap-2">
                {PREDEFINED_STRATEGIES.map((strat, idx) => (
                  <button key={idx} onClick={() => { setActiveFilters(strat.filters as any); setPage(1); }} className="text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{strat.name}</span>
                      <Plus className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">{strat.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Select Metric</label>
                <select value={newFilterMetric} onChange={(e) => setNewFilterMetric(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  {Object.entries(AVAILABLE_METRICS.reduce((acc, curr) => { if (!acc[curr.category]) acc[curr.category] = []; acc[curr.category].push(curr); return acc; }, {} as Record<string, any[]>)
                  ).map(([category, metrics]) => (
                    <optgroup key={category} label={category}>
                      {metrics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Operator</label>
                  <select value={newFilterOp} onChange={(e) => setNewFilterOp(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value=">">{'>'}</option><option value="<">{'<'}</option><option value=">=">{'>='}</option><option value="<=">{'<='}</option><option value="=">{'='}</option><option value="contains">Contains</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Value</label>
                  <input type="text" value={newFilterVal} onChange={(e) => setNewFilterVal(e.target.value)} placeholder="e.g. 50" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
              <button onClick={handleAddFilter} disabled={!newFilterVal} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Add Filter
              </button>
            </div>
          </div>
        </aside>

        {/* 70% Width Screener Grid */}
        <div className="lg:w-[70%] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <header>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">Market Screener <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-lg">PRO</span></h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium"><Target className="h-3.5 w-3.5" /> Scanning {totalCount} institutional-grade securities</p>
            </header>
            <div className="flex items-center gap-3">
              <button onClick={exportToCSV} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500 transition-all shadow-sm" title="Export CSV"><Download className="h-5 w-5" /></button>
              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search stocks..." className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full sm:w-64 shadow-sm" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`lg:hidden p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}><Settings2 className="h-5 w-5" /></button>
            </div>
          </div>


          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">
                    {activeColumns.map(colId => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === colId);
                      return (
                        <SortHeader 
                          key={colId}
                          label={metric?.label || colId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
                          field={colId} 
                          center={['mfi', 'rsi'].includes(colId)}
                        />
                      );
                    })}
                    <th className="px-6 py-4 text-right text-slate-500 text-[10px] font-black uppercase tracking-widest sticky right-0 bg-slate-50 dark:bg-slate-800 z-10">Explore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {isLoading ? Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={activeColumns.length + 1} className="px-6 py-6">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-full"></div>
                      </td>
                    </tr>
                  )) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan={activeColumns.length + 1} className="px-6 py-32 text-center">
                        <BarChart4 className="h-16 w-16 text-slate-300 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">No matches found</h3>
                        <p className="text-slate-500 dark:text-slate-600 text-sm max-w-xs mx-auto mt-2 font-medium">Try relaxing your filter criteria or search for a different symbol.</p>
                        <button onClick={() => setActiveFilters([])} className="mt-6 text-blue-600 hover:text-blue-500 text-sm font-bold flex items-center gap-2 mx-auto">Clear all filters <X className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ) : stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group cursor-default">
                      {activeColumns.map(colId => (
                        <td key={colId} className="px-6 py-4">
                          {renderCell(stock, colId)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/30 z-10">
                        <Link to={`/stock/${stock.symbol}`} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white hover:scale-110 transition-all inline-block shadow-lg">
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination remains same ... */}
            {totalPages > 0 && (
              <div className="px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium font-medium">Showing <span className="text-slate-900 dark:text-white font-bold">{(page-1)*pageSize + 1}</span> to <span className="text-slate-900 dark:text-white font-bold">{Math.min(page*pageSize, totalCount)}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalCount}</span> institutional securities</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-20 transition-all shadow-sm"><ChevronLeft className="h-4 w-4" /></button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => { const pageNum = i + 1; return (<button key={pageNum} onClick={() => setPage(pageNum)} className={`h-10 w-10 rounded-xl text-xs font-black transition-all border ${page === pageNum ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500'}`}>{pageNum}</button>); })}
                    {totalPages > 3 && <span className="text-slate-400 px-1 font-black">...</span>}
                    {totalPages > 3 && (<button onClick={() => setPage(totalPages)} className={`h-10 w-10 rounded-xl text-xs font-black transition-all border ${page === totalPages ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-white'}`}>{totalPages}</button>)}
                  </div>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-20 transition-all shadow-sm"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Screener;
