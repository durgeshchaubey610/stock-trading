import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../../services/api';
import { 
  PiggyBank, Plus, Trash2, Calendar, Loader2, X
} from 'lucide-react';

const SavingsGoals = () => {
  const queryClient = useQueryClient();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Queries
  const { data: goalsResponse, isLoading: goalsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => stockService.getSavingsGoals(),
  });

  const goals = goalsResponse?.data || [];

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: (data: any) => stockService.createSavingsGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setIsGoalModalOpen(false);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => stockService.deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    }
  });

  const addFundsMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number, amount: number }) => stockService.addFundsToGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-indigo-500" />
          Active Savings Goals
        </h2>
        <button 
          onClick={() => setIsGoalModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-755 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {goalsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="bg-slate-200 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <TargetIcon className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-900 dark:text-white font-bold">No savings goals yet</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Create a goal to start tracking your financial progress.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal: any) => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600/10 p-3 rounded-2xl">
                      <TargetIcon className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{goal.goal_name}</h3>
                      <p className="text-slate-555 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{goal.category || 'General'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this savings goal?")) {
                        deleteGoalMutation.mutate(goal.id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-550 dark:text-slate-400 font-semibold">Progress</span>
                    <span className="text-slate-900 dark:text-white font-black">₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 text-right font-black">{progress.toFixed(1)}%</p>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                     <Calendar className="h-3 w-3" />
                     Target: {new Date(goal.target_date).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => {
                      const amount = prompt("Enter amount to add:");
                      if (amount && !isNaN(Number(amount))) {
                        addFundsMutation.mutate({ id: goal.id, amount: Number(amount) });
                      }
                    }}
                    className="text-xs bg-indigo-500/10 text-indigo-650 dark:bg-indigo-600/20 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-black uppercase tracking-wider"
                  >
                    + Add Funds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TargetIcon className="h-5 w-5 text-indigo-500" />
                New Savings Goal
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createGoalMutation.mutate({
                goal_name: formData.get('name'),
                target_amount: Number(formData.get('target')),
                target_date: formData.get('date'),
                category: formData.get('category')
              });
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Goal Name</label>
                <input name="name" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. New Car" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Amount (₹)</label>
                  <input name="target" type="number" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Date</label>
                  <input name="date" type="date" required className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select name="category" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                  <option value="House">House</option>
                  <option value="Car">Car</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Emergency">Emergency Fund</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={createGoalMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all mt-4"
              >
                {createGoalMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;

function TargetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
