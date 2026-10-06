import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cloud, 
  RefreshCw, 
  Search, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { stockService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface FirebaseStock {
  symbol: string;
  clean_symbol: string;
  company_name?: string;
  price: number;
  change: number;
  change_pct: number;
  rsi: number;
  macd: number;
  volume: number;
  signal: 'buy' | 'sell' | 'neutral';
  signal_detail?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  updated_at: string;
}

interface QuarterlyReport {
  symbol: string;
  quarter: string;
  title: string;
  summary: string;
  revenue_cr: number;
  profit_cr: number;
  growth_pct: number;
  pdf_storage_url: string;
  vector_similarity_score?: number;
}

const FirebaseHub: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<FirebaseStock[]>([]);
  const [reports, setReports] = useState<QuarterlyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QuarterlyReport[] | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await stockService.getQuarterlyReports();
      if (res.data?.reports) {
        setReports(res.data.reports);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    }
  };

  const fetchFirebaseStocks = async () => {
    try {
      const res = await stockService.getFirebaseStocks();
      if (res.data?.stocks) {
        setStocks(res.data.stocks);
      }
    } catch (e) {
      console.error('Error fetching stocks:', e);
    }
  };

  useEffect(() => {
    fetchFirebaseStocks();
    fetchReports();
  }, []);

  const handleSyncStocks = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await stockService.syncStocksToFirebase();
      setSyncStatusMsg(`Successfully synchronized ${res.data?.synced_count || 0} stocks to Firebase Realtime DB & Firestore with AI Sentiment & Signals.`);
      fetchFirebaseStocks();
    } catch (e: any) {
      setSyncStatusMsg(`Sync error: ${e?.message || 'Could not reach server'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVectorSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await stockService.searchQuarterlyReportsVector(searchQuery);
      setSearchResults(res.data?.results || []);
    } catch (e) {
      console.error('Vector search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSeedReports = async () => {
    try {
      await stockService.seedQuarterlyReports();
      fetchReports();
      setSyncStatusMsg('Sample quarterly reports seeded into Cloud Firestore with Vector Embeddings.');
    } catch (e: any) {
      setSyncStatusMsg(`Seed error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Cloud className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Firebase Cloud Infrastructure</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Connected to project <span className="font-semibold text-amber-600 dark:text-amber-400">chaubeyedu</span> • Realtime Database, Cloud Firestore & Vector DB
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncStocks}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing to Firebase...' : 'Sync Stock Data'}
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-lg p-4 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Authentication</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Active Session</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {user?.email || 'Authenticated User'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Realtime Database</span>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">asia-southeast1</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            chaubeyedu-default-rtdb
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cloud Firestore</span>
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{stocks.length} Stocks</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collections: /stocks, /quarterly_reports
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vector DB Concept</span>
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{reports.length} Reports</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cosine Similarity Embeddings
          </div>
        </div>
      </div>

      {/* Stock Data Synced with Sentiment & Buy/Sell/Neutral Signal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Realtime Synced Stock Signals & Sentiment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Python calculation: Sentiment analysis + Buy / Sell / Neutral AI signal stored on Firebase
            </p>
          </div>
          <button
            onClick={fetchFirebaseStocks}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">AI Signal</th>
                <th className="px-4 py-3">Sentiment</th>
                <th className="px-4 py-3">RSI</th>
                <th className="px-4 py-3">MACD</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No stocks synced yet. Click "Sync Stock Data" above to push stock updates, sentiment, and signals.
                  </td>
                </tr>
              ) : (
                stocks.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {s.symbol || s.clean_symbol}
                    </td>
                    <td className="px-4 py-3">₹{s.price?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s.signal === 'buy' 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : s.signal === 'sell'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {s.signal ? s.signal.toUpperCase() : 'NEUTRAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize ${
                        s.sentiment === 'positive' 
                          ? 'text-emerald-500' 
                          : s.sentiment === 'negative' 
                          ? 'text-rose-500' 
                          : 'text-slate-400'
                      }`}>
                        {s.sentiment || 'neutral'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.rsi?.toFixed(1) || '50.0'}</td>
                    <td className="px-4 py-3">{s.macd?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {s.updated_at ? new Date(s.updated_at).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud Firestore Vector DB Concept for Quarterly Reports in PDF */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-500" />
              Cloud Firestore Vector DB & Quarterly Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Semantic vector search with cosine similarity over quarterly reports stored in Firebase
            </p>
          </div>
          <button
            onClick={handleSeedReports}
            className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium transition"
          >
            Seed / Refresh Reports
          </button>
        </div>

        {/* Vector Search Form */}
        <form onSubmit={handleVectorSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports using semantic queries (e.g. 'high cloud and AI margin growth', 'domestic EV leadership')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Vector Search'}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearchQuery(''); }}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Clear
            </button>
          )}
        </form>

        {/* Reports Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(searchResults || reports).map((rep, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative hover:border-purple-500/50 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{rep.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                      {rep.quarter}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {rep.title}
                  </h3>
                </div>

                {rep.vector_similarity_score !== undefined && (
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                      Match: {(rep.vector_similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {rep.summary}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Revenue:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">₹{rep.revenue_cr?.toLocaleString()} Cr</p>
                </div>
                <div>
                  <span className="text-slate-400">Net Profit:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">₹{rep.profit_cr?.toLocaleString()} Cr</p>
                </div>
                <div>
                  <span className="text-slate-400">YoY Growth:</span>
                  <p className="font-semibold text-emerald-500">+{rep.growth_pct}%</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={rep.pdf_storage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View PDF Report
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-[10px] text-slate-400">Firebase Storage Asset</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FirebaseHub;
