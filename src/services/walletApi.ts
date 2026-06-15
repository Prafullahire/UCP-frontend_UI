import { api, getDateRangeParams } from './ordersApi';

export interface WalletKpis {
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
  availableBalance: number;
}

export const walletApi = {
  async fetchTransactions(filters: any = {}): Promise<any[]> {
    try {
      const params: any = { limit: 100 };
      Object.assign(params, getDateRangeParams(filters.dateRange));

      if (filters.rechargeType) {
        params.type = filters.rechargeType;
      }
      
      const res = await api.get('/wallet/transaction', { params });
      let records = res.data?.data?.records || [];
      if(!Array.isArray(records) && res.data?.data) {
         records = Array.isArray(res.data.data) ? res.data.data : [];
      }

      // Convert to WalletTransaction format expected by UI
      return records.map((r: any) => {
        const dateObj = r.created ? new Date(typeof r.created === 'number' && r.created < 10000000000 ? r.created * 1000 : r.created) : new Date();
        return {
          id: r.id || r.transaction_id || `TXN-${Math.floor(Math.random() * 10000)}`,
          date: r.created ? dateObj.toLocaleDateString('en-GB') : 'N/A',
          time: r.created ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          awb: r.awb || r.awb_number || null,
          description: r.notes || r.txn_for || r.description || 'Wallet transaction',
          rechargeType: r.txn_for || r.type || r.recharge_type || 'other',
          amount: parseFloat(r.amount || r.credit || r.debit || 0) * ((r.type === 'debit' || r.txn_type === 'debit') ? -1 : 1),
          availableBalance: parseFloat(r.balance_after || r.balance || r.available_balance || r.closing_balance || 0),
        };
      });
    } catch (err) {
      console.error('Failed to fetch wallet transactions:', err);
      return [];
    }
  },

  async fetchBalance(): Promise<number> {
    try {
      const res = await api.get('/wallet/headerbalance');
      return parseFloat(res.data?.data?.balance || res.data?.data?.available_balance || 0);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      return 0;
    }
  },

  async recharge(amount: number, paymentMode: string = 'razorpay'): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const res = await api.post('/recharge', {
        amount,
        payment_mode: paymentMode
      });
      return { success: res.data?.status === true, data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      console.error('Failed to recharge wallet:', err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  async initiatePayURecharge(amount: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const res = await api.post('/payment/payu/generate', {
        amount,
        productinfo: 'Wallet Recharge'
      });
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      console.error('Failed to generate PayU payment:', err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }
};
