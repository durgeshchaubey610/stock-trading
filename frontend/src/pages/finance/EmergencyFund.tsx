import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { stockService } from '../../services/api';
import { 
  PiggyBank, AlertTriangle, CheckCircle2, 
  Loader2, ArrowRight, ShieldCheck
} from 'lucide-react';

const EmergencyFund = () => {
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState('');

  // 1. Fetch Dashboard Summary (includes scores, annual expenses, net worth)
  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.get('/dashboard/summary'),
  });

  // 2. Fetch Savings Goals (to find the specific emergency fund goal)
  const { data: goalsResponse, isLoading: goalsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => stockService.getSavingsGoals(),
  });

  const summary = summaryResponse?.data || {};
  const goals = goalsResponse?.data || [];
  
  const scores = summary.scores || {};
  const fire = summary.fire || {};
  
  // Calculate expenses
  const annualExpenses = fire.annual_expenses || 0;
  const monthlyExpenses = annualExpenses / 12;
  const emergencyTarget = monthlyExpenses * 6; // Standard 6 months safety cushion
  
  // Find emergency fund savings goal
  const emergencyGoal = goals.find((g: any) => 
    g.category?.toLowerCase() === 'emergency' || g.goal_name?.toLowerCase().includes('emergency')
  );

  const currentSavings = emergencyGoal ? emergencyGoal.current_amount : 0;
  const targetAmount = emergencyGoal ? emergencyGoal.target_amount : (emergencyTarget > 0 ? emergencyTarget : 150000);
  const progressPct = Math.min((currentSavings / max(targetAmount, 1)) * 100, 100);
  const remainingGap = max(targetAmount - currentSavings, 0);

  // Mutations
  const createEmergencyGoalMutation = useMutation({
    mutationFn: (data: any) => stockService.createSavingsGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const addFundsMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number, amount: number }) => stockService.addFundsToGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setDepositAmount('');
    }
  });

  const handleQuickAdd = (amount: number) => {
    if (emergencyGoal) {
      addFundsMutation.mutate({ id: emergencyGoal.id, amount });
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (emergencyGoal && amount > 0) {
      addFundsMutation.mutate({ id: emergencyGoal.id, amount });
    }
  };

  const handleEstablishGoal = () => {
    // Establish emergency goal of 6 months expenses
    const dateOneYearOut = new Date();
    dateOneYearOut.setFullYear(dateOneYearOut.getFullYear() + 1);
    
    createEmergencyGoalMutation.mutate({
      goal_name: 'Emergency Safety Cushion',
      target_amount: targetAmount > 0 ? targetAmount : 150000,
      target_date: dateOneYearOut.toISOString().split('T')[0],
      category: 'Emergency'
    });
  };

  const isLoading = summaryLoading || goalsLoading;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Upper Grid: Status & Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Progress Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emergency Reserves</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${progressPct >= 100 ? 'bg-emerald-500/10 text-emerald-500' : progressPct >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {progressPct >= 100 ? 'Fully Shielded' : progressPct >= 50 ? 'Partially Shielded' : 'Vulnerable'}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase">Current Reserves</p>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">₹{currentSavings.toLocaleString()}</h2>
              <p className="text-xs text-slate-450 dark:text-slate-500">Targeting ₹{targetAmount.toLocaleString()} (6x Monthly Expenses)</p>
            </div>
          </div>

          <div className="space-y-2 mt-8">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-550 dark:text-slate-455">Cushion Coverage Progress</span>
              <span className="font-black text-slate-900 dark:text-white">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div className={`h-full ${progressPct >= 100 ? 'bg-emerald-500 animate-pulse' : progressPct >= 50 ? 'bg-indigo-500' : 'bg-rose-500'} transition-all duration-1000`} style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Protection Health Meter */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between items-center text-center">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cushion Score</span>
            <div className="relative flex items-center justify-center mt-4">
              <svg className="w-36 h-36">
                <circle className="text-slate-100 dark:text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" r="56" cx="72" cy="72" />
                <circle className="text-indigo-500" strokeWidth="12" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * progressPct) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="72" cy="72" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{scores.emergency_fund || 0}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fund Score</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-455 dark:text-slate-500 leading-relaxed font-semibold max-w-[200px] mt-4">
            A 100% score guarantees a 6-month buffer against unexpected career disruption or emergency overheads.
          </p>
        </div>

      </div>

      {/* Main Cushion Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Grid / Calculation Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" /> Cushion Formula Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850">
                <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase">Baseline Monthly Budget</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{monthlyExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className="text-[10px] text-slate-455 mt-2">Estimated baseline monthly living expenses.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-855">
                <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase">Recommended Safety Net</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{(monthlyExpenses * 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className="text-[10px] text-slate-455 mt-2">6 Months of baseline living coverage.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850">
                <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase">Remaining Cushion Gap</span>
                <p className="text-xl font-black text-rose-500 mt-1">₹{remainingGap.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className="text-[10px] text-slate-455 mt-2">Net savings required to complete safety target.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-855">
                <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase">Liquidity Profile</span>
                <p className="text-xl font-black text-blue-500 mt-1">Cash Reserves</p>
                <p className="text-[10px] text-slate-455 mt-2">Goal locks are liquid and immediately redeemable.</p>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          {remainingGap > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 flex gap-4 items-start">
              <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-rose-800 dark:text-rose-400 uppercase">Emergency Fund Underfunded</h4>
                <p className="text-xs text-rose-650 dark:text-rose-450 mt-1 leading-relaxed">
                  Your safety reserves cover less than the recommended 6 months expense shield. Save another <strong>₹{remainingGap.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> to protect your compounding wealth from emergency drawdowns.
                </p>
              </div>
            </div>
          )}

          {remainingGap === 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6 flex gap-4 items-start">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase">Safety Net Fully Covered</h4>
                <p className="text-xs text-emerald-650 dark:text-emerald-450 mt-1 leading-relaxed">
                  Excellent work! Your Emergency Safety Cushion is fully funded. You have built a robust shield that protects your stock investments from forced liquidation during recessions.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Action Station (Right Sidebar Column) */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-indigo-500" /> Deposit Station
            </h3>

            {!emergencyGoal ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                  You do not have an active Emergency Fund Savings Goal logged. Create one with one click to start tracking!
                </p>
                <button 
                  onClick={handleEstablishGoal}
                  disabled={createEmergencyGoalMutation.isPending}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md"
                >
                  {createEmergencyGoalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Establish Goal <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Deposit Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={addFundsMutation.isPending || !depositAmount}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md"
                  >
                    {addFundsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Deposit'}
                  </button>
                </form>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Booster</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 25000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => handleQuickAdd(amount)}
                        disabled={addFundsMutation.isPending}
                        className="py-2 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-850 hover:border-indigo-500/20 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
                      >
                        +₹{amount >= 1000 ? `${amount/1000}k` : amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default EmergencyFund;

function max(a: number, b: number): number {
  return a > b ? a : b;
}
