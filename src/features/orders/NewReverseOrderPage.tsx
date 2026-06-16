import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import { ordersApi } from '../../services/ordersApi';
import PickupDrawer from './components/PickupDrawer';
import PackageDrawer from './components/PackageDrawer';
import CustomerDrawer from './components/CustomerDrawer';
import SavedAddressSelect, { type SavedAddressOption } from './components/SavedAddressSelect';
import ProductSearchSelect from './components/ProductSearchSelect';
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

/* ─── Reverse-specific: QC Questions catalogue ────────────────
   The reverse order flow needs a Quality Check pass on the
   returned product. Each entry is rendered as a single
   selectable chip — the operator taps the chips that apply
   instead of answering yes/no for every item. The state shape
   is a flat `Record<id, boolean>` so a chip is "marked" when
   its key is `true`. Add/rename items here — the chip row
   adapts automatically. */
interface QcQuestion {
  id: string;
  label: string;
}
const QC_QUESTIONS: QcQuestion[] = [
  { id: 'usage',  label: 'Usage' },
  { id: 'damage', label: 'Damage' },
  { id: 'brand',  label: 'Brand Check' },
  { id: 'size',   label: 'Product Size' },
  { id: 'color',  label: 'Product Color' },
];

/* ─── Order lifecycle steps ─────────────────────────────────────
   Mirrors the forward flow so the screen shell (back chevron,
   toasts, sidebar context) behaves identically across both
   create flows. */
type OrderStep = 'compose' | 'pending-manifest' | 'select-mode' | 'awb-assigned';

interface ShipmentMode {
  id: string;
  courier: string;
  mode?: 'Surface' | 'Air';
  /** Weight slab in kilograms (e.g. 0.5, 1, 2, 5, 10) */
  weight: number;
  /** All-in charge for this slab in rupees */
  rate: number;
}

const SHIPMENT_MODES: ShipmentMode[] = [
  { id: 'air-xb-05',  courier: 'Air Xpressbees',     mode: 'Air',     weight: 0.5, rate: 68  },
  { id: 'sur-xb-05',  courier: 'Xpressbees Surface', mode: 'Surface', weight: 0.5, rate: 70  },
  { id: 'xb-1',       courier: 'Xpressbees',                          weight: 1,   rate: 99  },
  { id: 'xb-2',       courier: 'Xpressbees',                          weight: 2,   rate: 152 },
  { id: 'xb-5',       courier: 'Xpressbees',                          weight: 5,   rate: 214 },
  { id: 'xb-10',      courier: 'Xpressbees',                          weight: 10,  rate: 314 },
];

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
const toStateCode = (state: string): string =>
  STATE_CODES[state] ?? state.slice(0, 2).toUpperCase();

/**
 * New Reverse Order screen.
 *
 * Layout is intentionally identical to the New Forward Order screen
 * (Pickup · Customer · Package on row 1, Add Product Details on row
 * 2, Payment Details on row 3). The reverse flow injects ONE extra
 * card in the left column — `Product Verification` — between
 * "Add Product Details" and "Payment Details". That card captures
 * the product images (Image 1 required, 2–4 optional) and the QC
 * questionnaire that the warehouse uses to grade the returned item
 * before the refund / restock decision.
 *
 * Everything else — drawers, dropdowns, totals math, lifecycle
 * screens — is the same as the forward flow so the shell behaviour
 * stays consistent between the two create paths.
 */
