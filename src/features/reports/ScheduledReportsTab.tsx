import React from 'react';
import ScheduledReportsTable from './ScheduledReportsTable';
import { useReportsStore } from '../../store/useReportsStore';

export const ScheduledReportsTab: React.FC = () => {
  const openDrawer = useReportsStore((state) => state.openDrawer);

  return (
    <div id="panelScheduled">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-p" onClick={() => openDrawer(null)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          Schedule Report
        </button>
      </div>
      <ScheduledReportsTable />
    </div>
  );
};

export default ScheduledReportsTab;
