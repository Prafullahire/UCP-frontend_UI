import React, { useMemo, useState } from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import Toast from '../../components/ui/Toast';
import SupportKpiOverview from './components/SupportKpiOverview';
import SupportFilterBar, { type SupportFilterState } from './components/SupportFilterBar';
import TicketsTable from './components/TicketsTable';
import CreateTicketDrawer from './components/CreateTicketDrawer';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import BulkTicketDrawer from './components/BulkTicketDrawer';
import { BULK_AWB_DATA, FILTER_STATUSES, INITIAL_TICKETS } from './data/supportData';
import { supportApi } from '../../services/supportApi';
import type { TabId, Ticket } from './types';

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DetailState {
  ticket: Ticket;
  viewOnly: boolean;
}

/**
 * Top-level Support page.
 *
 *   • Renders the page header + "+ Create Ticket" CTA.
 *   • KPI overview ("Last 30-Days Data Overview").
 *   • Tab strip — Open / Resolved / Closed (counts driven by ticket state).
 *   • Filter bar — date / sub-category / status / sort.
 *   • Tickets table.
 *   • Mounts the Create / Detail / Bulk drawers based on local state.
 *
 * Reuses the project-wide toast (`useReportsStore.showToast`) so support
 * surfaces feedback through the existing notification surface.
 */
