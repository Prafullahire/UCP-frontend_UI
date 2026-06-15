import { create } from 'zustand';
import type { ScheduledReport, DateFilterState } from '../types/reports';
import { reportsApi } from '../services/reportsApi';

interface ReportsStoreState {
  reports: ScheduledReport[];
  loading: boolean;
  activeTab: 'instant' | 'scheduled';
  dateFilter: DateFilterState;
  toast: { message: string; visible: boolean } | null;
  
  // Modals & Drawer state
  drawer: { open: boolean; editingId: number | null };
  samplePreview: { open: boolean; type: string; title: string } | null;
  deleteConfirm: { open: boolean; id: number | null } | null;
  successModal: { open: boolean; title: string; rtype: string; freq: string } | null;

  /* Wallet recharge popup — surfaced via the topbar wallet pill AND
     the "+ Recharge Wallet" CTA on the Wallet Transactions screen. A
     single store slot keeps both call-sites in sync and lets us mount
     the modal once at the layout root instead of per-page. */
  walletRecharge: { open: boolean };
  walletBalance: number;

  // Actions
  fetchReports: () => Promise<void>;
  addReport: (report: Omit<ScheduledReport, 'id'>) => void;
  updateReport: (id: number, report: Partial<ScheduledReport>) => void;
  deleteReport: (id: number) => void;
  toggleReportEnabled: (id: number) => void;
  
  setActiveTab: (tab: 'instant' | 'scheduled') => void;
  setDateFilter: (filter: DateFilterState) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  
  openDrawer: (editingId?: number | null) => void;
  closeDrawer: () => void;
  openSample: (type: string, title: string) => void;
  closeSample: () => void;
  openDeleteConfirm: (id: number) => void;
  closeDeleteConfirm: () => void;
  openSuccess: (title: string, rtype: string, freq: string) => void;
  closeSuccess: () => void;
  openWalletRecharge: () => void;
  closeWalletRecharge: () => void;
}

export const useReportsStore = create<ReportsStoreState>((set, get) => ({
  reports: [],
  loading: false,
  activeTab: 'instant',
  dateFilter: {
    type: 'last30',
    label: 'Last 30 Days',
    startDate: '2026-04-25',
    endDate: '2026-05-25',
  },
  toast: null,
  drawer: { open: false, editingId: null },
  samplePreview: null,
  deleteConfirm: null,
  successModal: null,
  walletRecharge: { open: false },
  walletBalance: 1741.32,

  fetchReports: async () => {
    set({ loading: true });
    try {
      const reports = await reportsApi.fetchInitialScheduledReports();
      set({ reports, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  addReport: async (reportData) => {
    const newReport = await reportsApi.createScheduleReport(reportData);
    if (newReport) {
      newReport.isNew = true;
      set((state) => ({
        reports: [newReport, ...state.reports],
      }));
      // Remove isNew animation flag after 3 seconds
      setTimeout(() => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === newReport.id ? { ...r, isNew: false } : r
          ),
        }));
      }, 3000);
    } else {
      get().showToast('Failed to create report schedule');
    }
  },

  updateReport: async (id, reportData) => {
    const success = await reportsApi.updateScheduleReport(id, reportData);
    if (success) {
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id ? { ...r, ...reportData } : r
        ),
      }));
    } else {
      get().showToast('Failed to update report schedule');
    }
  },

  deleteReport: async (id) => {
    const success = await reportsApi.deleteScheduleReport(id);
    if (success) {
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      }));
    } else {
      get().showToast('Failed to delete report schedule');
    }
  },

  toggleReportEnabled: async (id) => {
    const report = get().reports.find(r => r.id === id);
    if (!report) return;
    const newStatus = !report.enabled;
    const success = await reportsApi.updateScheduleReport(id, { ...report, enabled: newStatus });
    
    if (success) {
      set((state) => {
        const reports = state.reports.map((r) => {
          if (r.id === id) {
            // Trigger toast
            setTimeout(() => {
              get().showToast(`${newStatus ? 'Enabled' : 'Disabled'}: ${r.title}`);
            }, 0);
            return { ...r, enabled: newStatus };
          }
          return r;
        });
        return { reports };
      });
    } else {
      get().showToast('Failed to toggle report status');
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setDateFilter: (dateFilter) => set({ dateFilter }),

  showToast: (message) => {
    // Clear previous toast timer if any
    // const toast = get().toast;
    set({ toast: { message, visible: true } });
  },

  hideToast: () => {
    set((state) => (state.toast ? { toast: { ...state.toast, visible: false } } : {}));
  },

  openDrawer: (editingId = null) => {
    set({ drawer: { open: true, editingId } });
  },

  closeDrawer: () => {
    set({ drawer: { open: false, editingId: null } });
  },

  openSample: (type, title) => {
    set({ samplePreview: { open: true, type, title } });
  },

  closeSample: () => {
    set({ samplePreview: null });
  },

  openDeleteConfirm: (id) => {
    set({ deleteConfirm: { open: true, id } });
  },

  closeDeleteConfirm: () => {
    set({ deleteConfirm: null });
  },

  openSuccess: (title, rtype, freq) => {
    set({ successModal: { open: true, title, rtype, freq } });
  },

  closeSuccess: () => {
    set({ successModal: null });
  },

  openWalletRecharge: () => {
    set({ walletRecharge: { open: true } });
  },

  closeWalletRecharge: () => {
    set({ walletRecharge: { open: false } });
  },
}));
