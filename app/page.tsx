'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Utensils,
  Download,
  Upload,
} from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { BottomNav, NavTabType } from '@/components/bottom-nav';
import { JobCard } from '@/components/job-card';
import { JobWizardModal } from '@/components/job-wizard-modal';
import { JobDetailModal } from '@/components/job-detail-modal';
import { ShoppingScreen } from '@/components/shopping-screen';
import { LedgerScreen } from '@/components/ledger-screen';
import { CalendarScreen } from '@/components/calendar-screen';
import {
  CookJob,
  GeneralTransaction,
  subscribeStorage,
  getJobsSnapshot,
  getJobsServerSnapshot,
  getTransactionsSnapshot,
  getTransactionsServerSnapshot,
  saveJobs,
  saveGeneralTransactions,
  formatTL,
  getTotalReceivables,
} from '@/lib/cook-storage';
import {
  subscribeAppMode,
  getAppModeSnapshot,
  getAppModeServerSnapshot,
  setAppMode,
} from '@/lib/app-mode';
import { ModeSelectorScreen } from '@/components/mode-selector-screen';
import { SimpleHome } from '@/components/simple-mode/simple-home';

export default function HomePage() {
  // Hydration-safe external store subscriptions (Zero SSR-client mismatch, zero effect setState)
  const isHydrated = useSyncExternalStore(
    subscribeStorage,
    () => true,
    () => false
  );

  const appMode = useSyncExternalStore(
    subscribeAppMode,
    getAppModeSnapshot,
    getAppModeServerSnapshot
  );

  const jobs = useSyncExternalStore(
    subscribeStorage,
    getJobsSnapshot,
    getJobsServerSnapshot
  );

  const generalTransactions = useSyncExternalStore(
    subscribeStorage,
    getTransactionsSnapshot,
    getTransactionsServerSnapshot
  );

  // Navigation State: 4 Main Tabs (İşler, Takvim, Alışveriş, Kasa)
  const [activeNavTab, setActiveNavTab] = useState<NavTabType>('jobs');

  // Sub-tab for Jobs: Aktif vs Tamamlananlar
  const [jobSubTab, setJobSubTab] = useState<'active' | 'completed'>('active');

  // Modals & Wizard date
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialDate, setWizardInitialDate] = useState<string | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<CookJob | null>(null);

  // Add Job
  const handleSaveJob = (newJobData: Omit<CookJob, 'id' | 'createdAt'>) => {
    const job: CookJob = {
      ...newJobData,
      id: 'job_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    saveJobs([job, ...jobs]);
    setJobSubTab('active');
  };

  // Update Job (payments, ingredients, etc.)
  const handleUpdateJob = (updatedJob: CookJob) => {
    saveJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    if (selectedJob && selectedJob.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
  };

  // Toggle Completed / Active status
  const handleToggleStatus = (id: string) => {
    saveJobs(
      jobs.map((j) =>
        j.id === id
          ? { ...j, status: j.status === 'active' ? 'completed' : 'active' }
          : j
      )
    );

    if (selectedJob && selectedJob.id === id) {
      setSelectedJob((prev) =>
        prev
          ? { ...prev, status: prev.status === 'active' ? 'completed' : 'active' }
          : null
      );
    }
  };

  // Delete Job
  const handleDeleteJob = (id: string) => {
    saveJobs(jobs.filter((j) => j.id !== id));
    if (selectedJob?.id === id) {
      setSelectedJob(null);
    }
  };

  // Add General / Job Transaction from Ledger
  const handleAddGeneralTransaction = (
    t: Omit<GeneralTransaction, 'id'>,
    linkToJob = false
  ) => {
    const transactionId = 'gen_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const transaction: GeneralTransaction = {
      ...t,
      id: transactionId,
    };

    // If this transaction is an income linked to an active job, also record it as a payment in the job
    if (linkToJob && t.jobId && t.type === 'income') {
      saveJobs(
        jobs.map((job) => {
          if (job.id === t.jobId) {
            const newPayment = {
              id: 'pay_' + transactionId,
              amount: t.amount,
              date: t.date,
              note: t.title || 'Kasa Tahsilatı',
            };
            return {
              ...job,
              payments: [...(job.payments || []), newPayment],
            };
          }
          return job;
        })
      );
    }

    saveGeneralTransactions([transaction, ...generalTransactions]);
  };

  // Delete General Transaction
  const handleDeleteGeneralTransaction = (id: string) => {
    saveGeneralTransactions(generalTransactions.filter((t) => t.id !== id));
  };

  // Backup / Export
  const handleExportBackup = () => {
    const backupData = { jobs, generalTransactions };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `asci_defteri_tam_yedek_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore / Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.jobs)) {
          saveJobs(parsed.jobs);
          if (Array.isArray(parsed.generalTransactions)) {
            saveGeneralTransactions(parsed.generalTransactions);
          }
          alert('Tüm defter yedekten başarıyla yüklendi!');
        } else if (Array.isArray(parsed)) {
          saveJobs(parsed);
          alert('İşler yedekten başarıyla yüklendi!');
        } else {
          alert('Geçersiz yedek dosyası.');
        }
      } catch {
        alert('Dosya okunurken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered jobs
  const activeJobs = jobs
    .filter((j) => j.status === 'active')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedJobs = jobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedJobs = jobSubTab === 'active' ? activeJobs : completedJobs;

  // Counts for bottom navigation
  const pendingShoppingCount = activeJobs.reduce((sum, j) => {
    const pendingInJob = (j.ingredients || []).filter((i) => !i.purchased).length;
    return sum + pendingInJob;
  }, 0);

  const totalActiveReceivables = getTotalReceivables(jobs);

  const openNewJobWizard = (customDate?: string) => {
    setWizardInitialDate(customDate);
    setIsWizardOpen(true);
  };

  // 1. Loading state identical on server and client before hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <TopBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white animate-pulse shadow-md">
            <Utensils className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-800">Aşçı Defteri Açılıyor...</h2>
            <p className="text-xs font-semibold text-slate-400">Verileriniz yükleniyor</p>
          </div>
        </main>
        <BottomNav
          activeTab="jobs"
          onSelectTab={() => {}}
          activeJobsCount={0}
          pendingShoppingCount={0}
        />
      </div>
    );
  }

  // 2. First-time visitor without chosen mode -> Show Mode Selector
  if (!appMode) {
    return <ModeSelectorScreen onSelectMode={(mode) => setAppMode(mode)} />;
  }

  // 3. Simple Mode -> Ultra-simple 3-module senior cook notebook
  if (appMode === 'simple') {
    return <SimpleHome onSwitchToAdvanced={() => setAppMode('advanced')} />;
  }

  // 4. Advanced Mode -> Full-featured Recipe, Ingredient, Ledger and Calendar notebook
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Bar with Kolay Mod switcher */}
      <TopBar onSwitchToSimple={() => setAppMode('simple')} />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4 py-4 sm:py-5 space-y-5 pb-36">
        {/* ==================== TAB 1: İŞ DEFTERİ ==================== */}
        {activeNavTab === 'jobs' && (
          <div className="space-y-4">
            {/* Quick Receivables Banner */}
            {activeJobs.length > 0 && (
              <div className="rounded-3xl border-2 border-slate-900 bg-slate-900 p-4 sm:p-5 text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Düğünlerden Bekleyen Alacak
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-400">
                    {formatTL(totalActiveReceivables)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300">
                    {activeJobs.length} Aktif İş
                  </span>
                </div>
              </div>
            )}

            {/* Sub-Tabs: Aktif İşler vs Tamamlananlar */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/90 rounded-3xl">
              <button
                onClick={() => setJobSubTab('active')}
                type="button"
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[56px] ${
                  jobSubTab === 'active'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Aktif İşler</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    jobSubTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {activeJobs.length}
                </span>
              </button>

              <button
                onClick={() => setJobSubTab('completed')}
                type="button"
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[56px] ${
                  jobSubTab === 'completed'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Tamamlananlar</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    jobSubTab === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {completedJobs.length}
                </span>
              </button>
            </div>

            {/* Jobs List */}
            <div className="space-y-3.5">
              {displayedJobs.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center space-y-4">
                  <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                    <Utensils className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">
                      {jobSubTab === 'active' ? 'Henüz Kayıtlı İş Yok' : 'Tamamlanmış İş Bulunmuyor'}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto">
                      {jobSubTab === 'active'
                        ? 'Yeni bir düğün, mevlit veya hayır yemeği kaydetmek için aşağıdaki butona dokunun.'
                        : 'Hesabı kapatılan ve biten işleriniz burada güvenle arşivlenir.'}
                    </p>
                  </div>

                  {jobSubTab === 'active' && (
                    <button
                      type="button"
                      onClick={() => openNewJobWizard()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all min-h-[56px]"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                      <span>İlk İşi Deftere Ekle</span>
                    </button>
                  )}
                </div>
              ) : (
                displayedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSelect={(j) => setSelectedJob(j)}
                  />
                ))
              )}
            </div>

            {/* Floating New Job Button (only in jobs tab) */}
            <div className="fixed bottom-22 left-0 right-0 z-30 px-4 pointer-events-none">
              <div className="mx-auto max-w-2xl pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openNewJobWizard()}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 px-6 text-lg sm:text-xl font-black text-white shadow-2xl shadow-blue-600/50 hover:bg-blue-700 active:scale-98 transition-all min-h-[60px]"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                  <span>Yeni Düğün / Yemek Ekle</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: TAKVİM (DOLU / BOŞ GÜNLER) ==================== */}
        {activeNavTab === 'calendar' && (
          <CalendarScreen
            jobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
            onAddNewJobForDate={(dateStr) => openNewJobWizard(dateStr)}
          />
        )}

        {/* ==================== TAB 3: PAZAR & ALIŞVERİŞ ==================== */}
        {activeNavTab === 'shopping' && (
          <ShoppingScreen
            jobs={jobs}
            onUpdateJob={handleUpdateJob}
            onNavigateToJobs={() => openNewJobWizard()}
          />
        )}

        {/* ==================== TAB 4: CARİ DEFTER & KASA ==================== */}
        {activeNavTab === 'ledger' && (
          <LedgerScreen
            jobs={jobs}
            generalTransactions={generalTransactions}
            onAddGeneralTransaction={handleAddGeneralTransaction}
            onDeleteGeneralTransaction={handleDeleteGeneralTransaction}
          />
        )}

        {/* Backup & Restore Bar (shown across all tabs at bottom) */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 px-2 flex-wrap gap-3">
          <span>Tüm veriler telefonunuzda saklanır (İnternetsiz).</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={jobs.length === 0 && generalTransactions.length === 0}
              className="flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yedek İndir</span>
            </button>

            <label className="flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Yedek Yükle</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </main>

      {/* 4-Tab Thumb-Zone Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        activeJobsCount={activeJobs.length}
        pendingShoppingCount={pendingShoppingCount}
      />

      {/* Full Screen Step Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <JobWizardModal
            key={wizardInitialDate || 'wizard_open'}
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onSaveJob={handleSaveJob}
            initialDate={wizardInitialDate}
          />
        )}
      </AnimatePresence>

      {/* Job Detail & Actions Modal */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onUpdateJob={handleUpdateJob}
            onToggleStatus={handleToggleStatus}
            onDeleteJob={handleDeleteJob}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
