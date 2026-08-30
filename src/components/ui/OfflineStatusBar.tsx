import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { useConnectivity } from '../../hooks/useConnectivity';

export const OfflineStatusBar: React.FC = () => {
  const { status, isOffline, pendingSyncCount, triggerSync } = useConnectivity();

  return (
    <AnimatePresence>
      {(isOffline || pendingSyncCount > 0 || status === 'SYNCING') && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full z-40 px-4 py-2 flex items-center justify-between text-xs border-b backdrop-blur-md"
          style={{
            backgroundColor: isOffline 
              ? 'rgba(234, 88, 12, 0.12)' 
              : status === 'SYNCING'
                ? 'rgba(59, 130, 246, 0.12)'
                : 'rgba(16, 185, 129, 0.12)',
            borderColor: isOffline
              ? 'rgba(234, 88, 12, 0.3)'
              : status === 'SYNCING'
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(16, 185, 129, 0.3)',
            color: isOffline ? '#fdba74' : status === 'SYNCING' ? '#93c5fd' : '#86efac'
          }}
        >
          <div className="flex items-center gap-2.5 max-w-full overflow-hidden">
            {isOffline ? (
              <span className="p-1 rounded bg-orange-500/20 text-orange-400 flex-shrink-0">
                <WifiOff size={14} />
              </span>
            ) : status === 'SYNCING' ? (
              <span className="p-1 rounded bg-blue-500/20 text-blue-400 flex-shrink-0 animate-spin">
                <RefreshCw size={14} />
              </span>
            ) : (
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                <CheckCircle2 size={14} />
              </span>
            )}

            <div className="flex items-center gap-2 truncate">
              <span className="font-bold tracking-wider uppercase text-[11px]">
                {isOffline ? 'OFFLINE TACTICAL MODE' : status === 'SYNCING' ? 'SYNCING TO CLOUD' : 'LOCAL ENGINE READY'}
              </span>
              <span className="text-zinc-400 hidden sm:inline">•</span>
              <span className="text-zinc-300 hidden md:inline flex items-center gap-1">
                <Database size={11} className="inline text-amber-400" />
                IndexedDB & Local AI Veracity Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {pendingSyncCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingSyncCount} {pendingSyncCount === 1 ? 'Action' : 'Actions'} Pending Sync
              </span>
            )}

            {!isOffline && pendingSyncCount > 0 && (
              <button
                type="button"
                onClick={triggerSync}
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
              >
                <RefreshCw size={11} className={status === 'SYNCING' ? 'animate-spin' : ''} />
                Sync Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
