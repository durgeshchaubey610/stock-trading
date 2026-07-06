import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { 
  User, Mail, Shield, LogOut, Settings, Award, 
  CreditCard, CheckCircle2, Zap, Crown, Loader2, FileText
} from 'lucide-react';
import Modal from '../components/common/Modal';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Profile: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'subscription' | 'security' | 'preferences'>('general');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Modal state for alerts
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => stockService.getSubscriptionPlans(),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['userInvoices'],
    queryFn: () => stockService.getInvoices(),
    enabled: !!user
  });

  const plans = plansData?.data || [];
  const invoices = invoicesData?.data || [];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyMutation = useMutation({
    mutationFn: (data: any) => stockService.verifySubscriptionPayment(data),
    onSuccess: () => {
      // Update local auth state
      const updatedUser = { 
        ...user, 
        is_premium: true, 
        subscription_tier: selectedPlan?.name || 'pro'
      };
      login(localStorage.getItem('token') || '', updatedUser as any);
      showAlert("Success", "Your subscription has been activated successfully!", "success");
    },
    onError: (err: any) => {
      showAlert("Payment Failed", err.response?.data?.detail || "Verification failed", "error");
    }
  });

  const orderMutation = useMutation({
    mutationFn: (planId: number) => stockService.createSubscriptionOrder(planId),
    onSuccess: async (res) => {
      if (res.data.status === 'success') {
         // Free plan case
         const updatedUser = { 
            ...user, 
            is_premium: false, 
            subscription_tier: 'free'
         };
         login(localStorage.getItem('token') || '', updatedUser as any);
         showAlert("Success", "Subscribed to free plan", "success");
         return;
      }

      const order = res.data;
      const resRazorpay = await loadRazorpay();

      if (!resRazorpay) {
        showAlert("Error", "Razorpay SDK failed to load. Are you online?", "error");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: "AI Stock Trader",
        description: `Subscription for ${selectedPlan.display_name}`,
        order_id: order.id,
        handler: (response: any) => {
          verifyMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: selectedPlan.id
          });
        },
        prefill: {
          name: user?.username,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    },
    onError: (err: any) => {
      showAlert("Error", "Could not create order: " + (err.response?.data?.detail || "Unknown error"), "error");
    }
  });

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    orderMutation.mutate(plan.id);
  };

  const getPlanIcon = (name: string) => {
    if (name === 'premium') return Crown;
    if (name === 'pro') return Zap;
    return User;
  };

  const getPlanColor = (name: string) => {
    if (name === 'premium') return 'text-yellow-500';
    if (name === 'pro') return 'text-blue-500';
    return 'text-slate-400';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile and subscription preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: 'general', name: 'General', icon: User },
            { id: 'subscription', name: 'Subscription', icon: CreditCard },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'preferences', name: 'Preferences', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-900'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-4"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Username</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium">
                      <User className="h-4 w-4 text-slate-400" />
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Email Address</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {/* Current Plan Card */}
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-6 flex items-center justify-between shadow-sm">
                  <div>
                     <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Plan</span>
                     <h4 className="text-2xl font-black text-slate-900 dark:text-white capitalize">{user?.subscription_tier || 'Free'}</h4>
                     {user?.subscription_expiry && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                           Expires on: {new Date(user.subscription_expiry).toLocaleDateString()}
                        </p>
                     )}
                  </div>
                  <div className={`p-4 rounded-2xl ${user?.is_premium ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500'}`}>
                     <Award className="h-8 w-8" />
                  </div>
               </div>

               {/* Plan Grid */}
               <div className="grid grid-cols-1 gap-4">
                  {plansLoading ? (
                     <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading subscription plans...</p>
                     </div>
                  ) : plans.map((plan: any) => {
                     const PlanIcon = getPlanIcon(plan.name);
                     const planColor = getPlanColor(plan.name);
                     const features = JSON.parse(plan.features || '[]');
                     
                     return (
                        <div key={plan.id} className={`bg-white dark:bg-slate-900 border ${user?.subscription_tier === plan.name ? 'border-blue-500 bg-blue-500/5' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm`}>
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-950 ${planColor}`}>
                                    <PlanIcon className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <h5 className="font-bold text-slate-900 dark:text-white">{plan.display_name}</h5>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{plan.price}{plan.price > 0 && <span className="text-xs font-normal text-slate-500 lowercase">/{plan.duration_days === 30 ? 'mo' : 'yr'}</span>}</p>
                                 </div>
                              </div>
                              {user?.subscription_tier === plan.name ? (
                                 <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase">Active</span>
                              ) : (
                                 <button 
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={orderMutation.isPending && selectedPlan?.id === plan.id}
                                    className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                 >
                                    {orderMutation.isPending && selectedPlan?.id === plan.id ? (
                                       <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : plan.price === 0 ? 'Switch' : 'Upgrade'}
                                 </button>
                              )}
                           </div>
                           <ul className="space-y-2">
                              {features.map((f: string, i: number) => (
                                 <li key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    {f}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     );
                  })}
               </div>

               {/* Invoices Section */}
               {invoices.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                     <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <FileText className="h-5 w-5 text-blue-500" />
                           Billing History
                        </h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                 <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                 <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Plan</th>
                                 <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                                 <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {invoices.map((inv: any) => (
                                 <tr key={inv.id}>
                                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-xs text-slate-900 dark:text-white font-bold capitalize">{inv.plan?.name}</td>
                                    <td className="px-6 py-4 text-xs text-slate-900 dark:text-white font-bold">₹{inv.amount}</td>
                                    <td className="px-6 py-4">
                                       <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                                          inv.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                       }`}>
                                          {inv.payment_status}
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Status</h3>
            </div>
            <div className="p-6">
              <div className={`flex items-center justify-between ${user?.is_premium ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'} border rounded-xl p-6 shadow-inner`}>
                <div>
                  <span className={`text-xs font-bold ${user?.is_premium ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest`}>
                     {user?.is_premium ? 'Premium Access' : 'Standard Access'}
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                     {user?.is_premium ? 'Full Enterprise Access' : 'Limited Free Access'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs leading-relaxed font-medium">
                    {user?.is_premium 
                      ? 'You have full access to all AI strategies, sentiment analysis, and advanced management tools.'
                      : 'Upgrade to Pro or Premium to unlock AI health coach, paper trading, and advanced analytics.'}
                  </p>
                </div>
                <div className={`${user?.is_premium ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'} p-3 rounded-full shadow-lg`}>
                  <Award className={`h-6 w-6 ${user?.is_premium ? 'text-white' : 'text-slate-500'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
