'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  MapPin,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import {
  CookJob,
  formatTL,
  getRemainingBalance,
  getTotalPaid,
} from '@/lib/cook-storage';

interface JobCardProps {
  job: CookJob;
  onSelect: (job: CookJob) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect }) => {
  const remaining = getRemainingBalance(job);
  const totalPaid = getTotalPaid(job);

  // Date parsing
  const parts = (job.date || '').split('-');
  const dayNum = parts[2] || '01';
  const monthNames = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
  ];
  const monthText = monthNames[Number(parts[1]) - 1] || 'Gün';

  const purchasedCount = (job.ingredients || []).filter((i) => i.purchased).length;
  const totalIngredients = (job.ingredients || []).length;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(job)}
      className={`group cursor-pointer rounded-3xl border-2 p-5 transition-all bg-white hover:border-blue-500 shadow-sm ${
        job.status === 'completed'
          ? 'border-slate-200 opacity-70'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Date Box */}
        <div className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            {monthText}
          </span>
          <span className="text-2xl sm:text-3xl font-black leading-none">{dayNum}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {job.title}
            </h3>
            {job.status === 'completed' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tamamlandı
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{job.guestCount} Kişilik</span>
            </span>

            {job.location && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{job.location}</span>
              </span>
            )}
          </div>

          {/* Badges: Market & Balance */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <div className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              Kalan:{' '}
              <span className={`font-mono font-black ${
                remaining > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {formatTL(remaining)}
              </span>
            </div>

            {totalIngredients > 0 && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pazar: {purchasedCount}/{totalIngredients}</span>
              </div>
            )}

            {totalPaid > 0 && (
              <div className="hidden sm:flex rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Alınan: {formatTL(totalPaid)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Arrow */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
