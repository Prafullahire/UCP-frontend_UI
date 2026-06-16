/**
 * Pincode Serviceability dataset & helpers.
 *
 * Mirrors the `PS_SERVICEABLE`, `checkServiceability()` and
 * `zNameMap` / `estMap` logic from
 * `ui-source/screens/info-center v1.html`.
 */

import type { PinDetails, PsResult, PsService, Zone } from '../types';
import { detectZone, pinInfo } from './rateCalculatorData';

/** Seed list of pincodes known to be serviceable. */
export const PS_SERVICEABLE = new Set<string>([
  '411006', '560025', '400001', '110001', '600001',
  '700001', '500001', '380001', '302001', '226001', '800001',
]);

const ZONE_FULL_NAME: Record<Zone, string> = {
  z1: 'Zone A — Within City',
  z2: 'Zone B — Regional / Within State',
  z3: 'Zone C — Metro to Metro',
  z4: 'Zone D — Rest of India',
  z5: 'Zone E — Special Destination',
};

const ETA_BY_ZONE: Record<Zone, string> = {
  z1: 'Same Day / Next Day',
  z2: '1–2 Business Days',
  z3: '2–3 Business Days',
  z4: '3–5 Business Days',
  z5: '5–7 Business Days',
};

function isServiceable(pin: string, info: PinDetails | null): boolean {
  // For UI demonstration purposes, treat all valid 6-digit pincodes as serviceable
  return /^[0-9]{6}$/.test(pin);
}

/**
 * Validate input and produce the full {@link PsResult} payload
 * shown on the right panel. Returns `null` for invalid pincodes —
 * callers should show a toast in that case.
 */
export function checkServiceability(
  originRaw: string,
  destRaw: string,
): PsResult | null {
  const origin = originRaw.trim();
  const dest   = destRaw.trim();
  if (origin.length !== 6 || Number.isNaN(Number(origin))) return null;
  if (dest.length !== 6   || Number.isNaN(Number(dest)))   return null;

  const originInfo = pinInfo(origin);
  const destInfo   = pinInfo(dest);

  const oOk = isServiceable(origin, originInfo);
  const dOk = isServiceable(dest, destInfo);
  const bothOk = oOk && dOk;

  const zone = detectZone(origin, dest);
  const etaLabel = ETA_BY_ZONE[zone];

  const services: PsService[] = bothOk
    ? [
        {
          name:   'Surface Freight',
          detail: `${etaLabel} · COD Available`,
          ok:     true,
          icon:   '🚚',
        },
        {
          name:   'Air Express',
          detail: `${zone === 'z4' || zone === 'z5' ? '2–4 Business Days' : '1–2 Business Days'} · COD Available`,
          ok:     true,
          icon:   '✈',
        },
        {
          name:   'Same Day Delivery',
          detail: 'Available in select metro cities only',
          ok:     zone === 'z1',
          icon:   '⚡',
        },
        {
          name:   'COD Collection',
          detail: `Remittance T+${zone === 'z1' ? '1' : zone === 'z2' ? '2' : '3'} business days`,
          ok:     true,
          icon:   '💰',
        },
      ]
    : [
        { name: 'Surface Freight', detail: 'Pincode not in serviceable zone', ok: false, icon: '🚚' },
        { name: 'Air Express',     detail: 'Pincode not in serviceable zone', ok: false, icon: '✈'  },
        { name: 'COD Collection',  detail: 'Not available',                   ok: false, icon: '💰' },
      ];

  return {
    origin,
    destination: dest,
    originInfo,
    destInfo,
    zone,
    zoneLabel: ZONE_FULL_NAME[zone],
    etaLabel,
    status: bothOk ? 'serviceable' : 'unserviceable',
    services,
  };
}
