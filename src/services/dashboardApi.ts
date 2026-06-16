import { api } from './ordersApi';

export const dashboardApi = {
  async fetchDashboardStats(dateRangeFilters: any = {}) {
    try {
      const res = await api.get('/dashboard/stats', { params: dateRangeFilters });
      return res.data?.data || {};
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      return {};
    }
  },

  async fetchNotifications() {
    try {
      const res = await api.get('/dashboard/notifications');
      return res.data?.data || {};
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      return {};
    }
  }
};
