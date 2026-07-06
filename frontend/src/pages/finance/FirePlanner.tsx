import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  AlertTriangle, CheckCircle2, 
  Loader2, Settings
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart,
  Line
} from 'recharts';

const FirePlanner = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: plannerResponse, isLoading: plannerLoading } = useQuery({
    queryKey: ['firePlanner'],
    queryFn: () => api.get('/finance/fire-planner').then(res => res.data),
  });

  // Local state for configuration sliders
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(55);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpense, setMonthlyExpense] = useState(40000);
  const [preCagr, setPreCagr] = useState(12.0);
  const [postCagr, setPostCagr] = useState(7.0);
  const [inflation, setInflation] = useState(6.0);

  // Sync state when query data changes
  useEffect(() => {
    if (plannerResponse?.profile) {
      const p = plannerResponse.profile;
      setCurrentAge(p.current_age);
      setRetirementAge(p.retirement_age);
      setLifeExpectancy(p.life_expectancy);
      setMonthlyExpense(p.monthly_expenses_post_retirement);
      setPreCagr(p.pre_retirement_cagr);
      setPostCagr(p.post_retirement_cagr);
      setInflation(p.inflation_rate);
    }
  }, [plannerResponse]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/fire-profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firePlanner'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const handleSaveParameters = () => {
    updateProfileMutation.mutate({
      current_age: currentAge,
      retirement_age: retirementAge,
      life_expectancy: lifeExpectancy,
      monthly_expenses_post_retirement: monthlyExpense,
      pre_retirement_cagr: preCagr,
      post_retirement_cagr: postCagr,
      inflation_rate: inflation
    });
  };

  if (plannerLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>;
  }

  const metrics = plannerResponse?.metrics || {
    current_net_worth: 0,
    years_to_retirement: 0,
    years_in_retirement: 0,
    inflation_adjusted_monthly_expense: 0,
    required_corpus: 0,
    estimated_corpus_future_value: 0,
    savings_gap: 0,
    monthly_sip_required: 0,
    readiness_score: 0
  };

  const projections = plannerResponse?.projections || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Configuration Sidebar - 4 columns */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <Settings className="h-5 w-5 text-indigo-500" /> FIRE Modellers
        </h3>

        <div className="space-y-4">
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Current Age</span>
              <span className="text-slate-900 dark:text-white font-black">{currentAge} Years</span>
            </div>
            <input 
              type="range" min="18" max="75" step="1" 
              value={currentAge} 
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Target Retirement Age</span>
              <span className="text-slate-900 dark:text-white font-black">{retirementAge} Years</span>
            </div>
            <input 
              type="range" min={currentAge + 1} max="80" step="1" 
              value={retirementAge} 
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Life Expectancy</span>
              <span className="text-slate-900 dark:text-white font-black">{lifeExpectancy} Years</span>
            </div>
            <input 
              type="range" min={retirementAge + 1} max="100" step="1" 
              value={lifeExpectancy} 
              onChange={(e) => setLifeExpectancy(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Post-Retirement Expense (₹/Month)</label>
            <input 
              type="number"
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-bold"
            />
          </div>

          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-850 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Pre-Retirement Returns (CAGR)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">{preCagr}%</span>
            </div>
            <input 
              type="range" min="4" max="25" step="0.5" 
              value={preCagr} 
              onChange={(e) => setPreCagr(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Post-Retirement Returns (CAGR)</span>
              <span className="text-blue-500 dark:text-blue-400 font-black">{postCagr}%</span>
            </div>
            <input 
              type="range" min="3" max="15" step="0.5" 
              value={postCagr} 
              onChange={(e) => setPostCagr(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-550 dark:text-slate-400 font-bold">Expected Inflation Rate</span>
              <span className="text-rose-500 dark:text-rose-450 font-black">{inflation}%</span>
            </div>
            <input 
              type="range" min="2" max="12" step="0.5" 
              value={inflation} 
              onChange={(e) => setInflation(Number(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

        </div>

        <button 
          onClick={handleSaveParameters}
          disabled={updateProfileMutation.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md mt-6"
        >
          {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Parameters'}
        </button>
      </div>

      {/* Primary Dashboards Columns - 8 columns */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Upper Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Circular Score Gauge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">FIRE Readiness</span>
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28">
                <circle className="text-slate-100 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="56" cy="56" />
                <circle className="text-indigo-500" strokeWidth="8" strokeDasharray={276.4} strokeDashoffset={276.4 - (276.4 * metrics.readiness_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="44" cx="56" cy="56" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{metrics.readiness_score}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ready</span>
              </div>
            </div>
          </div>

          {/* Target Required Corpus */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Required Target Corpus</span>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">₹{metrics.required_corpus.toLocaleString(undefined, {maximumFractionDigits: 0})}</h4>
            </div>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-4">
              Annuity required for ₹{metrics.inflation_adjusted_monthly_expense.toLocaleString(undefined, {maximumFractionDigits: 0})}/mo inflation-adjusted payout.
            </p>
          </div>

          {/* Monthly SIP Required */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Necessary Monthly SIP</span>
              <h4 className={`text-2xl font-black tracking-tight mt-2 ${metrics.monthly_sip_required > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500'}`}>
                ₹{metrics.monthly_sip_required.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </h4>
            </div>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-4">
              Invest monthly compounding at {preCagr}% CAGR to secure your target corpus in {metrics.years_to_retirement} years.
            </p>
          </div>

        </div>

        {/* Projections Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">FIRE Projection Simulation</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest italic">Year-by-Year compounding curves (Best, average, worst case metrics)</p>
            </div>
            
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Best Case</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500 inline-block"></span> Average</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span> Worst Case</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projections} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="age" tickLine={false} axisLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 9, fontWeight: 700 }}
                  tickFormatter={(val) => {
                    if (val >= 10000000) return `₹${(val/10000000).toFixed(1)}Cr`;
                    if (val >= 100000) return `₹${(val/100000).toFixed(0)}L`;
                    return `₹${val}`;
                  }}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString(undefined, {maximumFractionDigits: 0})}`]}
                  labelFormatter={(label) => `Age: ${label}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="best_value" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="average_value" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="worst_value" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone Warnings & Info */}
        {metrics.savings_gap > 0 ? (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 flex gap-4 items-start shadow-sm">
            <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-rose-800 dark:text-rose-400 uppercase">FIRE Target Gap Identified</h4>
              <p className="text-xs text-rose-650 dark:text-rose-450 mt-1 leading-relaxed">
                Your current projected wealth falls short of your required target annuity by <strong>₹{metrics.savings_gap.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong>. Starting a monthly SIP of <strong>₹{metrics.monthly_sip_required.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> at {preCagr}% CAGR is highly recommended to bridge this gap.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6 flex gap-4 items-start shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase">Financial Freedom Secured</h4>
              <p className="text-xs text-emerald-650 dark:text-emerald-450 mt-1 leading-relaxed">
                Fantastic! Your current projected assets are fully sufficient to fund your expected retirement expenses. You have a zero savings gap and are on track to achieve Financial Freedom.
              </p>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
};

export default FirePlanner;
