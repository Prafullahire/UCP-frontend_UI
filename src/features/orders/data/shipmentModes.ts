/**
 * Shipment mode catalogue + utilities shared between the New Forward Order
 * "Select Shipment Mode" step and the Ship Now flow launched from the
 * Pending Orders grid. Centralising these definitions keeps the courier
 * comparison rows, AWB generator and state-code formatter in lockstep
 * regardless of the entry point.
 *
 * `mode` is intentionally optional: untagged Xpressbees rows in the
 * reference design are weight-tier variants that don't fit either filter
 * tab.
 */
export interface ShipmentMode {
  id: string;
  courier: string;
  mode?: 'Surface' | 'Air';
  /** Weight slab in kilograms (e.g. 0.5, 1, 2, 5, 10) */
  weight: number;
  /** All-in charge for this slab in rupees */
  rate: number;
}

export const SHIPMENT_MODES: ShipmentMode[] = [
  { id: 'air-xb-05', courier: 'Air Xpressbees',     mode: 'Air',     weight: 0.5, rate: 68  },
  { id: 'sur-xb-05', courier: 'Xpressbees Surface', mode: 'Surface', weight: 0.5, rate: 70  },
  { id: 'xb-1',      courier: 'Xpressbees',                          weight: 1,   rate: 99  },
  { id: 'xb-2',      courier: 'Xpressbees',                          weight: 2,   rate: 152 },
  { id: 'xb-5',      courier: 'Xpressbees',                          weight: 5,   rate: 214 },
  { id: 'xb-10',     courier: 'Xpressbees',                          weight: 10,  rate: 314 },
];

/* Compact 2-letter postal codes for the Indian states our mock data
   uses. Mirrors the "{pincode}, {state-code}" format shown in the
   reference design's order-summary sidebar (e.g. "560002, KA"). */
const STATE_CODES: Record<string, string> = {
  'Karnataka':      'KA',
  'Maharashtra':    'MH',
  'Delhi':          'DL',
  'Tamil Nadu':     'TN',
  'Uttar Pradesh':  'UP',
  'West Bengal':    'WB',
  'Gujarat':        'GJ',
  'Rajasthan':      'RJ',
  'Telangana':      'TS',
  'Andhra Pradesh': 'AP',
  'Kerala':         'KL',
  'Punjab':         'PB',
  'Haryana':        'HR',
  'Madhya Pradesh': 'MP',
};

export const toStateCode = (state: string): string =>
  STATE_CODES[state] ?? state.slice(0, 2).toUpperCase();

/* AWB pattern mimics the XB Sellportal format: "1XB" prefix + 11 digits. */
export function genAwbNumber(): string {
  const tail = Math.floor(10_000_000_000 + Math.random() * 89_999_999_999);
  return `1XB${tail}`;
}
