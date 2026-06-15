import React, { useEffect, useState } from 'react';
import SavedAddressSelect, { type SavedAddressOption } from './SavedAddressSelect';
import {
  SAVED_PICKUPS,
  type SavedPickup,
} from '../data/forwardOrderData';

interface BulkPickupLocationModalProps {
  /** How many rows are being bulk-updated — drives the subtitle copy. */
  selectedCount: number;
  onClose: () => void;
  /** Fires with the chosen pickup id when the user clicks "Update Warehouse". */
  onConfirm: (pickup: SavedPickup) => void;
}

/**
 * Bulk Pickup Location Change.
 *
 * Mirrors the reference pop-up shipped with the brief — minimal modal
 * with a single "Pickup Location" picker and two footer CTAs (Close +
 * Update Warehouse). The picker is the same `SavedAddressSelect` used
 * on the New Order Creation screen so users see the exact same recipe
 * (search, address card, "+ Add new pickup") regardless of where they
 * change a warehouse from.
 *
 * Reuses the shared `.ord-ov` + `.ord-modal-*` shell plus the existing
 * `.sup-mf / .sup-ml` field tokens — no bespoke styles are introduced.
 */
export const BulkPickupLocationModal: React.FC<BulkPickupLocationModalProps> = ({
  selectedCount,
  onClose,
  onConfirm,
}) => {
  /* No preselection — the dropdown opens with the placeholder so the user
     is forced to make an active choice (avoids accidentally re-applying
     the previously chosen warehouse from a different bulk pass). */
  const [pickupId, setPickupId] = useState<string | null>(null);

  /* Close on Escape — matches every other modal in the page. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [pickups, setPickups] = useState<SavedPickup[]>(SAVED_PICKUPS);

  useEffect(() => {
    import('../../../services/warehouseApi').then(({ warehouseApi }) => {
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
        }
      });
    });
  }, []);

  const options: SavedAddressOption[] = pickups.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.contactPhone,
    email: p.email,
    isVerified: p.isVerified,
    hint: p.isPrimary ? 'Primary' : undefined,
  }));

  const handleConfirm = () => {
    if (!pickupId) return;
    const pickup = pickups.find((p) => p.id === pickupId);
    if (pickup) onConfirm(pickup);
  };

  return (
    <div
      className="ord-ov"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-pickup-title"
    >
      <div
        className="ord-modal"
        style={{ width: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ord-modal-hdr">
          <div>
            <div className="ord-modal-title" id="bulk-pickup-title">
              Pickup Location Change
            </div>
            <div className="ord-modal-sub">
              Bulk Pickup Location Change · {selectedCount} order{selectedCount > 1 ? 's' : ''} selected
            </div>
          </div>
          <button type="button" className="ord-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ord-modal-body">
          <div className="sup-mf" style={{ marginBottom: 0 }}>
            <div className="sup-ml">Pickup Location</div>
            <SavedAddressSelect
              value={pickupId}
              options={options}
              placeholder="Select the Warehouse"
              addNewLabel="Add new pickup location"
              onChange={setPickupId}
              /* Add-new is intentionally a no-op in this context — the
                 bulk modal is for picking from existing warehouses;
                 standalone pickup creation lives on the New Order page. */
              onAddNew={() => {}}
            />
          </div>
        </div>

        <div className="ord-modal-ft">
          <button type="button" className="ord-cta ord-cta-s" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-p"
            onClick={handleConfirm}
            disabled={!pickupId}
            style={!pickupId ? { opacity: .55, cursor: 'not-allowed' } : undefined}
          >
            Update Warehouse
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPickupLocationModal;
