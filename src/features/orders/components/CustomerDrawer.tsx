import React, { useEffect, useMemo, useState } from 'react';
import { PINCODE_MAP } from '../../support/data/supportData';
import type { SavedCustomer } from '../data/forwardOrderData';

/** Adds an Escape-to-close handler matching the rest of the codebase. */
function useEscClose(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

interface CustomerDrawerProps {
  mode: 'create' | 'edit';
  customer?: SavedCustomer;
  onClose: () => void;
  onSave: (customer: SavedCustomer) => void;
}

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({ mode, customer, onClose, onSave }) => {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(stripPrefix(customer?.phone));
  const [email, setEmail] = useState(customer?.email ?? '');
  const [pincode, setPincode] = useState(customer?.pincode ?? '');
  const [state, setState] = useState(customer?.state ?? '');
  const [city, setCity] = useState(customer?.city ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const isVerified = customer?.isVerified ?? false;

  useEscClose(onClose);

  useEffect(() => {
    if (pincode.length === 6) {
      const found = PINCODE_MAP[pincode];
      if (found) {
        setCity(found[0]);
        setState(found[1]);
      }
    }
  }, [pincode]);

  const canSubmit = useMemo(
    () => !!name.trim() && !!phone.trim() && !!pincode.trim() && !!state.trim() && !!city.trim() && !!address.trim(),
    [name, phone, pincode, state, city, address],
  );

  const clearAll = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPincode('');
    setState('');
    setCity('');
    setAddress('');
  };

  const handleApply = () => {
    if (!canSubmit) return;
    const id = customer?.id ?? `cu-${Date.now()}`;
    onSave({
      id,
      name: name.trim(),
      phone: `+91 ${phone.trim()}`,
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isVerified,
    });
  };

  return (
    <div className="sup-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sup-panel w-create">
        <div className="sup-panel-hdr">
          <div className="sup-panel-hdr-t">
            <div>
              <div className="sup-panel-title">
                {mode === 'create' ? 'New Customer Details' : 'Edit Customer Details'}
              </div>
              <div className="sup-panel-sub">
                Delivery address and contact info
              </div>
            </div>
            <div className="sup-panel-x" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="sup-panel-body">
          <div className="ord-nf-sec-lbl">Contact Details</div>
          <div className="sup-row">
            <div className="sup-mf">
              <div className="sup-ml">Customer Name <Req /></div>
              <input
                className="sup-mi"
                type="text"
                placeholder="Enter customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="sup-mf">
              <div className="sup-ml">Contact No. <Req /></div>
              <PhoneInput value={phone} onChange={setPhone} />
              {isVerified && (
                <div className="field-hint ok"><span>✓</span><span>Verified</span></div>
              )}
            </div>
          </div>
          <div className="sup-mf">
            <div className="sup-ml">Email Id</div>
            <input
              className="sup-mi"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="ord-nf-divider" />

          <div className="ord-nf-sec-lbl">Address Details</div>

          <div className="sup-row">
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
          </div>
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

const Req: React.FC = () => <span style={{ color: 'var(--red)' }}>*</span>;

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

function stripPrefix(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/^\+\d{1,3}\s*/, '');
}

export default CustomerDrawer;
