import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
// import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Loader2, Coins, HelpCircle, 
  /* ArrowRight, */ ShieldAlert
} from 'lucide-react';

const AlternativeProtection = () => {
  
  // Queries
  const { data: protectionResponse, isLoading } = useQuery({
    queryKey: ['alternativeProtection'],
    queryFn: () => api.get('/finance/alternative-protection').then(res => res.data),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>;
  }

  const traditional = protectionResponse?.traditional || { total_policies: 0, total_annual_premium: 25000, total_coverage_amount: 500000 };
  const alternatives = protectionResponse?.alternatives || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Introduction Banner */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-500" /> Self-Insurance & Alternative Protection
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
            Instead of paying recurring traditional insurance premiums that yield zero returns, you can divert those funds into cash-flowing assets that compound over time, building a highly liquid emergency health reservoir.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0">
          <HelpCircle className="h-4 w-4" /> Strategic Pivot
        </div>
      </div>

      {/* Grid comparing traditional insurance stats vs alternative opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Traditional Insurance Overhead */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-rose-500" /> Traditional Policy Cost
            </span>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Policies</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{traditional.total_policies} Logged</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Annual Premium Outflow</span>
                <p className="text-2xl font-black text-rose-500">₹{traditional.total_annual_premium.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Coverage Shield</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">₹{traditional.total_coverage_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-8">
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Traditional premiums represent guaranteed capital loss unless a claim triggers. Below are alternative vehicles to compound this capital instead.
            </p>
          </div>
        </div>

        {/* Right Column: Alternative Compounding Solutions */}
        <div className="lg:col-span-8 space-y-6">
          
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-500" /> Alternative Protection Solutions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alternatives.map((alt: any) => (
              <div key={alt.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-colors flex flex-col justify-between shadow-md group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tight">{alt.name}</h5>
                      <span className="text-[9px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wide">Target return: {alt.cagr}% CAGR</span>
                    </div>
                    <span className="bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{alt.risk_level} Risk</span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal font-semibold">{alt.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800 py-3 text-xs">
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">10-Yr Compounded</span>
                       <p className="text-sm font-black text-emerald-500 mt-0.5">₹{alt.estimated_value_10y.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                     </div>
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">20-Yr Compounded</span>
                       <p className="text-sm font-black text-indigo-500 mt-0.5">₹{alt.estimated_value_20y.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                     </div>
                  </div>

                  <p className="text-[9px] text-slate-455 font-bold italic">
                     {alt.protection_benefit}
                  </p>
                </div>

                <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-550 dark:text-slate-400">Liquidity: {alt.liquidity}</span>
                  {/* <Link to="/finance/goals" className="inline-flex items-center gap-1 text-indigo-600 hover:gap-1.5 transition-all">
                     Build Goal <ArrowRight className="h-3 w-3" />
                  </Link> */}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

export default AlternativeProtection;
