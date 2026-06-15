import React from 'react';

/**
 * Single source of truth for the Sellportal left navigation.
 * Used by `Sidebar` (rendering) and the router (active-state matching).
 *
 * Conventions
 *  - `path` of `undefined` or `'#'` → renders a "Coming soon" toast on click.
 *  - `children` makes the item expandable (accordion behaviour).
 *  - `badge` shows a pill on the right (or a dot in collapsed mode).
 */

export interface NavSubItem {
  id: string;
  label: string;
  path?: string;
}

export interface NavConfigItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string | number;
  badgeAriaLabel?: string;
  children?: NavSubItem[];
}

const Dashboard = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 1.5H21C21.8284 1.5 22.5 2.17157 22.5 3V21C22.5 21.8284 21.8284 22.5 21 22.5H3C2.17157 22.5 1.5 21.8284 1.5 21V3C1.5 2.17157 2.17157 1.5 3 1.5Z" stroke="#FFF7ED"/>
    <path d="M7 5.5H8.59961C9.42804 5.5 10.0996 6.17157 10.0996 7V17C10.0996 17.8284 9.42804 18.5 8.59961 18.5H7C6.17157 18.5 5.5 17.8284 5.5 17V7C5.5 6.17157 6.17157 5.5 7 5.5Z" fill="#FFF7ED" stroke="#FFF7ED"/>
    <path d="M15.4 5.5H17C17.83 5.5 18.5 6.17 18.5 7V10C18.5 10.83 17.83 11.5 17 11.5H15.4C14.57 11.5 13.9 10.83 13.9 10V7C13.9 6.17 14.57 5.5 15.4 5.5Z" fill="#FFF7ED" stroke="#FFF7ED"/>
  </svg>
);

const Orders = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.75 2.12H17.5C18 2.12 18.47 2.37 18.74 2.78L21.66 7.12H1.59L4.5 2.78C4.78 2.37 5.25 2.12 5.75 2.12Z" stroke="#FFF7ED"/>
    <path d="M12.12 2.15V7.5H21.69V21C21.69 21.83 21.02 22.5 20.19 22.5H3.06C2.23 22.5 1.56 21.83 1.56 21V7.5H11.12V2.15H12.12Z" stroke="#FFF7ED"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M16.71 11.36C16.88 11.49 16.92 11.74 16.79 11.92L11.27 19.28C11.14 19.46 10.89 19.49 10.71 19.36L6.55 16.24C6.37 16.11 6.33 15.86 6.47 15.68L7.19 14.72C7.32 14.55 7.57 14.51 7.75 14.64L10.31 16.56C10.48 16.7 10.73 16.66 10.87 16.48L15.19 10.72C15.32 10.54 15.57 10.51 15.75 10.64L16.71 11.36Z" fill="#FFF7ED"/>
  </svg>
);

const Ndr = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.35 4.5H15.55C16.05 4.5 16.52 4.75 16.8 5.16L19.27 8.83H1.63L4.1 5.16C4.38 4.75 4.85 4.5 5.35 4.5Z" stroke="#FFF7ED"/>
    <path d="M10.84 4.52V9.28H19.34V21C19.34 21.83 18.66 22.5 17.84 22.5H3.06C2.23 22.5 1.56 21.83 1.56 21V9.28H10.06V4.52H10.84Z" stroke="#FFF7ED"/>
    <rect x="10.33" y="4.33" width="8.8" height="10.26" rx="2" fill="#F07C00"/>
    <path d="M15.01 16C13.07 16 11.42 15.32 10.05 13.95C8.68 12.58 8 10.92 8 8.98C8 7.06 8.68 5.42 10.05 4.05C11.42 2.68 13.07 2 15 2C16.95 2 18.61 2.68 19.97 4.03C21.32 5.39 22 7.05 22 9C22 10.95 21.32 12.61 19.95 13.97C18.59 15.32 16.94 16 15.01 16ZM14.45 10.1H15.73V4.86H14.45V10.1ZM15.09 13.21C15.32 13.21 15.52 13.14 15.68 12.99C15.84 12.85 15.92 12.65 15.92 12.41C15.92 12.16 15.84 11.97 15.67 11.82C15.51 11.68 15.32 11.6 15.11 11.6C14.84 11.63 14.64 11.71 14.51 11.86C14.37 12 14.3 12.19 14.3 12.43C14.3 12.66 14.38 12.85 14.52 12.99C14.67 13.14 14.86 13.21 15.09 13.21Z" fill="#FFF7ED"/>
  </svg>
);

