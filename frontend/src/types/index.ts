export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector_id: number;
  sub_sector: string;
  market_cap: number;
  close_price: number;
  pe_ratio: number;
  forward_pe_ratio: number;
  volume: number;
  rsi: number;
  mfi: number;
  forward_1y_growth: number;
  ebitda_growth: number;
  forward_1y_ebitda_growth: number;
  forward_1y_eps_growth: number;
  forward_1y_ocf_growth: number;
  eps_growth: number;
  is_fno: number;
  return_1y?: number;
  return_1d?: number;
  
  // Technical Indicators
  sma20: number;
  sma50: number;
  sma200: number;
  ema20: number;
  ema50: number;
  atr14: number;
  macd: number;
  macd_signal: number;
  adx: number;
  supertrend: number;
  high_52_week: number;
  low_52_week: number;
  delivery_percentage: number;
  oi_change: number;
  avg_volume_20d: number;
  signal: string;
  
  // Fundamental Indicators
  debt_to_equity: number;
  roe: number;
  roce: number;

  // Valuation Metrics
  pb_ratio?: number;
  peg_ratio?: number;
  ev_to_ebitda?: number;
  ev_to_sales?: number;
  price_to_sales?: number;
  dividend_yield?: number;
  enterprise_value?: number;

  // Profitability Metrics
  roa?: number;
  ebitda_margin?: number;
  operating_margin?: number;
  gross_margin?: number;
  net_profit_margin?: number;

  // Growth Metrics
  revenue_growth_3y?: number;
  revenue_growth_5y?: number;
  profit_growth_3y?: number;
  profit_growth_5y?: number;

  // Financial Health
  current_ratio?: number;
  quick_ratio?: number;
  interest_coverage_ratio?: number;
  total_debt?: number;
  total_cash?: number;

  // Analyst Ratings & Key Stats
  beta?: number;
  vwap?: number;
  target_price?: number;
  upside_pct?: number;
  recommendation_count?: number;
  recommendation_key?: string;
  shares_outstanding?: number;
  face_value?: number;
  book_value?: number;
  
  // Stock holders
  promoter_holding: number;
  fii_holding: number;
  dii_holding: number;
  retail_holding: number;

  // New Normalized Objects
  financials?: any;
  growth?: any;
  valuation?: any;
  ownership?: any[];
  technicals?: any;
  scores?: {
    fundamental_score: number;
    growth_score: number;
    value_score: number;
    quality_score: number;
    momentum_score: number;
    risk_score: number;
    intrinsic_value_score: number;
    overall_score: number;
  };
  forecasts?: any;
  news?: any[];
  events?: any[];

  created_at: string;
  updated_at: string;
}

export interface DailyPick {
  id: number;
  symbol: string;
  signal_type: string;
  reasoning: string;
  entry: number;
  target: number;
  stop_loss: number;
  position: 'call' | 'put';
  created_at: string;
}

export interface InvestmentBasket {
  id: number;
  name: string;
  description: string;
  category: string;
  risk_level: string;
  min_investment: number;
  constituents: any[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  page: number;
  page_size: number;
  total_count: number;
  stocks: T[];
}

export interface PortfolioSummary {
  available_cash: number;
  total_buy_cost: number;
  total_sell_revenue: number;
  current_value: number;
  total_portfolio_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_pnl: number;
  total_pnl_percentage: number;
  benchmarking: {
    index_name: string;
    index_return_pct: number;
    alpha: number;
  };
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  pnl_percentage: number;
  sector: string;
  cap_category: string;
}

export interface Portfolio {
  holdings: PortfolioHolding[];
  summary: PortfolioSummary;
  diversification: {
    sector: Record<string, number>;
    market_cap: Record<string, number>;
  };
  tax_harvesting: {
    total_harvestable_loss: number;
    short_term_loss: number;
    long_term_loss: number;
    suggested_stocks: any[];
  };
}

export interface PaperPortfolio {
  balance: number;
  available_cash: number;
  invested_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  trades: any[];
}

export interface HealthProfile {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmi_category: string;
  sleep_time?: string;
  wakeup_time?: string;
  mobile_screen_time?: number;
  laptop_screen_time?: number;
  tv_screen_time?: number;
  tablet_screen_time?: number;
  food_type?: 'VEG' | 'NON_VEG' | 'BOTH';
  goal?: 'WEIGHT_GAIN' | 'WEIGHT_LOSS' | 'MAINTAIN_WEIGHT' | 'MUSCLE_GAIN' | 'FITNESS' | 'BODYBUILDING' | 'HEALTHY_LIFESTYLE';
  blood_group?: string;
  water_intake_target?: number;
  activity_level?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  date_of_birth?: string;
  disliked_foods?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  relation: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  height_cm?: number;
  blood_group?: string;
  food_type?: string;
  disliked_foods?: string;
  allergies?: string;
  chronic_diseases?: string;
}

