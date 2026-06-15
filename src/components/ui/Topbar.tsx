import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportsStore } from '../../store/useReportsStore';

interface TopbarProps {
  onMobileMenuClick: () => void;
}

/* ─── Quick Actions dropdown menu ──────────────────────────────────────────
 * Mirrors the visual pattern of the existing `.date-dd` dropdown
 * (DateFilter component) — same positioning, surface, divider treatment.
 * `path` set → navigate; otherwise → toast.
 * ───────────────────────────────────────────────────────────────────────── */
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const QA_ICON = (d: string, fill?: string) => (
  <svg viewBox="0 0 20 20" fill={fill ?? 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d={d} />
  </svg>
);

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'tracking',
    label: 'Tracking Page',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M10 17.5s6-5.4 6-10a6 6 0 10-12 0c0 4.6 6 10 6 10z" />
        <circle cx="10" cy="7.5" r="2.2" />
      </svg>
    ),
  },
  {
    id: 'create-order',
    label: 'Create Order',
    path: '/orders/new-forward',
    icon: QA_ICON('M10 4v12M4 10h12'),
  },
  {
    id: 'create-reverse',
    label: 'Create Reverse Order',
    path: '/orders/new-reverse',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M3.5 10a6.5 6.5 0 1011.7-3.9" />
        <path d="M3.5 4v3.5H7" />
      </svg>
    ),
  },
  {
    id: 'pickup',
    label: 'Create Pickup Request',
    path: '/orders/pickup-request',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M3 6.5L10 3l7 3.5v7L10 17l-7-3.5v-7z" />
        <path d="M3 6.5L10 10l7-3.5M10 10v7" />
      </svg>
    ),
  },
  {
    id: 'pincode',
    label: 'Pincode Serviceability',
    path: '/info/pincode',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5" />
        <path d="M12.5 12.5L17 17" />
      </svg>
    ),
  },
  {
    id: 'rate-calc',
    label: 'Rate Calculator',
    path: '/info/rate-calculator',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <rect x="4" y="2.5" width="12" height="15" rx="2" />
        <rect x="6.5" y="5" width="7" height="2.5" rx=".5" />
        <path d="M7 11h.01M10 11h.01M13 11h.01M7 14h.01M10 14h.01M13 14h.01" />
      </svg>
    ),
  },
  {
    id: 'create-ticket',
    label: 'Create Ticket',
    path: '/support',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M5 2.5h7l4 4v11a0 0 0 010 0H5a0 0 0 010 0v-15a0 0 0 010 0z" />
        <path d="M12 2.5v4h4M8 11h5M8 14h3" />
      </svg>
    ),
  },
];

/**
 * Sellportal top bar.
 * Layout (left → right):
 *   • Search (flex)
 *   • Wallet pill    — flat card icon + balance; click opens recharge modal
 *   • Vertical divider
 *   • Quick Actions  — flat lightning-bolt icon + label, dropdown trigger
 *   • Vertical divider
 *   • Support        — flat help icon + label, links to /support
 *   • MR avatar      — initials circle, dropdown trigger
 *
 * Visual recipe sourced from the 2026 redesign mock — the wallet,
 * Quick Actions and Support controls are deliberately **flat** (no
 * border / pill) and live alongside hairline dividers so the topbar
 * reads as a lightweight utility strip rather than a row of
 * competing buttons.
 */
