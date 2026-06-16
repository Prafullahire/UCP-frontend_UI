import { api } from './ordersApi';

export const warehouseApi = {
  async getWarehouses() {
    try {
      const res = await api.get('/warehouse/list');
      // The API returns an object or array, let's aggressively parse it
      let list: any[] = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data;
      return list;
    } catch (e) {
      console.error('Failed to fetch warehouses', e);
      return [];
    }
  },

  async createWarehouse(data: any) {
    try {
      const res = await api.post('/warehouse/create', data);
      return res.data;
    } catch (e) {
      console.error('Failed to create warehouse', e);
      throw e;
    }
  }
};
