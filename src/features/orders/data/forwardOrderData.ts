/**
 * Mock data for the New Forward Order screen.
 *
 * Mirrors the four screenshots supplied with the brief and intentionally
 * lives in a separate file so a future API swap touches only this module.
 * Where possible types are re-exported (e.g. customer addresses re-use the
 * same `OrderAddress` shape that powers the Pending grid).
 */

import type { OrderAddress } from '../types';

/* ──────────────────────────── Saved pickup locations ──────────────────────────── */

export type AddressTag = 'Warehouse' | 'Home' | 'Work' | 'Other';

export interface SavedPickup {
  id: string;
  /** Display label — "Design Studio 1" in the screenshot */
  name: string;
  tag: AddressTag;
  /** Single-line address as displayed in the card */
  address: string;
  city: string;
  state: string;
  pincode: string;
  /** Country defaults to India — kept for completeness */
  country: string;
  contactPhone: string;
  contactPersonName: string;
  email: string;
  supportPhone: string;
  /** Convenience flags — drive the green "Verified" badge */
  isVerified: boolean;
  /** First saved pickup is treated as the Primary (auto-selected) */
  isPrimary: boolean;
  /** Label-printing preferences */
  hideWarehouseAddress: boolean;
  hideWarehousePhone: boolean;
  hideCustomerPhone: boolean;
  hideProductDetails: boolean;
  /** Return address mirrors pickup when true */
  returnSameAsPickup: boolean;
}

export const SAVED_PICKUPS: SavedPickup[] = [
  {
    id: '1',
    name: 'Design Studio 1',
    tag: 'Warehouse',
    address: '123 Green Valley Road, Kalyani Nagar, Pune, Maharashtra, 411014, India.',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    country: 'India',
    contactPhone: '+91 9656019439',
    contactPersonName: 'Sameeksha Gore',
    email: 'designstudio1@gmail.com',
    supportPhone: '+91 9656019439',
    isVerified: true,
    isPrimary: true,
    hideWarehouseAddress: true,
    hideWarehousePhone: false,
    hideCustomerPhone: false,
    hideProductDetails: false,
    returnSameAsPickup: true,
  },
  {
    id: '2',
    name: 'Pune XB Warehouse#1',
    tag: 'Warehouse',
    address: '78 Industrial Area, Bhosari, Pune, Maharashtra, 411026, India.',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411026',
    country: 'India',
    contactPhone: '+91 9139019439',
    contactPersonName: 'Rohit Verma',
    email: 'pune.warehouse@xb.com',
    supportPhone: '+91 9139019439',
    isVerified: true,
    isPrimary: false,
    hideWarehouseAddress: false,
    hideWarehousePhone: false,
    hideCustomerPhone: false,
    hideProductDetails: false,
    returnSameAsPickup: true,
  },
  {
    id: '3',
    name: 'Bangalore Fulfilment Hub',
    tag: 'Warehouse',
    address: '4th Cross, Indiranagar, Bengaluru, Karnataka, 560038, India.',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    country: 'India',
    contactPhone: '+91 9845011234',
    contactPersonName: 'Anita Rao',
    email: 'blr.hub@xb.com',
    supportPhone: '+91 9845011234',
    isVerified: true,
    isPrimary: false,
    hideWarehouseAddress: false,
    hideWarehousePhone: false,
    hideCustomerPhone: false,
    hideProductDetails: false,
    returnSameAsPickup: true,
  },
];

export const ADDRESS_TAGS: AddressTag[] = ['Warehouse', 'Home', 'Work', 'Other'];

/* ──────────────────────────── Saved customers ──────────────────────────── */

export interface SavedCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isVerified: boolean;
}

