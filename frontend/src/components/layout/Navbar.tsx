import { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBasket, 
  TrendingUp, 
  User as UserIcon, 
  Menu, 
  X,
  LogOut,
  Sun,
  Moon,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { stockService } from '../../services/api';
import type { DailyPick } from '../../types';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: picksData } = useQuery({
    queryKey: ['dailyPicks'],
    queryFn: () => stockService.getDailyPicks(),
    refetchInterval: 60000 * 5, // Every 5 minutes
  });

  const picks: DailyPick[] = picksData?.data?.picks || [];
  const [currentPickIdx, setCurrentPickIdx] = useState(0);

  useEffect(() => {
    if (picks.length > 0) {
      const interval = setInterval(() => {
        setCurrentPickIdx((prev) => (prev + 1) % picks.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [picks]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Zap },
    { name: 'Screener', path: '/screener', icon: Search },
    { name: 'Backtest', path: '/backtest', icon: Activity },
    { name: 'Portfolio', path: '/baskets', icon: ShoppingBasket },
    { name: 'Finance', path: '/finance', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-full sticky top-0 z-50">
      {/* Daily AI Pick Banner */}
      {picks.length > 0 && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white py-1.5 px-4 overflow-hidden relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="bg-white/20 text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                <Zap className="h-3 w-3 fill-current" /> Daily AI Pick
              </span>
              <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-500">
                <span className="font-black tracking-tight">{picks[currentPickIdx].symbol}</span>
                <span className="text-blue-100 text-xs font-medium hidden sm:inline opacity-90 truncate max-w-md italic">
                  "{picks[currentPickIdx].reasoning}"
                </span>
                <span className="bg-emerald-400 text-blue-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  {picks[currentPickIdx].signal_type}
                </span>
              </div>
            </div>
            <Link to={`/stock/${picks[currentPickIdx].symbol}`} className="text-white/80 hover:text-white transition-colors">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Progress bar for the ticker */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 transition-all duration-[5000ms] ease-linear" style={{ width: `${((currentPickIdx + 1) / picks.length) * 100}%` }}></div>
        </div>
      )}

      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI Stock<span className="text-blue-600 dark:text-blue-500">Trader</span></span>
              </Link>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-white' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.username}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 border border-slate-200 dark:border-slate-800">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 mr-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                      isActive 
                        ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-white' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <UserIcon className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-300"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