const WeightRecon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Balance / scale icon — represents weight reconciliation */}
    <path d="M12 3V21" stroke="#FFF7ED" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 6H19" stroke="#FFF7ED" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 21H15" stroke="#FFF7ED" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2.5 13C2.5 13 3.5 9 5.5 9C7.5 9 8.5 13 8.5 13C8.5 13 8 14.5 5.5 14.5C3 14.5 2.5 13 2.5 13Z" stroke="#FFF7ED" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M15.5 13C15.5 13 16.5 9 18.5 9C20.5 9 21.5 13 21.5 13C21.5 13 21 14.5 18.5 14.5C16 14.5 15.5 13 15.5 13Z" stroke="#FFF7ED" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const Info = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1.5C14.78 1.5 17.46 2.61 19.42 4.58C21.39 6.54 22.5 9.22 22.5 12C22.5 14.78 21.39 17.46 19.42 19.42C17.46 21.39 14.78 22.5 12 22.5C9.22 22.5 6.54 21.39 4.58 19.42C2.61 17.46 1.5 14.78 1.5 12C1.5 9.22 2.61 6.54 4.58 4.58C6.54 2.61 9.22 1.5 12 1.5Z" stroke="#FFF7ED"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M13 8V6H11V8H13ZM11 11.5H9V9.5H13V15.5H15V17.5H9V15.5H11V11.5Z" fill="#FFF7ED"/>
  </svg>
);

const Finance = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 8C21.83 8 22.5 8.67 22.5 9.5V18.5C22.5 19.33 21.83 20 21 20H7C6.17 20 5.5 19.33 5.5 18.5V16.5H16C17.38 16.5 18.5 15.38 18.5 14V8H21Z" stroke="#FFF7ED"/>
    <path d="M3 4.5H17C17.83 4.5 18.5 5.17 18.5 6V15C18.5 15.83 17.83 16.5 17 16.5H3C2.17 16.5 1.5 15.83 1.5 15V6C1.5 5.17 2.17 4.5 3 4.5Z" stroke="#FFF7ED"/>
    <path d="M7.5 10.5C7.5 11.16 7.76 11.8 8.23 12.27C8.7 12.74 9.34 13 10 13C10.66 13 11.3 12.74 11.77 12.27C12.24 11.8 12.5 11.16 12.5 10.5C12.5 9.84 12.24 9.2 11.77 8.73C11.3 8.26 10.66 8 10 8C9.34 8 8.7 8.26 8.23 8.73C7.76 9.2 7.5 9.84 7.5 10.5Z" fill="#FFF7ED"/>
  </svg>
);

const Support = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1.5C17.8 1.5 22.5 6.2 22.5 12C22.5 17.8 17.8 22.5 12 22.5H2C1.6 22.5 1.37 22.07 1.58 21.74L3.13 19.25C3.46 18.73 3.42 18.08 3.11 17.59C2.09 15.97 1.5 14.05 1.5 12C1.5 6.2 6.2 1.5 12 1.5Z" stroke="#FFF7ED"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M9.94 9.5C9.94 8.97 10.15 8.46 10.52 8.09C10.9 7.71 11.41 7.5 11.94 7.5C12.47 7.5 12.98 7.71 13.35 8.09C13.73 8.46 13.94 8.97 13.94 9.5C13.94 9.57 13.91 9.63 13.86 9.68L11.27 11.98C11.06 12.16 10.94 12.44 10.94 12.72V13.5C10.94 14.05 11.39 14.5 11.94 14.5H12.02C12.53 14.5 12.94 14.09 12.94 13.58C12.94 13.32 13.05 13.07 13.25 12.9L15.6 10.8C15.82 10.61 15.94 10.34 15.94 10.06V9.5C15.94 8.44 15.52 7.42 14.77 6.67C14.02 5.92 13 5.5 11.94 5.5C10.88 5.5 9.86 5.92 9.11 6.67C8.36 7.42 7.94 8.44 7.94 9.5C7.94 9.81 8.19 10.06 8.49 10.06H9.38C9.69 10.06 9.94 9.81 9.94 9.5ZM11.94 16C11.39 16 10.94 16.45 10.94 17C10.94 17.55 11.39 18 11.94 18C12.49 18 12.94 17.55 12.94 17C12.94 16.45 12.49 16 11.94 16Z" fill="#FFF7ED"/>
  </svg>
);

