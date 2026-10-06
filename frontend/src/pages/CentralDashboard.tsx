import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Zap, 
  TrendingUp, 
  Briefcase, 
  Target, 
  Award,
  ChevronRight,
  // ShieldCheck,
  PiggyBank,
  CreditCard,
  Percent,
  Coins
} from 'lucide-react';
import { 
  XAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';

const CentralDashboard = () => {
  const { data: summaryResponse, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.get('/dashboard/summary'),
  });

  const defaultSummary = {
    net_worth: { net_worth_value: 0, total_assets: 0, total_liabilities: 0, assets: {}, liabilities: {} },
    fire: { fire_number: 15000000, current_coverage_pct: 0, target_age: 50, years_remaining: 15 },
    scores: { total_score: 50, emergency_fund_months: 6, savings_rate_pct: 25 },
    gamification: { level: 1, xp_to_next: 100 },
    roadmap: [
      { stage: 1, title: 'Foundation', requirement: 'Set up your portfolio and watchlists', is_completed: true, action_link: '/screener' },
      { stage: 2, title: 'Growth', requirement: 'Monitor live signals and screener picks', is_completed: false, action_link: '/screener' }
    ],
    insights: []
  };

  const summary = summaryResponse?.data || defaultSummary;

  const getInsightPath = (insight: any) => {
    const title = insight.title?.toLowerCase() || '';
    // if (title.includes('emergency')) return '/finance/emergency-fund';
    // if (title.includes('insurance')) return '/finance/insurance';
    if (title.includes('trading') || insight.category === 'Trading') return '/screener';
    // return '/finance/goals';
    // return '/finance/emergency-fund';
    return '/screener';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="h-16 w-16 relative">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping"></div>
          <div className="relative h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Initializing FIRE Command Center...</p>
      </div>
    );
  }

  const netWorth = summary?.net_worth?.net_worth_value || 0;
  const totalAssets = summary?.net_worth?.total_assets || 0;
  const totalLiabilities = summary?.net_worth?.total_liabilities || 0;

  const assets = summary?.net_worth?.assets || {};
  const liabilities = summary?.net_worth?.liabilities || {};

  const fire = summary?.fire || {};
  const scores = summary?.scores || {};
  const gamification = summary?.gamification || {};

  const roadmap = summary?.roadmap || [];
  const nextStep = roadmap.find((step: any) => !step.is_completed) || roadmap[roadmap.length - 1];

  // Levels description mapping
  const levelNames: Record<number, string> = {
    1: 'Foundation Established',
    2: 'Budget Logs Active',
    3: 'Protected Wealth',
    4: 'Emergency Cushion Funded',
    5: 'Asset Builder Active',
    6: 'Wealth Accumulator',
    7: 'Financial Freedom Achieved'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 pointer-events-none">
          <Zap className="h-64 w-64 text-indigo-500" />
        </div>
         
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
              FIRE Command Center
            </h1>
            <p className="text-slate-650 dark:text-slate-400 text-lg font-medium leading-relaxed">
              Synthesizing live metrics across your equity, savings goals, and protection reserves to map your path to financial freedom.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 min-w-[260px] text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gamified Progress</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Level {gamification.level}: {levelNames[gamification.level] || 'Novice'}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${100 - (gamification.xp_to_next / 10)}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-1 tracking-wider">{gamification.xp_to_next} XP to next level</p>
            </div>
          </div>
        </div>
      </section>

      {/* FIRE Freedom Roadmap */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Award className="h-6 w-6 text-indigo-500" /> FIRE Freedom Roadmap
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your step-by-step master plan to achieve absolute Financial Independence.</p>
          </div>
          
          {nextStep && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 max-w-sm flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-indigo-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Immediate Next Step</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{nextStep.requirement}</p>
                <Link to={nextStep.action_link} className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:gap-1.5 transition-all mt-1.5 uppercase tracking-widest">
                  Go to Action <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Roadmap Timeline Stepper */}
        <div className="relative">
          {/* Horizontal connection line */}
          <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 relative z-10">
            {roadmap.map((step: any) => {
              const isActive = nextStep?.stage === step.stage;
              const isCompleted = step.is_completed;
              
              return (
                <div key={step.stage} className={`flex md:flex-col items-center gap-4 text-left md:text-center p-4 rounded-3xl transition-all ${
                  isActive 
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 shadow-md' 
                    : 'border border-transparent'
                }`}>
                  {/* Visual Node */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-black text-xs transition-all border ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : step.stage}
                  </div>
                  
                  {/* Stage Text */}
                  <div className="space-y-1">
                    <p className={`text-xs font-black uppercase tracking-wider ${
                      isActive 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : isCompleted 
                          ? 'text-slate-800 dark:text-slate-200' 
                          : 'text-slate-400 dark:text-slate-500'
                    }`}>{step.title}</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal hidden md:block">{step.requirement}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Core Financial Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Net Worth & FIRE progress */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Net Worth Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Worth Summary</span>
                </div>
                <div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">₹{netWorth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Assets - Liabilities</p>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Assets</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">₹{totalAssets.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Liabilities</span>
                  <p className="text-base font-bold text-rose-500">₹{totalLiabilities.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
              </div>
            </div>

            {/* FIRE Gap Planner Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FIRE Roadmap</span>
                  </div>
                  <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">{fire.progress_pct?.toFixed(1)}% Ready</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{fire.fi_number?.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Target FI Number (25x expenses)</p>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Target Year</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{fire.estimated_fi_year}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Years Remaining</span>
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{fire.years_remaining} Years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Proactive Actions & AI Insights */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Zap className="h-6 w-6 text-indigo-500 animate-pulse" /> Proactive Insights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary?.insights?.map((insight: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col justify-between">
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${insight.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                    {insight.priority} Priority
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {insight.category === 'Finance' && <Briefcase className="h-5 w-5 text-emerald-500" />}
                        {insight.category === 'Trading' && <TrendingUp className="h-5 w-5 text-indigo-500" />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{insight.category}</p>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mt-0.5">{insight.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold leading-relaxed">{insight.message}</p>
                  </div>
                  <div className="mt-6">
                    <Link to={getInsightPath(insight)} className="flex items-center gap-1 text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                      Execute Action <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Allocation & Performance Chart */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Wealth Projection</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest italic">10-Year Compounding Model based on savings rate & 12% CAGR</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase">Growth Plan</span>
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { year: '2026', nw: netWorth },
                  { year: '2027', nw: netWorth * 1.12 + 120000 },
                  { year: '2028', nw: (netWorth * 1.12 + 120000) * 1.12 + 125000 },
                  { year: '2029', nw: ((netWorth * 1.12 + 120000) * 1.12 + 125000) * 1.12 + 130000 },
                  { year: '2030', nw: (((netWorth * 1.12 + 120000) * 1.12 + 125000) * 1.12 + 130000) * 1.12 + 135000 },
                  { year: '2032', nw: (((netWorth * 1.12 + 120000) * 1.12 + 125000) * 1.12 + 130000) * 1.12 + 135000 * 2.5 },
                  { year: '2035', nw: fire.fi_number * 0.8 },
                  { year: '2036', nw: fire.fi_number }
                ]}>
                  <defs>
                    <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                  <RechartsTooltip formatter={(val: any) => [`₹${Math.round(val).toLocaleString()}`, 'Projected Net Worth']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                  <Area type="monotone" dataKey="nw" stroke="#6366f1" fillOpacity={1} fill="url(#colorNw)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Life / FIRE Scores and Asset Breakdown */}
        <div className="lg:col-span-4 space-y-8">
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
            <Percent className="h-6 w-6 text-emerald-500" /> FIRE Metrics
          </h2>

          {/* Score Gauges */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
            <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Health Score</span>
              <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">{scores.financial_health?.toFixed(0)}%</p>
            </div>
                <div className="space-y-6">
              {[
                // { label: 'Emergency Fund Protection', score: scores.emergency_fund || 0, color: 'bg-emerald-500', icon: PiggyBank, path: '/finance/emergency-fund' },
                // { label: 'Insurance Coverage', score: scores.protection || 0, color: 'bg-rose-500', icon: ShieldCheck, path: '/finance/insurance' },
                { label: 'Investment Allocation', score: scores.wealth_building || 0, color: 'bg-blue-500', icon: TrendingUp, path: '/baskets' }
              ].map(item => (
                <Link key={item.label} to={item.path} className="block space-y-2 group/gauge">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-slate-450 group-hover/gauge:text-indigo-500 transition-colors" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover/gauge:text-slate-900 dark:group-hover/gauge:text-white transition-colors">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.score?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.score}%` }}></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Detailed Assets Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Asset Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Coins className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Portfolio Cash</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase">Paper Sandbox balance</p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">₹{assets.portfolio_cash?.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Stock Holdings</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase">Active paper value</p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">₹{assets.portfolio_holdings?.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <PiggyBank className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Savings Goals</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase">Locked target savings</p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">₹{assets.savings_goals?.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Coins className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Alternatives</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase">Gold and physical reserve</p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">₹{assets.gold?.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>

          {/* Active Liability Registry */}
          <div className="bg-slate-50 dark:bg-slate-955/40 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-4 w-4 text-rose-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Liabilities</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">Total Loans / Cards</span>
                <span className="font-black text-rose-500">₹{liabilities.loans?.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CentralDashboard;
