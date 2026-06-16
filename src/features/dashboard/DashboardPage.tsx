import React, { useState, useEffect } from 'react';
import KpiCard from './components/KpiCard';
import NotificationBanner from './components/NotificationBanner';
import DateRangeDropdown from './components/DateRangeDropdown';
import OrdersTab from './tabs/OrdersTab';
import NdrTab from './tabs/NdrTab';
import RtoTab from './tabs/RtoTab';
import { TOP_KPIS as STATIC_TOP_KPIS } from './data/dashboardData';
import { dashboardApi } from '../../services/dashboardApi';
import { ordersApi } from '../../services/ordersApi';

type TabId = 'orders' | 'ndr' | 'rto';

interface TabSpec {
  id: TabId;
  label: string;
  count: string;
}

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [kpis, setKpis] = useState(STATIC_TOP_KPIS);
  const [tabs, setTabs] = useState<TabSpec[]>([
    { id: 'orders', label: 'Orders & Shipments', count: '0' },
    { id: 'ndr',    label: 'NDR',                count: '0' },
    { id: 'rto',    label: 'RTO',                count: '0' },
  ]);
  const [notificationMsg, setNotificationMsg] = useState<React.ReactNode>(
    <>Action needed: <b>Loading...</b></>
  );

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const [statsData, notifData, pendingOrders, pickups] = await Promise.all([
          dashboardApi.fetchDashboardStats(),
          dashboardApi.fetchNotifications(),
          ordersApi.fetchPendingOrders({}),
          ordersApi.fetchShipments('ready-to-pickup', {})
        ]);

        const pendingShipmentCount = pendingOrders.length;
        const pendingPickupCount = pickups.length;
        const ndrCount = notifData?.ndr?.action_required || 0;
        const weightDisputes = notifData?.weight?.total_weight_disputes || 0;

        setKpis([
          { lbl: 'Pending Shipment', n: pendingShipmentCount.toString(), sub: 'awaiting dispatch', sev: 'med', cta: 'Ship Now', tip: 'Orders ready to ship' },
          { lbl: 'Pending Pickup', n: pendingPickupCount.toString(), sub: 'pickups scheduled', sev: 'med', cta: 'Book Now', tip: 'Manifested but not picked up' },
          { lbl: 'Critical NDR Action Required', n: ndrCount.toString(), sub: 'at RTO risk', sev: 'high', cta: 'Resolve', tip: 'Non-delivery reports needing action' },
          { lbl: 'Weight Dispute', n: weightDisputes.toString(), sub: 'in penalties', sev: 'low', cta: 'Resolve', tip: 'Courier weight mismatch' },
        ]);

        const totalShipments = statsData?.total_shipments || 0;
        const totalRto = statsData?.rto || 0;

        setTabs([
          { id: 'orders', label: 'Orders & Shipments', count: totalShipments.toString() },
          { id: 'ndr',    label: 'NDR',                count: ndrCount.toString() },
          { id: 'rto',    label: 'RTO',                count: totalRto.toString() },
        ]);

        if (ndrCount > 0) {
          setNotificationMsg(
            <>Action needed: <b>{ndrCount} NDRs unresolved</b> — revenue at risk.</>
          );
        } else if (weightDisputes > 0) {
          setNotificationMsg(
            <>Action needed: <b>{weightDisputes} Weight disputes</b> pending.</>
          );
        } else {
          setNotificationMsg(
            <><b>All caught up!</b> No pending critical actions.</>
          );
        }

      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
    };
    fetchDynamicData();
  }, []);

  return (
    <div className="page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="dash-ph">
        <div>
          <div className="dash-ph-title">Dashboard</div>
          <div className="dash-ph-sub">Last updated just now</div>
        </div>
        <DateRangeDropdown />
      </div>

      {/* ── Quick Actions strip + alert ─────────────────────────────── */}
      <div className="dash-sec-lbl">Quick Actions</div>
      <NotificationBanner>
        {notificationMsg}
      </NotificationBanner>

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <div className="kpi-grid kpi-grid-4">
        {kpis.map((k) => (
          <KpiCard key={k.lbl} {...k} />
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="d-tabs" role="tablist" aria-label="Dashboard sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`d-tab ${activeTab === t.id ? 'on' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="d-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Active tab content ──────────────────────────────────────── */}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'ndr'    && <NdrTab />}
      {activeTab === 'rto'    && <RtoTab />}
    </div>
  );
};

export default DashboardPage;

