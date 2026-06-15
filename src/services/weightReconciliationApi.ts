import { api, getDateRangeParams } from './ordersApi';
import type { WrRecord } from '../features/weight-reconciliation/types';

export const weightReconciliationApi = {
  async fetchRecords(filters: any = {}): Promise<WrRecord[]> {
    try {
      const params: any = { limit: 100, page: 1 };
      
      const { start_date, end_date } = getDateRangeParams(filters.dateRange);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;

      if (filters.statusFilter) {
        if (filters.statusFilter === 'under-review') {
          params.status = 'dispute';
        } else if (filters.statusFilter === 'action-pending') {
          params.status = 'action pending';
        } else if (filters.statusFilter === 'auto-accepted') {
          params.status = 'auto accepted';
        } else if (filters.statusFilter === 'seller-accepted') {
          params.status = 'accepted';
        } else {
          params.status = filters.statusFilter;
        }
      }

      // Hit the real backend API
      const res = await api.get('/weight-reco/list', { params });
      let records = res.data?.data?.records || res.data?.data || [];
      if (!Array.isArray(records)) {
        records = [];
      }

      // Map backend data to frontend model using exact DB fields from his controller
      return records.map((r: any): WrRecord => {
        // Calculate days left for action pending
        let daysLeft = 0;
        if (r.apply_weight_date) {
          const appliedTime = r.apply_weight_date * 1000;
          const disputeTimeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days
          const deadline = appliedTime + disputeTimeLimit;
          const diff = deadline - Date.now();
          daysLeft = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
        }

        let state: any = null;
        let acceptedBy: any = undefined;
        const statusStr = (r.seller_action_status || '').toLowerCase();
        
        if (statusStr === 'dispute') state = 'open';
        else if (statusStr === 'closed') state = 'closed';
        else if (statusStr === 'accepted' || statusStr === 'auto accepted') {
          state = 'accepted';
          acceptedBy = statusStr === 'auto accepted' ? 'auto' : 'seller';
        }

        const billedWeight = parseFloat(r.courier_billed_weight || 0) * 1000; // convert to grams if needed
        let slabBucket: any = '500_1000';
        if (billedWeight <= 1000) slabBucket = '500_1000';
        else if (billedWeight <= 2000) slabBucket = '1001_2000';
        else if (billedWeight <= 5000) slabBucket = '2001_5000';
        else slabBucket = '5000_plus';

        return {
          id: String(r.id || `wr-${Math.random()}`),
          appliedDate: r.apply_weight_date ? new Date(r.apply_weight_date * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          awb: r.awb_number || '',
          orderId: r.order_id || '',
          entered: {
            dead: (r.seller_dead_weight || 0.5) + 'kg',
            dims: `${r.seller_package_length || 10}x${r.seller_package_breadth || 10}x${r.seller_package_height || 10}`,
            slab: (r.seller_booking_weight || 0.5) + 'kg',
            volumetric: (r.seller_volumetric_weight || 0.5) + 'kg',
          },
          appliedWeight: (r.courier_billed_weight || 1) + 'kg',
          charges: {
            forward: '₹' + (r.extra_weight_charges || 0),
            rto: '₹' + (r.rto_extra_weight_charges || 0),
            chargedToWallet: r.applied_to_wallet === '1' || r.applied_to_wallet === 1,
          },
          product: r.product_name || 'Product',
          daysLeft,
          state,
          acceptedBy,
          slabBucket,
        };
      });
    } catch (err) {
      console.error('Failed to fetch weight reconciliation records from backend:', err);
      throw err;
    }
  },

  async exportRecords(filters: any = {}, fallbackRecords?: WrRecord[]): Promise<void> {
    try {
      const params: any = {};
      const { start_date, end_date } = getDateRangeParams(filters.dateRange);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      
      // There is no explicit /weight-reco/export endpoint. 
      // We will generate the CSV locally from the currently visible filtered records.
      const records = fallbackRecords && fallbackRecords.length > 0 ? fallbackRecords : await this.fetchRecords(filters);
      if (records.length === 0) {
        throw new Error("No data to export");
      }

      const headers = "Applied Date,AWB Number,Order ID,Entered Dead,Entered Dims,Applied Weight,Charges Forward,Charges RTO,Product";
      const rows = records.map(r => {
        return [
          r.appliedDate,
          r.awb,
          r.orderId,
          r.entered.dead,
          r.entered.dims,
          r.appliedWeight,
          r.charges.forward,
          r.charges.rto || '',
          r.product
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `weight_reconciliation_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export weight reconciliation records:', err);
      throw err;
    }
  }
};