export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick }) => {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);
  const openWalletRecharge = useReportsStore((s) => s.openWalletRecharge);
  const walletBalance = useReportsStore((s) => s.walletBalance);
  const formattedBalance = `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(walletBalance)}`;

  const [qaOpen, setQaOpen] = useState(false);
  const qaWrapRef = useRef<HTMLDivElement>(null);

  /* Profile dropdown — mirrors the Quick Actions popover so the
     visual language and keyboard behaviour stay consistent. */
  const [pfOpen, setPfOpen] = useState(false);
  const pfWrapRef = useRef<HTMLDivElement>(null);

  // Close Quick Actions dropdown on outside click / Escape
  useEffect(() => {
    if (!qaOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (qaOpen && qaWrapRef.current && !qaWrapRef.current.contains(target)) {
        setQaOpen(false);
      }
      if (avOpen && avWrapRef.current && !avWrapRef.current.contains(target)) {
        setAvOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQaOpen(false);
        setAvOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [qaOpen]);

  // Close Profile dropdown on outside click / Escape
  useEffect(() => {
    if (!pfOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (pfWrapRef.current && !pfWrapRef.current.contains(e.target as Node)) {
        setPfOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPfOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [pfOpen]);

  const handleQuickAction = (action: QuickAction) => {
    setQaOpen(false);
    if (action.path) {
      navigate(action.path);
    } else {
      showToast(`Coming soon: ${action.label}`);
    }
  };

  /* Profile menu actions — Profile lands on the dedicated screen;
     Logout clears any session data we own (currently `sessionStorage`
     only — no auth state in the store yet) and bounces the user to
     the app landing page (`/`, which redirects to /dashboard while
     no real auth flow is wired). When a true auth layer is added
     later it should replace this branch but the call-site here is
     already routing through a single `handleLogout` for that swap. */
  const handleProfile = () => {
    setPfOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setPfOpen(false);
    try {
      sessionStorage.clear();
      localStorage.removeItem('xb.session');
      localStorage.removeItem('token');
      localStorage.removeItem('kavachToken');
    } catch {
      /* storage access can throw in private-mode browsers — ignore. */
    }
    showToast('You have been logged out');
    navigate('/login');
  };

  return (
    <header className="topbar" role="banner">
      {/* Mobile hamburger — only visible on narrow viewports */}
      <button
        type="button"
        className="tb-burger"
        onClick={onMobileMenuClick}
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="#1A190F" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>

      {/* Search */}
      <div className="tb-srch" role="search">
        <span className="tb-srch-ico" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="#6B6960" strokeWidth="1.22">
            <circle cx="6.75" cy="6.75" r="4.25" />
            <path d="M10.25 10.25L13 13" strokeLinecap="round" />
          </svg>
        </span>
        <input type="text" placeholder="Search orders, AWB, customer..." aria-label="Search" />
      </div>

      <div className="tb-r" role="toolbar" aria-label="Top bar actions">
        {/* Wallet pill — flat (no border). The whole button is now the
            recharge trigger (opens the wallet-recharge popup); the
            previous orange "+" button was folded into this single
            affordance so the topbar carries one less control. */}
        <button
          type="button"
          className="tb-wallet"
          title="Recharge wallet"
          aria-label={`Wallet balance ${formattedBalance}. Click to recharge.`}
          onClick={openWalletRecharge}
        >
          <span className="tb-wallet-ico" aria-hidden="true">
            <svg viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="16">
              <rect x="1.5" y="2.5" width="17" height="11" rx="2" />
              <path d="M1.5 7H18.5" />
            </svg>
          </span>
          <span className="tb-wallet-amount">{formattedBalance}</span>
        </button>

        {/* Hairline divider between wallet pill and Quick Actions */}
        <span className="tb-divider" aria-hidden="true" />

        {/* Quick Actions — flat trigger with lightning-bolt glyph */}
        <div className="tb-qa-wrap" ref={qaWrapRef}>
          <button
            type="button"
            className={`tb-qa ${qaOpen ? 'on' : ''}`}
            aria-label="Quick Actions"
            aria-haspopup="menu"
            aria-expanded={qaOpen}
            onClick={() => setQaOpen((p) => !p)}
          >
            <span className="tb-qa-ico" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M11.5 2L4 11.25h5L8.5 18l7.5-9.25h-5L11.5 2z" />
              </svg>
            </span>
            <span className="tb-qa-lbl">Quick Actions</span>
          </button>

          <div className={`tb-qa-dd ${qaOpen ? 'sh' : ''}`} role="menu" aria-label="Quick Actions">
            <div className="tb-qa-dd-head">QUICK ACTIONS</div>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                className="tb-qa-dd-opt"
                onClick={() => handleQuickAction(action)}
              >
                <span className="tb-qa-dd-ico">{action.icon}</span>
                <span className="tb-qa-dd-lbl">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hairline divider between Quick Actions and Support */}
        <span className="tb-divider" aria-hidden="true" />

        {/* Support — flat link button. Icon left, label right; same
            visual recipe as the Wallet + Quick Actions controls so
            the three utility actions read as one continuous strip. */}
        <button
          type="button"
          className="tb-support"
          aria-label="Support"
          title="Support"
          onClick={() => navigate('/support')}
        >
          <span className="tb-support-ico" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="10" cy="10" r="7.25" />
              <path d="M7.6 7.5a2.4 2.4 0 014.8 0c0 1.3-1 1.7-1.9 2.3-.45.3-.5.55-.5 1" />
              <circle cx="10" cy="14.25" r=".5" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="tb-support-lbl">Support</span>
        </button>

        {/* Account avatar — dropdown trigger.
            Visual recipe is borrowed from `.tb-qa-*` so the popover
            surface matches the Quick Actions menu pixel-for-pixel. */}
        <div className="tb-qa-wrap tb-pf-wrap" ref={pfWrapRef}>
          <button
            type="button"
            className={`tb-av ${pfOpen ? 'on' : ''}`}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={pfOpen}
            onClick={() => setPfOpen((p) => !p)}
          >
            <span className="tb-av-circle" aria-hidden="true">
              {(() => {
                const email = localStorage.getItem('email');
                if (!email) return 'MR';
                const namePart = email.split('@')[0];
                const parts = namePart.split('.').filter(p => p !== 'ext');
                if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                return 'MR';
              })()}
            </span>
          </button>

          <div
            className={`tb-qa-dd tb-pf-dd ${pfOpen ? 'sh' : ''}`}
            role="menu"
            aria-label="Account menu"
          >
            <div className="tb-qa-dd-head">ACCOUNT</div>
            <button
              type="button"
              role="menuitem"
              className="tb-qa-dd-opt"
              onClick={handleProfile}
            >
              <span className="tb-qa-dd-ico">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                  <circle cx="10" cy="7" r="3.25" />
                  <path d="M3.75 17c1-3.4 3.7-5 6.25-5s5.25 1.6 6.25 5" />
                </svg>
              </span>
              <span className="tb-qa-dd-lbl">Profile</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="tb-qa-dd-opt tb-qa-dd-opt-danger"
              onClick={handleLogout}
            >
              <span className="tb-qa-dd-ico">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                  <path d="M12.5 14.5V16a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 16V4A1.5 1.5 0 015 2.5h6A1.5 1.5 0 0112.5 4v1.5" />
                  <path d="M8.5 10h9M14 6.5l3.5 3.5L14 13.5" />
                </svg>
              </span>
              <span className="tb-qa-dd-lbl">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
