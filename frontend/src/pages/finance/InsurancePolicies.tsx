import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../../services/api';
import { 
  ShieldCheck, Plus, Trash2, Calendar, Loader2, X
} from 'lucide-react';

const InsurancePolicies = () => {
  const queryClient = useQueryClient();
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);

  // Queries
  const { data: insuranceResponse, isLoading: insuranceLoading } = useQuery({
    queryKey: ['insurance'],
    queryFn: () => stockService.getInsurancePolicies(),
  });

  const insurance = insuranceResponse?.data || [];

  // Mutations
  const createInsuranceMutation = useMutation({
    mutationFn: (data: any) => stockService.createInsurancePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
      setIsInsuranceModalOpen(false);
    }
  });

  const deleteInsuranceMutation = useMutation({
    mutationFn: (id: number) => stockService.deleteInsurancePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          Insurance Policies
        </h2>
        <button 
          onClick={() => setIsInsuranceModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" /> Add Policy
        </button>
      </div>

      {insuranceLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /></div>
      ) : insurance.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="bg-slate-200 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-900 dark:text-white font-bold">No insurance policies</p>
            <p className="text-slate-550 dark:text-slate-400 text-sm">Track your coverage and premium due dates.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insurance.map((policy: any) => (
            <div key={policy.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors group shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/10 p-3 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{policy.policy_name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{policy.provider_name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this insurance policy?")) {
                      deleteInsuranceMutation.mutate(policy.id);
                    }
                  }}
                  className="text-slate-550 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coverage</p>
                   <p className="text-lg font-bold text-slate-900 dark:text-white">₹{policy.coverage_amount.toLocaleString()}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Premium ({policy.premium_frequency})</p>
                   <p className="text-lg font-bold text-blue-500 dark:text-blue-400">₹{policy.premium_amount.toLocaleString()}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs font-semibold">
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded uppercase tracking-wider">{policy.policy_type}</span>
                 <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3 w-3" /> Renewal: {new Date(policy.renewal_date).toLocaleDateString()}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insurance Modal */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Add Insurance Policy
              </h3>
              <button onClick={() => setIsInsuranceModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createInsuranceMutation.mutate({
                policy_name: formData.get('name'),
                provider_name: formData.get('provider'),
                policy_type: formData.get('type'),
                coverage_amount: Number(formData.get('coverage')),
                premium_amount: Number(formData.get('premium')),
                premium_frequency: formData.get('frequency'),
                renewal_date: formData.get('date')
              });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Policy Name</label>
                  <input name="name" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Family Health Plan" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Provider Name</label>
                  <input name="provider" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Star Health" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Policy Type</label>
                  <select name="type" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Term Life">Term Life</option>
                    <option value="Health">Health</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Home">Home</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Coverage Amount (₹)</label>
                  <input name="coverage" type="number" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Premium Amount (₹)</label>
                  <input name="premium" type="number" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Frequency</label>
                  <select name="frequency" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Renewal Date</label>
                <input name="date" type="date" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <button 
                type="submit"
                disabled={createInsuranceMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-4 shadow-md"
              >
                {createInsuranceMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Add Policy'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurancePolicies;
