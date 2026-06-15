import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useReportsStore } from '../../store/useReportsStore';
import {
  NAV_CONFIG,
  NAV_BOTTOM,
  resolveActiveNav,
  type NavConfigItem,
  type NavSubItem,
} from '../../data/navConfig';
import { ndrApi } from '../../services/ndrApi';
import { weightReconciliationApi } from '../../services/weightReconciliationApi';

/* Single timing source — mirrors --nav-dur in sidebar.css */
const NAV_DUR = 200;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);

  const { id: activeId, parentId: activeParentId } = resolveActiveNav(location.pathname);

  const [open, setOpen] = useState(false);              // desktop hover-expand
  const [openSubId, setOpenSubId] = useState<string | null>(null);
  const [ndrCount, setNdrCount] = useState<number | null>(null);
  const [weightRecoCount, setWeightRecoCount] = useState<number | null>(null);

  const wasOpenRef = useRef(false);
  /* Set when the user click-opens a specific dropdown from the collapsed rail —
   * tells the open-transition effect to keep their choice instead of resetting
   * to the active branch. Reset after one effect run. */
  const userToggleRef = useRef(false);

  /* ─── Hover dwell open / debounced close (desktop only) ────────── */
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const interactTimer = useRef<number | null>(null);

  const clearTimer = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const handleMouseEnter = useCallback(() => {
    clearTimer(closeTimer);
    openTimer.current = window.setTimeout(() => setOpen(true), 180);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimer(openTimer);
    closeTimer.current = window.setTimeout(() => {
      if (interactTimer.current) return; // click in flight — abort close
      setOpen(false);
    }, 160);
  }, []);

  /* Lock open during a click interaction so hover-out doesn't immediately close */
  const lockOpen = () => {
    clearTimer(interactTimer);
    interactTimer.current = window.setTimeout(() => {
      interactTimer.current = null;
    }, 400);
  };

  /* ─── Sub-nav reveal / hide tied to rail open/close ────────────────
   * Rules
   *  • Rail OPENING  → reveal the dropdown that contains the active sub-item
   *    (or close everything if no sub-item is active).
   *  • Rail OPEN     → re-orient when the user navigates to a sub-item in a
   *    different parent; otherwise leave a user-toggled dropdown alone.
   *  • Rail CLOSING  → close every dropdown, but defer the height collapse
   *    until the width transition finishes (avoids layout jump).
   * ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;

    if (open) {
      // If the user click-opened a specific dropdown from the collapsed rail,
      // respect their choice and skip the auto-reveal for this transition.
      if (userToggleRef.current) {
        userToggleRef.current = false;
        return;
      }
      // On the open transition OR when navigation moves into a different
      // active branch, reveal that branch (null → all closed).
      if (!wasOpen || activeParentId !== null) {
        setOpenSubId(activeParentId);
      }
      return;
    }

    // Closing transition: collapse every dropdown after the width animation
    const t = window.setTimeout(() => setOpenSubId(null), NAV_DUR);
    return () => window.clearTimeout(t);
  }, [open, activeParentId]);

  /* ─── Keyboard shortcut: ⌘\ / Ctrl+\ toggles the rail ──────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isBackslash = e.key === '\\' || e.code === 'Backslash';
      const mod = e.metaKey || e.ctrlKey;
      if (isBackslash && mod) {
        e.preventDefault();
        clearTimer(openTimer);
        clearTimer(closeTimer);
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ─── Fetch dynamic counts ────────────────────────────────── */
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const records = await ndrApi.fetchNdrList({ dateRange: 'last30' });
        setNdrCount(records.length);
      } catch (err) {
        console.error('Failed to fetch NDR count', err);
      }
      try {
        const wrRecords = await weightReconciliationApi.fetchRecords({ dateRange: 'last30' });
        // Setting it to actionable records count (open state) or total count?
        // Usually, badge represents actionable items. Let's use records.length.
        setWeightRecoCount(wrRecords.length);
      } catch (err) {
        console.error('Failed to fetch Weight Reco count', err);
      }
    };
    fetchCounts();
  }, []);

  /* Cleanup on unmount */
  useEffect(() => () => {
    clearTimer(openTimer);
    clearTimer(closeTimer);
    clearTimer(interactTimer);
  }, []);

  /* ─── Navigation ───────────────────────────────────────────────── */
  const followItem = (item: NavConfigItem | NavSubItem, label: string) => {
    lockOpen();
    if (item.path && item.path !== '#') {
      navigate(item.path);
      if (mobileOpen) onMobileClose();
    } else {
      showToast(`Coming soon: ${label}`);
    }
  };

  const handleToggleSub = (id: string) => {
    lockOpen();
    /* Expand rail first when collapsed — clicking a parent shouldn't blindly toggle */
    if (!open) {
      userToggleRef.current = true;
      setOpen(true);
      setOpenSubId(id);
      return;
    }
    setOpenSubId((prev) => (prev === id ? null : id));
  };

  /* ─── Renderers ────────────────────────────────────────────────── */
  const renderItem = (item: NavConfigItem) => {
    const isActive = activeId === item.id;
    const isParentOfActive = activeParentId === item.id;
    const hasChildren = !!item.children?.length;
    const isExpanded = openSubId === item.id;

    /* When the rail is COLLAPSED, sub-items are hidden — lift the full
     * active treatment (orange bar + active background) to the parent so the
     * user can always see where they are. When EXPANDED, the active sub-item
     * is visible, so the parent uses the subtler `par-active` orange tint. */
    const showAsActive = isActive || (isParentOfActive && !open);
    const showAsParentActive = isParentOfActive && open;

    const baseClass = [
      'nav-item',
      showAsActive && 'active',
      showAsParentActive && 'par-active',
    ]
      .filter(Boolean)
      .join(' ');

    if (hasChildren) {
      return (
        <React.Fragment key={item.id}>
          <button
            type="button"
            className={baseClass}
            aria-expanded={isExpanded}
            aria-label={item.label}
            onClick={() => handleToggleSub(item.id)}
          >
            <span className="nav-ico">{item.icon}</span>
            <span className="nav-lbl">{item.label}</span>
            <span className="nav-tip" role="tooltip">{item.label}</span>
            <svg className="nav-chev" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M1 1l4 4 4-4" strokeLinecap="round" />
            </svg>
          </button>
          <div className={`nav-sub ${isExpanded ? 'open' : ''}`} id={`sn-${item.id}`}>
            {item.children!.map((sub) => renderSubItem(sub))}
          </div>
        </React.Fragment>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className={baseClass}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        onClick={() => followItem(item, item.label)}
      >
        <span className="nav-ico">{item.icon}</span>
        <span className="nav-lbl">{item.label}</span>
        {(item.badge !== undefined || (item.id === 'ndr' && ndrCount !== null) || (item.id === 'weight-reconciliation' && weightRecoCount !== null)) && (
          <span className="nav-badge" aria-label={item.badgeAriaLabel ?? `${item.badge}`}>
            {item.id === 'ndr' && ndrCount !== null
              ? ndrCount
              : item.id === 'weight-reconciliation' && weightRecoCount !== null
                ? weightRecoCount
                : item.badge}
          </span>
        )}
        <span className="nav-tip" role="tooltip">{item.label}</span>
      </button>
    );
  };

  const renderSubItem = (sub: NavSubItem) => {
    const isActive = activeId === sub.id;
    return (
      <button
        key={sub.id}
        type="button"
        className={`nav-sub-item ${isActive ? 'active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={sub.label}
        tabIndex={open ? 0 : -1}
        onClick={() => followItem(sub, sub.label)}
      >
        <span className="nav-sub-dot" aria-hidden="true" />
        <span className="nav-sub-lbl">{sub.label}</span>
      </button>
    );
  };

  /* ─── Render ───────────────────────────────────────────────────── */
  const navClass = [
    'nav',
    open && 'open',
    mobileOpen && 'mobile-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile scrim — taps anywhere outside the rail to dismiss it */}
      <div
        className={`nav-scrim ${mobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <nav
        className={navClass}
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo: crossfade collapsed mark ↔ expanded wordmark */}
        <div className="nav-logo">
          <NavLink
            to="/dashboard"
            className="nav-logo-collapsed"
            aria-label="XpressBees — go to dashboard"
            onClick={(e) => {
              e.preventDefault();
              followItem({ id: 'dashboard', label: 'Dashboard', path: '/dashboard' } as NavConfigItem, 'Dashboard');
            }}
          >
            <svg width="28" height="28" viewBox="0 0 59 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M19.09 31.1L27.55 21.7L23.46 12.86H30.15L31.98 16.85L35.59 12.86H41.98L34.14 21.54L38.55 31.11H31.78L29.69 26.46L25.5 31.11H19.09V31.1Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M47.78 17.19L47.17 19.98H50.15C51.42 19.98 52.15 19.5 52.39 18.46C52.57 17.62 52.03 17.19 50.76 17.19H47.78ZM39.17 31.14L43.11 12.88H53.12C55.3 12.88 56.76 13.43 57.48 14.46C58.03 15.25 58.21 16.22 57.97 17.43C57.61 19.01 56.64 20.22 54.94 21.01C56.88 21.74 57.6 23.26 57.12 25.56C56.76 27.32 55.79 28.66 54.21 29.69C52.81 30.6 51.24 31.08 49.48 31.08H39.11L39.17 31.14ZM46.45 23.38L45.72 26.77H48.99C50.45 26.77 51.36 26.17 51.54 25.01C51.78 23.92 51.24 23.31 49.9 23.31H46.39L46.45 23.38Z" fill="#F07C00"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.04 31.1L21.23 20.92L17.44 12.86H20.65L24.58 21.41L15.82 31.1H12.04Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M6.02 31.1L15.21 20.92L11.41 12.86H14.62L18.55 21.41L9.79 31.1H6.02Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M0 31.1L9.19 20.92L5.39 12.86H8.61L12.54 21.41L3.77 31.1H0Z" fill="white"/>
            </svg>
          </NavLink>

          <NavLink
            to="/dashboard"
            className="nav-logo-expanded"
            aria-label="XpressBees — go to dashboard"
            onClick={(e) => {
              e.preventDefault();
              followItem({ id: 'dashboard', label: 'Dashboard', path: '/dashboard' } as NavConfigItem, 'Dashboard');
            }}
          >
            <svg width="180" height="40" viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M103.944 27.1223L109.632 27.1837C109.509 27.6156 109.437 28.0689 109.562 28.4422C109.832 29.2741 110.56 29.7807 112.106 29.7807C113.652 29.7807 114.578 29.2234 114.826 28.0502C114.887 27.6183 114.764 27.2477 114.268 26.9384C113.898 26.7517 112.909 26.3811 111.301 25.8878C109.322 25.2692 108.024 24.7759 107.405 24.28C106.232 23.4134 105.797 22.1175 106.168 20.5097C106.6 18.4699 107.714 16.9234 109.506 15.8116C111.053 14.8223 112.906 14.3291 115.007 14.3291C117.108 14.3291 118.964 14.761 120.076 15.6889C121.374 16.7395 121.868 18.286 121.497 20.4484H116.058C116.306 19.8298 116.18 19.3365 115.687 18.9659C115.316 18.6566 114.759 18.4726 114.079 18.4726C112.658 18.4726 111.917 18.9046 111.73 19.7098C111.607 20.2671 112.101 20.7604 113.151 21.131C114.327 21.4403 115.5 21.7496 116.612 22.0589C118.095 22.4908 119.209 23.0481 119.828 23.728C120.694 24.6559 121.004 25.8905 120.694 27.437C120.201 29.6634 118.964 31.3325 116.863 32.4444C115.132 33.3723 113.093 33.8043 110.682 33.8043C108.272 33.8043 107.283 33.4336 106.045 32.6924C104.07 31.5112 103.39 29.6554 103.944 27.1223ZM121.809 27.0237L127.496 27.085C127.374 27.517 127.302 27.9702 127.427 28.3435C127.696 29.1754 128.424 29.6821 129.971 29.6821C131.517 29.6821 132.442 29.1248 132.69 27.9516C132.752 27.5196 132.629 27.149 132.133 26.8397C131.763 26.6531 130.773 26.2824 129.165 25.7891C127.187 25.1705 125.888 24.6773 125.27 24.1813C124.097 23.3147 123.662 22.0189 124.033 20.4111C124.465 18.3713 125.579 16.8248 127.371 15.7129C128.918 14.7237 130.771 14.2304 132.872 14.2304C134.973 14.2304 136.829 14.6624 137.941 15.5903C139.239 16.6408 139.732 18.1873 139.362 20.3497H133.922C134.17 19.7311 134.045 19.2379 133.552 18.8672C133.181 18.5579 132.624 18.374 131.944 18.374C130.523 18.374 129.781 18.8059 129.595 19.6112C129.472 20.1684 129.965 20.6617 131.016 21.0323C132.189 21.3416 133.365 21.6509 134.477 21.9602C135.959 22.3922 137.074 22.9495 137.693 23.6294C138.559 24.5573 138.866 25.7918 138.559 27.3383C138.066 29.5647 136.829 31.2339 134.728 32.3458C132.997 33.2737 130.957 33.7056 128.547 33.7056C126.136 33.7056 125.147 33.335 123.91 32.5937C121.932 31.4125 121.252 29.5594 121.809 27.0237ZM85.9088 33.3297L89.9191 14.7583H105.341L104.294 19.5098H94.6066L94.1133 21.8536H102.875L101.888 26.2958H93.1267L92.6334 28.6395H102.566L101.518 33.391H85.8928L85.9088 33.3297ZM75.3553 19.2005L74.5527 22.9041H77.5151C79.1816 22.9041 80.1681 22.2882 80.4161 21.0537C80.6641 19.8191 79.8615 19.2032 77.947 19.2032H75.294H75.3553V19.2005ZM66.6069 33.3857L70.6278 14.7637H81.616C83.3544 14.7637 84.6583 15.1983 85.5889 16.0675C86.5808 17.0594 86.8927 18.3633 86.5808 20.1018C86.3328 21.1577 85.8982 22.0882 85.2769 22.8961C84.5943 23.8267 83.7251 24.448 82.7332 24.7573C84.2237 25.3785 84.781 26.9304 84.4717 29.4128C84.4103 30.0953 84.285 30.7779 84.2237 31.3992C84.0984 32.3298 84.0984 33.0124 84.2237 33.3857H78.451C78.451 32.7031 78.451 31.7725 78.5763 30.53C78.7629 29.2874 78.7629 28.4822 78.5763 28.0476C78.3897 27.3036 77.7684 26.869 76.7152 26.869H73.6728L72.2463 33.3857H66.6069ZM57.6399 19.5098L56.8373 23.2748H59.0584C60.045 23.2748 60.7249 23.2134 61.2182 22.9655C61.9594 22.6562 62.3914 22.1015 62.5754 21.2376C62.7594 20.4964 62.5754 19.9418 62.0821 19.6938C61.7728 19.5098 61.1569 19.4458 60.293 19.4458H57.7626L57.6399 19.5098ZM48.9395 33.3323L52.9498 14.7583H62.514C64.7965 14.7583 66.4016 15.4996 67.3269 16.9794C68.0681 18.1526 68.3134 19.5712 67.9428 21.1763C67.4495 23.3361 66.463 25.0026 64.8578 26.1731C63.314 27.285 61.4635 27.7783 59.2424 27.7783H55.8481L54.6136 33.3937H48.9235L48.9395 33.3323ZM27.5045 33.3937L36.1382 23.792L31.9627 14.761H38.7966L40.6711 18.8326L44.3507 14.761H50.8806L42.8709 23.6214L47.3744 33.3963H40.4631L38.3247 28.6502L34.0451 33.3963H27.5045V33.3937Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M176.155 33.3137L180.163 14.7583H195.574L194.526 19.5045H184.847L184.354 21.8482H193.108L192.183 26.2878H183.429L182.936 28.6315H192.86L191.812 33.3777H176.155V33.3137ZM157.829 33.319L161.837 14.7637H177.248L176.2 19.5098H166.521L166.028 21.8536H174.782L173.857 26.2931H165.103L164.61 28.6368H174.537L173.489 33.383H157.816L157.829 33.319ZM147.803 19.1819L147.185 22.0322H150.222C151.523 22.0322 152.267 21.5363 152.515 20.4831C152.702 19.6165 152.144 19.1819 150.843 19.1819H147.803ZM139.007 33.431L143.033 14.7823H153.256C155.485 14.7823 156.973 15.3396 157.717 16.3928C158.274 17.1981 158.461 18.19 158.213 19.4298C157.842 21.0403 156.85 22.2802 155.115 23.0854C157.098 23.8294 157.84 25.3785 157.344 27.7329C156.973 29.5301 155.981 30.8926 154.371 31.9458C152.947 32.8764 151.334 33.3697 149.539 33.3697H138.946L139.007 33.431ZM146.441 25.5012L145.697 28.9701H149.043C150.531 28.9701 151.459 28.3515 151.646 27.173C151.894 26.0584 151.336 25.4372 149.974 25.4372H146.38L146.441 25.5012Z" fill="#F07C00"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M20.3 33.39L29.69 22.99L25.81 14.76H29.09L33.11 23.49L24.16 33.39H20.3Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.15 33.39L23.53 22.99L19.66 14.76H22.94L26.95 23.49L18 33.39H14.15Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M8 33.39L17.39 22.99L13.51 14.76H16.79L20.81 23.49L11.86 33.39H8Z" fill="white"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M194.228 27.0637L199.947 27.125C199.822 27.5596 199.753 28.0156 199.875 28.3889C200.147 29.2234 200.878 29.7354 202.432 29.7354C203.987 29.7354 204.917 29.1754 205.168 27.9942C205.229 27.5596 205.107 27.1863 204.608 26.8744C204.235 26.6877 203.24 26.3144 201.624 25.8185C199.635 25.1972 198.331 24.6986 197.707 24.2027C196.526 23.3334 196.092 22.0269 196.465 20.4111C196.899 18.3606 198.019 16.8061 199.822 15.6862C201.376 14.6917 203.24 14.1957 205.355 14.1957C207.469 14.1957 209.333 14.6304 210.45 15.5636C211.757 16.6195 212.252 18.174 211.879 20.3497H206.41C206.658 19.7285 206.536 19.2299 206.037 18.8592C205.664 18.5473 205.104 18.3633 204.421 18.3633C202.992 18.3633 202.246 18.7979 202.059 19.6058C201.934 20.1658 202.432 20.6617 203.488 21.035C204.669 21.347 205.85 21.6563 206.968 21.9682C208.458 22.4028 209.578 22.9628 210.199 23.6454C211.069 24.5786 211.381 25.8211 211.069 27.3756C210.573 29.6127 209.327 31.2925 207.216 32.4098C205.475 33.343 203.424 33.7776 201 33.7776C198.577 33.7776 197.582 33.4043 196.34 32.6577C194.353 31.4765 193.668 29.6127 194.228 27.0637Z" fill="#F07C00"/>
            </svg>
          </NavLink>
        </div>

        {/* Body */}
        <div className="nav-body">
          {NAV_CONFIG.map(renderItem)}
        </div>

        {/* Bottom (Settings) */}
        <div className="nav-bottom">
          {NAV_BOTTOM.map(renderItem)}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