const Reports = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3h12a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#FFF7ED" strokeWidth="1.2"/>
    <path d="M7 8h6M7 11h4M7 14h2" stroke="#FFF7ED" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const Services = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.18 1.25 10.39 1.54 9.76 2.06C9.13 2.58 8.7 3.31 8.56 4.11C8.41 4.92 8.55 5.75 8.95 6.46C9.35 7.18 9.99 7.73 10.75 8.02V13.1L6.27 16.23C5.57 15.82 4.74 15.66 3.93 15.8C3.13 15.93 2.39 16.34 1.86 16.96C1.32 17.58 1.02 18.36 1 19.18C0.99 20 1.26 20.79 1.77 21.43C2.28 22.07 2.99 22.51 3.79 22.68C4.6 22.84 5.43 22.72 6.15 22.34C6.87 21.95 7.44 21.33 7.74 20.57C8.05 19.81 8.08 18.97 7.84 18.19L12 15.28L16.16 18.19C15.92 18.97 15.95 19.81 16.26 20.57C16.56 21.33 17.13 21.95 17.85 22.34C18.57 22.72 19.4 22.84 20.2 22.68C21.01 22.51 21.72 22.07 22.23 21.43C22.74 20.79 23.01 20 23 19.18C22.98 18.36 22.68 17.58 22.14 16.96C21.61 16.34 20.87 15.93 20.07 15.8C19.26 15.66 18.43 15.82 17.73 16.23L13.25 13.1V8.02C14.01 7.73 14.65 7.18 15.05 6.46C15.45 5.75 15.59 4.92 15.44 4.12C15.29 3.31 14.87 2.58 14.24 2.06C13.61 1.54 12.82 1.25 12 1.25Z" fill="#FFF7ED"/>
  </svg>
);

const Settings = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.999 7.643C10.844 7.643 9.736 8.102 8.919 8.919C8.102 9.736 7.643 10.844 7.643 12C7.643 13.156 8.102 14.264 8.919 15.081C9.736 15.898 10.844 16.357 11.999 16.357C12.572 16.357 13.139 16.244 13.667 16.025C14.196 15.806 14.676 15.486 15.081 15.081C15.485 14.677 15.807 14.196 16.026 13.667C16.245 13.139 16.357 12.572 16.357 12C16.357 11.428 16.245 10.861 16.026 10.333C15.807 9.804 15.485 9.323 15.081 8.919C14.676 8.514 14.196 8.193 13.667 7.975C13.139 7.756 12.572 7.643 11.999 7.643Z" stroke="#FFF7ED"/>
    <path d="M3.268 10.273L3.158 10.135L1.776 8.421C1.606 8.208 1.505 7.948 1.486 7.677C1.467 7.405 1.531 7.134 1.668 6.899L2.408 5.604C2.541 5.372 2.741 5.187 2.981 5.069C3.221 4.952 3.491 4.908 3.755 4.944L5.924 5.275L6.096 5.302L6.247 5.216L8.979 3.666L9.134 3.578L9.199 3.412L9.993 1.363C10.09 1.109 10.262 0.892 10.485 0.738C10.68 0.604 10.908 0.523 11.143 0.504L11.245 0.5H12.756L12.857 0.504C13.092 0.522 13.32 0.603 13.515 0.737C13.71 0.872 13.866 1.055 13.967 1.269L14.007 1.361L14.801 3.412L14.865 3.577L15.018 3.665L17.714 5.215L17.867 5.302L18.04 5.275L20.209 4.943L20.21 4.944C20.474 4.908 20.743 4.951 20.983 5.068C21.163 5.157 21.32 5.284 21.444 5.439L21.556 5.604L22.292 6.894L22.295 6.899C22.433 7.134 22.497 7.405 22.478 7.677C22.459 7.948 22.358 8.208 22.188 8.421L20.838 10.14L20.731 10.275V13.728L20.842 13.865L22.225 15.581C22.394 15.794 22.495 16.052 22.514 16.323C22.533 16.595 22.469 16.866 22.331 17.101L21.59 18.398C21.457 18.629 21.258 18.814 21.019 18.931C20.779 19.048 20.509 19.092 20.245 19.056H20.244L18.076 18.725L17.903 18.698L17.751 18.785L15.056 20.335L14.903 20.423L14.839 20.588L14.045 22.637L14.044 22.638C13.947 22.891 13.776 23.109 13.552 23.263C13.329 23.417 13.064 23.499 12.793 23.5H11.244C10.973 23.499 10.709 23.416 10.486 23.263C10.291 23.128 10.136 22.945 10.035 22.732L9.995 22.639L9.201 20.588L9.136 20.423L8.984 20.335L6.287 18.785L6.135 18.698L5.962 18.725L3.792 19.056C3.528 19.092 3.259 19.048 3.019 18.931C2.839 18.842 2.682 18.716 2.558 18.561L2.446 18.396L1.71 17.106L1.707 17.101L1.658 17.011C1.553 16.798 1.507 16.561 1.524 16.323C1.543 16.052 1.644 15.792 1.814 15.579L1.816 15.576L3.162 13.86L3.268 13.724V10.273Z" stroke="#FFF7ED"/>
    <circle cx="12" cy="12" r="4" fill="#FFF7ED"/>
  </svg>
);

