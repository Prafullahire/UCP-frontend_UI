import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import PickupDrawer from './components/PickupDrawer';
import PackageDrawer from './components/PackageDrawer';
import CustomerDrawer from './components/CustomerDrawer';
import SavedAddressSelect, { type SavedAddressOption } from './components/SavedAddressSelect';
import { PENDING_ORDERS } from './data/ordersData';
import {
  SAVED_CUSTOMERS,
  SAVED_PACKAGES,
  SAVED_PICKUPS,
  calcVolumetricWeight,
  chargeableWeight,
  type SavedCustomer,
  type SavedPackage,
  type SavedPickup,
} from './data/forwardOrderData';
import type { Order } from './types';
import { ordersApi } from '../../services/ordersApi';

/**
 * Edit Order screen.
 *
 * Opened from the Pending grid's 3-dot menu → "Edit Order". Reuses the
 * exact layout, cards, drawers and form controls that power the New
 * Forward Order composer so an editor never sees a different visual
 * vocabulary — only the entry point and the editable surface change.
 *
 * Editable sections (explicit per brief):
 *   1. Pickup
 *   2. Customer
 *   3. Package Details
 *   4. Payment Details
 *
 * Locked section:
 *   • Product Details — surfaced as a read-only block so the order
 *     summary stays complete, but the catalog selector / qty steppers
 *     never render. A small lock banner makes the intent unambiguous.
 *
 * The Pickup + Customer pickers are seeded with synthetic options built
 * from the order's existing pickup/customer payload so the dropdowns
 * always preselect the order's actual data — even when it doesn't match
 * any of the SAVED_* presets (e.g. a one-off pickup warehouse).
 */
export const EditForwardOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: orderIdParam } = useParams<{ id: string }>();
  const location = useLocation();
  const showToast = useReportsStore((s) => s.showToast);

  /* Resolve the order. If a non-existent id ever reaches this route we
     bail back to /orders rather than rendering an empty form — keeps
     the route safe for deep-links from the future API. */
  const order = useMemo(
    () => location.state?.order ?? PENDING_ORDERS.find((o) => o.id === orderIdParam) ?? null,
    [location.state, orderIdParam],
  );

  useEffect(() => {
    if (!order) {
      showToast('Order not found — returning to Orders list');
      navigate('/orders', { replace: true });
    }
  }, [order, navigate, showToast]);

  if (!order) return null;

  return <EditForm key={order.id} order={order} onCancel={() => navigate('/orders')} />;
};

/* ────────────────────────────────────────────────────────────────
   Inner form — keyed on order.id so a hard re-mount happens whenever
   the route's id changes. Lets us seed every piece of form state from
   the order via useState's lazy initializer without ever needing a
   useEffect dance to sync props → state.
   ──────────────────────────────────────────────────────────────── */

