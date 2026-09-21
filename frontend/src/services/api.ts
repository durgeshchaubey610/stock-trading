import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const ensureNS = (sym: string): string => 
  sym && !sym.endsWith('.NS') ? `${sym}.NS` : sym;

const cleanSymbol = (sym: any): any => 
  (typeof sym === 'string' && sym.endsWith('.NS')) ? sym.slice(0, -3) : sym;

const cleanStockObj = (s: any): any => {
  if (!s) return s;
  return {
    ...s,
    symbol: cleanSymbol(s.symbol),
    stock_symbol: cleanSymbol(s.stock_symbol)
  };
};

const cleanStocksArray = (arr: any[]): any[] => {
  if (!arr) return arr;
  return arr.map(cleanStockObj);
};

const cleanFilters = (filters: any): any => {
  if (!filters) return filters;
  if (filters.rules) {
    return {
      ...filters,
      rules: filters.rules.map((r: any) => {
        if (r.rules) return cleanFilters(r);
        if (r.field === 'symbol' && typeof r.value === 'string') {
          const val = r.value.trim().toUpperCase();
          return {
            ...r,
            value: (r.operator === '=' || r.operator === '==') ? ensureNS(val) : val
          };
        }
        return r;
      })
    };
  }
  return filters;
};

export const stockService = {
  getStocks: (params: { page?: number; pageSize?: number; search?: string; sector?: string; signal?: string; sort_by?: string; sort_order?: string }) => {
    const { page = 1, pageSize = 30, search, sector, signal, sort_by, sort_order } = params;
    let url = `/stocks?page=${page}&page_size=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sector) url += `&sector=${encodeURIComponent(sector)}`;
    if (signal) url += `&signal=${encodeURIComponent(signal)}`;
    if (sort_by) url += `&sort_by=${sort_by}`;
    if (sort_order) url += `&sort_order=${sort_order}`;
    return api.get(url).then(res => {
      if (res.data && res.data.stocks) {
        res.data.stocks = cleanStocksArray(res.data.stocks);
      }
      return res;
    });
  },

  screenStocks: (data: { filters?: any; sort_by?: string; sort_order?: string; page?: number; page_size?: number }) => {
    const mappedData = {
      ...data,
      filters: cleanFilters(data.filters)
    };
    return api.post('/stocks/screen', mappedData).then(res => {
      if (res.data && res.data.stocks) {
        res.data.stocks = cleanStocksArray(res.data.stocks);
      }
      return res;
    });
  },
  
  getStockDetail: (symbol: string) =>
    api.get(`/stocks/${encodeURIComponent(ensureNS(symbol))}`).then(res => {
      if (res.data) {
        res.data = cleanStockObj(res.data);
        if (res.data.peers) {
          res.data.peers = cleanStocksArray(res.data.peers);
        }
      }
      return res;
    }),
  
  getStockChart: (symbol: string, period = '1y', interval = '1d') =>
    api.get(`/stocks/${encodeURIComponent(ensureNS(symbol))}/chart?period=${period}&interval=${interval}`),
    
  getStockFinancials: (symbol: string) =>
    api.get(`/stocks/${encodeURIComponent(ensureNS(symbol))}/financials`),

  getStockPeers: (symbol: string) =>
    api.get(`/stocks/${encodeURIComponent(ensureNS(symbol))}/peers`).then(res => {
      if (res.data) {
        res.data = cleanStocksArray(res.data);
      }
      return res;
    }),

  getDailyPicks: (strategy = 'swing_trade') =>
    api.get(`/stocks/daily-picks?strategy=${strategy}`).then(res => {
      if (res.data && res.data.picks) {
        res.data.picks = cleanStocksArray(res.data.picks);
      }
      return res;
    }),

  getBaskets: () =>
    api.get('/baskets').then(res => {
      if (Array.isArray(res.data)) {
        res.data = res.data.map((basket: any) => {
          if (basket.stocks) {
            basket.stocks = cleanStocksArray(basket.stocks);
          }
          return basket;
        });
      }
      return res;
    }),

  getPortfolio: () =>
    api.get('/portfolio').then(res => {
      if (res.data && res.data.holdings) {
        res.data.holdings = cleanStocksArray(res.data.holdings);
      }
      return res;
    }),

  addToPortfolio: (data: { stock_symbol: string; buy_price: number; quantity: number; action: 1 | 2 }) => {
    const mappedData = {
      ...data,
      stock_symbol: ensureNS(data.stock_symbol)
    };
    return api.post('/portfolio/add', mappedData);
  },

  // Paper Trading
  getPaperPortfolio: () => api.get('/paper-trading/portfolio').then(res => {
    if (res.data && res.data.holdings) {
      res.data.holdings = cleanStocksArray(res.data.holdings);
    }
    return res;
  }),
  getPaperTradeHistory: () => api.get('/paper-trading/history').then(res => {
    if (Array.isArray(res.data)) {
      res.data = cleanStocksArray(res.data);
    }
    return res;
  }),
  getWatchlist: () => api.get('/paper-trading/watchlist').then(res => {
    if (Array.isArray(res.data)) {
      res.data = cleanStocksArray(res.data);
    }
    return res;
  }),
  addToWatchlist: (symbol: string) => api.post(`/paper-trading/watchlist/add?symbol=${encodeURIComponent(ensureNS(symbol))}`),
  removeFromWatchlist: (symbol: string) => api.delete(`/paper-trading/watchlist/${encodeURIComponent(ensureNS(symbol))}`),
  placePaperOrder: (data: { symbol: string; quantity: number; price: number; order_type: string; action: string }) => {
    const mappedData = {
      ...data,
      symbol: ensureNS(data.symbol)
    };
    return api.post('/paper-trading/order', mappedData);
  },
  addPaperJournal: (data: { symbol: string; notes: string; reasoning: string }) => {
    const mappedData = {
      ...data,
      symbol: ensureNS(data.symbol)
    };
    return api.post('/paper-trading/journal', mappedData);
  },

  // Templates
  createTemplate: (data: { name: string; description: string; filters: any; is_public: boolean }) =>
    api.post('/templates', data),

  // Backtesting
  backtestStrategy: (data: {
    symbol: string;
    period: string;
    initial_capital: number;
    buy_rules: any[];
    sell_rules: any[];
    stop_loss_pct?: number;
    take_profit_pct?: number;
  }) => {
    const mappedData = {
      ...data,
      symbol: ensureNS(data.symbol)
    };
    return api.post('/backtest', mappedData);
  },

  // Finance
  getSavingsGoals: () => api.get('/finance/goals'),
  createSavingsGoal: (data: any) => api.post('/finance/goals', data),
  addFundsToGoal: (id: number, amount: number) => api.put(`/finance/goals/${id}/add-funds?amount=${amount}`),
  deleteSavingsGoal: (id: number) => api.delete(`/finance/goals/${id}`),
  getInsurancePolicies: () => api.get('/finance/insurance'),
  createInsurancePolicy: (data: any) => api.post('/finance/insurance', data),
  deleteInsurancePolicy: (id: number) => api.delete(`/finance/insurance/${id}`),
  upgradeToPremium: (tier: string) => api.post(`/profile/upgrade?tier=${tier}`),

  // Assets & Liabilities (Phase 10: FIRE Command Center networth detailers)
  getNetWorthDetails: () => api.get('/finance/networth'),
  getAssets: () => api.get('/finance/assets'),
  addAsset: (data: any) => api.post('/finance/assets', data),
  deleteAsset: (id: number) => api.delete(`/finance/assets/${id}`),
  getLiabilities: () => api.get('/finance/liabilities'),
  addLiability: (data: any) => api.post('/finance/liabilities', data),
  deleteLiability: (id: number) => api.delete(`/finance/liabilities/${id}`),

  // Expenses compatibility for Finance Dashboard
  getExpenses: () => api.get('/finance/assets'),
  getExpenseSummary: () => api.get('/finance/networth'),
  createExpense: (data: any) => api.post('/finance/assets', data),
  deleteExpense: (id: number) => api.delete(`/finance/assets/${id}`),

  // FIRE Retirement Planner (Phase 11)
  getFireProfile: () => api.get('/finance/fire-profile'),
  updateFireProfile: (data: any) => api.post('/finance/fire-profile', data),
  getFirePlanner: () => api.get('/finance/fire-planner'),
  getAlternativeProtection: () => api.get('/finance/alternative-protection'),

  // Subscriptions
  getSubscriptionPlans: () => api.get('/subscription/plans'),
  createSubscriptionOrder: (planId: number) => api.post(`/subscription/create-order?plan_id=${planId}`),
  verifySubscriptionPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; plan_id: number }) =>
    api.post('/subscription/verify-payment', data),
  getInvoices: () => api.get('/subscription/invoices'),
};

export default api;
