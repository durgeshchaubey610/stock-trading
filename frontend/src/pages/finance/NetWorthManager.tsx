import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../../services/api';
import { 
  Trash2, Loader2, Coins, ArrowUpRight, ArrowDownRight,
  PlusCircle, AlertCircle, Info, Landmark
} from 'lucide-react';

const NetWorthManager = () => {
  const queryClient = useQueryClient();

  // State for forms
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);

  // Asset Form fields
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetType, setAssetType] = useState('Cash');
  const [assetDesc, setAssetDesc] = useState('');

  // Liability Form fields
  const [liabilityName, setLiabilityName] = useState('');
  const [liabilityOutstanding, setLiabilityOutstanding] = useState('');
  const [liabilityTotal, setLiabilityTotal] = useState('');
  const [liabilityEmi, setLiabilityEmi] = useState('');
  const [liabilityType, setLiabilityType] = useState('Home Loan');
  const [liabilityDesc, setLiabilityDesc] = useState('');

  // Queries
  const { data: nwData, isLoading: nwLoading } = useQuery({
    queryKey: ['netWorthDetails'],
    queryFn: () => stockService.getNetWorthDetails().then((res: any) => res.data),
  });

  // Mutations
  const addAssetMutation = useMutation({
    mutationFn: (data: any) => stockService.addAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['firePlanner'] });
      // Reset form
      setAssetName('');
      setAssetValue('');
      setAssetDesc('');
      setShowAssetForm(false);
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: number) => stockService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['firePlanner'] });
    }
  });

  const addLiabilityMutation = useMutation({
    mutationFn: (data: any) => stockService.addLiability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['firePlanner'] });
      // Reset form
      setLiabilityName('');
      setLiabilityOutstanding('');
      setLiabilityTotal('');
      setLiabilityEmi('');
      setLiabilityDesc('');
      setShowLiabilityForm(false);
    }
  });

  const deleteLiabilityMutation = useMutation({
    mutationFn: (id: number) => stockService.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['firePlanner'] });
    }
  });

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetValue) return;
    addAssetMutation.mutate({
      asset_name: assetName,
      asset_type: assetType,
      value: parseFloat(assetValue),
      description: assetDesc
    });
  };

  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabilityName || !liabilityOutstanding || !liabilityTotal) return;
    addLiabilityMutation.mutate({
      liability_name: liabilityName,
      liability_type: liabilityType,
      total_amount: parseFloat(liabilityTotal),
      outstanding_amount: parseFloat(liabilityOutstanding),
      monthly_payment: parseFloat(liabilityEmi || '0'),
      description: liabilityDesc
    });
  };

  if (nwLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>;
  }

  const assetsList = nwData?.assets?.manual_assets || [];
  const liabilitiesList = nwData?.liabilities?.manual_liabilities || [];
  const totalAssetsVal = nwData?.total_assets || 0;
  const totalLiabilitiesVal = nwData?.total_liabilities || 0;
  const netWorthVal = nwData?.net_worth || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Consolidated Net Worth Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl border border-slate-800">
        
        <div className="space-y-2 border-r border-slate-800/80 pr-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Landmark className="h-4 w-4 text-indigo-400" /> Current Net Worth
          </span>
          <h2 className="text-4xl font-black tracking-tight mt-2">
            ₹{netWorthVal.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Assets minus Outstanding Liabilities</p>
        </div>

        <div className="space-y-2 border-r border-slate-800/80 pr-6 md:pl-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Combined Assets
          </span>
          <h3 className="text-2xl font-black text-emerald-450 tracking-tight mt-2">
            ₹{totalAssetsVal.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compounding Wealth & Cash Reserves</p>
        </div>

        <div className="space-y-2 md:pl-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowDownRight className="h-4 w-4 text-rose-400" /> Outstanding Liabilities
          </span>
          <h3 className="text-2xl font-black text-rose-400 tracking-tight mt-2">
            ₹{totalLiabilitiesVal.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Outstanding debts, mortgages, & EMIs</p>
        </div>

      </div>

      {/* Assets and Liabilities Manager columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Assets Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" /> Active Assets
            </h4>
            <button 
              onClick={() => setShowAssetForm(!showAssetForm)}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-widest"
            >
              <PlusCircle className="h-4 w-4" /> Add Asset
            </button>
          </div>

          {/* Add Asset Form */}
          {showAssetForm && (
            <form onSubmit={handleAddAsset} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset Name</label>
                  <input 
                    type="text" required placeholder="e.g. EPF Payout"
                    value={assetName} onChange={(e) => setAssetName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset Value (₹)</label>
                  <input 
                    type="number" required placeholder="50000"
                    value={assetValue} onChange={(e) => setAssetValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset Type</label>
                  <select 
                    value={assetType} onChange={(e) => setAssetType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  >
                    <option value="Cash">Cash & Savings</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Gold">Gold & Jewelry</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="EPF/PPF/NPS">EPF / PPF / NPS</option>
                    <option value="Stocks">Other Stocks</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Description</label>
                  <input 
                    type="text" placeholder="Short description"
                    value={assetDesc} onChange={(e) => setAssetDesc(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button" onClick={() => setShowAssetForm(false)}
                  className="px-4 py-2 border border-slate-305 text-slate-550 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={addAssetMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {addAssetMutation.isPending ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          )}

          {/* Assets List */}
          <div className="space-y-3">
            {assetsList.length === 0 ? (
              <div className="py-8 text-center text-slate-455 text-xs font-bold uppercase flex flex-col items-center gap-2">
                <Info className="h-5 w-5 text-slate-400" /> No Manual Assets registered.
              </div>
            ) : (
              assetsList.map((asset: any) => (
                <div key={asset.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 hover:border-emerald-500/20 transition-colors">
                  <div>
                    <span className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                      {asset.type}
                    </span>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white mt-1.5">{asset.name}</h5>
                    {asset.description && <p className="text-[9px] text-slate-455 mt-0.5">{asset.description}</p>}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ₹{asset.value.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                    <button 
                      onClick={() => deleteAssetMutation.mutate(asset.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Liabilities Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Landmark className="h-5 w-5 text-rose-500" /> Active Liabilities
            </h4>
            <button 
              onClick={() => setShowLiabilityForm(!showLiabilityForm)}
              className="flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-750 dark:text-rose-400 dark:hover:text-rose-350 uppercase tracking-widest"
            >
              <PlusCircle className="h-4 w-4" /> Add Liability
            </button>
          </div>

          {/* Add Liability Form */}
          {showLiabilityForm && (
            <form onSubmit={handleAddLiability} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Liability Name</label>
                  <input 
                    type="text" required placeholder="e.g. HDFC Home Loan"
                    value={liabilityName} onChange={(e) => setLiabilityName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Outstanding Principal (₹)</label>
                  <input 
                    type="number" required placeholder="Outstanding debt"
                    value={liabilityOutstanding} onChange={(e) => setLiabilityOutstanding(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Total Loan Limit (₹)</label>
                  <input 
                    type="number" required placeholder="Sanctioned amount"
                    value={liabilityTotal} onChange={(e) => setLiabilityTotal(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Monthly EMI (₹)</label>
                  <input 
                    type="number" placeholder="Optional EMI"
                    value={liabilityEmi} onChange={(e) => setLiabilityEmi(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Debt Type</label>
                  <select 
                    value={liabilityType} onChange={(e) => setLiabilityType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Business Loan">Business Debt</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Description</label>
                <input 
                  type="text" placeholder="Short description"
                  value={liabilityDesc} onChange={(e) => setLiabilityDesc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button" onClick={() => setShowLiabilityForm(false)}
                  className="px-4 py-2 border border-slate-305 text-slate-550 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={addLiabilityMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                >
                  {addLiabilityMutation.isPending ? 'Saving...' : 'Save Debt'}
                </button>
              </div>
            </form>
          )}

          {/* Liabilities List */}
          <div className="space-y-3">
            {liabilitiesList.length === 0 ? (
              <div className="py-8 text-center text-slate-455 text-xs font-bold uppercase flex flex-col items-center gap-2">
                <AlertCircle className="h-5 w-5 text-slate-400" /> No active debts or liabilities.
              </div>
            ) : (
              liabilitiesList.map((liability: any) => (
                <div key={liability.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-105 dark:border-slate-850 hover:border-rose-500/20 transition-colors">
                  <div>
                    <span className="bg-rose-500/10 text-rose-650 dark:text-rose-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                      {liability.type}
                    </span>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white mt-1.5">{liability.name}</h5>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-455">
                      <span>Total: ₹{liability.total.toLocaleString()}</span>
                      {liability.emi > 0 && <span>• EMI: ₹{liability.emi.toLocaleString()}/mo</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-rose-500">
                      ₹{liability.outstanding.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                    <button 
                      onClick={() => deleteLiabilityMutation.mutate(liability.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Liability"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default NetWorthManager;