export const SAVED_CUSTOMERS: SavedCustomer[] = [
  {
    id: 'cu-emma-johnson',
    name: 'Emma Johnson',
    phone: '+91 9139019439',
    email: 'Mohan.Raj@gmail.com',
    address: '456 Blue Sky Lane, Ravet, Pune, Maharashtra, 411044, India.',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411044',
    isVerified: true,
  },
  {
    id: 'cu-rahul-sharma',
    name: 'Rahul Sharma',
    phone: '+91 9876543210',
    email: 'rahul.sharma@example.com',
    address: '42, MG Road, Bengaluru, Karnataka – 560001, India.',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    isVerified: true,
  },
  {
    id: 'cu-anita-singh',
    name: 'Anita Singh',
    phone: '+91 9988011223',
    email: 'anita.s@example.com',
    address: 'Flat 304, Sunrise Apartments, Bandra West, Mumbai, Maharashtra, 400050, India.',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    isVerified: false,
  },
  {
    id: 'cu-divendra-k',
    name: 'Divendra K.',
    phone: '+91 9012345678',
    email: 'divendra.k@example.com',
    address: '12, Park Street, Camp, Pune, Maharashtra, 411006, India.',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411006',
    isVerified: false,
  },
];

/* ──────────────────────────── Product catalog ──────────────────────────── */

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  /** Unit price in rupees */
  price: number;
  /** Optional small thumbnail glyph (svg path string) — keeps the demo
   *  self-contained instead of bundling pixel assets. */
  thumb?: string;
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: 'p-sony-wh-1000xm5',    name: 'Sony WH-1000XM5 Headphones', sku: '10',     category: 'Electronics', price: 28990 },
  { id: 'p-sony-earbuds',       name: 'Sony Earbuds',               sku: '22',     category: 'Electronics', price: 8990  },
  { id: 'p-sony-soundbar',      name: 'Sony Compact Soundbar',      sku: '31',     category: 'Electronics', price: 14990 },
  { id: 'p-sony-srs-xb33',      name: 'Sony SRS-XB33 Bluetooth Speaker', sku: 'SNY-SRSXB33-BLU-001', category: 'Electronics', price: 9990 },
  { id: 'p-asus-zenbook',       name: 'Asus Zenbook 14',            sku: 'ASU-ZB14-2026',   category: 'Computers',   price: 89990 },
  { id: 'p-anker-charger',      name: 'Anker 30W Type-C Charger',   sku: 'ANK-30W-C',       category: 'Accessories', price: 1799  },
  { id: 'p-fossil-gen6',        name: 'Fossil Gen 6 Smartwatch',    sku: 'FOS-GEN6-44',     category: 'Wearables',   price: 18999 },
];

/* ──────────────────────────── Saved package presets ──────────────────────────── */

export interface SavedPackage {
  id: string;
  name: string;
  /** Dead weight in kg (volumetric is derived from L×B×H / 5000) */
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
}

export const SAVED_PACKAGES: SavedPackage[] = [
  { id: 'pkg-gemstone-multi', name: 'Gemstone Multi Pack', physicalWeight: 14,   length: 14, breadth: 14, height: 12 },
  { id: 'pkg-small-box',      name: 'Small Box',           physicalWeight: 0.5,  length: 20, breadth: 15, height: 10 },
  { id: 'pkg-medium-box',     name: 'Medium Box',          physicalWeight: 2,    length: 30, breadth: 25, height: 15 },
  { id: 'pkg-fragile-cube',   name: 'Fragile Cube',        physicalWeight: 1.2,  length: 20, breadth: 20, height: 20 },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

/** Volumetric weight using the standard 5000 divisor (cm³ → kg). */
export const calcVolumetricWeight = (l: number, b: number, h: number): number =>
  Math.round(((l * b * h) / 5000) * 100) / 100;

/** Pick the chargeable weight (whichever is heavier: dead or volumetric). */
export const chargeableWeight = (physical: number, volumetric: number): number =>
  Math.max(physical, volumetric);

/** Convenience — the seed Primary pickup, used to auto-select on mount. */
export const PRIMARY_PICKUP: SavedPickup =
  SAVED_PICKUPS.find((p) => p.isPrimary) ?? SAVED_PICKUPS[0];

/** Adapter so existing components that consume `OrderAddress` still type-check. */
export const toOrderAddress = (p: { city: string; pincode: string }): OrderAddress => ({
  city: p.city,
  pin: p.pincode,
});
