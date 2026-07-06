import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm?: () => void;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  confirmText = 'OK',
  onConfirm 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="h-12 w-12 text-emerald-500" />,
    error: <AlertCircle className="h-12 w-12 text-rose-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-amber-500" />,
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-rose-500/10 border-rose-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${colors[type]}`}>
                {React.cloneElement(icons[type] as React.ReactElement<any>, { className: 'h-5 w-5' })}
             </div>
             <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter italic">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-10 text-center space-y-8">
           <div className="flex justify-center">
              {icons[type]}
           </div>
           
           <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{message}</p>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={onConfirm || onClose}
                className="flex-grow bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl"
              >
                {confirmText}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
