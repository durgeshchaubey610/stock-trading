import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/api';
import type { Portfolio, Stock } from '../types';
import { 
  Loader2,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart as PieChartIcon,
  Search,
  Zap,
  UserCheck,
  BarChart3,
  History,
  Eye,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

type TabType = 'overview' | 'holdings' | 'watchlist' | 'history' | 'analytics';

const Baskets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const queryClient = useQueryClient();
  const [newWatchlistSymbol, setNewWatchlistSymbol] = useState('');
  const [addingWatchlist, setAddingWatchlist] = useState(false);

  const handleAddToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistSymbol.trim()) return;
    setAddingWatchlist(true);
    try {
      await stockService.addToWatchlist(newWatchlistSymbol.toUpperCase().trim());
      setNewWatchlistSymbol('');
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to add stock to watchlist');
    } finally {
      setAddingWatchlist(false);
    }
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      await stockService.removeFromWatchlist(symbol);
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to remove stock from watchlist');
    }
  };

  const { data: portfolioDataResponse, isLoading: portfolioLoading } = useQuery({
    queryKey: ['paperPortfolio'],
    queryFn: () => stockService.getPaperPortfolio(),
  });

  const { data: historyResponse } = useQuery({
    queryKey: ['tradeHistory'],
    queryFn: () => stockService.getPaperTradeHistory(),
    enabled: activeTab === 'history'
  });

  const { data: watchlistResponse } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => stockService.getWatchlist(),
    enabled: activeTab === 'watchlist'
  });

  const portfolio: Portfolio = portfolioDataResponse?.data;
  const tradeHistory = historyResponse?.data || [];
  const watchlist: Stock[] = watchlistResponse?.data || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Briefcase },
    { id: 'holdings', name: 'Holdings', icon: Activity },
    { id: 'watchlist', name: 'Watchlist', icon: Eye },
    { id: 'history', name: 'Trade History', icon: History },
    { id: 'analytics', name: 'Performance', icon: PieChartIcon },
  ];

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  if (portfolioLoading && activeTab === 'overview') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Portfolio...</p>
        </div>
     );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4 italic uppercase">
            <Target className="h-10 w-10 text-blue-500" />
            Institutional Portfolio
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Monitor virtual performance, track alpha, and optimize your institutional-grade strategy.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Cash</p>
                <p className="text-2xl font-black text-emerald-500">{formatCurrency(portfolio?.summary.available_cash || 0)}</p>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">
                Find Signals
            </Link>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-800 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white dark:bg-slate-900'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-600'}`} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="space-y-10">
             {/* Summary Cards */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <UserCheck className="h-32 w-32 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center gap-4 mb-8">
                         <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <Briefcase className="h-8 w-8 text-white" />
                         </div>
                         <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Master Dashboard</h2>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status: </span>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Pro Tier</span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Net Worth</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(portfolio?.summary.current_value || 0)}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Invested</p>
                            <p className="text-3xl font-black text-slate-700 dark:text-slate-300">{formatCurrency(portfolio?.summary.total_buy_cost || 0)}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Returns</p>
                            <div className="flex items-baseline gap-2">
                              <p className={`text-3xl font-black ${portfolio?.summary.total_pnl && portfolio.summary.total_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {portfolio?.summary.total_pnl && portfolio.summary.total_pnl >= 0 ? '+' : ''}{formatCurrency(portfolio?.summary.total_pnl || 0)}
                              </p>
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Index Beat (Alpha)</p>
                            <div className="flex items-baseline gap-2">
                              <p className={`text-3xl font-black ${portfolio?.summary.benchmarking.alpha && portfolio.summary.benchmarking.alpha >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                                {portfolio?.summary.benchmarking.alpha && portfolio.summary.benchmarking.alpha >= 0 ? '+' : ''}{portfolio?.summary.benchmarking.alpha || '0'}%
                              </p>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl">
                       <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" /> AI Optimization
                       </h3>
                       <div className="space-y-6">
                          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Realized P&L</span>
                                <span className={`${(portfolio?.summary.realized_pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-black text-sm`}>{formatCurrency(portfolio?.summary.realized_pnl || 0)}</span>
                             </div>
                             <p className="text-[10px] text-slate-500 leading-relaxed italic">Cumulative profit booked from closed positions.</p>
                          </div>
                          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Diversification</span>
                                <span className="text-blue-500 font-black text-sm">Optimal</span>
                             </div>
                             <p className="text-[10px] text-slate-500 leading-relaxed italic">Balanced exposure across {portfolio ? Object.keys(portfolio.diversification.sector).length : 0} industries.</p>
                          </div>
                       </div>
                    </div>
             </div>

             {/* Recent Activity Mini Table */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Top Holdings Performance</h3>
                    <Link to="/baskets?tab=holdings" onClick={() => setActiveTab('holdings')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">View All Positions</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-950/50 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            <tr>
                                <th className="px-8 py-4">Symbol</th>
                                <th className="px-8 py-4">Returns</th>
                                <th className="px-8 py-4">Weightage</th>
                                <th className="px-8 py-4 text-right">Analysis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {portfolio?.holdings.slice(0, 5).map((h) => (
                                <tr key={h.symbol} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all">
                                    <td className="px-8 py-4 font-black text-slate-900 dark:text-white text-sm">{h.symbol}</td>
                                    <td className={`px-8 py-4 font-black text-xs ${h.pnl_percentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{h.pnl_percentage}%</td>
                                    <td className="px-8 py-4">
                                        <div className="w-24 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${(h.current_value / portfolio.summary.current_value) * 100}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <Link to={`/stock/${h.symbol}`} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all inline-block"><ArrowUpRight className="h-3.5 w-3.5" /></Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'holdings' && (
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Current Portfolio Positions</h2>
                    </div>
                    <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Units</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{portfolio?.holdings.length || 0}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <tr>
                        <th className="px-10 py-6">Instrument</th>
                        <th className="px-10 py-6">Allocation Details</th>
                        <th className="px-10 py-6">Entry / Current</th>
                        <th className="px-10 py-6">Performance</th>
                        <th className="px-10 py-6">Sale Advice</th>
                        <th className="px-10 py-6 text-right">Analytics</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {portfolio?.holdings.map((holding: any) => (
                        <tr key={holding.symbol} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-10 py-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{holding.symbol}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 self-start px-2 py-0.5 rounded-md">{holding.sector}</span>
                            </div>
                            </td>
                            <td className="px-10 py-8">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500">Qty: {holding.quantity}</span>
                                    <span className="text-slate-655 dark:text-slate-300">{formatCurrency(holding.cost_basis)}</span>
                                </div>
                                <div className="h-1.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${(holding.current_value / portfolio.summary.current_value) * 100}%` }}></div>
                                </div>
                            </div>
                            </td>
                            <td className="px-10 py-8">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-550 dark:text-slate-400">{formatCurrency(holding.avg_buy_price)}</span>
                                <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(holding.current_price)}</span>
                            </div>
                            </td>
                            <td className="px-10 py-8">
                            <div className="flex flex-col">
                                <span className={`text-lg font-black ${holding.unrealized_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {holding.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(holding.unrealized_pnl)}
                                </span>
                                <div className="flex items-center gap-1">
                                {holding.pnl_percentage >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-rose-600" />}
                                <span className={`text-[10px] font-black ${holding.pnl_percentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {holding.pnl_percentage >= 0 ? '+' : ''}{holding.pnl_percentage}%
                                </span>
                                </div>
                            </div>
                            </td>
                            <td className="px-10 py-8">
                                {holding.sale_recommendation ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">Action Required</span>
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{holding.sale_recommendation}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">Hold</span>
                                )}
                            </td>
                            <td className="px-10 py-8 text-right">
                            <Link 
                                to={`/stock/${holding.symbol}`} 
                                className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-900/40 hover:text-white transition-all flex items-center justify-center group/btn"
                            >
                                <Search className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                            </Link>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
           </div>
        )}

        {activeTab === 'watchlist' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/20">
                     <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                             <Eye className="h-6 w-6 text-blue-500" />
                         </div>
                         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Strategic Watchlist</h2>
                     </div>
                     <form onSubmit={handleAddToWatchlist} className="flex items-center gap-2">
                         <input
                             type="text"
                             value={newWatchlistSymbol}
                             onChange={(e) => setNewWatchlistSymbol(e.target.value)}
                             placeholder="Enter stock symbol (e.g. INFY)..."
                             className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 uppercase"
                         />
                         <button
                             type="submit"
                             disabled={addingWatchlist}
                             className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
                         >
                             {addingWatchlist ? 'Adding...' : 'Add Stock'}
                         </button>
                     </form>
                  </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Symbol</th>
                                <th className="px-10 py-6">Current Price</th>
                                <th className="px-10 py-6">Daily Change</th>
                                <th className="px-10 py-6">Signal</th>
                                <th className="px-10 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {watchlist.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest italic">Watchlist is currently empty</td>
                                </tr>
                            ) : watchlist.map((s) => (
                                <tr key={s.symbol} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all">
                                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-lg">{s.symbol}</td>
                                    <td className="px-10 py-8 font-mono text-slate-600 dark:text-slate-300">{formatCurrency(s.close_price)}</td>
                                    <td className={`px-10 py-8 font-black ${s.return_1d && s.return_1d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {s.return_1d && s.return_1d >= 0 ? '+' : ''}{s.return_1d?.toFixed(2)}%
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{s.signal || 'Neutral'}</span>
                                    </td>
                                     <td className="px-10 py-8 text-right">
                                         <div className="flex items-center justify-end gap-3">
                                             <Link to={`/stock/${s.symbol}`} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">Buy Now</Link>
                                             <button
                                                 onClick={() => handleRemoveFromWatchlist(s.symbol)}
                                                 className="border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                                             >
                                                 Remove
                                             </button>
                                         </div>
                                     </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <History className="h-6 w-6 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Trade History</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Date</th>
                                <th className="px-10 py-6">Symbol</th>
                                <th className="px-10 py-6">Type</th>
                                <th className="px-10 py-6">Quantity</th>
                                <th className="px-10 py-6">Execution Price</th>
                                <th className="px-10 py-6 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {tradeHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest italic">No trade execution records found</td>
                                </tr>
                            ) : tradeHistory.map((t: any) => (
                                <tr key={t.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all">
                                    <td className="px-10 py-6 text-xs text-slate-500 font-mono">{new Date(t.transaction_date).toLocaleDateString()}</td>
                                    <td className="px-10 py-6 font-black text-slate-900 dark:text-white">{t.stock_symbol}</td>
                                    <td className="px-10 py-6">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${t.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                            {t.action}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 dark:text-slate-400">{t.quantity}</td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-605 dark:text-slate-300">{formatCurrency(t.execution_price)}</td>
                                    <td className="px-10 py-6 text-right font-black text-slate-900 dark:text-white">{formatCurrency(t.quantity * t.execution_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="space-y-10">
                 {/* Diversification & Analytics */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                          <PieChartIcon className="h-5 w-5 text-blue-500" /> Sector Diversification
                        </h3>
                        <div className="h-[350px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={portfolio ? Object.entries(portfolio.diversification.sector).map(([name, value]) => ({ name, value })) : []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {portfolio && Object.entries(portfolio.diversification.sector).map((_, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                                 <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-emerald-500" /> Market Cap Weightage
                        </h3>
                        <div className="h-[350px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={portfolio ? Object.entries(portfolio.diversification.market_cap).map(([name, value]) => ({ name, value })) : []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {portfolio && Object.entries(portfolio.diversification.market_cap).map((_, index) => (
                                       <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                    ))}
                                 </Pie>
                                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                                 <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Target className="h-40 w-40 text-blue-500" />
                       </div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-8">Performance Benchmarking</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Portfolio Alpha</p>
                                <p className={`text-4xl font-black ${(portfolio?.summary.benchmarking.alpha || 0) >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                                    {(portfolio?.summary.benchmarking.alpha || 0) >= 0 ? '+' : ''}{portfolio?.summary.benchmarking.alpha || '0'}%
                                </p>
                                <p className="text-[10px] text-slate-600 mt-4 italic font-bold">Excess return over {portfolio?.summary.benchmarking.index_name}</p>
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Win Rate</p>
                                <p className="text-4xl font-black text-emerald-500">68.5%</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 italic font-bold">Percentage of profitable trades executed.</p>
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Avg. Holding Period</p>
                                <p className="text-4xl font-black text-purple-500">14 Days</p>
                                <p className="text-[10px] text-slate-600 mt-4 italic font-bold">Institutional momentum strategy duration.</p>
                            </div>
                       </div>
                  </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Baskets;
