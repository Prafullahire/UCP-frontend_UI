import React, { useEffect } from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import InstantReportsTab from './InstantReportsTab';
import ScheduledReportsTab from './ScheduledReportsTab';
import ScheduleDrawer from './ScheduleDrawer';
import SamplePreviewModal from './SamplePreviewModal';
import SuccessModal from './SuccessModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import Toast from '../../components/ui/Toast';

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReportsPage: React.FC = () => {
  const activeTab = useReportsStore((state) => state.activeTab);
  const setActiveTab = useReportsStore((state) => state.setActiveTab);
  const fetchReports = useReportsStore((state) => state.fetchReports);
  const toast = useReportsStore((state) => state.toast);

  // Fetch initial report configurations
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="page fade">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-.4px' }}>
            Reports
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
            Download instant reports or manage automated scheduled delivery
          </div>
        </div>
        <button
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => {
            window.location.reload();
          }}
        >
          {RefreshIcon}
          Refresh
        </button>
      </div>

      <div className="mod-tabs">
        <div
          className={`mod-tab ${activeTab === 'instant' ? 'on' : ''}`}
          id="tabInstant"
          onClick={() => setActiveTab('instant')}
        >
          Instant Reports
        </div>
        <div
          className={`mod-tab ${activeTab === 'scheduled' ? 'on' : ''}`}
          id="tabScheduled"
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Reports
        </div>
      </div>

      {activeTab === 'instant' ? <InstantReportsTab /> : <ScheduledReportsTab />}

      {/* Drawer and Modals */}
      <ScheduleDrawer />
      <SamplePreviewModal />
      <SuccessModal />
      <DeleteConfirmationModal />
      
      {/* Toast Alert Notifications */}
      {toast && <Toast />}
    </div>
  );
};

export default ReportsPage;
