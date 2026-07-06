import { Outlet, NavLink } from 'react-router-dom';
import { 
  PiggyBank, ShieldCheck, Flame, Coins, Landmark
} from 'lucide-react';

const FinanceLayout = () => {

  const tabs = [
    { path: '/finance/goals', name: 'Savings Goals', icon: TargetIcon },
    { path: '/finance/emergency-fund', name: 'Emergency Fund', icon: PiggyBank },
    { path: '/finance/insurance', name: 'Insurance Policies', icon: ShieldCheck },
    { path: '/finance/fire-planner', name: 'FIRE Planner', icon: Flame },
    { path: '/finance/alternatives', name: 'Alternative Assets', icon: Coins },
    { path: '/finance/networth', name: 'Net Worth', icon: Landmark },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Finance & Planning</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track goals, secure emergency cushions, manage insurance, and plan for financial freedom.</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 md:gap-0">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-605 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <Outlet />
      </div>
    </div>
  );
};

export default FinanceLayout;

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
