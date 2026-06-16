import { api, getDateRangeParams } from './ordersApi';
export const ndrApi = {
  async fetchNdrList(filters: any = {}): Promise<any[]> {
    try {
      const params: any = { limit: 100, ship_status: 'ndr' };
      
      Object.assign(params, getDateRangeParams(filters.dateRange));

      if (filters.paymentMode && filters.paymentMode !== 'all') {
        params.payment_type = filters.paymentMode;
      }
      if (filters.channel) {
        params.channel = filters.channel;
      }

      const res = await api.get('/order/list', { params });
      let records = res.data?.data?.records || [];

      return records.map((r: any): any => {
         const date = new Date(r.order_date ? r.order_date * 1000 : Date.now());
         return {
          id: r.id || `NDR-${Math.floor(Math.random() * 10000)}`,
          orderId: r.awb_number || r.id || `AWB-${Math.floor(Math.random() * 10000)}`,
          attemptDate: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          attemptLabel: '1st Attempt', // Default or parse from backend
          attemptCount: r.attempt_count || 1,
          reason: r.ndr_reason || r.status_reason || 'Customer Unavailable',
          reasonId: r.ndr_reason_id || 'customer-unavailable',
          slaText: '24h overdue', // Default or compute from date
          sla: 'warning',
          priority: 'seller', // Default or parse
          amountDisplay: `₹${parseFloat(r.order_amount || 0).toLocaleString()}`,
          paymentMode: (r.payment_type || 'prepaid').toLowerCase() === 'cod' ? 'cod' : 'prepaid',
          customerName: r.customer_name || 'N/A',
          customerPhone: r.customer_mobile || 'N/A',
          deliveryAddress: `${r.delivery_city || ''}, ${r.delivery_state || ''} ${r.delivery_pincode || ''}`.trim() || 'N/A',
          highRtoRisk: false,
          transportMode: 'surface',
          serviceTier: 'Standard',
          carrier: 'XpressBees',
          lastActionBy: 'XpressBees',
          lastTag: 'awaiting',
          lastActionTime: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          channel: r.order_source || 'Shopify',
          daysSinceAttempt: 1,
         };
      });
    } catch (err) {
      console.error('Failed to fetch NDR list:', err);
      return [];
    }
  },

  async exportNdr(filters: any = {}): Promise<boolean> {
    try {
      const res = await api.get('/ndr/export', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ndr_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (err) {
      console.error('Failed to export NDR:', err);
      return false;
    }
  },

  async bulkUpdateNdr(payload: any): Promise<boolean> {
    try {
      // The backend uses /order/bilkupdate for bulk actions
      const res = await api.post('/order/bilkupdate', payload);
      return res.data?.status === true || res.data?.code === 201;
    } catch (err) {
      console.error('Failed to bulk update NDR:', err);
      return false;
    }
  }
};
