import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate,useLocation} from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import { ordersApi } from '../../services/ordersApi';
import PickupDrawer from './components/PickupDrawer';
import PackageDrawer from './components/PackageDrawer';
import CustomerDrawer from './components/CustomerDrawer';
import SavedAddressSelect, { type SavedAddressOption } from './components/SavedAddressSelect';
import ProductSearchSelect from './components/ProductSearchSelect';
import SelectShipmentModeView from './components/SelectShipmentModeView';
import AwbAssignedView from './components/AwbAssignedView';
import { SHIPMENT_MODES, genAwbNumber } from './data/shipmentModes';
import {
  CATALOG_PRODUCTS,
  PRIMARY_PICKUP,
  SAVED_CUSTOMERS,
  SAVED_PACKAGES,
  SAVED_PICKUPS,
  calcVolumetricWeight,
  chargeableWeight,
  type CatalogProduct,
  type SavedCustomer,
  type SavedPackage,
  type SavedPickup,
} from './data/forwardOrderData';
import type { Order, Shipment } from './types';

/* ─── Tabs (Single Order is default per the brief) ─────────── */
type TabId = 'single' | 'bulk';
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'single', label: 'Single Order' },
  { id: 'bulk',   label: 'Bulk Order' },
];

interface LineItem {
  productId: string;
  qty: number;
}

/* ─── Order lifecycle steps ─────────────────────────────────────
   The Forward-Order screen owns four lifecycle states. We keep them
   as local view-state instead of separate routes so the page shell
   (back chevron, toasts, sidebar context) remains identical and the
   in-flight order data flows through naturally:

     'compose'          → editable form (default)
     'pending-manifest' → after "Create & Manifest Later"
     'select-mode'      → after "Create Order & Ship" (Ship Now flow)
     'awb-assigned'     → after picking a shipment mode + Ship Now
*/
type OrderStep = 'compose' | 'pending-manifest' | 'select-mode' | 'awb-assigned';

/**
 * Pre-fill payload pushed via `location.state` when the user picks
 * "Clone Order" from a row menu. Carries the original Order / Shipment
 * so the composer can hydrate every form field that maps cleanly.
 */
interface CloneNavState {
  clonedFrom?: Order | Shipment;
}

/**
 * Field-by-field initial-state derivation for a cloned source. Each
 * lookup falls back gracefully when the source's value can't be matched
 * against the saved-pickups / saved-customers / catalog datasets — the
 * user is still free to re-select. Tucked at module scope so the
 * component body stays readable.
 */
