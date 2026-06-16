import { api } from './ordersApi';
import { checkServiceability as mockCheckServiceability } from '../features/info-center/data/pincodeServiceabilityData';
import type { PsResult } from '../features/info-center/types';

export const pincodeApi = {
  async checkServiceability(origin: string, destination: string): Promise<PsResult | null> {
    try {
      // The user expects the UI to show available couriers for Origin and Destination separately
      // Using the serviciblepincodeslist endpoint for both
      
      const originPromise = api.get(`/pincode/serviciblepincodeslist?pincode=${origin}`);
      const destPromise = api.get(`/pincode/serviciblepincodeslist?pincode=${destination}`);
      
      const [originRes, destRes] = await Promise.all([originPromise, destPromise]);
      
      // We will attach the raw backend records directly to our PsResult so the UI can render them
      const mockResult = mockCheckServiceability(origin, destination);
      if (mockResult) {
         return {
           ...mockResult,
           originCouriers: originRes.data?.data?.records || [],
           destCouriers: destRes.data?.data?.records || []
         } as any;
      }
      
      throw new Error("Invalid pincode or not serviceable");
    } catch (err) {
      console.warn('Fallback to local logic:', err);
      return mockCheckServiceability(origin, destination);
    }
  },

  async downloadActivePincodes(): Promise<any[]> {
    try {
      const res = await api.get('/pincode/list?limit=1000000');
      if (res.data?.status === true && res.data?.data?.records) {
        return res.data.data.records;
      }
      return [];
    } catch (err) {
      console.error('Failed to download pincodes:', err);
      throw err;
    }
  }
};
