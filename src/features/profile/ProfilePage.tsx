import React, { useState } from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import Toast from '../../components/ui/Toast';

/* ──────────────────────────────────────────────────────────────
 * Profile (Orders → Topbar → Account → Profile)
 *
 * Lays out the KYC onboarding screen captured in the supplied
 * reference image. Visual styling is built entirely on the existing
 * XB Sellportal primitives so the screen lands feeling native:
 *
 *   • Page chrome      — `.page` + `.ord-ph` / `.ord-ph-title`
 *   • Form card        — `.ord-nf-card` + `.ord-nf-card-hdr`
 *   • Form fields      — `.sup-mf` / `.sup-ml` / `.sup-mi` / `.sup-mi-ta`
 *   • Primary CTA      — `.ord-cta.ord-cta-p`
 *   • Step indicator   — new `.pf-stepper` recipe (added to profile.css)
 *
 * The first step ("KYC Details") is fully wired with mock state.
 * The remaining three steps are surfaced in the stepper but stay
 * inert / preview-only so the screen advertises the full flow
 * without forking work that wasn't requested in the brief.
 * ──────────────────────────────────────────────────────────────── */

type StepId = 'kyc' | 'company' | 'bank' | 'agreement';

interface StepSpec {
  id: StepId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const Req: React.FC = () => <span style={{ color: 'var(--red)' }}>*</span>;

/* ── Step icons — outline SVGs sized to fit the 36px tile ───── */
const KycIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <rect x="3" y="3" width="14" height="14" rx="2.5" />
    <circle cx="10" cy="9" r="2.2" />
    <path d="M6 15c.8-1.8 2.4-2.8 4-2.8s3.2 1 4 2.8" />
  </svg>
);
const CompanyIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <circle cx="7" cy="7.5" r="2.5" />
    <circle cx="13" cy="7.5" r="2.5" />
    <path d="M2.5 16c.7-2.4 2.3-3.5 4.5-3.5S10.8 13.6 11.5 16M9 16c.7-2.4 2.3-3.5 4.5-3.5S17.3 13.6 18 16" />
  </svg>
);
const BankIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M3.5 14h13M4.5 14V8.5M9.5 14V8.5M14.5 14V8.5M3 8.5L10 4l7 4.5M3.5 16.5h13" />
  </svg>
);
const AgreementIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M5 2.5h7l3 3v12H5z" />
    <path d="M8 9h5M8 12h5M8 15h3" />
  </svg>
);
const ChevIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <path d="M6 4l4 4-4 4" />
  </svg>
);
const VerifiedIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
    <path d="M3.5 8.3l3 3 6-6" />
  </svg>
);

const STEPS: StepSpec[] = [
  { id: 'kyc',       title: 'KYC',          subtitle: 'Details', icon: KycIcon },
  { id: 'company',   title: 'Company Info', subtitle: 'Details', icon: CompanyIcon },
  { id: 'bank',      title: 'Bank',         subtitle: 'Details', icon: BankIcon },
  { id: 'agreement', title: 'Agreement',    subtitle: 'Details', icon: AgreementIcon },
];

const KYC_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Private Limited Company',
  'Public Limited Company',
  'LLP',
];

/**
 * Profile page composing the existing form primitives.
 */
