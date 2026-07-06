import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { 
  TrendingUp, TrendingDown, Activity, 
  ArrowLeft, ShieldCheck, Zap, Info, 
  Loader2, Target, ShoppingCart, MinusCircle, 
  PlusCircle, X, Scale, Percent, Search, Briefcase,
  AlertCircle, BarChart, Maximize2, Minimize2,
  Eye, EyeOff
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, PieChart, Pie, Cell, Legend, BarChart as RechartsBarChart, Bar,
  ComposedChart, Line, ReferenceLine
} from 'recharts';
import type { Stock, PaperPortfolio } from '../types';
import Modal from '../components/common/Modal';

// Indicator calculation helper
const calculateIndicators = (data: any[], period: number = 14): any[] => {
  if (!data || data.length === 0) return [];
  
  const result = data.map(d => {
    const open = d.open || d.close || 0;
    const close = d.close || 0;
    const high = d.high || d.close || 0;
    const low = d.low || d.close || 0;
    const isBullish = close >= open;
    return {
      ...d,
      open,
      close,
      high,
      low,
      lowHigh: [low, high],
      openClose: open === close ? [open - 0.01, close + 0.01] : [open, close],
      isBullish
    };
  });

  // Calculate RSI
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < result.length; i++) {
    if (i === 0) {
      result[i].rsi = 50;
      continue;
    }

    const difference = result[i].close - result[i - 1].close;
    const gain = difference > 0 ? difference : 0;
    const loss = difference < 0 ? -difference : 0;

    if (i < period) {
      avgGain += gain;
      avgLoss += loss;
      result[i].rsi = 50;
      if (i === period - 1) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result[i].rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[i].rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    }
  }

  // Calculate MFI
  const typicalPrices = result.map(d => (d.high + d.low + d.close) / 3);
  const rawMoneyFlows = result.map((d, i) => typicalPrices[i] * d.volume);

  for (let i = 0; i < result.length; i++) {
    if (i < period) {
      result[i].mfi = 50;
      continue;
    }

    let posFlow = 0;
    let negFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      if (j === 0) continue;
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        posFlow += rawMoneyFlows[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negFlow += rawMoneyFlows[j];
      }
    }

    const mfr = negFlow === 0 ? 100 : posFlow / negFlow;
    result[i].mfi = negFlow === 0 ? 100 : 100 - 100 / (1 + mfr);
  }

  return result;
};

