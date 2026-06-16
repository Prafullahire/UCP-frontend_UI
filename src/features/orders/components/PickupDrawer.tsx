import React, { useEffect, useMemo, useState } from 'react';
import { PINCODE_MAP } from '../../support/data/supportData';
import { ADDRESS_TAGS, type AddressTag, type SavedPickup } from '../data/forwardOrderData';

/** Adds an Escape-to-close handler matching the rest of the codebase. */
function useEscClose(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

interface PickupDrawerProps {
  mode: 'create' | 'edit';
  /** Existing pickup when editing — undefined when creating a new one. */
  pickup?: SavedPickup;
  onClose: () => void;
  onSave: (pickup: SavedPickup) => void;
}

/* Reuses the support drawer shell (`.sup-ov` overlay + `.sup-panel.w-create`
   700px panel + sticky header/footer) and the support form helpers
   (`.sup-mf` / `.sup-ml` / `.sup-mi` / `.sup-row`). Mirrors the New Pickup
   pop-up screenshot supplied with the brief. */
export const PickupDrawer: React.FC<PickupDrawerProps> = ({ mode, pickup, onClose, onSave }) => {
  /* ── Address details ────────────────────────────────────────── */
  const [tag, setTag]             = useState<AddressTag>(pickup?.tag ?? 'Warehouse');
  const [name, setName]           = useState(pickup?.name ?? '');
  const [pincode, setPincode]     = useState(pickup?.pincode ?? '');
  const [state, setState]         = useState(pickup?.state ?? '');
  const [city, setCity]           = useState(pickup?.city ?? '');
  const [address, setAddress]     = useState(pickup?.address ?? '');

  /* ── Contact ──────────────────────────────────────────────── */
  const [contactPhone, setContactPhone]   = useState(stripPrefix(pickup?.contactPhone));
  const [contactPerson, setContactPerson] = useState(pickup?.contactPersonName ?? '');
  const isVerified = pickup?.isVerified ?? false;

  /* ── Support contact ──────────────────────────────────────── */
  const [supportSameAsContact, setSupportSameAsContact] = useState(false);
  const [supportPhone, setSupportPhone] = useState(stripPrefix(pickup?.supportPhone));
  const [email, setEmail]               = useState(pickup?.email ?? '');

  /* ── Label preferences ────────────────────────────────────── */
  const [hideWhAddress, setHideWhAddress] = useState(pickup?.hideWarehouseAddress ?? true);
  const [hideWhPhone, setHideWhPhone]     = useState(pickup?.hideWarehousePhone ?? false);
  const [hideCustPhone, setHideCustPhone] = useState(pickup?.hideCustomerPhone ?? false);
  const [hideProdDetails, setHideProdDetails] = useState(pickup?.hideProductDetails ?? false);

  /* ── Return details ───────────────────────────────────────── */
  const [returnSame, setReturnSame] = useState(pickup?.returnSameAsPickup ?? true);

  useEscClose(onClose);

  /* ── Pincode autofill (reuses PINCODE_MAP from Support) ──── */
  useEffect(() => {
    if (pincode.length === 6) {
      const found = PINCODE_MAP[pincode];
      if (found) {
        setCity(found[0]);
        setState(found[1]);
      }
    }
  }, [pincode]);

  /* ── Keep the support-contact fields in sync when the
        "Same as Contact Details" checkbox is on. ───────────── */
  useEffect(() => {
    if (supportSameAsContact) setSupportPhone(contactPhone);
  }, [supportSameAsContact, contactPhone]);

  const canSubmit = useMemo(
    () => !!name.trim() && !!pincode.trim() && !!state.trim() && !!city.trim() && !!address.trim(),
    [name, pincode, state, city, address],
  );

  const clearAll = () => {
    setName(''); setPincode(''); setState(''); setCity(''); setAddress('');
    setContactPhone(''); setContactPerson('');
    setSupportSameAsContact(false); setSupportPhone(''); setEmail('');
    setHideWhAddress(true); setHideWhPhone(false); setHideCustPhone(false); setHideProdDetails(false);
    setReturnSame(true);
  };

  const handleApply = () => {
    if (!canSubmit) return;
    const id = pickup?.id ?? `pk-${Date.now()}`;
    onSave({
      id,
      name: name.trim(),
      tag,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: 'India',
      contactPhone: `+91 ${contactPhone.trim()}`,
      contactPersonName: contactPerson.trim(),
      email: email.trim(),
      supportPhone: `+91 ${(supportSameAsContact ? contactPhone : supportPhone).trim()}`,
      isVerified,
      isPrimary: pickup?.isPrimary ?? false,
      hideWarehouseAddress: hideWhAddress,
      hideWarehousePhone: hideWhPhone,
      hideCustomerPhone: hideCustPhone,
      hideProductDetails: hideProdDetails,
      returnSameAsPickup: returnSame,
    });
  };

  return (
    <div className="sup-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sup-panel w-create">
        <div className="sup-panel-hdr">
          <div className="sup-panel-hdr-t">
            <div>
              <div className="sup-panel-title">
                {mode === 'create' ? 'New Pickup Location' : 'Edit Pickup Location'}
              </div>
              <div className="sup-panel-sub">
                Address used on shipping labels, manifests and invoices
              </div>
            </div>
            <div className="sup-panel-x" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="sup-panel-body">
          {/* ── Address Details ──────────────────────────────── */}
          <div className="ord-nf-sec-lbl">Address Details</div>

          <div className="sup-mf">
            <div className="sup-ml">
              Tag this address as <InfoDot />
            </div>
            <div className="ord-nf-tagrow">
              {ADDRESS_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`ord-nf-tag ${tag === t ? 'on' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="sup-row">
            <div className="sup-mf">
              <div className="sup-ml">Warehouse Name <Req /></div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter warehouse name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">Pincode <Req /></div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter Pin code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="sup-row">
            <div className="sup-mf">
              <div className="sup-ml">State <Req /></div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">City <Req /></div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="sup-mf">
            <div className="sup-ml">Address Line <Req /></div>
            <input
              className="sup-mi"
              type="text"
              placeholder="Enter Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="sup-ml-hint" style={{ marginTop: 4 }}>
              This will be used in the invoices that you will print
            </div>
          </div>

          <div className="ord-nf-divider" />

          {/* ── Contact Details ──────────────────────────────── */}
          <div className="ord-nf-sec-lbl">Contact Details</div>

          <div className="sup-row">
            <div className="sup-mf">
              <div className="sup-ml">Contact No.</div>
              <PhoneInput value={contactPhone} onChange={setContactPhone} />
              {isVerified && (
                <div className="field-hint ok"><span>✓</span><span>Verified</span></div>
              )}
            </div>
            <div className="sup-mf">
              <div className="sup-ml">Contact Person Name</div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter contact person name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
          </div>

          <div className="ord-nf-divider" />

          {/* ── Support Contact Details ──────────────────────── */}
          <div className="ord-nf-sec-lbl">Support Contact Details</div>

          <label className="ord-nf-check">
            <input
              type="checkbox"
              checked={supportSameAsContact}
              onChange={(e) => setSupportSameAsContact(e.target.checked)}
            />
            <span>Same as Contact Details</span>
          </label>

          <div className="sup-row" style={{ marginTop: 10 }}>
            <div className="sup-mf">
              <div className="sup-ml">Contact No. <InfoDot /></div>
              <PhoneInput
                value={supportPhone}
                onChange={setSupportPhone}
                disabled={supportSameAsContact}
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">Email Id <InfoDot /></div>
              <input
                className="sup-mi"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {isVerified && email && (
                <div className="field-hint ok"><span>✓</span><span>Verified</span></div>
              )}
            </div>
          </div>

          <div className="ord-nf-divider" />

          {/* ── Label preferences ────────────────────────────── */}
          <div className="ord-nf-sec-lbl">Label Preferences</div>
          <div className="ord-nf-prefgrid">
            <Check label="Hide Warehouse Address"      checked={hideWhAddress}    onChange={setHideWhAddress} />
            <Check label="Hide Warehouse Phone Number" checked={hideWhPhone}      onChange={setHideWhPhone} />
            <Check label="Hide Customer Phone Number"  checked={hideCustPhone}    onChange={setHideCustPhone} />
            <Check label="Hide Product Details"        checked={hideProdDetails}  onChange={setHideProdDetails} />
          </div>

          <div className="ord-nf-divider" />

          {/* ── Return details ───────────────────────────────── */}
          <div className="ord-nf-sec-lbl">Return Details</div>
          <Check
            label="Return address is the same as pickup address"
            checked={returnSame}
            onChange={setReturnSame}
            accent
          />
        </div>

        <div className="sup-panel-ft">
          <button type="button" className="ord-cta ord-cta-s" onClick={clearAll}>Clear All</button>
          <button
            type="button"
            className="ord-cta ord-cta-p"
            disabled={!canSubmit}
            style={!canSubmit ? { opacity: .5, cursor: 'not-allowed' } : undefined}
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Local sub-components ──────────────────────────────────── */

const Req: React.FC = () => <span style={{ color: 'var(--red)' }}>*</span>;

const InfoDot: React.FC = () => (
  <span
    title="More info"
    aria-hidden="true"
    style={{
      display: 'inline-flex',
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: 'var(--s3)',
      color: 'var(--ink3)',
      fontSize: 9,
      fontWeight: 700,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    }}
  >
    i
  </span>
);

interface PhoneInputProps { value: string; onChange: (v: string) => void; disabled?: boolean; }
const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, disabled }) => (
  <div className="ord-nf-phone">
    <span className="ord-nf-phone-prefix">+91</span>
    <input
      type="tel"
      placeholder="Enter phone number"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
      disabled={disabled}
    />
  </div>
);

interface CheckProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: boolean;
}
const Check: React.FC<CheckProps> = ({ label, checked, onChange, accent }) => (
  <label className={`ord-nf-check ${accent ? 'accent' : ''}`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

/* ─── Helpers ────────────────────────────────────────────────── */

function stripPrefix(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/^\+\d{1,3}\s*/, '');
}

export default PickupDrawer;