export const ProfilePage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* The first step is fully wired; the rest live as inert tabs that
     advertise the full flow without forking unrequested work. */
  const [activeStep, setActiveStep] = useState<StepId>('kyc');

  /* ── KYC form state (seeded with the values from the reference) ── */
  const [kycType, setKycType]         = useState<string>('Sole Proprietorship');
  const [aadhar, setAadhar]           = useState<string>('425826328278');
  const [pan, setPan]                 = useState<string>('EYIPK1860G');

  const [aadharName, setAadharName]   = useState<string>(() => {
    const email = localStorage.getItem('email');
    if (!email) return 'User Name';
    const namePart = email.split('@')[0];
    const parts = namePart.split('.').filter(p => p !== 'ext');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  });
  const [aadharDob, setAadharDob]     = useState<string>('1998-03-21');
  const [aadharGender, setAadharGender] = useState<string>('M');
  const [aadharAddress, setAadharAddress] = useState<string>(
    'plot no. 95-96 Jaripatka Kukreja Nagar 00546047 Nagpur Nagpur Maharashtra 440014 India',
  );
  const [aadharImage, setAadharImage] = useState<string | null>(null);

  const [panName, setPanName]         = useState<string>(() => {
    const email = localStorage.getItem('email');
    if (!email) return 'User Name';
    const namePart = email.split('@')[0];
    const parts = namePart.split('.').filter(p => p !== 'ext');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  });
  const [panImage, setPanImage]       = useState<string | null>(null);

  const isAadharVerified = aadhar.trim().length === 12;
  const isPanVerified    = /^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim());

  const handleSave = () => {
    showToast('✓ KYC details saved');
  };

  /* Stub file-picker — keeps the screen demoable without dragging in
     the more elaborate upload widget used by the Reverse Order page. */
  const pickImage = (onPick: (dataUrl: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onPick(String(reader.result));
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="page">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Profile</div>
        </div>
      </div>

      {/* ── Step indicator ─────────────────────────────────── */}
      <div className="pf-stepper" role="tablist" aria-label="Profile onboarding steps">
        {STEPS.map((s, idx) => {
          const isActive   = s.id === activeStep;
          const isComplete = STEPS.findIndex((x) => x.id === activeStep) > idx;
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`pf-step ${isActive ? 'on' : ''} ${isComplete ? 'done' : ''}`}
                onClick={() => setActiveStep(s.id)}
              >
                <span className="pf-step-ico" aria-hidden="true">{s.icon}</span>
                <span className="pf-step-text">
                  <span className="pf-step-t">{s.title}</span>
                  <span className="pf-step-s">{s.subtitle}</span>
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <span className="pf-step-sep" aria-hidden="true">{ChevIcon}</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step body: KYC ──────────────────────────────────
           Two-column layout: the lean account-identity panel on
           the left, the document-evidence panel (Aadhar + PAN) on
           the right. Each panel is an `.ord-nf-card` so the visual
           treatment matches the New Order screens. */}
      {activeStep === 'kyc' && (
      <div className="pf-grid">
        {/* ── Left: identity panel ─────────────────────────── */}
        <section className="ord-nf-card pf-card">
          <div className="sup-mf">
            <div className="sup-ml">Select Type of KYC</div>
            <select
              className="sup-mi pf-select"
              value={kycType}
              onChange={(e) => setKycType(e.target.value)}
            >
              {KYC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="sup-mf">
            <div className="sup-ml">Aadhar Number <Req /></div>
            <div className="pf-input-pair">
              <input
                className="sup-mi"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhar number"
              />
              {isAadharVerified && (
                <span className="pf-verified" aria-label="Aadhar verified">
                  {VerifiedIcon}
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>

          <div className="sup-mf">
            <div className="sup-ml">Pan Number <Req /></div>
            <div className="pf-input-pair">
              <input
                className="sup-mi"
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                style={{ textTransform: 'uppercase' }}
              />
              {isPanVerified && (
                <span className="pf-verified" aria-label="PAN verified">
                  {VerifiedIcon}
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>

          <div className="pf-card-ft">
            <button
              type="button"
              className="ord-cta ord-cta-p"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </section>

        {/* ── Right: document evidence panel ───────────────── */}
        <section className="ord-nf-card pf-card">
          {/* Aadhar sub-section */}
          <div className="pf-subhead">Aadhar Card Details</div>

          <div className="sup-mf">
            <div className="sup-ml">Full Name <Req /></div>
            <input
              className="sup-mi"
              type="text"
              value={aadharName}
              onChange={(e) => setAadharName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="pf-row-2">
            <div className="sup-mf">
              <div className="sup-ml">DOB <Req /></div>
              <input
                className="sup-mi"
                type="date"
                value={aadharDob}
                onChange={(e) => setAadharDob(e.target.value)}
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">Gender <Req /></div>
              <select
                className="sup-mi pf-select"
                value={aadharGender}
                onChange={(e) => setAadharGender(e.target.value)}
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div className="pf-row-addr">
            <div className="sup-mf">
              <div className="sup-ml">Address <Req /></div>
              <textarea
                className="sup-mi-ta"
                rows={3}
                value={aadharAddress}
                onChange={(e) => setAadharAddress(e.target.value)}
                placeholder="Address as on Aadhar"
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">View Image <Req /></div>
              <ImageTile
                src={aadharImage}
                onPick={() => pickImage(setAadharImage)}
                onClear={() => setAadharImage(null)}
                label="Aadhar"
              />
            </div>
          </div>

          {/* PAN sub-section */}
          <div className="pf-subhead" style={{ marginTop: 18 }}>Pan Card Details</div>

          <div className="pf-row-addr">
            <div className="sup-mf">
              <div className="sup-ml">Full Name <Req /></div>
              <input
                className="sup-mi"
                type="text"
                value={panName}
                onChange={(e) => setPanName(e.target.value)}
                placeholder="Enter Full Name"
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">View Image <Req /></div>
              <ImageTile
                src={panImage}
                onPick={() => pickImage(setPanImage)}
                onClear={() => setPanImage(null)}
                label="PAN"
              />
            </div>
          </div>
        </section>
      </div>
      )}

      {/* ── Step body: Company Info ────────────────────────────────── */}
      {activeStep === 'company' && (
      <div className="pf-grid">
        <section className="ord-nf-card pf-card">
          <div className="pf-subhead">Company Details</div>
          <div className="sup-mf">
            <div className="sup-ml">Company Name <Req /></div>
            <input className="sup-mi" type="text" value={aadharName + ' Enterprises'} readOnly />
          </div>
          <div className="sup-mf">
            <div className="sup-ml">Registered Email <Req /></div>
            <input className="sup-mi" type="text" value={localStorage.getItem('email') || ''} readOnly />
          </div>
          <div className="pf-card-ft">
            <button type="button" className="ord-cta ord-cta-p" onClick={handleSave}>Save Changes</button>
          </div>
        </section>
      </div>
      )}

      {/* ── Step body: Bank Details ────────────────────────────────── */}
      {activeStep === 'bank' && (
      <div className="pf-grid">
        <section className="ord-nf-card pf-card">
          <div className="pf-subhead">Bank Details</div>
          <div className="sup-mf">
            <div className="sup-ml">Account Holder Name <Req /></div>
            <input className="sup-mi" type="text" value={aadharName} readOnly />
          </div>
          <div className="sup-mf">
            <div className="sup-ml">Account Number <Req /></div>
            <input className="sup-mi" type="text" value="XXXX-XXXX-1234" readOnly />
          </div>
          <div className="pf-card-ft">
            <button type="button" className="ord-cta ord-cta-p" onClick={handleSave}>Save Changes</button>
          </div>
        </section>
      </div>
      )}

      {/* ── Step body: Agreement ────────────────────────────────── */}
      {activeStep === 'agreement' && (
      <div className="pf-grid">
        <section className="ord-nf-card pf-card">
          <div className="pf-subhead">Service Agreement</div>
          <div className="sup-mf">
            <div className="sup-ml">Authorized Signatory <Req /></div>
            <input className="sup-mi" type="text" value={aadharName} readOnly />
          </div>
          <div className="sup-mf">
            <div className="sup-ml">Signatory Email <Req /></div>
            <input className="sup-mi" type="text" value={localStorage.getItem('email') || ''} readOnly />
          </div>
          <div className="pf-card-ft">
            <button type="button" className="ord-cta ord-cta-p" onClick={handleSave}>Save Changes</button>
          </div>
        </section>
      </div>
      )}

      {toast && <Toast />}
    </div>
  );
};

/* ── Sub-component: small image preview tile ───────────────────
   Click-to-upload tile that mirrors the empty / filled treatment
   on the Reverse Order page's image grid but at a smaller size so
   it sits comfortably next to a single form field. Empty state
   surfaces an inline "Upload" call-to-action; filled state shows
   the image with a × button to clear. */
interface ImageTileProps {
  src: string | null;
  onPick: () => void;
  onClear: () => void;
  label: string;
}

const ImageTile: React.FC<ImageTileProps> = ({ src, onPick, onClear, label }) => {
  if (src) {
    return (
      <div className="pf-img-tile filled">
        <img src={src} alt={`${label} document`} />
        <button
          type="button"
          className="pf-img-x"
          aria-label={`Remove ${label} image`}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          ×
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="pf-img-tile empty"
      onClick={onPick}
      aria-label={`Upload ${label} image`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 16l5-5 4 4 3-3 6 6" />
        <circle cx="9" cy="9.5" r="1.4" />
      </svg>
      <span className="pf-img-tile-lbl">Upload</span>
    </button>
  );
};

export default ProfilePage;