export const NewReverseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);
  const toast     = useReportsStore((s) => s.toast);

  /* ─── Tabs ───────────────────────────────────────────────── */
  const [tab, setTab] = useState<TabId>('single');

  /* ─── Pickup ─────────────────────────────────────────────── */
  const [pickups, setPickups] = useState<SavedPickup[]>(SAVED_PICKUPS);
  const [pickupId, setPickupId] = useState<string | null>(PRIMARY_PICKUP.id);
  const selectedPickup = pickups.find((p) => p.id === pickupId) ?? null;
  const [pickupDrawer, setPickupDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);

  /* ─── Customer ───────────────────────────────────────────── */
  const [customers, setCustomers] = useState<SavedCustomer[]>(SAVED_CUSTOMERS);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const [customerDrawer, setCustomerDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);

  /* ─── Products ───────────────────────────────────────────── */
  const [products] = useState<CatalogProduct[]>(CATALOG_PRODUCTS);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [chargesOpen, setChargesOpen] = useState(false);

  /* ─── Other charges & discount (all optional, numeric) ───── */
  const [shippingCharges,    setShippingCharges]    = useState<string>('');
  const [giftWrapCharges,    setGiftWrapCharges]    = useState<string>('');
  const [transactionCharges, setTransactionCharges] = useState<string>('');
  const [totalDiscountInput, setTotalDiscountInput] = useState<string>('');

  /* ─── Reverse-only: product images + QC questionnaire ──────
     `images` carries object-URLs for the four upload tiles.
     Index 0 is required; the remaining three are optional and
     are revealed only after a file is dropped on them. We
     intentionally don't model these as a server upload here —
     URL.createObjectURL is enough for the prototype and the
     thumbnail preview that the screenshot demands. */
  const [images, setImages] = useState<Array<string | null>>([null, null, null, null]);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  /* QC defaults ON to match the screenshot. Toggle hides the grid
     entirely (answers are kept so re-enabling restores them). */
  const [qcEnabled, setQcEnabled] = useState(true);
  const [qcAnswers, setQcAnswers] = useState<Record<string, boolean>>({});

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

  const [physicalWt, setPhysicalWt] = useState<string>('');
  const [length,  setLength]  = useState<string>('');
  const [breadth, setBreadth] = useState<string>('');
  const [height,  setHeight]  = useState<string>('');
  const [savePackageDetail, setSavePackageDetail] = useState(false);

  const [packageDrawer, setPackageDrawer] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);

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

  /* ─── Order lifecycle / post-create state ────────────────── */
  const [step, setStep] = useState<OrderStep>('compose');
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [awbNumber,      setAwbNumber]      = useState<string | null>(null);

  /* ─── Handlers ───────────────────────────────────────────── */

  const handlePickupSave = (next: SavedPickup) => {
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

  const onPickupChange = (id: string) => setPickupId(id);
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

  /* ─── Reverse-only: image + QC handlers ──────────────────── */

  const triggerImagePicker = (idx: number) => {
    fileInputRefs.current[idx]?.click();
  };

  const handleImageChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImages((prev) => {
      const next = prev.slice();
      /* Revoke the previous URL to avoid a memory leak on re-upload. */
      if (next[idx]) URL.revokeObjectURL(next[idx]!);
      next[idx] = url;
      return next;
    });
    showToast(`✓ Image ${idx + 1} uploaded`);
    /* Reset the input so re-selecting the same file fires onChange. */
    e.target.value = '';
  };

  const clearImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.slice();
      if (next[idx]) URL.revokeObjectURL(next[idx]!);
      next[idx] = null;
      return next;
    });
  };

  /* Tap a chip to toggle it. Single-click semantics, no yes/no
     prompt — selected chips represent the QC items the operator
     wants to flag/track for this return. */
  const toggleQcAnswer = (id: string) => {
    setQcAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ─── Submit ──────────────────────────────────────────────── */

  /* Reverse adds two extra validations on top of forward:
     1. The first product image is required (matches the *Required
        label in the screenshot).
     2. When QC is ON, at least one chip must be selected — leaving
        the section enabled with zero selections defeats the toggle
        and signals an unfinished QC pass. */
  const qcSelectedCount = QC_QUESTIONS.filter((q) => qcAnswers[q.id]).length;
  const canCreate =
    selectedPickup &&
    selectedCustomer &&
    lines.length > 0 &&
    Number(physicalWt) > 0 &&
    !!orderId.trim() &&
    !!images[0] &&
    (!qcEnabled || qcSelectedCount > 0);

  const explainMissing = (): string => {
    if (!selectedPickup)        return 'Select a pickup location';
    if (!selectedCustomer)      return 'Select the customer the product is being returned from';
    if (lines.length === 0)     return 'Add at least one product';
    if (!(Number(physicalWt) > 0)) return 'Add the package physical weight';
    if (!orderId.trim())        return 'Order ID is required';
    if (!images[0])             return 'Upload at least the first product image';
    if (qcEnabled && qcSelectedCount === 0) {
      return 'Select at least one QC item (or turn the QC toggle off)';
    }
    return 'Fill the required fields to continue';
  };

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
      order_payment_type: 'reverse',
      // Shipping (where it's going back to)
      shipping_fname: selectedPickup.name.split(' ')[0] || 'Warehouse',
      shipping_lname: selectedPickup.name.split(' ').slice(1).join(' ') || '',
      shipping_address: selectedPickup.address || 'Address',
      shipping_address_2: '',
      shipping_city: selectedPickup.city || 'City',
      shipping_state: selectedPickup.state || 'State',
      shipping_country: 'INDIA',
      shipping_zip: selectedPickup.pincode,
      shipping_phone: selectedPickup.phone?.replace(/\D/g, '').slice(-10) || '9999999999',
      // Billing (customer who is returning it)
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
      originpincodecheck: selectedCustomer.pincode, // from customer
      dispincode: selectedPickup.pincode, // to warehouse
      // Financials
      order_amount: grandTotal,
      collectable_amount: paymentMode === 'COD' ? Number(collectable) : 0,
      shipping_charges: Number(shippingCharges) || 0,
      cod_charges: paymentMode === 'COD' ? (Number(transactionCharges) || 0) : 0,
      tax_amount: 0,
      discount: Number(totalDiscountInput) || 0,
      is_reverse: 1,
      qc_check: qcEnabled ? '1' : '0',
      qc: [{}],
      qc_item: qcEnabled ? [{
        product_usage: qcAnswers['usage'] ? '1' : '0',
        product_damage: qcAnswers['damage'] ? '1' : '0',
        brandname: qcAnswers['brand'] ? '1' : '0',
        brandnametype: qcAnswers['brand'] ? 'text' : '',
        brand_name_text: qcAnswers['brand'] ? 'text' : '',
        productsize: qcAnswers['size'] ? '1' : '0',
        product_size_text: qcAnswers['size'] ? 'text' : '',
        productcolor: qcAnswers['color'] ? '1' : '0',
        product_color_text: qcAnswers['color'] ? 'text' : '',
        product_img_1: images[0] ? "https://example.com/image1.png" : '',
        product_img_2: images[1] ? "https://example.com/image2.png" : '',
        product_img_3: images[2] ? "https://example.com/image3.png" : '',
        product_img_4: images[3] ? "https://example.com/image4.png" : ''
      }] : [],
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
    if (response.success) {
      setIsCreated(true);
      if (response.dbId) {
        setDbOrderId(response.dbId);
      }
    } else {
      setOrderId(genOrderId());
    }
    setIsSubmitting(false);
    return response;
  };

  const handleCreateManifestLater = async () => {
    if (!canCreate) {
      showToast(explainMissing());
      return;
    }
    const response = await saveOrder();
    if (response.success) {
      showToast(`✓ Reverse order ${orderId} created — pending manifest`);
      setStep('pending-manifest');
    } else {
      showToast(`❌ Failed to create reverse order: ${response.message || 'Please try again.'}`);
    }
  };

  const handleCreateAndShip = async () => {
    if (!canCreate) {
      showToast(explainMissing());
      return;
    }
    const response = await saveOrder();
    if (response.success) {
      showToast(`✓ Reverse order ${orderId} created — select a shipment mode`);
      setSelectedModeId(null);
      setStep('select-mode');
    } else {
      showToast(`❌ Failed to create reverse order: ${response.message || 'Please try again.'}`);
    }
  };

  const handleShipNow = async () => {
    if (!selectedModeId) {
      showToast('Pick a shipment mode to continue');
      return;
    }
    showToast('Shipping reverse order...');
    let idToShip = dbOrderId || orderId;
    if (!dbOrderId) {
        try {
            const listRes = await ordersApi.listOrders({ order_id: orderId });
            const found = listRes.data.find(o => String(o.order_id) === orderId);
            if (found && found.id) idToShip = String(found.id);
        } catch (err) {}
    }
    const success = await ordersApi.shipOrder(idToShip, selectedModeId, selectedPickup?.id || 0);
    if (success) {
      const awb = genAwbNumber();
      setAwbNumber(awb);
      setStep('awb-assigned');
      showToast(`✓ Reverse AWB ${awb} assigned`);
    } else {
      showToast('❌ Failed to ship reverse order. Please try again.');
    }
  };

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
    /* Reverse-only resets — clear images + QC */
    images.forEach((url) => url && URL.revokeObjectURL(url));
    setImages([null, null, null, null]);
    setQcEnabled(true);
    setQcAnswers({});
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

  const handleBack = () => {
    if (step === 'select-mode') setStep('compose');
    else navigate('/orders');
  };

  return (
    <div className="page">
      {/* ── Header row (back ← title · CTAs) ───────────────── */}
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
              <div className="ord-ph-title">New Reverse Order</div>
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
                showToast(`✓ Reverse order ${orderId} created — pending manifest`);
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
          <h3>Bulk Reverse Order — coming up next</h3>
          <p>
            Bulk reverse orders will be uploaded via CSV here. The flow plugs
            into the same pickup / package / customer recipes used by single
            orders, so nothing in this shell has to change.
          </p>
        </div>
      ) : (
        <div className="ord-nf-grid">
          {/* ════════ LEFT column (1fr) ════════ */}
          <div className="ord-nf-left">
            {/* Row 1: Pickup | Customer */}
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

            {/* Row 2: Add Product Details */}
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

            {/* ── Row 2½ (reverse-only): Product Verification ──
                  Sits between "Add Product Details" and "Payment
                  Details" so the operator's mental flow is:
                  what product → verify it → take the money.
                  Pure capture — no totals impact. */}
            <section className="ord-nf-card">
              <div className="ord-nf-card-hdr">
                Atleast First Product Image Is Required<Req />
                <span className="ord-nf-card-hdr-note">
                  Used for QC reference and dispute resolution.
                </span>
              </div>

              <div className="ord-rv-images">
                {[0, 1, 2, 3].map((i) => {
                  const url = images[i];
                  const isRequired = i === 0;
                  return (
                    <div
                      key={i}
                      className={`ord-rv-img-slot ${url ? 'on' : ''} ${isRequired ? 'req' : ''}`}
                    >
                      <input
                        ref={(el) => {
                          fileInputRefs.current[i] = el;
                        }}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleImageChange(i, e)}
                      />
                      {url ? (
                        <>
                          <img
                            src={url}
                            alt={`Product image ${i + 1}`}
                            className="ord-rv-img-preview"
                          />
                          <button
                            type="button"
                            className="ord-rv-img-x"
                            onClick={() => clearImage(i)}
                            aria-label={`Remove image ${i + 1}`}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="ord-rv-img-trigger"
                          onClick={() => triggerImagePicker(i)}
                          aria-label={`Upload image ${i + 1}${isRequired ? ' (required)' : ''}`}
                        >
                          <span className="ord-rv-img-ico" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3v12" />
                              <path d="m7 8 5-5 5 5" />
                              <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                            </svg>
                          </span>
                          <span className="ord-rv-img-lbl">Image {i + 1}</span>
                          {isRequired && (
                            <span className="ord-rv-img-req">(Required)</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="ord-rv-qc-hdr">
                <button
                  type="button"
                  role="switch"
                  aria-checked={qcEnabled}
                  className={`ord-rv-switch ${qcEnabled ? 'on' : ''}`}
                  onClick={() => setQcEnabled((v) => !v)}
                >
                  <span className="ord-rv-switch-thumb" aria-hidden="true" />
                </button>
                <span className="ord-rv-qc-title">QC Questions</span>
              </div>

              {qcEnabled && (
                <div className="ord-rv-qc-chips" role="group" aria-label="QC checks">
                  {QC_QUESTIONS.map((q) => {
                    const on = !!qcAnswers[q.id];
                    return (
                      <button
                        key={q.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        className={`ord-rv-qc-chip ${on ? 'on' : ''}`}
                        onClick={() => toggleQcAnswer(q.id)}
                      >
                        <span className="ord-rv-qc-chip-ico" aria-hidden="true">
                          {on ? (
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m3.5 8.5 3 3 6-7" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                              <path d="M8 3.5v9M3.5 8h9" />
                            </svg>
                          )}
                        </span>
                        <span className="ord-rv-qc-chip-lbl">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Row 3: Payment Details */}
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

/* ─── Local helpers (intentional duplicates of the Forward page
       so this screen stays self-contained per the brief) ───── */

const Req: React.FC = () => <span style={{ color: 'var(--red)' }}>*</span>;

const ShipIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3M20 17H8m12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    <path d="M14 8h4l4 5v4h-2" />
  </svg>
);

function genOrderId(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function genAwbNumber(): string {
  const tail = Math.floor(10_000_000_000 + Math.random() * 89_999_999_999);
  return `1XB${tail}`;
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
   Mirrors the forward page's post-create flow. The wording is
   tweaked to read as "reverse" where the user would notice (sidebar
   "Reverse · Single", success copy). */

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
      <div className="ord-nf-state-title">Reverse Order Created — Pending Manifest</div>
      <div className="ord-nf-state-sub">
        Reverse order <b>{orderId}</b> is saved as a draft return. Assign a courier when you're
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
          <div className="ord-nf-state-k">Return To</div>
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

interface SelectShipmentModeViewProps {
  orderId: string;
  pickupCity: string;
  pickupPincode: string;
  pickupState: string;
  deliveryCity: string;
  deliveryPincode: string;
  deliveryState: string;
  orderValue: number;
  paymentMode: 'PREPAID' | 'COD';
  chargeableWeight: number;
  modes: ShipmentMode[];
  selectedModeId: string | null;
  onSelectMode: (id: string) => void;
}

type ShipmentModeTab  = 'all' | 'surface' | 'air';
type ShipmentSortDir  = 'asc' | 'desc';

const SelectShipmentModeView: React.FC<SelectShipmentModeViewProps> = ({
  orderId, pickupCity, pickupPincode, pickupState,
  deliveryCity, deliveryPincode, deliveryState,
  orderValue, paymentMode, chargeableWeight,
  modes, selectedModeId, onSelectMode,
}) => {
  const [tab,     setTab]     = useState<ShipmentModeTab>('all');
  const [sortDir, setSortDir] = useState<ShipmentSortDir>('asc');

  const counts = useMemo(() => ({
    all:     modes.length,
    surface: modes.filter((m) => m.mode === 'Surface').length,
    air:     modes.filter((m) => m.mode === 'Air').length,
  }), [modes]);

  const visibleModes = useMemo(() => {
    const filtered =
      tab === 'surface' ? modes.filter((m) => m.mode === 'Surface') :
      tab === 'air'     ? modes.filter((m) => m.mode === 'Air')     :
      modes;
    return filtered.slice().sort((a, b) =>
      sortDir === 'asc' ? a.rate - b.rate : b.rate - a.rate,
    );
  }, [modes, tab, sortDir]);

  const TABS: Array<{ id: ShipmentModeTab; label: string; count: number }> = [
    { id: 'all',     label: 'All',     count: counts.all     },
    { id: 'surface', label: 'Surface', count: counts.surface },
    { id: 'air',     label: 'Air',     count: counts.air     },
  ];

  return (
    <div className="ord-nf-mode-grid">
      <aside className="ord-nf-mode-side">
        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ORDER</div>
          <div className="ord-nf-mode-side-v">{orderId}</div>
          <div className="ord-nf-mode-side-sub">Reverse · Single</div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ROUTE</div>
          <div className="ord-nf-mode-side-route">
            <div className="ord-nf-mode-side-loc">
              <b>{deliveryCity}</b>
              <span>{deliveryPincode}{deliveryState && `, ${toStateCode(deliveryState)}`}</span>
            </div>
            <span className="ord-nf-mode-side-line" aria-hidden="true" />
            <div className="ord-nf-mode-side-loc to">
              <b>{pickupCity}</b>
              <span>{pickupPincode}{pickupState && `, ${toStateCode(pickupState)}`}</span>
            </div>
          </div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ORDER VALUE</div>
          <div className="ord-nf-mode-side-v">₹{orderValue.toLocaleString('en-IN')}</div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">PAYMENT</div>
          <span className={`ord-pay-mode ${paymentMode === 'COD' ? 'cod' : 'prepaid'}`}>
            {paymentMode}
          </span>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">APPLICABLE WEIGHT (IN KG)</div>
          <div className="ord-nf-mode-side-v">{chargeableWeight} kg</div>
        </div>
      </aside>

      <main className="ord-nf-mode-main">
        <div className="ord-nf-mode-toolbar">
          <div className="ord-nf-mode-tabs" role="tablist" aria-label="Shipment mode filter">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`ord-nf-mode-tab ${tab === t.id ? 'on' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span className="ord-nf-mode-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="ord-nf-mode-toolbar-r">
            <span className="ord-nf-mode-count-lbl">
              <b>{visibleModes.length}</b> services found
            </span>
            <label className="ord-nf-mode-sort">
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as ShipmentSortDir)}
                aria-label="Sort by price"
              >
                <option value="asc">Price: Low - High</option>
                <option value="desc">Price: High - Low</option>
              </select>
            </label>
          </div>
        </div>

        <div className="ord-nf-mode-tbl" role="table">
          <div className="ord-nf-mode-tbl-hdr" role="row">
            <span />
            <span role="columnheader">COURIER SERVICE</span>
            <span role="columnheader" className="num">WEIGHT</span>
            <span role="columnheader" className="num">CHARGES</span>
          </div>

          {visibleModes.length === 0 ? (
            <div className="ord-nf-mode-tbl-empty">
              No {tab === 'all' ? '' : tab} services available for this route.
            </div>
          ) : (
            visibleModes.map((m) => {
              const isOn = m.id === selectedModeId;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="row"
                  aria-pressed={isOn}
                  className={`ord-nf-mode-tbl-row ${isOn ? 'on' : ''}`}
                  onClick={() => onSelectMode(m.id)}
                >
                  <span
                    className={`ord-cb ${isOn ? 'on' : ''}`}
                    aria-hidden="true"
                  />
                  <div className="ord-nf-mode-tbl-courier">
                    <div className="ord-nf-mode-tbl-name">{m.courier}</div>
                    {m.mode && (
                      <span className={`ord-nf-mode-tag ${m.mode.toLowerCase()}`}>
                        {m.mode.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ord-nf-mode-tbl-wt">
                    <span className="ord-nf-mode-wt-pill">
                      {m.weight} K.G
                    </span>
                  </div>
                  <div className="ord-nf-mode-tbl-rate">
                    ₹{m.rate.toLocaleString('en-IN')}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

interface AwbAssignedViewProps {
  orderId: string;
  awbNumber: string;
  shipmentMode: ShipmentMode | null;
  customerName: string;
  deliveryCity: string;
  pickupName: string;
  pickupCity: string;
  chargeableWeight: number;
  amount: number;
  paymentMode: 'PREPAID' | 'COD';
  onViewOrders: () => void;
  onCreateAnother: () => void;
  onPrintLabel: () => void;
}
const AwbAssignedView: React.FC<AwbAssignedViewProps> = ({
  orderId, awbNumber, shipmentMode, customerName, deliveryCity, pickupName, pickupCity,
  chargeableWeight, amount, paymentMode, onViewOrders, onCreateAnother, onPrintLabel,
}) => (
  <div className="ord-nf-state">
    <div className="ord-nf-state-card">
      <div className="ord-nf-state-ico ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="ord-nf-state-title">Return AWB Assigned</div>
      <div className="ord-nf-state-sub">
        Reverse order <b>{orderId}</b> is ready for pickup.{' '}
        {shipmentMode ? (
          <>{shipmentMode.courier}{shipmentMode.mode ? ` (${shipmentMode.mode})` : ''} will collect it next.</>
        ) : null}
      </div>

      <div className="ord-nf-awb">
        <div className="ord-nf-awb-l">
          <div className="ord-nf-state-k">AWB Number</div>
          <div className="ord-nf-awb-num">{awbNumber}</div>
          {shipmentMode && (
            <div className="ord-nf-awb-courier">
              {shipmentMode.courier}
              {shipmentMode.mode && ` · ${shipmentMode.mode}`}
              {' · '}{shipmentMode.weight} kg slab
            </div>
          )}
        </div>
        <span className="ord-status new ord-nf-awb-pill">Ready for Pickup</span>
      </div>

      <div className="ord-nf-state-grid">
        <div>
          <div className="ord-nf-state-k">Order ID</div>
          <div className="ord-nf-state-v mono">{orderId}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Customer</div>
          <div className="ord-nf-state-v">{customerName} · {deliveryCity}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Return To</div>
          <div className="ord-nf-state-v">{pickupName} · {pickupCity}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Chargeable Weight</div>
          <div className="ord-nf-state-v mono">{chargeableWeight.toFixed(2)} kg</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Order Value</div>
          <div className="ord-nf-state-v mono">
            ₹{amount.toLocaleString('en-IN')}{' '}
            <span className={`ord-pay-mode ${paymentMode === 'COD' ? 'cod' : 'prepaid'}`} style={{ marginLeft: 6 }}>
              {paymentMode}
            </span>
          </div>
        </div>
        {shipmentMode && (
          <div>
            <div className="ord-nf-state-k">Shipping Rate</div>
            <div className="ord-nf-state-v mono">₹{shipmentMode.rate.toLocaleString('en-IN')}</div>
          </div>
        )}
      </div>

      <div className="ord-nf-state-ft">
        <button type="button" className="ord-cta ord-cta-s" onClick={onCreateAnother}>
          + Create Another Order
        </button>
        <button type="button" className="ord-cta ord-cta-s" onClick={onPrintLabel}>
          🖨 Print Label
        </button>
        <button type="button" className="ord-cta ord-cta-p" onClick={onViewOrders}>
          View All Orders
        </button>
      </div>
    </div>
  </div>
);

export default NewReverseOrderPage;
