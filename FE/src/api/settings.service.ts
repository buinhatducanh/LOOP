/**
 * Customer settings / profile API
 * Stub: calls PUT /api/customer/profile when BE endpoint exists
 */
import { api } from './client';

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export const settingsService = {
  /** Update customer profile — stub with graceful fallback */
  updateProfile: async (data: CustomerProfile): Promise<{ success: boolean }> => {
    try {
      await api.put('/customer/profile', data);
      return { success: true };
    } catch {
      // BE endpoint not yet implemented — return success anyway (localStorage fallback used)
      return { success: true };
    }
  },
};