interface EditFormProps {
  order: Order;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ order, onCancel }) => {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* ─── Pickup ─── */
  const seededPickup = useMemo<SavedPickup>(
    () => synthesizePickupFromOrder(order),
    [order],
  );
  /* Inject the seeded pickup at the head of the dropdown so the order's
     actual warehouse is always shown first. Saved presets still follow. */
  const [pickups, setPickups] = useState<SavedPickup[]>(() => [
    seededPickup,
    ...SAVED_PICKUPS,
  ]);
  const [pickupId, setPickupId] = useState<string>(seededPickup.id);
  const selectedPickup = pickups.find((p) => p.id === pickupId) ?? null;
  const [pickupDrawer, setPickupDrawer] = useState<
    { mode: 'create' | 'edit'; id?: string } | null
  >(null);

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
          setPickups([seededPickup, ...mapped]);
        }
      });
    });
  }, [seededPickup]);

  /* ─── Customer ─── */
  const seededCustomer = useMemo<SavedCustomer>(
    () => synthesizeCustomerFromOrder(order),
    [order],
  );
  const [customers, setCustomers] = useState<SavedCustomer[]>(() => [seededCustomer, ...SAVED_CUSTOMERS]);
  const [customerId, setCustomerId] = useState<string>(seededCustomer.id);
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const [customerDrawer, setCustomerDrawer] = useState<
    { mode: 'create' | 'edit'; id?: string } | null
  >(null);

  /* ─── Package Details ─── */
  const seededPkg = useMemo(() => parsePackageFromOrder(order), [order]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>(SAVED_PACKAGES);
  const [packageId, setPackageId] = useState<string | null>(null);
  const selectedPackage = savedPackages.find((p) => p.id === packageId) ?? null;
  const [physicalWt, setPhysicalWt] = useState<string>(String(seededPkg.physicalWeight));
  const [length, setLength]   = useState<string>(String(seededPkg.length));
  const [breadth, setBreadth] = useState<string>(String(seededPkg.breadth));
  const [height, setHeight]   = useState<string>(String(seededPkg.height));
  const [savePackageDetail, setSavePackageDetail] = useState(false);
  const [packageDrawer, setPackageDrawer] = useState<
    { mode: 'create' | 'edit'; id?: string } | null
  >(null);

  const volumetricWt = useMemo(() => {
    const l = Number(length), b = Number(breadth), h = Number(height);
    if (!l || !b || !h) return 0;
    return calcVolumetricWeight(l, b, h);
  }, [length, breadth, height]);

  const chargeable = chargeableWeight(Number(physicalWt) || 0, volumetricWt);

  /* ─── Payment Details (Order Id stays mono-fixed since it identifies
        the existing record; mode + collectable are mutable). ─── */
  const initialPaymentMode: 'PREPAID' | 'COD' =
    order.payment.mode === 'COD' ? 'COD' : 'PREPAID';
  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD'>(initialPaymentMode);
  const [collectable, setCollectable] = useState<string>(
    initialPaymentMode === 'COD' ? String(order.payment.amount) : '',
  );

  /* ─── Drawer save handlers (mirror the New Order page's behaviour). ─── */

  const handlePickupSave = async (next: SavedPickup) => {
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
        setPickups([seededPickup, ...mapped]);
        
        const newlyCreated = mapped.find(m => m.name.toLowerCase() === next.name.toLowerCase());
        if (newlyCreated) {
           setPickupId(newlyCreated.id);
        }
      }
    } catch (err) {
      console.error("Failed to save pickup to backend", err);
    }
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

  /* ─── Submit ─── */

  const canSave =
    !!selectedPickup &&
    !!selectedCustomer &&
    Number(physicalWt) > 0 &&
    (paymentMode === 'PREPAID' || Number(collectable) > 0);

  const handleSave = async () => {
    if (!canSave) {
      showToast('Pickup, customer, package weight and collectable amount are required');
      return;
    }
    
    showToast(`Saving changes for order ${order.id}...`);
    
    const payload: any = {
      physical_weight: Number(physicalWt),
      length: Number(length),
      breadth: Number(breadth),
      height: Number(height),
      payment_type: paymentMode,
      pickup_warehouse_name: selectedPickup?.name,
      pickup_city: selectedPickup?.city,
      pickup_pincode: selectedPickup?.pincode,
      customer_name: selectedCustomer?.name,
      customer_mobile: selectedCustomer?.phone?.replace(/\D/g, ''),
      delivery_city: selectedCustomer?.city,
      delivery_pincode: selectedCustomer?.pincode
    };
    if (paymentMode === 'COD') {
      payload.order_amount = Number(collectable);
    }
    // Note: The UI doesn't currently edit everything we send back, but we send what we can.
    
    const success = await ordersApi.bulkUpdateOrders([order.id], payload);
    if (success) {
      showToast(`✓ Order ${order.id} updated successfully`);
      navigate('/orders');
    } else {
      showToast(`❌ Failed to update order ${order.id}. Please try again.`);
    }
  };

  /* ─── Adapters for SavedAddressSelect ─── */

  const pickupOptions: SavedAddressOption[] = pickups.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.contactPhone,
    email: p.email,
    isVerified: p.isVerified,
    hint: p.id === seededPickup.id
      ? 'Linked to this order'
      : p.isPrimary
        ? 'Primary'
        : undefined,
  }));

  const customerOptions: SavedAddressOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    email: c.email,
    isVerified: c.isVerified,
    hint: c.id === seededCustomer.id ? 'Linked to this order' : undefined,
  }));

  /* Derived display values for the locked Product Details card. */
  const orderAmountDisplay = '₹' + order.payment.amount.toLocaleString('en-IN');
  const unitPrice = (order.product?.qty || 1) > 0
    ? order.payment.amount / (order.product?.qty || 1)
    : order.payment.amount;
  const unitPriceDisplay = '₹' + unitPrice.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

  return (
    <div className="page">
      {/* ── Header (back ← title · CTAs) ──────────────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <button
            type="button"
            className="ord-nf-back"
            onClick={onCancel}
            aria-label="Back to Orders"
          >
            ‹
          </button>
          <div className="ord-ph-title">
            Edit Order <span className="ord-edit-id mono">#{order.id}</span>
          </div>
          <span className="ord-status new" style={{ marginLeft: 10 }}>Pending</span>
        </div>
        <div className="ord-ph-r">
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-p"
            onClick={handleSave}
            disabled={!canSave}
            style={!canSave ? { opacity: .55, cursor: 'not-allowed' } : undefined}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* ── 2-column body (same shell as the New Order page) ──── */}
      <div className="ord-nf-grid">
        {/* ════════ LEFT column ════════ */}
        <div className="ord-nf-left">
          {/* Row 1 — Pickup | Customer */}
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
                  onAddNew={() => setCustomerDrawer({ mode: 'create' })}
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

          {/* Row 2 — Product Details (LOCKED) */}
          <section className="ord-nf-card">
            <div className="ord-nf-card-hdr">
              Product Details
              <span className="ord-nf-card-hdr-note">
                <LockIcon /> Locked — cannot be edited after order creation
              </span>
            </div>

            <div className="ord-edit-locked">
              <div className="ord-edit-locked-grid">
                <KV label="Product"     value={order.product?.name || 'N/A'} />
                <KV label="SKU"         value={order.product?.sku || 'N/A'} mono />
                <KV label="HSN"         value={order.product?.hsn || 'N/A'} mono />
                <KV label="Quantity"    value={String(order.product?.qty || 1)} />
                <KV label="Unit Price"  value={unitPriceDisplay} mono />
                <KV label="Order Total" value={orderAmountDisplay} mono />
              </div>
            </div>
          </section>

          {/* Row 3 — Payment Details */}
          <section className="ord-nf-card">
            <div className="ord-nf-card-hdr">
              Payment Details<Req />
            </div>

            <div className="ord-nf-paygrid">
              <div className="sup-mf">
                <div className="sup-ml">Order Id</div>
                <input
                  className="sup-mi"
                  type="text"
                  value={order.id}
                  readOnly
                  style={{ background: 'var(--s3)', color: 'var(--ink2)' }}
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
                    onChange={(e) =>
                      setCollectable(e.target.value.replace(/[^\d.]/g, ''))
                    }
                    disabled={paymentMode !== 'COD'}
                    style={
                      paymentMode !== 'COD'
                        ? { background: 'var(--s3)', color: 'var(--ink3)' }
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ════════ RIGHT column ════════ */}
        <div className="ord-nf-right">
          <section className="ord-nf-card">
            <div className="ord-nf-card-hdr">Package Details</div>

            <div className="ord-nf-tip">
              <span className="ord-nf-tip-ico">💡</span>
              <span>Tip: Add correct values to avoid weight discrepancy</span>
            </div>

            <div className="sup-mf">
              <div className="ord-nf-row-between">
                <div className="sup-ml">Saved Package</div>
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
                      onClick={() =>
                        setPackageDrawer({ mode: 'edit', id: selectedPackage.id })
                      }
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
                <option value="">Use order's current package values</option>
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

            <div className="ord-nf-sec-lbl">Size of Package</div>
            <div className="ord-nf-dims">
              <UnitField label="Length"  unit="cm" value={length}  onChange={setLength} />
              <UnitField label="Breadth" unit="cm" value={breadth} onChange={setBreadth} />
              <UnitField label="Height"  unit="cm" value={height}  onChange={setHeight} />
            </div>

            {chargeable > 0 && (
              <div className="ord-nf-chargeable">
                <span className="ord-nf-chargeable-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6Z" />
                  </svg>
                </span>
                <div>
                  <div className="ord-nf-chargeable-n">{chargeable.toFixed(2)} kg</div>
                  <div className="ord-nf-chargeable-sub">
                    Charged at whichever is heavier — dead or volumetric
                  </div>
                </div>
              </div>
            )}

            <label className="ord-nf-check" style={{ marginTop: 10 }}>
              <input
                type="checkbox"
                checked={savePackageDetail}
                onChange={(e) => setSavePackageDetail(e.target.checked)}
              />
              <span>Save Package Detail</span>
            </label>
          </section>
        </div>
      </div>

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

const LockIcon: React.FC = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={{ marginRight: 4, verticalAlign: 'middle' }}
  >
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
  </svg>
);