export const SupportPage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState<TabId>('open');

  const [filters, setFilters] = useState<SupportFilterState>({
    dateRange: 'last30',
    subCategory: null,
    status: null,
    sort: 'new',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.fetchTickets(filters);
      if (data && data.length > 0) {
        // HACK: send first ticket to local server for inspection
        if (typeof window !== 'undefined') {
          fetch('http://localhost:9999', { method: 'POST', body: JSON.stringify(data[0]) }).catch(() => {});
        }
        
        // Ensure data is sorted by created_at descending so newest are at the top
        const sortedData = [...data].sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        
        setTickets((prevTickets) => {
          const mapped: Ticket[] = sortedData.map((t: any) => {
            const existing = prevTickets.find(x => x.id === (t.ticket_id || t.id));
            const rawComments = t.comments || t.remarks || t.remarks_data || t.history || t.messages || t.remark_details || t.comments_data;
            
            let messages = undefined;
            if (Array.isArray(rawComments)) {
              messages = rawComments.map((c: any, i: number) => ({
                id: String(c.id || i),
                sender: (c.added_by === 'seller' || c.user_type === 'seller') ? 'seller' : 'support',
                text: c.comments || c.remarks || c.remark || c.message || '',
                time: c.created_at || c.date || 'N/A'
              }));
            } else if (existing && existing.messages) {
              messages = existing.messages;
            }

            return {
              id: t.ticket_id || t.id,
              internal_id: t.id,
              date: t.created_at?.split('T')[0] || 'N/A',
              time: '00:00',
              awb: t.awb_no || t.awb_number || 'N/A',
              sub: t.sub_category || 'N/A',
              cat: t.category || 'N/A',
              status: t.status?.toLowerCase() || 'open',
              due: t.resolution_due_by || 'N/A',
              updated: t.updated_at || 'N/A',
              sla: 'ok',
              messages,
            };
          });
          return mapped;
        });
      }
    } catch (err) {
      console.error('Error loading tickets', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  /* ─── Counts ─────────────────────────────────────────── */

  const counts = useMemo(() => ({
    open:     tickets.filter((t) => ['open', 'wip', 'awaiting', 'created', 'new', 'pending'].includes(t.status)).length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed:   tickets.filter((t) => t.status === 'closed').length,
  }), [tickets]);

  const wipCount      = tickets.filter((t) => t.status === 'wip').length;
  const awaitingCount = tickets.filter((t) => t.status === 'awaiting').length;
  const resolvedSla   = tickets.filter((t) => t.status === 'resolved' && t.sla === 'ok').length + 23; // pad with historical

  /* ─── Filtered rows ──────────────────────────────────── */

  const visibleRows = useMemo(() => {
    const tabPredicate = (t: Ticket) => {
      const openStatuses = ['open', 'wip', 'awaiting', 'created', 'new', 'pending'];
      if (activeTab === 'open')     return openStatuses.includes(t.status);
      if (activeTab === 'resolved') return t.status === 'resolved';
      return t.status === 'closed';
    };
    let list = tickets.filter(tabPredicate);
    if (filters.subCategory) {
      list = list.filter((t) => t.sub === filters.subCategory);
    }
    if (filters.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters.sort === 'old') {
      list = [...list].reverse();
    }
    return list;
  }, [tickets, activeTab, filters]);

  /* ─── Handlers ───────────────────────────────────────── */

  const handleReopen = (ticket: Ticket) => {
    if (!ticket.reopenHrsLeft) return;
    setTickets((prev) => {
      const others = prev.filter((t) => t.id !== ticket.id);
      const reopened: Ticket = { ...ticket, status: 'open', isNew: true, updated: '17 May 2026, Now' };
      return [reopened, ...others];
    });
    setActiveTab('open');
    showToast(`↩ Ticket ${ticket.id} reopened — moved to top of Open tab`);
  };

  const handleMarkResolved = async (id: string) => {
    const t = tickets.find(x => x.id === id);
    if (t) {
      const internalId = t.internal_id || t.id;
      await supportApi.updateTicket(internalId, {
        id: internalId,
        escalation_status: 'resolved',
        useMaster: true
      });
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'resolved', reopenHrsLeft: 48 } : t
      )
    );
    setDetail(null);
    setActiveTab('resolved');
    showToast(`✓ Ticket ${id} marked as resolved`);
  };

  const handleCreated = () => {
    loadTickets();
    setCreateOpen(false);
    setActiveTab('open');
  };

  const handleOpenExisting = (existingId: string, awb: string) => {
    setCreateOpen(false);
    const tk = tickets.find((t) => t.id === existingId) ?? {
      id: existingId,
      date: '15 May 2026',
      time: '11:00 AM',
      awb,
      sub: 'Issue Over Undelivered Shipment',
      cat: 'Shipment, NDR & RTO',
      status: 'open' as const,
      due: '19 May 2026, 10:00 AM',
      updated: '16 May 2026, 04:22 PM',
      sla: 'ok' as const,
    };
    setTimeout(() => setDetail({ ticket: tk, viewOnly: false }), 200);
  };

  /* ─── Render ─────────────────────────────────────────── */

  const subCategoryOptions = useMemo(() => {
    const distinct = new Set<string>();
    tickets.forEach((t) => distinct.add(t.sub));
    return Array.from(distinct).map((c) => ({ id: c, label: c }));
  }, [tickets]);

  const statusOptions = useMemo(() => {
    const distinct = new Set<string>();
    tickets.forEach((t) => distinct.add(t.status));
    return Array.from(distinct).map((s) => ({
      id: s,
      label: s === 'wip' || s === 'in progress' 
        ? 'In Progress' 
        : s.charAt(0).toUpperCase() + s.slice(1)
    }));
  }, [tickets]);

  return (
    <div className="page fade">
      <div className="sup-ph">
        <div>
          <div className="sup-ph-title">Support</div>
          <div className="sup-ph-sub">Get help by creating a ticket or reading help articles</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--border)' }}
            onClick={() => {
              window.location.reload();
            }}
          >
            {RefreshIcon}
            Refresh
          </button>
          <button type="button" className="btn btn-p" onClick={() => setCreateOpen(true)}>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            Create Ticket
          </button>
        </div>
      </div>

      <SupportKpiOverview
        open={counts.open}
        wip={wipCount}
        awaiting={awaitingCount}
        resolvedSla={resolvedSla}
      />

      <div className="sup-tabs" role="tablist" aria-label="Ticket lifecycle">
        {(['open', 'resolved', 'closed'] as TabId[]).map((id) => {
          const label = id[0].toUpperCase() + id.slice(1);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`sup-tab ${activeTab === id ? 'on' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
              <span className="sup-tab-count">{counts[id]}</span>
            </button>
          );
        })}
      </div>

      <SupportFilterBar
        state={filters}
        onChange={setFilters}
        subCategoryOptions={subCategoryOptions}
        statusOptions={statusOptions}
      />

      <TicketsTable
        rows={visibleRows}
        tab={activeTab}
        onView={(t, viewOnly) => setDetail({ ticket: t, viewOnly })}
        onUpdate={(t) => setDetail({ ticket: t, viewOnly: false })}
        onReopen={handleReopen}
      />

      {createOpen && (
        <CreateTicketDrawer
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
          onOpenExisting={handleOpenExisting}
          showToast={showToast}
        />
      )}

      {detail && (
        <TicketDetailDrawer
          ticket={detail.ticket}
          viewOnly={detail.viewOnly}
          onClose={() => setDetail(null)}
          onMarkResolved={handleMarkResolved}
          onSendMessage={(newMsg) => {
            showToast('✓ Message sent');
            if (newMsg) {
              setTickets(prev => prev.map(t => {
                if (t.id === detail.ticket.id) {
                  const msgs = t.messages || [];
                  return { ...t, messages: [...msgs, newMsg] };
                }
                return t;
              }));
              setDetail({
                ...detail,
                ticket: {
                  ...detail.ticket,
                  messages: [...(detail.ticket.messages || []), newMsg]
                }
              });
            }
          }}
          onSubmitUpdate={() => {
            showToast('✓ Update submitted');
            loadTickets();
            setDetail(null);
          }}
        />
      )}

      {bulkOpen && (
        <BulkTicketDrawer
          rows={BULK_AWB_DATA}
          onClose={() => setBulkOpen(false)}
          onViewTicket={(row) => {
            setBulkOpen(false);
            const tk: Ticket = {
              id: row.tkId ?? 'TK-???',
              date: '17 May 2026',
              time: '10:30 AM',
              awb: row.awb,
              sub: 'Issue Over Undelivered Shipment',
              cat: 'Shipment, NDR & RTO',
              status: 'open',
              due: '19 May 2026, 10:30 AM',
              updated: '17 May 2026, 10:30 AM',
              sla: 'ok',
            };
            setTimeout(() => setDetail({ ticket: tk, viewOnly: false }), 200);
            showToast(`Viewing ticket ${tk.id} for order ${row.order}`);
          }}
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

export default SupportPage;
