import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex justify-center transition-colors duration-300">
      <div className="w-full flex flex-col border-x border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
        <Navbar />
        <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
        <footer className="bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/50 py-8">
          <div className="w-full px-4 text-center">
            <p className="text-slate-500 text-sm font-medium">&copy; {new Date().getFullYear()} AI Stock Trader. Enterprise Edition.</p>
            <p className="text-slate-400 dark:text-slate-600 text-[10px] mt-1 uppercase tracking-widest">Built for High Performance Trading</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