/* ───────────────────────── Main nav (Dashboard → … → Services) ───────────────────────── */
export const NAV_CONFIG: NavConfigItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Dashboard,
    path: '/dashboard',
  },
  {
    id: 'orders',
    label: 'Orders & Pickups',
    icon: Orders,
    children: [
      { id: 'orders-list', label: 'Orders', path: '/orders' },
      { id: 'orders-pickup', label: 'Pickup Request', path: '/orders/pickup-request' },
    ],
  },
  {
    id: 'ndr',
    label: 'NDR',
    icon: Ndr,
    path: '/ndr',
    badge: 28,
    badgeAriaLabel: '28 non-delivery reports requiring action',
  },
  {
    id: 'weight-reconciliation',
    label: 'Weight Reconciliation',
    icon: WeightRecon,
    path: '/weight-reconciliation',
    badge: 28,
    badgeAriaLabel: '28 weight disputes need action',
  },
  {
    id: 'info',
    label: 'Information Center',
    icon: Info,
    children: [
      { id: 'info-pincode', label: 'Pincode Serviceability', path: '/info/pincode' },
      { id: 'info-calc', label: 'Rate Calculator', path: '/info/rate-calculator' },
      { id: 'info-ratecard', label: 'Rate Card', path: '/info/rate-card' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Finance,
    children: [
      { id: 'finance-wallet', label: 'Wallet', path: '/finance/wallet' },
      { id: 'finance-remittance', label: 'Remittance', path: '/finance/remittance' },
      { id: 'finance-invoice', label: 'Invoice & Credits', path: '/finance/invoices' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: Support,
    path: '/support',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: Reports,
    path: '/reports',
  },
  {
    id: 'services',
    label: 'Services',
    icon: Services,
    children: [
      { id: 'services-all', label: 'All', path: '/services' },
      { id: 'services-channels', label: 'Channels', path: '/services/channels' },
    ],
  },
];

/* ───────────────────────── Bottom-pinned nav (Settings) ───────────────────────── */
export const NAV_BOTTOM: NavConfigItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

/**
 * Resolve which top-level (or sub) nav item should be marked active for a given
 * pathname. Returns `{ id, parentId }` where `parentId` is set when the active
 * item is nested inside an expandable parent.
 */
export function resolveActiveNav(pathname: string): { id: string | null; parentId: string | null } {
  const all = [...NAV_CONFIG, ...NAV_BOTTOM];

  for (const item of all) {
    if (item.path && pathname.startsWith(item.path)) {
      return { id: item.id, parentId: null };
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.path && pathname.startsWith(child.path)) {
          return { id: child.id, parentId: item.id };
        }
      }
    }
  }
  return { id: null, parentId: null };
}