interface AddressCardProps {
  name: string;
  address: string;
  phone: string;
  email?: string;
  verified?: boolean;
  onEdit: () => void;
  onAddNew: () => void;
}
const AddressCard: React.FC<AddressCardProps> = ({
  name, address, phone, email, verified, onEdit, onAddNew,
}) => (
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
const UnitInput: React.FC<UnitInputProps> = ({
  value, onChange, placeholder, unit, readOnly,
}) => (
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

const UnitField: React.FC<{
  label: string; unit: string; value: string; onChange: (v: string) => void;
}> = ({ label, unit, value, onChange }) => (
  <div className="sup-mf" style={{ marginBottom: 0 }}>
    <div className="sup-ml">{label} <Req /></div>
    <UnitInput value={value} onChange={onChange} placeholder="0" unit={unit} />
  </div>
);

const KV: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label, value, mono,
}) => (
  <div>
    <div className="ord-nf-state-k">{label}</div>
    <div className={`ord-nf-state-v ${mono ? 'mono' : ''}`}>{value}</div>
  </div>
);

/* ───────────────────────────────────────────────────────────────
   Adapters — translate `Order` (Pending grid shape) → the SavedPickup
   / SavedCustomer / SavedPackage shapes consumed by the create-order
   form controls. Kept at module scope so they don't re-allocate on
   every render and are trivially unit-testable.
   ─────────────────────────────────────────────────────────────── */

