import type { ScheduledReport } from '../types/reports';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const reportsApi = {
  async downloadReport(reportName: string): Promise<boolean> {
    console.log(`Downloading ${reportName}...`);
    await delay(1200); // simulate API download generation
    return true;
  },

  async fetchInitialScheduledReports(): Promise<ScheduledReport[]> {
    await delay(500);
    return [
      {
        id: 1,
        title: 'Weekly Shipment Overview',
        enabled: true,
        recipients: ['ops@xpressbees.com', 'manager@mystore.com'],
        rtype: 'Order Report',
        status: ['Pending', 'In Transit', 'Delivered', 'RTO'],
        sub: ['COD', 'Prepaid', 'Pick Up'],
        freq: 'month',
        time: '06:12',
        dataLastNum: 7,
        dataLastUnit: 'Days',
        date: '2026-05-19',
        isNew: false
      },
      {
        id: 2,
        title: 'NDR Escalation Report',
        enabled: true,
        recipients: ['ndr@mystore.com'],
        rtype: 'NDR Report',
        status: ['Undelivered', 'NDR Raised'],
        sub: ['COD', 'Prepaid'],
        freq: 'month',
        time: '09:00',
        dataLastNum: 1,
        dataLastUnit: 'Weeks',
        date: '2026-05-15',
        isNew: false
      },
      {
        id: 3,
        title: 'Monthly Performance Digest',
        enabled: false,
        recipients: ['ops@mystore.com'],
        rtype: 'Performance Report',
        status: ['Overall Delivery', 'SLA Performance'],
        sub: ['All types'],
        freq: 'month',
        time: '18:30',
        dataLastNum: 1,
        dataLastUnit: 'Months',
        date: '2026-05-01',
        isNew: false
      }
    ];
  }
};