function deriveCloneSeed(source: Order | Shipment | undefined) {
  if (!source) return null;

  /* Customer match — by name first, then phone, then city + pincode. */
  const cust = SAVED_CUSTOMERS.find((c) => c.name === source.customer.name)
    ?? SAVED_CUSTOMERS.find((c) => c.phone === source.customer.phone)
    ?? SAVED_CUSTOMERS.find(
      (c) => c.city === source.customer.city && c.pincode === source.customer.pin,
    )
    ?? null;

  /* Pickup match — try the source's `pickupLocation` id directly, then
     fall back to a same-city saved pickup, then the Primary. */
  const pickup = SAVED_PICKUPS.find((p) => p.id === source.pickupLocation)
    ?? SAVED_PICKUPS.find((p) => p.city === source.pickup.city)
    ?? PRIMARY_PICKUP;

  /* Product match — only Order + new RTO Shipments carry a product. */
  const product = 'product' in source && source.product
    ? CATALOG_PRODUCTS.find((p) => p.sku === source.product!.sku)
      ?? CATALOG_PRODUCTS.find((p) => p.name === source.product!.name)
      ?? null
    : null;

  /* Package fields — only Pending orders carry a parsed package block;
     shipments fall back to defaults. */
  const pkg = 'package' in source && source.package ? source.package : null;
  const parseWeight = (s: string) => {
    const n = Number(s.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n > 0 ? String(n) : '';
  };
  const parseDims = (s: string): { l: string; b: string; h: string } => {
    const m = s.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
    return m ? { l: m[1], b: m[2], h: m[3] } : { l: '', b: '', h: '' };
  };
  const dims = pkg ? parseDims(pkg.dims) : { l: '', b: '', h: '' };
  const physical = pkg ? parseWeight(pkg.deadWt) : '';

  /* Payment — Order/Shipment.payment.mode is 'COD' | 'Prepaid' | 'Pickup'.
     The composer's `paymentMode` state only models COD vs PREPAID; treat
     Pickup as COD-equivalent for collection purposes. */
  const paymentMode: 'COD' | 'PREPAID' = source.payment.mode === 'Prepaid' ? 'PREPAID' : 'COD';

  return {
    sourceId: source.id,
    customerId: cust?.id ?? null,
    pickupId:   pickup.id,
    productId:  product?.id ?? null,
    productQty: 'product' in source && source.product ? Math.max(1, source.product.qty) : 1,
    physicalWt: physical,
    length:  dims.l,
    breadth: dims.b,
    height:  dims.h,
    paymentMode,
    collectable: source.payment.mode === 'COD' ? String(source.payment.amount) : '',
  };
}

/**
 * New Forward Order screen.
 *
 * Layout mirrors the "New Order Creation" screenshots supplied with the
 * brief — three cards on row 1 (Pickup · Customer · Package), an "Add
 * Product Details" card on row 2, and a "Payment Details + Totals" card
 * on row 3. Tabs above the cards switch between Single Order (default) and
 * Bulk Order.
 *
 * Reuses (no new primitives introduced):
 *  • `.ord-cta` / `.ord-cta-p` / `.ord-cta-s`  (header CTAs)
 *  • `.ord-tabs` / `.ord-tab`                  (Single / Bulk)
 *  • `.cdd*` + `.sup-mi*`                      (dropdowns + form fields)
 *  • `.sup-panel.w-create`                     (Pickup + Package drawers)
 *  • `useReportsStore.showToast`               (snackbar)
 */
export const NewForwardOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useReportsStore((s) => s.showToast);
  const toast     = useReportsStore((s) => s.toast);

  /* ─── Clone Order pre-fill ──────────────────────────────────
     `location.state.clonedFrom` is populated by the Clone Order menu
     item on the Pending grid + every Shipment grid. We hydrate the
     composer in a single pass via `deriveCloneSeed` so every useState
     below can use a lazy initializer — no useEffect race needed. */
  const cloneSeed = useMemo(() => {
    const navState = location.state as CloneNavState | null;
    return deriveCloneSeed(navState?.clonedFrom);
  }, [location.state]);

  /* ─── Tabs ───────────────────────────────────────────────── */
  const [tab, setTab] = useState<TabId>('single');

  /* ─── Pickup ─────────────────────────────────────────────── */
  const [pickups, setPickups] = useState<SavedPickup[]>(SAVED_PICKUPS);
  const [pickupId, setPickupId] = useState<string | null>(
    () => cloneSeed?.pickupId ?? PRIMARY_PICKUP.id,
  );
  const selectedPickup = pickups.find((p) => p.id === pickupId) ?? null;
  /* Drawer state — { mode, id? } open when not null. */
  const [pickupDrawer, setPickupDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);

  // Load actual warehouses on mount
  useEffect(() => {
    import('../../services/warehouseApi').then(({ warehouseApi }) => {
      warehouseApi.getWarehouses().then((whList: any[]) => {
        if (whList && whList.length > 0) {
          const mapped: SavedPickup[] = whList.map(wh => ({
            id: String(wh.id || wh.warehouse_id),
            name: wh.name || wh.warehouse_name || '',
            tag: 'Warehouse',
            address: wh.address_1 || wh.address || '',
            city: wh.city || '',
            state: wh.state || '',
            pincode: wh.zip || wh.pincode || '',
            country: 'India',
            contactPhone: wh.phone || '',
            contactPersonName: wh.contact_name || '',
            email: wh.email || '',
            supportPhone: wh.phone || '',
            isVerified: true,
            isPrimary: false,
            hideWarehouseAddress: false,
            hideWarehousePhone: false,
            hideCustomerPhone: false,
            hideProductDetails: false,
            returnSameAsPickup: true,
          }));
          setPickups(mapped);
          if (mapped.length > 0) setPickupId(mapped[0].id);
        }
      });
    });
  }, []);

  /* ─── Customer ─────────────────────────────────────────────── */
  const [customers, setCustomers] = useState<SavedCustomer[]>(SAVED_CUSTOMERS);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  /* ─── Products ───────────────────────────────────────────── */
  const [products] = useState<CatalogProduct[]>(CATALOG_PRODUCTS);
  const [lines, setLines] = useState<LineItem[]>(
    () => (cloneSeed?.productId
      ? [{ productId: cloneSeed.productId, qty: cloneSeed.productQty }]
      : []),
  );
  const [chargesOpen, setChargesOpen] = useState(false);

  /* ─── Other charges & discount (all optional, numeric) ───────
     Per the brief, this section is no longer Discount + Tax — it now
     exposes four optional numeric inputs that flow into the totals
     strip. Empty strings mean "not entered" and contribute 0 to the
     grand total. */
  const [shippingCharges,    setShippingCharges]    = useState<string>('');
  const [giftWrapCharges,    setGiftWrapCharges]    = useState<string>('');
  const [transactionCharges, setTransactionCharges] = useState<string>('');
  const [totalDiscountInput, setTotalDiscountInput] = useState<string>('');

  const productsById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const subTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (productsById[l.productId]?.price ?? 0) * l.qty, 0),
    [lines, productsById],
  );
  const totalShipping    = Number(shippingCharges)    || 0;
  const totalGiftWrap    = Number(giftWrapCharges)    || 0;
  const totalTransaction = Number(transactionCharges) || 0;
  const totalDiscount    = Number(totalDiscountInput) || 0;
  const totalExtras      = totalShipping + totalGiftWrap + totalTransaction;
  const grandTotal       = subTotal + totalExtras - totalDiscount;

  /* ─── Package ───────────────────────────────────────────── */
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>(SAVED_PACKAGES);
  const [packageId, setPackageId] = useState<string | null>(null);
  const selectedPackage = savedPackages.find((p) => p.id === packageId) ?? null;

  /* Per the brief: Physical Weight is ALWAYS user-editable, even after
     selecting a saved package. So we keep it as its own state. */
  const [physicalWt, setPhysicalWt] = useState<string>(() => cloneSeed?.physicalWt ?? '');
  const [length,  setLength]  = useState<string>(() => cloneSeed?.length  ?? '');
  const [breadth, setBreadth] = useState<string>(() => cloneSeed?.breadth ?? '');
  const [height,  setHeight]  = useState<string>(() => cloneSeed?.height  ?? '');
  const [savePackageDetail, setSavePackageDetail] = useState(false);

  /* Drawer state for the Package drawer */
  const [packageDrawer, setPackageDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [customerDrawer, setCustomerDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);

  const volumetricWt = useMemo(() => {
    const l = Number(length), b = Number(breadth), h = Number(height);
    if (!l || !b || !h) return 0;
    return calcVolumetricWeight(l, b, h);
  }, [length, breadth, height]);

  const chargeable = chargeableWeight(Number(physicalWt) || 0, volumetricWt);

  /* ─── Payment ────────────────────────────────────────────── */
  const [orderId, setOrderId] = useState<string>(genOrderId());
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD'>('COD');
  const [collectable, setCollectable] = useState<string>('');

  /* ─── Order lifecycle / post-create state ────────────────────
     `step` drives which view renders inside the page shell. When the
     order is created we snapshot the relevant details into
     `createdOrder` so the downstream success screens can render the
     summary without depending on form state that the user might
     mutate after navigation. */
  const [step, setStep] = useState<OrderStep>('compose');
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [awbNumber,      setAwbNumber]      = useState<string | null>(null);

  /* ─── Handlers ───────────────────────────────────────────── */

  const handlePickupSave = async (next: SavedPickup) => {
    // 1. Instantly update the UI so the user sees it immediately
    setPickups((prev) => {
      const i = prev.findIndex((p) => p.id === next.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
    setPickupId(next.id);
    setPickupDrawer(null);
    showToast(`✓ Pickup "${next.name}" ${pickupDrawer?.mode === 'edit' ? 'updated' : 'added'}`);

    // 2. Fire the API call in the background to save it permanently!
    try {
      const { warehouseApi } = await import('../../services/warehouseApi');
      const payload = {
        name: next.name,
        contact_name: next.contactPersonName || next.name,
        email: next.email || 'warehouse@test.com',
        phone: next.contactPhone.replace('+91 ', ''),
        address_1: next.address,
        address_2: "",
        city: next.city,
        state: next.state,
        zip: next.pincode,
        password: "auto"
      };
      await warehouseApi.createWarehouse(payload);
      
      // 3. Re-sync the latest accurate list from the backend
      const whList = await warehouseApi.getWarehouses();
      if (whList && whList.length > 0) {
        const mapped: SavedPickup[] = whList.map((wh: any) => ({
          id: String(wh.id || wh.warehouse_id),
          name: wh.name || wh.warehouse_name || '',
          tag: 'Warehouse',
          address: wh.address_1 || wh.address || '',
          city: wh.city || '',
          state: wh.state || '',
          pincode: wh.zip || wh.pincode || '',
          country: 'India',
          contactPhone: wh.phone || '',
          contactPersonName: wh.contact_name || '',
          email: wh.email || '',
          supportPhone: wh.phone || '',
          isVerified: true,
          isPrimary: false,
          hideWarehouseAddress: false,
          hideWarehousePhone: false,
          hideCustomerPhone: false,
          hideProductDetails: false,
          returnSameAsPickup: true,
        }));
        setPickups(mapped);
        
        // Find the newly created warehouse to keep it selected
        // We match by name since the backend assigns a new integer ID
        const newlyCreated = mapped.find(m => m.name.toLowerCase() === next.name.toLowerCase());
        if (newlyCreated) {
           setPickupId(newlyCreated.id);
        }
      }
    } catch (err) {
      console.error("Failed to save pickup to backend", err);
    }
  };

  const handlePackageSave = (next: SavedPackage) => {
    setSavedPackages((prev) => {
      const i = prev.findIndex((p) => p.id === next.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
    setPackageId(next.id);
    /* Auto-fill the form fields — but per the brief Physical Weight stays
       editable even after selection, so we still set it (it remains
       editable, the input is not readOnly). */
    setPhysicalWt(String(next.physicalWeight));
    setLength(String(next.length));
    setBreadth(String(next.breadth));
    setHeight(String(next.height));
    setPackageDrawer(null);
    showToast(`✓ Package "${next.name}" ${packageDrawer?.mode === 'edit' ? 'updated' : 'added'}`);
  };

  const handleCustomerSave = (next: SavedCustomer) => {
    setCustomers((prev) => {
      const i = prev.findIndex((c) => c.id === next.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
    setCustomerId(next.id);
    setCustomerDrawer(null);
    showToast(`✓ Customer "${next.name}" ${customerDrawer?.mode === 'edit' ? 'updated' : 'added'}`);
  };

  const onPickupChange = (id: string) => {
    setPickupId(id);
  };

  const onCustomerChange = (id: string) => setCustomerId(id);

  const onPackageChange = (id: string) => {
    setPackageId(id);
    const next = savedPackages.find((p) => p.id === id);
    if (next) {
      setPhysicalWt(String(next.physicalWeight));
      setLength(String(next.length));
      setBreadth(String(next.breadth));
      setHeight(String(next.height));
    }
  };

  const addLineItem = (p: CatalogProduct) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === p.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { productId: p.id, qty: 1 }];
    });
    showToast(`+ ${p.name} added`);
  };

  const updateLineQty = (productId: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (productId: string) =>
    setLines((prev) => prev.filter((l) => l.productId !== productId));

  /* ─── Submit ──────────────────────────────────────────────── */

  const canCreate =
    selectedPickup &&
    selectedCustomer &&
    lines.length > 0 &&
    Number(physicalWt) > 0 &&
    !!orderId.trim();

  const saveOrder = async () => {
    if (isCreated) return { success: true };
    if (isSubmitting) return { success: false, message: 'Already submitting' };
    if (!selectedPickup || !selectedCustomer) return { success: false, message: 'Missing pickup or customer' };
    
    setIsSubmitting(true);
    const randomNumber = Math.floor(Math.random() * 10000000) + 1;
    const payload = {
      order_id: orderId,
      order_number: orderId,
      order_unique_id: randomNumber,
      order_type: 'ecom',
      order_payment_type: paymentMode.toLowerCase(),
      // Shipping
      shipping_fname: selectedCustomer.name.split(' ')[0] || 'Customer',
      shipping_lname: selectedCustomer.name.split(' ').slice(1).join(' ') || '',
      shipping_address: selectedCustomer.address || 'Address',
      shipping_address_2: '',
      shipping_city: selectedCustomer.city || 'City',
      shipping_state: selectedCustomer.state || 'State',
      shipping_country: 'INDIA',
      shipping_zip: selectedCustomer.pincode,
      shipping_phone: selectedCustomer.phone?.replace(/\D/g, '').slice(-10),
      // Billing
      billing_fname: selectedCustomer.name.split(' ')[0] || 'Customer',
      billing_lname: selectedCustomer.name.split(' ').slice(1).join(' ') || '',
      billing_address: selectedCustomer.address || 'Address',
      billing_address_2: '',
      billing_city: selectedCustomer.city || 'City',
      billing_state: selectedCustomer.state || 'State',
      billing_country: 'INDIA',
      billing_zip: selectedCustomer.pincode,
      billing_phone: selectedCustomer.phone?.replace(/\D/g, '').slice(-10),
      // Package
      package_weight: Number(physicalWt),
      package_length: Number(length),
      package_breadth: Number(breadth),
      package_height: Number(height),
      // Warehouse & Pincodes
      warehouse_id: String(selectedPickup.id),
      originpincodecheck: selectedPickup.pincode,
      dispincode: selectedCustomer.pincode,
      // Financials
      order_amount: grandTotal,
      collectable_amount: paymentMode === 'COD' ? Number(collectable) : 0,
      shipping_charges: Number(shippingCharges) || 0,
      cod_charges: paymentMode === 'COD' ? (Number(transactionCharges) || 0) : 0,
      tax_amount: 0,
      discount: Number(totalDiscountInput) || 0,
      // Products
      order_products: lines.map((l) => {
        const p = productsById[l.productId];
        return {
          product_name: p?.name || 'Product',
          product_sku: p?.sku || 'SKU',
          product_price: p?.price || 0,
          product_qty: l.qty,
        };
      })
    };
    const response = await ordersApi.createOrder(payload);
    console.log("ORDER PAYLOAD", payload);
    if (response.success) {
      setIsCreated(true);
      if (response.dbId) {
        setDbOrderId(response.dbId);
      }
    } else {
      setOrderId(genOrderId()); // Prevent resubmitting the same ID if the user clicks again
    }
    setIsSubmitting(false);
    return response;
  };

  /* "Create & Manifest Later" → creates the order and lands the user
     on the Pending Manifest success screen (lifecycle step 2). */
  const handleCreateManifestLater = async () => {
    if (!canCreate) {
      showToast('Fill pickup, customer, product and package details to continue');
      return;
    }
    const response = await saveOrder();
    if (response.success) {
      showToast(`✓ Order ${orderId} created — pending manifest`);
      setStep('pending-manifest');
    } else {
      showToast(`❌ Failed to create order: ${response.message || 'Please try again.'}`);
    }
  };

  /* "Create Order & Ship" → creates the order AND opens the shipment
     mode selector. From there the user picks a courier and clicks
     "Ship Now" to land on the AWB Assigned final state. */
  const handleCreateAndShip = async () => {
    if (!canCreate) {
      showToast('Fill pickup, customer, product and package details to continue');
      return;
    }
    const response = await saveOrder();
    if (response.success) {
      showToast(`✓ Order ${orderId} created — select a shipment mode`);
      setSelectedModeId(null);
      setStep('select-mode');
    } else {
      showToast(`❌ Failed to create order: ${response.message || 'Please try again.'}`);
    }
  };

  /* Finalize the shipment after a mode is picked. Generates a mock
     AWB number so the final screen has something concrete to render. */
  const handleShipNow = async () => {
    if (!selectedModeId) {
      showToast('Pick a shipment mode to continue');
      return;
    }
    showToast('Shipping order...');
    let idToShip = dbOrderId || orderId;
    if (!dbOrderId) {
        // orderApi.shipOrder will now internally look up the DB ID if only customer orderId is provided.
    }
    const success = await ordersApi.shipOrder(idToShip, selectedModeId, selectedPickup?.id || 0);
    if (success) {
      const awb = genAwbNumber();
      setAwbNumber(awb);
      setStep('awb-assigned');
      showToast(`✓ Order ${orderId} shipped successfully`);
    } else {
      showToast('❌ Failed to ship order. Please try again.');
    }
  };

  /* Used by the post-create screens to start a fresh order. Resets
     just the bits that actually change between orders — pickup
     selection (Primary) stays sticky to match the brief. */
  const resetForNewOrder = () => {
    setLines([]);
    setCustomerId(null);
    setPackageId(null);
    setPhysicalWt('');
    setLength(''); setBreadth(''); setHeight('');
    setShippingCharges('');
    setGiftWrapCharges('');
    setTransactionCharges('');
    setTotalDiscountInput('');
    setCollectable('');
    setPaymentMode('COD');
    setOrderId(genOrderId());
    setIsCreated(false);
    setSelectedModeId(null);
    setAwbNumber(null);
    setStep('compose');
  };

  const selectedShipmentMode =
    SHIPMENT_MODES.find((m) => m.id === selectedModeId) ?? null;

  /* ─── Adapters for SavedAddressSelect ─────────────────────── */

  const pickupOptions: SavedAddressOption[] = pickups.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.contactPhone,
    email: p.email,
    isVerified: p.isVerified,
    hint: p.isPrimary ? 'Primary' : undefined,
  }));

  const customerOptions: SavedAddressOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    email: c.email,
    isVerified: c.isVerified,
  }));

  /* ─── Render ─────────────────────────────────────────────── */

  /* Step-specific back-button behaviour. On the mode selector the
     chevron returns the user to the form so they can tweak details
     before committing; everywhere else it exits to the Orders list. */
  const handleBack = () => {
    if (step === 'select-mode') setStep('compose');
    else navigate('/orders');
  };

  return (
    <div className="page">
      {/* ── Header row (back ← title · CTAs) ─────────────────
            The select-mode step swaps the title for an explicit
            "Back" label and replaces the form CTAs with the mode-
            selector CTAs ("Create & Manifest Later" + "Ship Now")
            to match the reference design. */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          {step === 'select-mode' ? (
            <button
              type="button"
              className="ord-nf-back-link"
              onClick={handleBack}
            >
              <span aria-hidden="true">‹</span> Back
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ord-nf-back"
                onClick={handleBack}
                aria-label="Back to Orders"
              >
                ‹
              </button>
              <div className="ord-ph-title">
                New Forward Order
                {cloneSeed && (
                  <span className="ord-nf-clone-badge" title={`Cloned from ${cloneSeed.sourceId}`}>
                    Cloned from #{cloneSeed.sourceId}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {step === 'compose' && (
          <div className="ord-ph-r">
            <button
              type="button"
              className="ord-cta ord-cta-s"
              onClick={handleCreateManifestLater}
              disabled={isSubmitting}
            >
              Create &amp; Manifest Later
            </button>
            <button
              type="button"
              className="ord-cta ord-cta-p"
              onClick={handleCreateAndShip}
              disabled={isSubmitting}
            >
              <ShipIcon /> Create Order &amp; Ship
            </button>
          </div>
        )}
        {step === 'select-mode' && (
          <div className="ord-ph-r">
            <button
              type="button"
              className="ord-cta ord-cta-s"
              onClick={() => {
                showToast(`✓ Order ${orderId} created — pending manifest`);
                setStep('pending-manifest');
              }}
            >
              Create &amp; Manifest Later
            </button>
            <button
              type="button"
              className="ord-cta ord-cta-p"
              onClick={handleShipNow}
              disabled={!selectedModeId}
              style={!selectedModeId ? { opacity: .55, cursor: 'not-allowed' } : undefined}
            >
              Ship Now
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs (Single Order is default) — only on the form step;
            post-create lifecycle screens hide the entry-mode tabs to
            keep the success / mode-select / AWB views focused. ── */}
      {step === 'compose' && (
        <div className="ord-tabs" role="tablist" aria-label="Order entry mode">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`ord-tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {step === 'pending-manifest' ? (
        <PendingManifestView
          orderId={orderId}
          customerName={selectedCustomer?.name ?? '—'}
          pickupName={selectedPickup?.name ?? '—'}
          itemCount={lines.reduce((s, l) => s + l.qty, 0)}
          amount={grandTotal}
          paymentMode={paymentMode}
          onShipNow={() => {
            setSelectedModeId(null);
            setStep('select-mode');
          }}
          onViewOrders={() => navigate('/orders')}
          onCreateAnother={resetForNewOrder}
        />
      ) : step === 'select-mode' ? (
        <SelectShipmentModeView
          orderId={orderId}
          pickupCity={selectedPickup?.city ?? '—'}
          pickupPincode={selectedPickup?.pincode ?? '—'}
          pickupState={selectedPickup?.state ?? ''}
          deliveryCity={selectedCustomer?.city ?? '—'}
          deliveryPincode={selectedCustomer?.pincode ?? '—'}
          deliveryState={selectedCustomer?.state ?? ''}
          orderValue={grandTotal}
          paymentMode={paymentMode}
          chargeableWeight={chargeable}
          modes={SHIPMENT_MODES}
          selectedModeId={selectedModeId}
          onSelectMode={setSelectedModeId}
        />
      ) : step === 'awb-assigned' ? (
        <AwbAssignedView
          orderId={orderId}
          awbNumber={awbNumber ?? ''}
          shipmentMode={selectedShipmentMode}
          customerName={selectedCustomer?.name ?? '—'}
          deliveryCity={selectedCustomer?.city ?? '—'}
          pickupName={selectedPickup?.name ?? '—'}
          pickupCity={selectedPickup?.city ?? '—'}
          chargeableWeight={chargeable}
          amount={grandTotal}
          paymentMode={paymentMode}
          onViewOrders={() => navigate('/orders')}
          onCreateAnother={resetForNewOrder}
          onPrintLabel={() => showToast(`🖨️ Label for AWB ${awbNumber} sent to printer`)}
        />
      ) : tab === 'bulk' ? (
        <div className="ord-empty">
          <h3>Bulk Order — coming up next</h3>
          <p>
            Bulk forward orders will be uploaded via CSV here. The flow plugs
            into the same pickup / package / customer recipes used by single
            orders, so nothing in this shell has to change.
          </p>
        </div>
      ) : (
        /* Outer 2-column shell — LEFT (1fr) for the order form, RIGHT
           (520px fixed) for the persistent Package Details rail. */
        <div className="ord-nf-grid">
          {/* ════════ LEFT column (1fr) ════════ */}
          <div className="ord-nf-left">
            {/* Row 1 inside left: Pickup | Customer (nested 2-col) */}
            <div className="ord-nf-pair">
            {/* Pickup card */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">Pickup</div>

              <div className="sup-mf" style={{ marginBottom: 8 }}>
                <div className="sup-ml">Pickup Details <Req /></div>
                <SavedAddressSelect
                  value={pickupId}
                  options={pickupOptions}
                  placeholder="Select pickup location"
                  addNewLabel="Add new pickup location"
                  onChange={onPickupChange}
                  onAddNew={() => setPickupDrawer({ mode: 'create' })}
                />
              </div>

              {selectedPickup && (
                <AddressCard
                  name={selectedPickup.name}
                  address={selectedPickup.address}
                  phone={selectedPickup.contactPhone}
                  email={selectedPickup.email}
                  verified={selectedPickup.isVerified}
                  onEdit={() => setPickupDrawer({ mode: 'edit', id: selectedPickup.id })}
                  onAddNew={() => setPickupDrawer({ mode: 'create' })}
                />
              )}
            </section>

            {/* Customer card */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">Customer</div>

              <div className="sup-mf" style={{ marginBottom: 8 }}>
                <div className="sup-ml">Delivery Details <Req /></div>
                <SavedAddressSelect
                  value={customerId}
                  options={customerOptions}
                  placeholder="Search by name or phone"
                  addNewLabel="Add new customer"
                  onChange={onCustomerChange}
                  onAddNew={() => {
                    setCustomerDrawer({ mode: 'create' });
                  }}
                />
              </div>

              {selectedCustomer && (
                <AddressCard
                  name={selectedCustomer.name}
                  address={selectedCustomer.address}
                  phone={selectedCustomer.phone}
                  email={selectedCustomer.email}
                  verified={selectedCustomer.isVerified}
                  onEdit={() => setCustomerDrawer({ mode: 'edit', id: selectedCustomer.id })}
                  onAddNew={() => setCustomerDrawer({ mode: 'create' })}
                />
              )}
            </section>
            </div>

            {/* Row 2 inside left: Add Product Details (lives in the same
                left column — width is controlled by the LEFT 1fr column,
                not by a full-width breakout). */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">
                Add Product Details<Req />
                <span className="ord-nf-card-hdr-note">
                  This cannot be modified once the order is created.
                </span>
              </div>

              <ProductSearchSelect
                products={products}
                onSelect={addLineItem}
                onAddNew={() => showToast('+ Add new Product — coming next')}
              />

              {lines.length > 0 && (
                <div className="ord-nf-lines">
                  <div className="ord-nf-lines-hdr">
                    <span>PRODUCT</span>
                    <span>QTY</span>
                    <span style={{ textAlign: 'right' }}>TOTAL (₹)</span>
                    <span />
                  </div>
                  {lines.map((l) => {
                    const p = productsById[l.productId];
                    if (!p) return null;
                    return (
                      <div key={l.productId} className="ord-nf-line">
                        <div className="ord-nf-line-prod">
                          <span className="ord-nf-prod-thumb sm" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <rect x="3" y="6" width="18" height="13" rx="2" />
                              <path d="M8 6V4h8v2" />
                            </svg>
                          </span>
                          <div>
                            <div className="ord-nf-line-name">{p.name}</div>
                            <div className="ord-nf-line-sku">
                              SKU: {p.sku} · ₹{p.price.toLocaleString('en-IN')}/unit
                            </div>
                          </div>
                        </div>
                        <div className="ord-nf-line-qty">
                          <button type="button" onClick={() => updateLineQty(l.productId, -1)}>−</button>
                          <span>{l.qty}</span>
                          <button type="button" onClick={() => updateLineQty(l.productId, +1)}>+</button>
                        </div>
                        <div className="ord-nf-line-total">
                          ₹{(p.price * l.qty).toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          className="ord-nf-line-del"
                          onClick={() => removeLine(l.productId)}
                          aria-label="Remove"
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5L11 4M7 7v4M9 7v4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className="ord-nf-collapse"
                onClick={() => setChargesOpen((o) => !o)}
              >
                <span>Add Other Charges &amp; Discount</span>
                <span className="chev">{chargesOpen ? '▴' : '▾'}</span>
              </button>

              {chargesOpen && (
                <div style={{ marginTop: 10 }}>
                  {/* Row 1 — Shipping Charges · Gift Wrap (both optional)        */}
                  <div className="sup-row">
                    <div className="sup-mf">
                      <div className="sup-ml">Shipping Charges (₹)</div>
                      <input
                        className="sup-mi"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={shippingCharges}
                        onChange={(e) => setShippingCharges(e.target.value.replace(/[^\d.]/g, ''))}
                      />
                    </div>
                    <div className="sup-mf">
                      <div className="sup-ml">Gift Wrap (₹)</div>
                      <input
                        className="sup-mi"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={giftWrapCharges}
                        onChange={(e) => setGiftWrapCharges(e.target.value.replace(/[^\d.]/g, ''))}
                      />
                    </div>
                  </div>
                  {/* Row 2 — Transaction Charges · Total Discount (both optional) */}
                  <div className="sup-row">
                    <div className="sup-mf">
                      <div className="sup-ml">Transaction Charges (₹)</div>
                      <input
                        className="sup-mi"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={transactionCharges}
                        onChange={(e) => setTransactionCharges(e.target.value.replace(/[^\d.]/g, ''))}
                      />
                    </div>
                    <div className="sup-mf">
                      <div className="sup-ml">Total Discount (₹)</div>
                      <input
                        className="sup-mi"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={totalDiscountInput}
                        onChange={(e) => setTotalDiscountInput(e.target.value.replace(/[^\d.]/g, ''))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Row 3 inside left: Payment Details ─────────── */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">
                Payment Details<Req />
                <span className="ord-nf-card-hdr-note">
                  This cannot be modified once the order is created.
                </span>
              </div>

              <div className="ord-nf-paygrid">
                <div className="sup-mf">
                  <div className="sup-ml">Order Id <Req /></div>
                  <input
                    className="sup-mi"
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div className="sup-mf">
                  <div className="sup-ml">Payment Mode <Req /></div>
                  <div className="ord-nf-toggle">
                    <button
                      type="button"
                      className={paymentMode === 'PREPAID' ? 'on' : ''}
                      onClick={() => setPaymentMode('PREPAID')}
                    >
                      PREPAID
                    </button>
                    <button
                      type="button"
                      className={paymentMode === 'COD' ? 'on' : ''}
                      onClick={() => setPaymentMode('COD')}
                    >
                      COD
                    </button>
                  </div>
                </div>
                <div className="sup-mf">
                  <div className="sup-ml">Collectable Amount</div>
                  <div className="ord-nf-unit">
                    <span className="ord-nf-unit-prefix">₹</span>
                    <input
                      className="sup-mi"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={collectable}
                      onChange={(e) => setCollectable(e.target.value.replace(/[^\d.]/g, ''))}
                      disabled={paymentMode !== 'COD'}
                      style={paymentMode !== 'COD' ? { background: 'var(--s3)', color: 'var(--ink3)' } : undefined}
                    />
                  </div>
                </div>
              </div>

              <div className="ord-nf-totals">
                <div><span>Sub Total</span><b>₹{subTotal.toLocaleString('en-IN')}</b></div>
                {totalShipping    > 0 && <div><span>Shipping Charges</span><b>₹{totalShipping.toLocaleString('en-IN')}</b></div>}
                {totalGiftWrap    > 0 && <div><span>Gift Wrap</span><b>₹{totalGiftWrap.toLocaleString('en-IN')}</b></div>}
                {totalTransaction > 0 && <div><span>Transaction Charges</span><b>₹{totalTransaction.toLocaleString('en-IN')}</b></div>}
                <div><span>Total Discount</span><b>-₹{totalDiscount.toLocaleString('en-IN')}</b></div>
                <div className="grand">
                  <span>Total</span>
                  <b>₹{grandTotal.toLocaleString('en-IN')}</b>
                </div>
              </div>
            </section>
          </div>

          {/* ════════ RIGHT column (520px fixed) ════════ */}
          <div className="ord-nf-right">
            {/* Package Details card */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">Package Details</div>

              <div className="ord-nf-tip">
                <span className="ord-nf-tip-ico">💡</span>
                <span>Tip: Add correct values to avoid weight discrepancy</span>
              </div>

              <div className="sup-mf">
                <div className="ord-nf-row-between">
                  <div className="sup-ml">Saved Package <Req /></div>
                  <div className="ord-nf-pkg-actions">
                    <button
                      type="button"
                      className="ord-nf-mini-link"
                      onClick={() => setPackageDrawer({ mode: 'create' })}
                    >
                      + Add New Package
                    </button>
                    {selectedPackage && (
                      <button
                        type="button"
                        className="ord-nf-mini-link"
                        onClick={() => setPackageDrawer({ mode: 'edit', id: selectedPackage.id })}
                      >
                        Edit Package
                      </button>
                    )}
                  </div>
                </div>
                <select
                  className="sup-mi"
                  value={packageId ?? ''}
                  onChange={(e) => onPackageChange(e.target.value)}
                >
                  <option value="" disabled>Select a saved package</option>
                  {savedPackages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="sup-row">
                <div className="sup-mf">
                  <div className="sup-ml">Physical Weight <Req /></div>
                  <UnitInput
                    value={physicalWt}
                    onChange={setPhysicalWt}
                    placeholder="0.00"
                    unit="kg"
                  />
                </div>
                <div className="sup-mf">
                  <div className="sup-ml">Volumetric Weight <Req /></div>
                  <UnitInput
                    value={volumetricWt ? volumetricWt.toFixed(2) : ''}
                    onChange={() => {}}
                    placeholder="0.00"
                    unit="kg"
                    readOnly
                  />
                </div>
              </div>

              {selectedPackage && (
                <>
                  <div className="ord-nf-sec-lbl">Size of Package</div>
                  <div className="ord-nf-dims">
                    <UnitField label="Length"  unit="cm" value={length}  onChange={setLength} />
                    <UnitField label="Breadth" unit="cm" value={breadth} onChange={setBreadth} />
                    <UnitField label="Height"  unit="cm" value={height}  onChange={setHeight} />
                  </div>
                </>
              )}

              {chargeable > 0 && (
                <div className="ord-nf-chargeable">
                  <span className="ord-nf-chargeable-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6Z"/></svg>
                  </span>
                  <div>
                    <div className="ord-nf-chargeable-n">{chargeable.toFixed(2)} kg</div>
                    <div className="ord-nf-chargeable-sub">
                      Charged at whichever is heavier — dead or volumetric
                    </div>
                  </div>
                </div>
              )}

              {selectedPackage && (
                <label className="ord-nf-check" style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    checked={savePackageDetail}
                    onChange={(e) => setSavePackageDetail(e.target.checked)}
                  />
                  <span>Save Package Detail</span>
                </label>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── Drawers ───────────────────────────────────────── */}
      {pickupDrawer && (
        <PickupDrawer
          mode={pickupDrawer.mode}
          pickup={
            pickupDrawer.mode === 'edit'
              ? pickups.find((p) => p.id === pickupDrawer.id)
              : undefined
          }
          onClose={() => setPickupDrawer(null)}
          onSave={handlePickupSave}
        />
      )}

      {packageDrawer && (
        <PackageDrawer
          mode={packageDrawer.mode}
          pkg={
            packageDrawer.mode === 'edit'
              ? savedPackages.find((p) => p.id === packageDrawer.id)
              : undefined
          }
          onClose={() => setPackageDrawer(null)}
          onSave={handlePackageSave}
        />
      )}

      {customerDrawer && (
        <CustomerDrawer
          mode={customerDrawer.mode}
          customer={
            customerDrawer.mode === 'edit'
              ? customers.find((c) => c.id === customerDrawer.id)
              : undefined
          }
          onClose={() => setCustomerDrawer(null)}
          onSave={handleCustomerSave}
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

/* ─── Local helpers ─────────────────────────────────────────── */

const Req: React.FC = () => <span style={{ color: 'var(--red)' }}>*</span>;

const ShipIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3M20 17H8m12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    <path d="M14 8h4l4 5v4h-2" />
  </svg>
);

function genOrderId(): string {
  // Generate a timestamp-based ID to ensure it is unique and fits in a 32-bit integer on the backend
  return Math.floor(Date.now() / 1000).toString();
}


interface AddressCardProps {
  name: string;
  address: string;
  phone: string;
  email?: string;
  verified?: boolean;
  onEdit: () => void;
  onAddNew: () => void;
}
const AddressCard: React.FC<AddressCardProps> = ({ name, address, phone, email, verified, onEdit, onAddNew }) => (
  <div className="ord-nf-addrcard">
    <div className="ord-nf-addrcard-top">
      <div className="ord-nf-addrcard-name">{name}</div>
      {verified && <span className="ord-nf-verified">✓ Verified</span>}  
    </div>
    <div className="ord-nf-addrcard-body">{address}</div>
    <div className="ord-nf-addrcard-meta">
      <span>📞 {phone}</span>
      {email && <span>✉ <a href={`mailto:${email}`}>{email}</a></span>}
    </div>
    <div className="ord-nf-addrcard-ft">
      <button type="button" className="ord-nf-addrcard-btn" onClick={onEdit}>✎ Edit</button>
      <button type="button" className="ord-nf-addrcard-btn" onClick={onAddNew}>+ Add New</button>
    </div>
  </div>
);

interface UnitInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit: string;
  readOnly?: boolean;
}
const UnitInput: React.FC<UnitInputProps> = ({ value, onChange, placeholder, unit, readOnly }) => (
  <div className="ord-nf-unit">
    <input
      className="sup-mi"
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
      style={readOnly ? { background: 'var(--s3)', color: 'var(--ink2)' } : undefined}
    />
    <span className="ord-nf-unit-suffix">{unit}</span>
  </div>
);

const UnitField: React.FC<{ label: string; unit: string; value: string; onChange: (v: string) => void }> = ({
  label, unit, value, onChange,
}) => (
  <div className="sup-mf" style={{ marginBottom: 0 }}>
    <div className="sup-ml">{label} <Req /></div>
    <UnitInput value={value} onChange={onChange} placeholder="0" unit={unit} />
  </div>
);

/* ───────────────────────────────────────────────────────────────────
   Lifecycle screens
   ──────────────────────────────────────────────────────────────────
   Each post-create view is intentionally kept inside this module so
   the page-level transition is a simple `setStep(…)` call and the
   shared header (back chevron, page title, toast portal) stays put.
   All three views render inside the same `.page` wrapper and reuse
   the existing `.ord-nf-card`, `.ord-cta`, `.ord-status` and totals
   tokens — no new design language is introduced.
   ─────────────────────────────────────────────────────────────────── */

interface PendingManifestViewProps {
  orderId: string;
  customerName: string;
  pickupName: string;
  itemCount: number;
  amount: number;
  paymentMode: 'PREPAID' | 'COD';
  onShipNow: () => void;
  onViewOrders: () => void;
  onCreateAnother: () => void;
}
const PendingManifestView: React.FC<PendingManifestViewProps> = ({
  orderId, customerName, pickupName, itemCount, amount, paymentMode,
  onShipNow, onViewOrders, onCreateAnother,
}) => (
  <div className="ord-nf-state">
    <div className="ord-nf-state-card">
      <div className="ord-nf-state-ico ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="ord-nf-state-title">Order Created — Pending Manifest</div>
      <div className="ord-nf-state-sub">
        Order <b>{orderId}</b> is saved as a draft shipment. Assign a courier when you're
        ready and we'll handle the manifest, pickup and AWB generation.
      </div>

      <span className="ord-status new" style={{ marginTop: 14 }}>Pending Manifest</span>

      <div className="ord-nf-state-grid">
        <div>
          <div className="ord-nf-state-k">Order ID</div>
          <div className="ord-nf-state-v mono">{orderId}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Customer</div>
          <div className="ord-nf-state-v">{customerName}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Pickup From</div>
          <div className="ord-nf-state-v">{pickupName}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Items · Payment</div>
          <div className="ord-nf-state-v">
            {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
            <span className={`ord-pay-mode ${paymentMode === 'COD' ? 'cod' : 'prepaid'}`}>
              {paymentMode}
            </span>
          </div>
        </div>
        <div>
          <div className="ord-nf-state-k">Order Value</div>
          <div className="ord-nf-state-v mono">₹{amount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="ord-nf-state-ft">
        <button type="button" className="ord-cta ord-cta-s" onClick={onCreateAnother}>
          + Create Another Order
        </button>
        <button type="button" className="ord-cta ord-cta-s" onClick={onViewOrders}>
          View All Orders
        </button>
        <button type="button" className="ord-cta ord-cta-p" onClick={onShipNow}>
          <ShipIcon /> Ship Now
        </button>
      </div>
    </div>
  </div>
);



export default NewForwardOrderPage;
