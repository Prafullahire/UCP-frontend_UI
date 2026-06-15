import { api, getDateRangeParams } from './ordersApi';
import type { ScheduledReport } from '../types/reports';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mapToBackendPayload = (report: Partial<ScheduledReport>) => {
  const typeMap: Record<string, number> = {
    'Order Report': 1,
    'NDR Report': 2,
    'Product Wise Summary': 3,
    'Performance Report': 4,
  };
  
  const csvFields = [...(report.status || []), ...(report.sub || [])]
    .map(s => s.replace(/[^a-zA-Z0-9_]/g, '_'))
    .filter(Boolean)
    .join(',') || 'default_field';

  return {
    ...(report.id && { id: report.id }),
    slag: report.rtype ? typeMap[report.rtype] || 1 : 1,
    user_id: 1, 
    report_name: report.title || 'Untitled Report',
    emails: report.recipients || [],
    frequency: report.freq === 'month' ? 'monthly' : report.freq === 'week' ? 'weekly' : 'daily',
    days_of_week: report.dayOfWeek ? [report.dayOfWeek] : null,
    dates: report.date ? [parseInt(report.date.split('-')[2], 10)] : null,
    time: (report.time?.length === 5 ? report.time + ':00' : report.time) || '00:00:00',
    data_period_value: report.dataLastNum || 1,
    data_period_unit: report.dataLastUnit?.toLowerCase() || 'days',
    status: report.enabled !== false ? 'active' : 'disabled',
    csv_field: csvFields
  };
};

const mapToFrontendReport = (row: any): ScheduledReport => {
  const revTypeMap: Record<number, string> = {
    1: 'Order Report',
    2: 'NDR Report',
    3: 'Product Wise Summary',
    4: 'Performance Report',
  };
  
  const freqMap: Record<string, 'day' | 'week' | 'month'> = {
    'daily': 'day',
    'weekly': 'week',
    'monthly': 'month'
  };

  const dates = Array.isArray(row.dates) ? row.dates[0] : row.dates;
  const dayStr = dates ? String(dates).padStart(2, '0') : '19';
  const fullDate = `2026-05-${dayStr}`;

  return {
    id: row.id,
    title: row.report_name || 'Untitled Report',
    enabled: row.status === 'active',
    recipients: Array.isArray(row.emails) ? row.emails : (row.emails ? JSON.parse(row.emails) : []),
    rtype: revTypeMap[row.slag] || 'Order Report',
    status: [], 
    sub: [],
    freq: freqMap[row.frequency] || 'month',
    time: row.time ? row.time.substring(0, 5) : '00:00', 
    dataLastNum: row.data_period_value || 1,
    dataLastUnit: row.data_period_unit ? row.data_period_unit.charAt(0).toUpperCase() + row.data_period_unit.slice(1) : 'Days',
    date: fullDate,
    dayOfWeek: Array.isArray(row.days_of_week) ? row.days_of_week[0] : (row.days_of_week || 'Wednesday'),
    isNew: false
  };
};

export const reportsApi = {
  async downloadReport(reportName: string, dateFilter?: any): Promise<boolean> {
    let endpoint = '/order/export';
    const params: any = {};
    
    if (dateFilter) {
      Object.assign(params, getDateRangeParams(dateFilter.type));
      
      if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        const start = new Date(dateFilter.startDate);
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        params.start_date = Math.floor(start.getTime() / 1000);
        params.end_date = Math.floor(end.getTime() / 1000);
      }
    }

    if (reportName === 'FWD In-Transit Orders') {
      params.ship_status = 'in transit';
    } else if (reportName === 'NDR Report') {
      endpoint = '/ndr/export';
      params.ship_status = 'ndr';
    }

    try {
      // For NDR Report, we try the specific backend export endpoint first
      if (endpoint === '/ndr/export') {
        try {
          const res = await api.get(endpoint, {
            params,
            responseType: 'blob',
          });
          
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          return true;
        } catch (exportErr) {
          console.warn('NDR export endpoint failed, falling back to local CSV generation', exportErr);
        }
      }
      
      // For all other reports, generate CSV locally to avoid non-existent export routes
      console.log('Generating local CSV for', reportName);
      
      let allRecords: any[] = [];
      let page = 1;
      const limit = 5000;
      
      while (page <= 20) { // Max 100,000 records to prevent infinite loop
        const fallbackParams = { ...params, limit, page };
        const res = await api.get('/order/list', { params: fallbackParams });
        const records = res.data?.data?.records || [];
        
        if (records.length === 0) break;
        
        allRecords = allRecords.concat(records);
        
        if (records.length < limit) break; // Reached the last page
        page++;
      }
      
      if (allRecords.length === 0) {
        console.warn('No data found for this date range to export');
        return false;
      }
      
      // Convert records to CSV
      const headers = Object.keys(allRecords[0]).join(',');
      const rows = allRecords.map((r: any) => Object.values(r).map(v => {
        const val = v === null || v === undefined ? '' : String(v);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','));
      const csvContent = [headers, ...rows].join('\n');
      
      const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;

    } catch (err: any) {
      console.error(`Failed to download ${reportName}:`, err);
      throw err;
    }
  },



  async fetchInitialScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const res = await api.get('/schedule/list');
      const records = res.data?.data || res.data?.records || [];
      if (Array.isArray(records)) {
        return records.map(mapToFrontendReport);
      } else if (res.data?.data?.records && Array.isArray(res.data.data.records)) {
        return res.data.data.records.map(mapToFrontendReport);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch scheduled reports:', err);
      return [];
    }
  },

  async createScheduleReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport | null> {
    try {
      const payload = mapToBackendPayload(report as ScheduledReport);
      const res = await api.post('/schedule/create', payload);
      if (res.data?.data) {
        return mapToFrontendReport(res.data.data);
      }
      return null;
    } catch (err) {
      console.error('Failed to create scheduled report:', err);
      return null;
    }
  },

  async updateScheduleReport(id: number, report: Partial<ScheduledReport>): Promise<boolean> {
    try {
      const payload = mapToBackendPayload({ id, ...report });
      const res = await api.post('/schedule/create', payload);
      return res.status === 200 || res.status === 201;
    } catch (err) {
      console.error('Failed to update scheduled report:', err);
      return false;
    }
  },

  async deleteScheduleReport(id: number): Promise<boolean> {
    try {
      const res = await api.delete(`/schedule/delete_schedule/${id}`);
      return res.status === 200 || res.status === 201;
    } catch (err) {
      console.error('Failed to delete scheduled report:', err);
      return false;
    }
  }
};