const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [chartPeriod, setChartPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState('Overview');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [orderType, setOrderType] = useState('Market');
  const queryClient = useQueryClient();

  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'line' | 'candle'>('area');
  const [showRSI, setShowRSI] = useState(false);
  const [showMFI, setShowMFI] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = !!document.fullscreenElement;
      if (!isNativeFullscreen && isChartFullscreen) {
        setIsChartFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isChartFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error(err));
        } else {
          setIsChartFullscreen(false);
        }
      }
    };
    if (isChartFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isChartFullscreen]);

  const enterFullscreen = async () => {
    setIsChartFullscreen(true);
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  };

  const exitFullscreen = async () => {
    setIsChartFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  };

  // Modal state for alerts
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => stockService.getStockDetail(symbol!),
    enabled: !!symbol,
  });

  const { data: chartDataResponse, isLoading: chartLoading } = useQuery({
    queryKey: ['stockChart', symbol, chartPeriod],
    queryFn: () => stockService.getStockChart(symbol!, chartPeriod),
    enabled: !!symbol,
  });

  const { data: financialDataResponse, isLoading: financialsLoading } = useQuery({
    queryKey: ['stockFinancials', symbol],
    queryFn: () => stockService.getStockFinancials(symbol!),
    enabled: !!symbol,
  });

  const { data: peersDataResponse, isLoading: peersLoading } = useQuery({
    queryKey: ['stockPeers', symbol],
    queryFn: () => stockService.getStockPeers(symbol!),
    enabled: !!symbol,
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['paperPortfolio'],
    queryFn: () => stockService.getPaperPortfolio(),
  });

  const stock: Stock = stockData?.data;
  const portfolio: PaperPortfolio = portfolioData?.data;
  const historicalPriceData = chartDataResponse?.data?.data || [];
  const historicalFinancials = financialDataResponse?.data || [];
  const enhancedChartData = useMemo(() => {
    return calculateIndicators(historicalPriceData);
  }, [historicalPriceData]);

  useEffect(() => {
    if (stock) {
      document.title = `${stock.name} | StockTrader`;
    }
  }, [stock]);

  const tradeMutation = useMutation({
    mutationFn: (data: { symbol: string; quantity: number; price: number; order_type: string; action: string }) => 
      stockService.placePaperOrder(data),
    onSuccess: () => {
      setIsTradeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['paperPortfolio'] });
      showAlert("Success", `${tradeAction} order executed successfully!`, "success");
    },
    onError: (error: any) => {
      showAlert("Error", error.response?.data?.detail || "Trade failed", "error");
    }
  });

  const { data: watchlistResponse } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => stockService.getWatchlist(),
  });

  const watchlist = watchlistResponse?.data || [];
  const isWatched = useMemo(() => {
    return watchlist.some((s: any) => s.symbol === symbol);
  }, [watchlist, symbol]);

  const [watchlistMutating, setWatchlistMutating] = useState(false);

  const handleWatchlistToggle = async () => {
    setWatchlistMutating(true);
    try {
      if (isWatched) {
        await stockService.removeFromWatchlist(symbol!);
        showAlert("Success", `${symbol} removed from watchlist`, "success");
      } else {
        await stockService.addToWatchlist(symbol!);
        showAlert("Success", `${symbol} added to watchlist`, "success");
      }
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    } catch (err: any) {
      console.error(err);
      showAlert("Error", err.response?.data?.detail || "Watchlist update failed", "error");
    } finally {
      setWatchlistMutating(false);
    }
  };

  if (stockLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">Analyzing {symbol} market data...</p>
    </div>
  );

  if (!stock) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
      <AlertCircle className="h-16 w-12 text-slate-700 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Data Unavailable</h2>
      <Link to="/screener" className="text-blue-500 mt-4 flex items-center gap-2 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Return to Screener
      </Link>
    </div>
  );

  const formatCurrency = (val: number | undefined) => val ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val) : '-';
  const formatCompact = (val: number | undefined) => val ? new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(val) : '-';

  const formatXAxisTick = (tickVal: string) => {
    if (!tickVal) return '';
    if (tickVal.includes(' ')) {
      const [date, time] = tickVal.split(' ');
      if (chartPeriod === '1d') {
        return time.substring(0, 5);
      }
      const dateObj = new Date(date);
      const month = dateObj.toLocaleString('en-US', { month: 'short' });
      const day = dateObj.getDate();
      return `${month} ${day} ${time.substring(0, 5)}`;
    }
    try {
      const dateObj = new Date(tickVal);
      if (chartPeriod === '1y' || chartPeriod === '5y' || chartPeriod === 'max') {
        return dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }
      return dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return tickVal;
    }
  };

  const ScoreCard = ({ label, score, max = 100, description }: { label: string, score: number, max?: number, description?: string }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-lg font-black ${score > 70 ? 'text-emerald-500' : score > 40 ? 'text-amber-500' : 'text-rose-500'}`}>{score}/{max}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${score > 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${(score/max)*100}%` }}></div>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{description || 'Proprietary metric based on historical performance and fundamental health.'}</p>
    </div>
  );

  const InfoRow = ({ label, value, subValue, icon: Icon }: { label: string, value: string | number, subValue?: string, icon?: any }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
        {subValue && <p className="text-[10px] text-slate-500 font-bold">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* 1. Top Header Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-8 bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stock.name}</h1>
            <span className="text-xl font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">{stock.symbol}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Sector:</span>
              <span className="text-blue-500 font-medium">{stock.sub_sector || 'Technology'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Market Cap:</span>
              <span className="text-slate-700 dark:text-slate-200">₹{formatCompact(stock.market_cap)}</span>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${stock.signal?.includes('Buy') ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/30 text-rose-500 bg-rose-500/5'}`}>
              AI RATING: {stock.signal || 'NEUTRAL'}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 min-w-[300px]">
          <div className="text-right">
            <p className="text-5xl font-black text-slate-900 dark:text-white">{formatCurrency(stock.close_price)}</p>
            <p className={`text-sm font-bold flex items-center justify-end gap-1 ${stock.oi_change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stock.oi_change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stock.oi_change || 0).toFixed(2)}% Today
            </p>
          </div>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => { setTradeAction('BUY'); setIsTradeModalOpen(true); }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 group"
            >
              <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" /> BUY
            </button>
            <button 
              onClick={() => { setTradeAction('SELL'); setIsTradeModalOpen(true); }}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 group"
            >
              <MinusCircle className="h-5 w-5 group-hover:scale-110 transition-transform" /> SELL
            </button>
          </div>
          <button 
            onClick={handleWatchlistToggle}
            disabled={watchlistMutating}
            className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {isWatched ? <EyeOff className="h-5 w-5 text-rose-500" /> : <Eye className="h-5 w-5 text-blue-500" />}
            {isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-10 overflow-x-auto no-scrollbar">
        {['Overview', 'Financials', 'Ownership', 'Technicals', 'Forecast', 'Peers'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>}
          </button>
        ))}
      </div>

      {/* 3. Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'Overview' && (
            <>
              {/* Checklist scorecard grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <ScoreCard label="Valuation" score={stock.scores?.value_score || 0} description="PE and PB ratios compared to sector average." />
                <ScoreCard label="Quality" score={stock.scores?.quality_score || 0} description="ROE and ROCE health over 5 years." />
                <ScoreCard label="Growth" score={stock.scores?.growth_score || 0} description="Revenue and EBITDA forward projections." />
                <ScoreCard label="Momemtum" score={stock.scores?.momentum_score || 0} description="Price trend and RSI strength index." />
              </div>

              {/* Price Action Summary */}
              <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                      <BarChart className="h-6 w-6 text-blue-500" /> Price Performance
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                      {/* Chart Type Selector */}
                      <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                        {['Area', 'Line', 'Candles'].map(type => (
                          <button 
                            key={type} 
                            onClick={() => setChartType(type.toLowerCase() === 'candles' ? 'candle' : type.toLowerCase() as any)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${((chartType === 'candle' && type === 'Candles') || chartType === type.toLowerCase()) ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          > 
                            {type} 
                          </button>
                        ))}
                      </div>
                      
                      {/* Period Selector */}
                      <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                        {['1D', '1W', '1M', '1Y', '5Y', 'MAX'].map(p => (
                          <button 
                            key={p} 
                            onClick={() => setChartPeriod(p.toLowerCase())}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${chartPeriod === p.toLowerCase() ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          > 
                            {p} 
                          </button>
                        ))}
                      </div>
                      
                      {/* Fullscreen Button */}
                      <button 
                        onClick={enterFullscreen}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all border border-slate-100 dark:border-slate-700/50"
                        title="Fullscreen Chart"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Indicator Toggles */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="uppercase tracking-widest text-[9px] font-black text-slate-400 dark:text-slate-500">Technical Studies:</span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white select-none transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showRSI} 
                        onChange={e => setShowRSI(e.target.checked)} 
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-transparent" 
                      />
                      RSI (14)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white select-none transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showMFI} 
                        onChange={e => setShowMFI(e.target.checked)} 
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-transparent" 
                      />
                      MFI (14)
                    </label>
                  </div>
                </div>

                <div className="space-y-6 w-full">
                  {chartLoading ? (
                    <div className="h-[400px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                  ) : (
                    <>
                      {/* Main Price Chart */}
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                          <ComposedChart data={enhancedChartData} barGap="-100%">
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} hide={showRSI || showMFI} tickFormatter={formatXAxisTick} />
                            <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#64748b' }} />
                            
                            {chartType === 'area' && (
                              <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                            )}
                            {chartType === 'line' && (
                              <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} dot={false} />
                            )}
                            {chartType === 'candle' && (
                              <>
                                <Bar dataKey="lowHigh" barSize={1.5}>
                                  {enhancedChartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.isBullish ? '#10b981' : '#ef4444'} stroke={entry.isBullish ? '#10b981' : '#ef4444'} />
                                  ))}
                                </Bar>
                                <Bar dataKey="openClose" barSize={8}>
                                  {enhancedChartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.isBullish ? '#10b981' : '#ef4444'} stroke={entry.isBullish ? '#10b981' : '#ef4444'} />
                                  ))}
                                </Bar>
                              </>
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* RSI Indicator Chart */}
                      {showRSI && (
                        <div className="h-[120px] w-full pt-2 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center px-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-purple-500 tracking-wider">RSI (14)</span>
                            <span className="text-[10px] font-bold text-slate-500">Overbought: 70 | Oversold: 30</span>
                          </div>
                          <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={100}>
                            <ComposedChart data={enhancedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-900" vertical={false} />
                              <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} hide={showMFI} tickFormatter={formatXAxisTick} />
                              <YAxis stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[30, 50, 70]} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#64748b' }} />
                              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '70', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30', fill: '#10b981', fontSize: 8, position: 'right' }} />
                              <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />
                              <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} name="RSI" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* MFI Indicator Chart */}
                      {showMFI && (
                        <div className="h-[120px] w-full pt-2 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center px-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">MFI (14)</span>
                            <span className="text-[10px] font-bold text-slate-500">Overbought: 80 | Oversold: 20</span>
                          </div>
                          <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={100}>
                            <ComposedChart data={enhancedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-900" vertical={false} />
                              <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatXAxisTick} />
                              <YAxis stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[20, 50, 80]} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#64748b' }} />
                              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '80', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                              <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" label={{ value: '20', fill: '#10b981', fontSize: 8, position: 'right' }} />
                              <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />
                              <Line type="monotone" dataKey="mfi" stroke="#f59e0b" strokeWidth={2} dot={false} name="MFI" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Key Stats Overview */}
              <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter">Key Fundamental Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                   <div>
                     <InfoRow label="P/E Ratio" value={stock.pe_ratio?.toFixed(2) || '-'} subValue={`Sector: 24.5`} icon={Activity} />
                     <InfoRow label="P/B Ratio" value={stock.pb_ratio?.toFixed(2) || '-'} subValue="Price to Book Value" icon={Scale} />
                     <InfoRow label="Dividend Yield" value={`${stock.dividend_yield?.toFixed(2)}%`} icon={Percent} />
                     <InfoRow label="Market Cap" value={`₹${formatCompact(stock.market_cap)}`} subValue="Total Value" icon={Briefcase} />
                   </div>
                   <div>
                     <InfoRow label="ROE" value={`${stock.roe?.toFixed(2)}%`} subValue="Return on Equity" icon={TrendingUp} />
                     <InfoRow label="ROCE" value={`${stock.roce?.toFixed(2)}%`} subValue="Return on Capital" icon={Zap} />
                     <InfoRow label="Face Value" value={stock.face_value || '10.0'} icon={Info} />
                     <InfoRow label="Book Value" value={formatCurrency(stock.book_value)} icon={Info} />
                   </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'Financials' && (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Income Statement (Annual)</h3>
               <div className="h-[400px]">
                  {financialsLoading ? (
                    <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                      <RechartsBarChart data={historicalFinancials}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(val) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(val)}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                          formatter={(value: any) => `₹${new Intl.NumberFormat('en-IN').format(value)}`}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="net_income" fill="#10b981" name="Net Profit" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div><p className="text-[10px] font-black text-slate-500 uppercase">ROE</p><p className="text-lg font-black text-slate-900 dark:text-white">{stock.roe?.toFixed(1)}%</p></div>
                  <div><p className="text-[10px] font-black text-slate-500 uppercase">ROCE</p><p className="text-lg font-black text-slate-900 dark:text-white">{stock.roce?.toFixed(1)}%</p></div>
                  <div><p className="text-[10px] font-black text-slate-500 uppercase">EBITDA Margin</p><p className="text-lg font-black text-slate-900 dark:text-white">{stock.ebitda_margin?.toFixed(1)}%</p></div>
                  <div><p className="text-[10px] font-black text-slate-500 uppercase">Debt/Equity</p><p className={`text-lg font-black ${stock.debt_to_equity < 1 ? 'text-emerald-500' : 'text-rose-500'}`}>{stock.debt_to_equity?.toFixed(2)}</p></div>
               </div>
             </div>
          )}

          {activeTab === 'Ownership' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Shareholding Pattern</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Promoters', value: stock.promoter_holding || 45 },
                            { name: 'FII', value: stock.fii_holding || 20 },
                            { name: 'DII', value: stock.dii_holding || 15 },
                            { name: 'Retail', value: stock.retail_holding || 20 }
                          ]}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6366f1" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Promoter Holding</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{stock.promoter_holding?.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${stock.promoter_holding}%` }}></div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">FII Holding</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{stock.fii_holding?.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${stock.fii_holding}%` }}></div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">DII Holding</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{stock.dii_holding?.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${stock.dii_holding}%` }}></div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Retail & Others</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{stock.retail_holding?.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${stock.retail_holding}%` }}></div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Technicals' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Technical Indicators</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Moving Averages</h4>
                    <InfoRow label="SMA (20)" value={stock.sma20?.toFixed(2)} subValue={stock.close_price > (stock.sma20 || 0) ? 'BULLISH' : 'BEARISH'} />
                    <InfoRow label="SMA (50)" value={stock.sma50?.toFixed(2)} subValue={stock.close_price > (stock.sma50 || 0) ? 'BULLISH' : 'BEARISH'} />
                    <InfoRow label="SMA (200)" value={stock.sma200?.toFixed(2)} subValue={stock.close_price > (stock.sma200 || 0) ? 'BULLISH' : 'BEARISH'} />
                    <InfoRow label="EMA (20)" value={stock.ema20?.toFixed(2)} />
                    <InfoRow label="EMA (50)" value={stock.ema50?.toFixed(2)} />
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Oscillators & Momentum</h4>
                    <InfoRow label="RSI (14)" value={stock.rsi?.toFixed(2)} subValue={(stock.rsi || 0) > 70 ? 'OVERBOUGHT' : (stock.rsi || 0) < 30 ? 'OVERSOLD' : 'NEUTRAL'} />
                    <InfoRow label="MFI (14)" value={stock.mfi?.toFixed(2)} />
                    <InfoRow label="MACD" value={stock.macd?.toFixed(2)} subValue={`Signal: ${stock.macd_signal?.toFixed(2)}`} />
                    <InfoRow label="ADX (14)" value={stock.adx?.toFixed(2)} subValue={(stock.adx || 0) > 25 ? 'STRONG TREND' : 'WEAK TREND'} />
                    <InfoRow label="ATR (14)" value={stock.atr14?.toFixed(2)} subValue="Volatility Index" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Forecast' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Analyst Ratings & 1Y Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Buy Percentage</p>
                    <p className="text-4xl font-black text-emerald-500">{stock.forecasts?.[0]?.buy_pct || 85}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Based on {stock.forecasts?.[0]?.analyst_count || 32} analysts</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Average Target</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(stock.forecasts?.[0]?.target_mean)}</p>
                    <p className="text-xs text-emerald-500 mt-2">+{stock.forecasts?.[0]?.upside_pct?.toFixed(1)}% Upside</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Consensus</p>
                    <p className="text-2xl font-black text-blue-500 uppercase tracking-widest mt-2">{stock.forecasts?.[0]?.consensus_rating?.replace('_', ' ') || 'Strong Buy'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">1-Year Future Estimates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                   <div>
                     <InfoRow label="Estimated Revenue" value={`₹${formatCompact(stock.forecasts?.[0]?.rev_estimate)}`} subValue="1Y Forward Projection" icon={TrendingUp} />
                     <InfoRow label="Estimated EBITDA" value={`₹${formatCompact(stock.forecasts?.[0]?.ebitda_estimate)}`} subValue="Projected Core Earnings" icon={Activity} />
                   </div>
                   <div>
                     <InfoRow label="Estimated EPS" value={`₹${stock.forecasts?.[0]?.eps_estimate?.toFixed(2) || '-'}`} subValue="Earnings Per Share" icon={Target} />
                     <InfoRow label="Estimated Net Profit" value={`₹${formatCompact(stock.forecasts?.[0]?.profit_estimate)}`} subValue="Bottom Line Forecast" icon={ShieldCheck} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Peers' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Sector Peers Comparison</h3>
               {peersLoading ? (
                 <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Cap</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">P/E</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ROE</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Signal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {peersDataResponse?.data?.map((peer: Stock) => (
                          <tr key={peer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-5">
                              <Link to={`/stock/${peer.symbol}`} className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">{peer.name}</span>
                                <span className="text-[10px] font-bold text-slate-500">{peer.symbol}</span>
                              </Link>
                            </td>
                            <td className="py-5 text-sm font-bold text-slate-600 dark:text-slate-300">₹{formatCompact(peer.market_cap)}</td>
                            <td className="py-5 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(peer.close_price)}</td>
                            <td className="py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{peer.pe_ratio?.toFixed(1) || '-'}</td>
                            <td className="py-5 text-sm font-bold text-emerald-500">{peer.roe?.toFixed(1)}%</td>
                            <td className="py-5 text-right">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${peer.signal?.includes('Buy') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {peer.signal || 'NEUTRAL'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* 4. Sidebar Section */}
        <div className="lg:col-span-4 space-y-8">
           <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-500" /> Analyst Views
              </h3>
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center mb-6 shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Target Price</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(stock.target_price || stock.close_price * 1.15)}</p>
                <p className="text-xs font-bold text-emerald-500 mt-2">+{stock.upside_pct?.toFixed(1) || '14.5'}% Expected Upside</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Strong Buy</span>
                  <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '45%' }}></div></div>
                  <span className="text-slate-900 dark:text-white font-black">45%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Buy</span>
                  <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: '30%' }}></div></div>
                  <span className="text-slate-900 dark:text-white font-black">30%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Hold</span>
                  <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: '15%' }}></div></div>
                  <span className="text-slate-900 dark:text-white font-black">15%</span>
                </div>
              </div>
           </section>

           <section className="bg-blue-600/10 rounded-3xl p-8 border border-blue-500/20 shadow-sm">
              <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 mb-4 uppercase tracking-tighter flex items-center gap-2">
                <Zap className="h-5 w-5 fill-blue-600 dark:fill-blue-400" /> AI Insights
              </h3>
              <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed mb-6 font-medium">
                Based on current technical indicators and fundamental trends, this stock shows <strong>Strong Bullish</strong> momentum. Institutional buying (FII) has increased by 1.2% in the last quarter.
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" /> Bullish: Volume Spike Detected
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                    <TrendingDown className="h-4 w-4" /> Risk: Increasing Debt/Equity
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* 5. Trade Modal */}
      {isTradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                   {tradeAction === 'BUY' ? <TrendingUp className="text-emerald-500 h-6 w-6" /> : <TrendingDown className="text-rose-500 h-6 w-6" />}
                   {tradeAction} {stock.symbol}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tracking-widest">Available Funds: {formatCurrency(portfolio?.available_cash)}</p>
              </div>
              <button onClick={() => setIsTradeModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Type</label>
                    <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                       <option>Market</option>
                       <option>Limit</option>
                       <option>Stop Loss</option>
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-inner">
                      <button onClick={() => setTradeQuantity(q => Math.max(1, q - 1))} className="p-3 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-xl transition-all shadow-sm"><MinusCircle className="h-5 w-5" /></button>
                      <input type="number" value={tradeQuantity} onChange={e => setTradeQuantity(parseInt(e.target.value) || 1)} className="bg-transparent text-slate-900 dark:text-white text-xl font-black text-center w-full focus:outline-none" />
                      <button onClick={() => setTradeQuantity(q => q + 1)} className="p-3 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-xl transition-all shadow-sm"><PlusCircle className="h-5 w-5" /></button>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8 px-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimated Value</span>
                    <p className="text-xs text-slate-500 mt-1 font-medium">@ {formatCurrency(stock.close_price)} / share</p>
                  </div>
                  <span className="text-4xl font-black text-blue-600">{formatCurrency(stock.close_price * tradeQuantity)}</span>
                </div>
                
                <button 
                  onClick={() => tradeMutation.mutate({ symbol: stock.symbol, quantity: tradeQuantity, price: (stock.close_price || 0), order_type: orderType, action: tradeAction })}
                  disabled={tradeMutation.isPending}
                  className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                    tradeAction === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                  } text-white disabled:opacity-50`}
                >
                  {tradeMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <>EXECUTE {tradeAction} ORDER</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Chart Overlay */}
      {isChartFullscreen && (
        <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col p-6 sm:p-10 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-slate-800">
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stock.name}</h2>
                <span className="text-sm font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg">{stock.symbol}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-black text-white">{formatCurrency(stock.close_price)}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${stock.oi_change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.oi_change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stock.oi_change || 0).toFixed(2)}% Today
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              {/* Studies checkboxes */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showRSI} 
                    onChange={e => setShowRSI(e.target.checked)} 
                    className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5" 
                  />
                  RSI
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showMFI} 
                    onChange={e => setShowMFI(e.target.checked)} 
                    className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5" 
                  />
                  MFI
                </label>
              </div>

              {/* Chart type */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['Area', 'Line', 'Candles'].map(type => (
                  <button 
                    key={type} 
                    onClick={() => setChartType(type.toLowerCase() === 'candles' ? 'candle' : type.toLowerCase() as any)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${((chartType === 'candle' && type === 'Candles') || chartType === type.toLowerCase()) ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  > 
                    {type} 
                  </button>
                ))}
              </div>

              {/* Timeframe */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['1D', '1W', '1M', '1Y', '5Y', 'MAX'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setChartPeriod(p.toLowerCase())}
                    className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${chartPeriod === p.toLowerCase() ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  > 
                    {p} 
                  </button>
                ))}
              </div>
              
              {/* Close */}
              <button 
                onClick={exitFullscreen} 
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3 rounded-xl text-slate-400 hover:text-white transition-all"
                title="Exit Fullscreen"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Charts Container */}
          <div className="flex-grow flex flex-col gap-6 w-full min-h-0">
            {chartLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Main Price Chart */}
                <div className="flex-[3] w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                    <ComposedChart data={enhancedChartData} barGap="-100%">
                      <defs>
                        <linearGradient id="colorPriceFullscreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} hide={showRSI || showMFI} tickFormatter={formatXAxisTick} />
                      <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} 
                        itemStyle={{ color: '#f8fafc' }} 
                        labelStyle={{ color: '#94a3b8' }} 
                      />
                      {chartType === 'area' && (
                        <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPriceFullscreen)" />
                      )}
                      {chartType === 'line' && (
                        <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      )}
                      {chartType === 'candle' && (
                        <>
                          <Bar dataKey="lowHigh" barSize={1.5}>
                            {enhancedChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.isBullish ? '#10b981' : '#ef4444'} stroke={entry.isBullish ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                          <Bar dataKey="openClose" barSize={8}>
                            {enhancedChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.isBullish ? '#10b981' : '#ef4444'} stroke={entry.isBullish ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* RSI Study */}
                {showRSI && (
                  <div className="flex-1 w-full min-h-[120px] pt-4 border-t border-slate-900 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">RSI (14)</span>
                      <span className="text-[10px] font-bold text-slate-500">Overbought: 70 | Oversold: 30</span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={100}>
                      <ComposedChart data={enhancedChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} hide={showMFI} tickFormatter={formatXAxisTick} />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[30, 50, 70]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} 
                          itemStyle={{ color: '#f8fafc' }} 
                          labelStyle={{ color: '#94a3b8' }} 
                        />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '70', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30', fill: '#10b981', fontSize: 8, position: 'right' }} />
                        <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Line type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={2.5} dot={false} name="RSI" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* MFI Study */}
                {showMFI && (
                  <div className="flex-1 w-full min-h-[120px] pt-4 border-t border-slate-900 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">MFI (14)</span>
                      <span className="text-[10px] font-bold text-slate-500">Overbought: 80 | Oversold: 20</span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={100}>
                      <ComposedChart data={enhancedChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatXAxisTick} />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[20, 50, 80]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} 
                          itemStyle={{ color: '#f8fafc' }} 
                          labelStyle={{ color: '#94a3b8' }} 
                        />
                        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '80', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                        <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" label={{ value: '20', fill: '#10b981', fontSize: 8, position: 'right' }} />
                        <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Line type="monotone" dataKey="mfi" stroke="#fbbf24" strokeWidth={2.5} dot={false} name="MFI" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
