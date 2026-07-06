import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { 
  PiggyBank, Receipt, ShieldCheck, Plus, Trash2, Calendar, 
  Loader2, Wallet, X
} from 'lucide-react';

const FinanceDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'goals' | 'expenses' | 'insurance'>('goals');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);

  // Queries
  const { data: goalsResponse, isLoading: goalsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => stockService.getSavingsGoals(),
  });

  const { data: expensesResponse, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => stockService.getExpenses(),
  });

  const { data: expensesSummaryResponse } = useQuery({
    queryKey: ['expenseSummary'],
    queryFn: () => stockService.getExpenseSummary(),
  });

  const { data: insuranceResponse, isLoading: insuranceLoading } = useQuery({
    queryKey: ['insurance'],
    queryFn: () => stockService.getInsurancePolicies(),
  });

  const goals = goalsResponse?.data || [];
  const expenses = expensesResponse?.data || [];
  const summary = expensesSummaryResponse?.data || { total_income: 0, total_expense: 0, net_savings: 0, expense_by_category: {} };
  const insurance = insuranceResponse?.data || [];

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

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => stockService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
      setIsExpenseModalOpen(false);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => stockService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
    }
  });

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

  const tabs = [
    { id: 'goals', name: 'Savings Goals', icon: TargetIcon },
    { id: 'expenses', name: 'Budget & Expenses', icon: Receipt },
    { id: 'insurance', name: 'Insurance Policies', icon: ShieldCheck },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finance & Planning</h1>
          <p className="text-slate-400 text-sm mt-1">Track goals, optimize budgets, and manage insurance coverage.</p>
        </div>
        
        <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-indigo-500" />
                Active Savings Goals
              </h2>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" /> New Goal
              </button>
            </div>

            {goalsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>
            ) : goals.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <TargetIcon className="h-8 w-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold">No savings goals yet</p>
                  <p className="text-slate-400 text-sm">Create a goal to start tracking your financial progress.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal: any) => {
                  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                  return (
                    <div key={goal.id} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-600/10 p-3 rounded-2xl">
                            <TargetIcon className="h-6 w-6 text-indigo-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{goal.goal_name}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{goal.category || 'General'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          className="text-slate-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white font-bold">${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-indigo-400 text-right">{progress.toFixed(1)}%</p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
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
                          className="text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-bold"
                        >
                          + Add Funds
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6">
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Total Income</p>
                 <p className="text-2xl font-black text-emerald-500">${summary.total_income.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6">
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Total Expenses</p>
                 <p className="text-2xl font-black text-red-500">${summary.total_expense.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6">
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Net Savings</p>
                 <p className="text-2xl font-black text-blue-500">${summary.net_savings.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-500" />
                Recent Transactions
              </h2>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Transaction
              </button>
            </div>

            {expensesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-emerald-500 animate-spin" /></div>
            ) : expenses.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="h-8 w-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold">No transactions logged</p>
                  <p className="text-slate-400 text-sm">Start tracking your income and expenses.</p>
                </div>
              </div>
            ) : (
               <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-slate-300 text-sm">{new Date(exp.date).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-slate-700">{exp.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                           {exp.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                           <span className={exp.type === 'income' ? 'text-emerald-500' : 'text-red-500'}>
                             {exp.type === 'income' ? '+' : '-'}${exp.amount.toLocaleString()}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteExpenseMutation.mutate(exp.id)}
                            className="text-slate-500 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Insurance Policies
              </h2>
              <button 
                onClick={() => setIsInsuranceModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Policy
              </button>
            </div>

            {insuranceLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /></div>
            ) : insurance.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-8 w-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold">No insurance policies</p>
                  <p className="text-slate-400 text-sm">Track your coverage and premium due dates.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insurance.map((policy: any) => (
                  <div key={policy.id} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors group">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-600/10 p-3 rounded-2xl">
                          <ShieldCheck className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{policy.policy_name}</h3>
                          <p className="text-slate-400 text-sm">{policy.provider_name}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteInsuranceMutation.mutate(policy.id)}
                        className="text-slate-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coverage</p>
                         <p className="text-lg font-bold text-white">${policy.coverage_amount.toLocaleString()}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Premium ({policy.premium_frequency})</p>
                         <p className="text-lg font-bold text-blue-400">${policy.premium_amount.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                       <span className="bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded uppercase tracking-wider">{policy.policy_type}</span>
                       <span className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="h-3 w-3" /> Renewal: {new Date(policy.renewal_date).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TargetIcon className="h-5 w-5 text-indigo-500" />
                New Savings Goal
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-white p-1">
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
                <input name="name" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. New Car" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Amount ($)</label>
                  <input name="target" type="number" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Date</label>
                  <input name="date" type="date" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select name="category" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none">
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

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-500" />
                Log Transaction
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createExpenseMutation.mutate({
                amount: Number(formData.get('amount')),
                category: formData.get('category'),
                type: formData.get('type'),
                date: formData.get('date'),
                description: formData.get('description')
              });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                  <select name="type" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <input name="category" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="e.g. Groceries, Salary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                <input name="description" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
              <button 
                type="submit"
                disabled={createExpenseMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all mt-4"
              >
                {createExpenseMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Log Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Insurance Modal */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Add Insurance Policy
              </h3>
              <button onClick={() => setIsInsuranceModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createInsuranceMutation.mutate({
                provider_name: formData.get('provider'),
                policy_name: formData.get('policy_name'),
                policy_type: formData.get('type'),
                coverage_amount: Number(formData.get('coverage')),
                premium_amount: Number(formData.get('premium')),
                premium_frequency: formData.get('frequency'),
                renewal_date: formData.get('renewal')
              });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Provider</label>
                  <input name="provider" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. LIC" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Policy Name</label>
                  <input name="policy_name" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                  <select name="type" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Term Life">Term Life</option>
                    <option value="Health">Health</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Home">Home</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Coverage Amount ($)</label>
                  <input name="coverage" type="number" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Premium Amount ($)</label>
                  <input name="premium" type="number" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Frequency</label>
                  <select name="frequency" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Renewal Date</label>
                <input name="renewal" type="date" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <button 
                type="submit"
                disabled={createInsuranceMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-4"
              >
                {createInsuranceMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Save Policy'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;

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
  )
}