'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { CookJob, formatTL, formatCookDate } from '@/lib/cook-storage';

interface CalendarScreenProps {
  jobs: CookJob[];
  onSelectJob: (job: CookJob) => void;
  onAddNewJobForDate: (dateStr: string) => void;
}

const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS = [
  { short: 'Pzt', full: 'Pazartesi' },
  { short: 'Sal', full: 'Salı' },
  { short: 'Çar', full: 'Çarşamba' },
  { short: 'Per', full: 'Perşembe' },
  { short: 'Cum', full: 'Cuma' },
  { short: 'Cmt', full: 'Cumartesi', isWeekend: true },
  { short: 'Paz', full: 'Pazar', isWeekend: true },
];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  jobs,
  onSelectJob,
  onAddNewJobForDate,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayStr);

  // Group jobs by date (YYYY-MM-DD)
  const jobsByDate = useMemo(() => {
    const map = new Map<string, CookJob[]>();
    jobs.forEach((job) => {
      if (!job.date) return;
      const list = map.get(job.date) || [];
      list.push(job);
      map.set(job.date, list);
    });
    return map;
  }, [jobs]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Build grid days for currentMonth & currentYear
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // In JS, getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // In Turkey, week starts on Monday: Monday = 0, Tuesday = 1, ..., Sunday = 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      jobs: CookJob[];
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      const dayOfWeek = days.length % 7;
      days.push({
        dayNumber: pDay,
        dateStr,
        isCurrentMonth: false,
        jobs: jobsByDate.get(dateStr) || [],
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek >= 5,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = days.length % 7;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        jobs: jobsByDate.get(dateStr) || [],
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek >= 5,
      });
    }

    // Next month padding to fill remaining row (total 35 or 42 cells)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let n = 1; n <= remainingSlots; n++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const dayOfWeek = days.length % 7;
      days.push({
        dayNumber: n,
        dateStr,
        isCurrentMonth: false,
        jobs: jobsByDate.get(dateStr) || [],
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek >= 5,
      });
    }

    return days;
  }, [currentYear, currentMonth, jobsByDate, todayStr]);

  // Statistics for the current month
  const monthStats = useMemo(() => {
    let bookedDays = 0;
    let totalJobsInMonth = 0;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayJobs = jobsByDate.get(dateStr) || [];
      if (dayJobs.length > 0) {
        bookedDays += 1;
        totalJobsInMonth += dayJobs.length;
      }
    }

    return {
      bookedDays,
      emptyDays: Math.max(0, daysInMonth - bookedDays),
      totalJobsInMonth,
    };
  }, [currentYear, currentMonth, jobsByDate]);

  // Selected date details
  const selectedDayJobs = jobsByDate.get(selectedDateStr) || [];
  const isSelectedDateBooked = selectedDayJobs.length > 0;

  return (
    <div className="space-y-4">
      {/* 1. Month Header & Fast Navigation */}
      <div className="rounded-3xl border-2 border-slate-900 bg-slate-900 p-4 sm:p-5 text-white shadow-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Month Button */}
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Önceki Ay"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Month & Year Title */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {TURKISH_MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleGoToday}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                Bugüne Git
              </button>
            </div>
          </div>

          {/* Next Month Button */}
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Sonraki Ay"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>

        {/* Month Summary Bar */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-center">
          <div className="rounded-2xl bg-rose-950/60 border border-rose-800/60 p-2.5">
            <div className="text-xs font-bold text-rose-300">🔴 Dolu Günler</div>
            <div className="text-xl font-black text-rose-400 font-mono">
              {monthStats.bookedDays} Gün ({monthStats.totalJobsInMonth} Düğün)
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800/60 p-2.5">
            <div className="text-xs font-bold text-emerald-300">🟢 Boş / Müsait Günler</div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {monthStats.emptyDays} Gün Boş
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calendar Grid */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
        {/* Weekday Names Header */}
        <div className="grid grid-cols-7 gap-1 text-center pb-2 mb-2 border-b border-slate-200">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.short}
              className={`text-xs font-black uppercase ${
                wd.isWeekend ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <span>{wd.short}</span>
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const hasJobs = cell.jobs.length > 0;

            return (
              <button
                key={`${cell.dateStr}_${idx}`}
                type="button"
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-2xl min-h-[58px] sm:min-h-[64px] border-2 transition-all relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500'
                    : hasJobs
                    ? 'border-rose-200 bg-rose-50/80 hover:border-rose-400'
                    : cell.isCurrentMonth
                    ? 'border-slate-100 bg-white hover:border-slate-300'
                    : 'border-transparent bg-slate-50/60 opacity-40'
                }`}
              >
                {/* Day Number + Today Marker */}
                <div className="flex items-center justify-center w-full">
                  <span
                    className={`text-sm sm:text-base font-black ${
                      cell.isToday
                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs'
                        : isSelected
                        ? 'text-blue-900'
                        : hasJobs
                        ? 'text-rose-900'
                        : cell.isWeekend
                        ? 'text-blue-700'
                        : 'text-slate-800'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="w-full flex items-center justify-center mt-0.5">
                  {hasJobs ? (
                    <div className="w-full text-center">
                      <span className="inline-block rounded-md bg-rose-600 px-1 py-0.5 text-[9px] sm:text-[10px] font-black text-white leading-none truncate max-w-full">
                        DOLU
                      </span>
                    </div>
                  ) : cell.isCurrentMonth ? (
                    <span className="text-[9px] font-bold text-slate-300">
                      Boş
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Day Details Panel */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-md space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isSelectedDateBooked
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seçilen Günün Durumu
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {formatCookDate(selectedDateStr)}
              </h3>
            </div>
          </div>

          <div>
            {isSelectedDateBooked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{selectedDayJobs.length} İş Kayıtlı (DOLU)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>BOŞ (Müsait Gün)</span>
              </span>
            )}
          </div>
        </div>

        {/* Jobs on this date */}
        {isSelectedDateBooked ? (
          <div className="space-y-3 pt-1">
            {selectedDayJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{job.guestCount} Kişilik</span>
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{job.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 block">Ücret</span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatTL(job.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {job.status === 'completed' ? 'Tamamlanmış İş' : 'Aktif Düğün İşi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectJob(job)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 min-h-[44px]"
                  >
                    <span>İş Defterini Aç</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Quick button to add another job to the same day */}
            <button
              type="button"
              onClick={() => onAddNewJobForDate(selectedDateStr)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-black text-slate-700 hover:border-blue-600 hover:text-blue-600 min-h-[48px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Bu Güne Ekstra Bir İş Daha Yaz</span>
            </button>
          </div>
        ) : (
          <div className="pt-1 space-y-4">
            <p className="text-sm font-semibold text-slate-500">
              Bu tarihe kayıtlı herhangi bir düğün, hayır veya yemek işiniz yok. Bu gün için gelen teklifleri rahatça kabul edebilirsiniz.
            </p>

            <button
              type="button"
              onClick={() => onAddNewJobForDate(selectedDateStr)}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 px-6 text-base sm:text-lg font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-98 transition-all min-h-[56px]"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
              <span>Bu Güne Yeni Düğün / Yemek Ekle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
