import React from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import { reportsApi } from '../../services/reportsApi';

export interface ReportCardProps {
  /** Background color CSS variable for the icon container (e.g. `var(--bl)`) */
  iconBg: string;
  /** Stroke color CSS variable for the icon SVG (e.g. `var(--blue)`) */
  iconStroke: string;
  /** Inner SVG paths (already inside <svg>) */
  iconSvg: React.ReactNode;
  /** Card title */
  title: string;
  /** Card body description */
  description: string;
  /** Sample modal type key (matches SamplePreviewModal SAMP_TABS) */
  sampleType: string;
  /** Label passed to download/sample API */
  reportName: string;
  /** Optional extra content rendered below description (e.g. perf type pills) */
  extraContent?: React.ReactNode;
  /** Span full row in the .ir-grid (used for Performance Report) */
  fullWidth?: boolean;
}

const DownloadIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" width="12" height="12">
    <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M2 7c2-4 8-4 10 0s-8 4-10 0z" />
    <circle cx="7" cy="7" r="2" />
  </svg>
);

export const ReportCard: React.FC<ReportCardProps> = ({
  iconBg,
  iconStroke,
  iconSvg,
  title,
  description,
  sampleType,
  reportName,
  extraContent,
  fullWidth = false,
}) => {
  const showToast = useReportsStore((s) => s.showToast);
  const openSample = useReportsStore((s) => s.openSample);
  const dateFilter = useReportsStore((s) => s.dateFilter);

  const handleDownload = async () => {
    showToast(`⬇ Preparing "${reportName}"…`);
    try {
      const success = await reportsApi.downloadReport(reportName, dateFilter);
      if (success === false) {
        showToast(`❌ No data found for "${reportName}" in this date range.`);
      } else {
        showToast(`✓ "${reportName}" downloaded`);
      }
    } catch {
      showToast(`❌ Failed to download "${reportName}"`);
    }
  };

  return (
    <div className="ir-card" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div>
        <div className="ir-card-ico" style={{ background: iconBg }}>
          <svg viewBox="0 0 20 20" fill="none" stroke={iconStroke} strokeWidth="1.5" width="18" height="18">
            {iconSvg}
          </svg>
        </div>
        <div className="ir-card-title">{title}</div>
        <div className="ir-card-desc">{description}</div>
        {extraContent}
      </div>
      <div className="ir-actions">
        <button className="btn btn-p btn-sm" onClick={handleDownload}>
          <DownloadIcon />
          Download Report
        </button>
        <button className="btn-ghost-blue" onClick={() => openSample(sampleType, title)}>
          <EyeIcon />
          View Sample Report
        </button>
      </div>
    </div>
  );
};

export default ReportCard;