function synthesizePickupFromOrder(order: Order): SavedPickup {
  return {
    id: `pk-existing-${order.id}`,
    name: order.pickupLocation,
    tag: 'Warehouse',
    address: `${order.pickup.city} — ${order.pickup.pin}`,
    city: order.pickup.city,
    state: '',
    pincode: order.pickup.pin,
    country: 'India',
    contactPhone: '',
    contactPersonName: '',
    email: '',
    supportPhone: '',
    isVerified: true,
    isPrimary: false,
    hideWarehouseAddress: false,
    hideWarehousePhone: false,
    hideCustomerPhone: false,
    hideProductDetails: false,
    returnSameAsPickup: true,
  };
}

function synthesizeCustomerFromOrder(order: Order): SavedCustomer {
  return {
    id: `cu-existing-${order.id}`,
    name: order.customer.name,
    phone: order.customer.phone,
    email: '',
    address: `${order.customer.city} — ${order.customer.pin}`,
    city: order.customer.city,
    state: '',
    pincode: order.customer.pin,
    isVerified: false,
  };
}

/**
 * Parses the order's display package strings (e.g. `'1 kg'`,
 * `'40×20×30 (cm)'`) into the numeric form the package controls expect.
 * Returns sensible zeros when the format isn't recognised — the form
 * surface remains usable and the user can simply re-enter the values.
 */
function parsePackageFromOrder(order: any): {
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
} {
  const deadWt = order.package?.deadWt || '0 kg';
  const dims = order.package?.dims || '10x10x10 (cm)';

  const physicalWeight = parseFloat(deadWt) || 0;
  const dimsMatch = dims.match(/(\d+(?:\.\d+)?)[×x](\d+(?:\.\d+)?)[×x](\d+(?:\.\d+)?)/i);
  return {
    physicalWeight,
    length:  dimsMatch ? Number(dimsMatch[1]) : 0,
    breadth: dimsMatch ? Number(dimsMatch[2]) : 0,
    height:  dimsMatch ? Number(dimsMatch[3]) : 0,
  };
}

export default EditForwardOrderPage;
