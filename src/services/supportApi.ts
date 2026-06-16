import { api } from './ordersApi';

export const supportApi = {
  async fetchTickets(filters: any = {}): Promise<any[]> {
    try {
      const params: any = { limit: 100 };
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      
      const res = await api.get('/escalation/list', { params });
      return res.data?.data?.records || res.data?.data || [];
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      return [];
    }
  },

  async createTicket(payload: any): Promise<any> {
    try {
      let data = payload;
      let headers = {};
      
      if (payload.file) {
        data = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            data.append(key, payload[key]);
          }
        });
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      const res = await api.post('/escalation/create', data, { headers });
      if (res.data?.status === true || res.data?.code === 200 || res.data?.code === 201) {
        return res.data?.data || res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to create ticket:', err);
      return null;
    }
  },

  async updateTicket(ticketId: string, payload: any): Promise<boolean> {
    try {
      let data: any = {
        id: ticketId,
        ...payload
      };
      let headers = {};

      if (payload.file) {
        data = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            data.append(key, payload[key]);
          }
        });
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      const res = await api.put('/escalation/update', data, { headers });
      return res.data?.status === true || res.data?.code === 200 || res.data?.code === 201;
    } catch (err) {
      console.error('Failed to update ticket:', err);
      return false;
    }
  },

  async addTicketRemark(ticketId: string | number, payload: any): Promise<boolean> {
    try {
      let data: any = {
        escalation_id: ticketId,
        ...payload
      };
      let headers = {};

      if (payload.file) {
        data = new FormData();
        data.append('escalation_id', String(ticketId));
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            data.append(key, payload[key]);
          }
        });
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      const res = await api.post('/escalation/add_remarks', data, { headers });
      return res.data?.status === true || res.data?.code === 200 || res.data?.code === 201;
    } catch (err) {
      console.error('Failed to update ticket:', err);
      return false;
    }
  }
};
