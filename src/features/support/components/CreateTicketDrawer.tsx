import React, { useState } from 'react';
import type {
  AwbRecord,
  AwbValidationOutcome,
  IssueCategory,
  RequestType,
  Ticket,
} from '../types';
import {
  CATEGORIES,
  PINCODE_MAP,
  RTO_SUBTYPES,
  REQUEST_TYPES,
} from '../data/supportData';
import CddSelect from './CddSelect';
import AwbValidator from './AwbValidator';
import {
  DuplicateBlock,
  EligibleBlock,
  IneligibleBlock,
  NotFoundBlock,
} from './AwbResultBlocks';
import { supportApi } from '../../../services/supportApi';

interface CreateTicketDrawerProps {
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
  /** Triggered when "View Ticket" is pressed inside a duplicate block. */
  onOpenExisting: (existingId: string, awb: string) => void;
  /** Surface a transient toast (parent owns the toast state). */
  showToast: (message: string) => void;
}

type ComplaintType = 'Behavioural' | 'Non-Behavioural';

/* ─── Local helpers (Update Contact / Address Change) ─────────── */

interface PrevInfoAccordionProps {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * "View Previous Info" collapsible header used by the Update Contact and
 * Address Change forms. Mirrors the original prototype's accordion that
 * shows the seller's currently registered values above the edit form.
 */
const PrevInfoAccordion: React.FC<PrevInfoAccordionProps> = ({ open, onToggle, children }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', marginBottom: 20 }}>
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--s2)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>View Previous Info</span>
      <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{open ? '▴' : '▾'}</span>
    </div>
    {open && (
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        {children}
      </div>
    )}
  </div>
);

/** Compact read-only field tile used inside the Previous Info accordion. */
const CompactReadField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 7 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
  </div>
);

/**
 * The progressive Create Ticket form.
 * Flow:
 *   1. Pick category (left dropdown).
 *   2. If Shipment Related → also pick issue category (Request / Complaint /
 *      Enquiry) and a third "Issue Type" dropdown unfolds inline.
 *   3. Issue-type specific forms render below (RTO subtype + AWB validate,
 *      Callback remarks, Update contact details, Address change w/ pincode
 *      autofill, Complaint, Enquiry).
 *   4. AWB-driven flows surface eligible/duplicate/ineligible result blocks.
 */
export const CreateTicketDrawer: React.FC<CreateTicketDrawerProps> = ({
  onClose,
  onCreated,
  onOpenExisting,
  showToast,
}) => {
  const [category, setCategory] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] = useState<IssueCategory | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [complaintType, setComplaintType] = useState<ComplaintType | null>(null);
  const [rtoSubtype, setRtoSubtype] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [callbackRemark, setCallbackRemark] = useState('');
  const [awbOutcome, setAwbOutcome] = useState<AwbValidationOutcome>({ kind: 'idle' });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* Update Contact / Address Change shared state */
  const [prevInfoOpen, setPrevInfoOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'ok' | 'manual'>('idle');

  const reset = () => {
    setCategory(null);
    setIssueCategory(null);
    setRequestType(null);
    setComplaintType(null);
    setRtoSubtype(null);
    setRemark('');
    setCallbackRemark('');
    setAwbOutcome({ kind: 'idle' });
    setFile(null);
    setPrevInfoOpen(false);
    setPincode('');
    setCity('');
    setStateField('');
    setPincodeStatus('idle');
  };

  const handlePincodeChange = (val: string) => {
    setPincode(val);
    if (val.length === 6) {
      const data = PINCODE_MAP[val];
      if (data) {
        setCity(data[0]);
        setStateField(data[1]);
        setPincodeStatus('ok');
      } else {
        setCity('');
        setStateField('');
        setPincodeStatus('manual');
      }
    } else {
      setCity('');
      setStateField('');
      setPincodeStatus('idle');
    }
  };

  const onPickCategory = (cat: string) => {
    setCategory(cat);
    setIssueCategory(null);
    setRequestType(null);
    setComplaintType(null);
    setRtoSubtype(null);
    setRemark('');
    setCallbackRemark('');
    setAwbOutcome({ kind: 'idle' });
  };

  /** Categories where the second-column "Sub-category" dropdown is active. */
  const showIssueCategory = category === 'Shipment Related Issues';

  const isTechCategory = category === 'Tech Related Issues';
  const isPickupCategory = category === 'Pickup Related Issues';

  /** Determines whether the primary CTA is enabled. */
  const isAwbValid = awbOutcome.kind === 'eligible';
  const eligibleRecord: AwbRecord | null = awbOutcome.kind === 'eligible' ? awbOutcome.record : null;

  const canSubmit = (() => {
    if (!category) return false;
    if (category === 'Shipment Related Issues') {
      if (!issueCategory) return false;
      if (issueCategory === 'Request') {
        if (!requestType) return false;
        if (requestType === 'RTO Cancellation Request') {
          return !!rtoSubtype && isAwbValid;
        }
        if (requestType === 'Callback Request') {
          return callbackRemark.trim().length > 0;
        }
        // Update Contact / Address Change — simplified: enable as soon as type chosen
        return true;
      }
      if (issueCategory === 'Complaint') {
        return !!complaintType && remark.trim().length > 0;
      }
      // Enquiry → AWB + remark required
      return isAwbValid && remark.trim().length > 0;
    }
    if (isTechCategory) return remark.trim().length > 0;
    if (isPickupCategory) return remark.trim().length > 0;
    // Other categories — AWB + remark
    return isAwbValid && remark.trim().length > 0;
  })();

  const handleCreate = async () => {
    if (!canSubmit) return;
    const record = eligibleRecord;
    
    showToast('Creating ticket...');
    const payload = {
      type: category === 'Tech Related Issues' ? 'tech' : category === 'Billing Related Issues' ? 'billing' : 'shipment',
      category,
      issue_type: issueCategory || category,
      issue: requestType || complaintType || rtoSubtype || category,
      subject: requestType || complaintType || rtoSubtype || category,
      sub_category: issueCategory,
      request_type: requestType,
      complaint_type: complaintType,
      rto_subtype: rtoSubtype,
      remarks: remark,
      awb_no: record?.awb || '',
      file: file,
    };
    
    const res = await supportApi.createTicket(payload);
    
    const newId = res?.ticket_id || `TK-${4892300 + Math.floor(Math.random() * 99)}`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const now = new Date();
    let hh = now.getHours();
    const mm = now.getMinutes();
    const ampm = hh < 12 ? 'AM' : 'PM';
    hh = hh % 12 || 12;
    const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
    const ticket: Ticket = {
      id: newId,
      date: dateStr,
      time: timeStr,
      awb: record?.awb ?? 'N/A',
      sub: requestType ?? complaintType ?? issueCategory ?? category ?? 'Others',
      cat: category ?? 'Others',
      status: 'open',
      due: `19 May 2026, ${timeStr}`,
      updated: `${dateStr}, ${timeStr}`,
      sla: 'ok',
      isNew: true,
    };
    onCreated(ticket);
    showToast(`✓ Ticket ${newId} created successfully!`);
    reset();
  };

  /* ─── Renderers ─────────────────────────────────────────────── */

  const categoryOptions = Object.keys(CATEGORIES).map((k) => ({
    value: k,
    label: k,
    desc: CATEGORIES[k].desc,
  }));

  const issueCategoryOptions = [
    { value: 'Request',   label: 'Request',   desc: 'RTO, callback, contact update requests' },
    { value: 'Complaint', label: 'Complaint', desc: 'Behavioural or non-behavioural complaints' },
    { value: 'Enquiry',   label: 'Enquiry',   desc: 'General enquiry about a shipment' },
  ];

  const renderRequestTypeField = () => (
    <div className="sup-mf">
      <div className="sup-ml">Issue Type <span style={{ color: 'var(--red)' }}>*</span></div>
      <CddSelect
        value={requestType}
        placeholder="Select issue type"
        options={REQUEST_TYPES.map((r) => ({ value: r, label: r }))}
        onChange={(v) => {
          setRequestType(v as RequestType);
          setRtoSubtype(null);
          setAwbOutcome({ kind: 'idle' });
        }}
      />
    </div>
  );

  const renderRtoForm = () => (
    <>
      <div className="sup-mf">
        <div className="sup-ml">Issue Sub-type <span style={{ color: 'var(--red)' }}>*</span></div>
        <CddSelect
          value={rtoSubtype}
          placeholder="Select RTO reason"
          options={RTO_SUBTYPES.map((s) => ({ value: s, label: s }))}
          searchable
          onChange={setRtoSubtype}
        />
      </div>

      {rtoSubtype && (
        <>
          <div className="sup-mf">
            <div className="sup-ml">AWB Number <span style={{ color: 'var(--red)' }}>*</span></div>
            <AwbValidator onChange={setAwbOutcome} buttonLabel="Validate AWB" />
          </div>
          {renderAwbResult()}
        </>
      )}
    </>
  );

  const renderCallbackForm = () => (
    <>
      <div className="sup-mf">
        <div className="sup-ml">Remark <span style={{ color: 'var(--red)' }}>*</span></div>
        <textarea
          className="sup-mi-ta"
          placeholder="Describe the reason for callback..."
          style={{ minHeight: 100 }}
          value={callbackRemark}
          onChange={(e) => setCallbackRemark(e.target.value)}
          maxLength={500}
        />
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>
          Our team will call you back within 1 business day.
        </div>
      </div>
      <div className="sup-mf">
        <div className="sup-ml">Attach File / Image <span className="sup-ml-hint">(optional)</span></div>
        <div className="uz" onClick={() => showToast('📎 File picker opened')}>
          <div className="uz-t">Click to attach or drag &amp; drop</div>
          <div className="uz-s">Upload limit: 5 MB · JPG, PNG, PDF</div>
        </div>
      </div>
    </>
  );

  const renderEnquiryForm = () => (
    <>
      <div className="sup-mf">
        <div className="sup-ml">AWB No. <span style={{ color: 'var(--red)' }}>*</span></div>
        <AwbValidator onChange={setAwbOutcome} buttonLabel="Validate" />
      </div>
      {renderAwbResult()}
      {renderRemark()}
      {renderUpload()}
    </>
  );

  const renderComplaintForm = () => (
    <>
      <div className="sup-mf">
        <div className="sup-ml">Issue Type <span style={{ color: 'var(--red)' }}>*</span></div>
        <CddSelect
          value={complaintType}
          placeholder="Select issue type"
          options={[
            { value: 'Behavioural',     label: 'Behavioural' },
            { value: 'Non-Behavioural', label: 'Non-Behavioural' },
          ]}
          onChange={(v) => setComplaintType(v as ComplaintType)}
        />
      </div>
      {complaintType && (
        <>
          {renderRemark('Describe the complaint in detail...')}
          {renderUpload()}
        </>
      )}
    </>
  );

  const renderUpdateContactForm = () => (
    <div style={{ marginTop: 16 }}>
      <PrevInfoAccordion
        open={prevInfoOpen}
        onToggle={() => setPrevInfoOpen((p) => !p)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <CompactReadField label="Name"        value="Rahul Sharma" />
          <CompactReadField label="Email ID"    value="seller@example.com" />
          <CompactReadField label="Contact No." value="+91 98765 43210" />
        </div>
      </PrevInfoAccordion>

      <div className="sup-section-lbl">Update Details</div>

      <div className="sup-mf">
        <div className="sup-ml">Name <span style={{ color: 'var(--red)' }}>*</span></div>
        <input className="sup-mi" type="text" placeholder="Enter name" />
      </div>
      <div className="sup-mf">
        <div className="sup-ml">Email ID <span className="sup-ml-hint">(optional)</span></div>
        <input className="sup-mi" type="email" placeholder="Enter email address" />
      </div>
      <div className="sup-mf">
        <div className="sup-ml">Contact No. <span style={{ color: 'var(--red)' }}>*</span></div>
        <input className="sup-mi" type="tel" placeholder="Enter contact number" />
      </div>

      {/* Common fields — AWB validate + Remark + Attach */}
      <div className="sup-mf">
        <div className="sup-ml">AWB No. <span style={{ color: 'var(--red)' }}>*</span></div>
        <AwbValidator onChange={setAwbOutcome} />
      </div>
      {renderAwbResult()}
      {renderRemark()}
      {renderUpload()}
    </div>
  );

  const renderAddressChangeForm = () => (
    <div style={{ marginTop: 16 }}>
      <PrevInfoAccordion
        open={prevInfoOpen}
        onToggle={() => setPrevInfoOpen((p) => !p)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <CompactReadField label="Name"        value="Rahul Sharma" />
          <CompactReadField label="Email ID"    value="seller@example.com" />
          <CompactReadField label="Contact No." value="+91 98765 43210" />
        </div>
        <div className="sup-section-lbl" style={{ marginBottom: 6 }}>Previous Address</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--s2)', borderRadius: 7 }}>
          42, MG Road, Bengaluru, Karnataka – 560001
        </div>
      </PrevInfoAccordion>

      <div className="sup-section-lbl">Update Details</div>

      <div className="sup-mf">
        <div className="sup-ml">Email ID <span className="sup-ml-hint">(optional)</span></div>
        <input className="sup-mi" type="email" placeholder="Enter email address" />
      </div>
      <div className="sup-mf">
        <div className="sup-ml">Contact No. <span className="sup-ml-hint">(optional)</span></div>
        <input className="sup-mi" type="tel" placeholder="Enter contact number" />
      </div>

      <div className="sup-section-lbl">New Address <span style={{ color: 'var(--red)' }}>*</span></div>

      <div className="sup-mf">
        <div className="sup-ml">Pincode <span style={{ color: 'var(--red)' }}>*</span></div>
        <input
          className="sup-mi"
          type="text"
          placeholder="Enter 6-digit pincode"
          maxLength={6}
          value={pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
        />
        {pincodeStatus === 'ok' && (
          <div className="field-hint ok"><span>✓</span><span>{city}, {stateField}</span></div>
        )}
        {pincodeStatus === 'manual' && (
          <div className="field-hint err">
            <span>✗</span>
            <span>Pincode not found — please enter city and state manually</span>
          </div>
        )}
      </div>

      <div className="sup-row" style={{ marginBottom: 14 }}>
        <div className="sup-mf" style={{ marginBottom: 0 }}>
          <div className="sup-ml">City</div>
          <input
            className="sup-mi"
            type="text"
            placeholder={pincodeStatus === 'manual' ? 'Enter city' : 'Auto-filled from pincode'}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            readOnly={pincodeStatus !== 'manual'}
            style={pincodeStatus !== 'manual' ? { background: 'var(--s3)', color: 'var(--ink2)' } : undefined}
          />
        </div>
        <div className="sup-mf" style={{ marginBottom: 0 }}>
          <div className="sup-ml">State</div>
          <input
            className="sup-mi"
            type="text"
            placeholder={pincodeStatus === 'manual' ? 'Enter state' : 'Auto-filled from pincode'}
            value={stateField}
            onChange={(e) => setStateField(e.target.value)}
            readOnly={pincodeStatus !== 'manual'}
            style={pincodeStatus !== 'manual' ? { background: 'var(--s3)', color: 'var(--ink2)' } : undefined}
          />
        </div>
      </div>

      <div className="sup-mf">
        <div className="sup-ml">Address Line 1 <span style={{ color: 'var(--red)' }}>*</span></div>
        <input className="sup-mi" type="text" placeholder="House/Flat no., Street name" />
      </div>
      <div className="sup-mf">
        <div className="sup-ml">Address Line 2 <span className="sup-ml-hint">(optional)</span></div>
        <input className="sup-mi" type="text" placeholder="Landmark, Area" />
      </div>

      {/* Common fields — AWB validate + Remark + Attach */}
      <div className="sup-mf">
        <div className="sup-ml">AWB No. <span style={{ color: 'var(--red)' }}>*</span></div>
        <AwbValidator onChange={setAwbOutcome} />
      </div>
      {renderAwbResult()}
      {renderRemark()}
      {renderUpload()}
    </div>
  );

  const renderRemark = (placeholder = 'Describe your issue in detail...') => (
    <div className="sup-mf">
      <div className="sup-ml">Remark <span style={{ color: 'var(--red)' }}>*</span></div>
      <textarea
        className="sup-mi-ta"
        placeholder={placeholder}
        style={{ minHeight: 90 }}
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        maxLength={500}
      />
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4, textAlign: 'right' }}>
        {500 - remark.length} characters remaining
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="sup-mf">
      <div className="sup-ml">Attach File / Image <span className="sup-ml-hint">(optional)</span></div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,.csv,.xlsx,.xls,.pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            showToast(`📎 Attached ${e.target.files[0].name}`);
          }
        }}
      />
      <div className="uz" onClick={() => fileInputRef.current?.click()} style={file ? { borderColor: 'var(--primary)', background: 'var(--s2)' } : undefined}>
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', width: '100%' }}>
            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
              {file.name}
            </span>
            <span
              style={{ fontSize: 18, color: 'var(--ink3)', cursor: 'pointer', padding: '0 5px' }}
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              ×
            </span>
          </div>
        ) : (
          <>
            <div className="uz-t">Click to attach or drag &amp; drop</div>
            <div className="uz-s">Upload limit: 5 MB · JPG, PNG, PDF, CSV, XLSX</div>
          </>
        )}
      </div>
    </div>
  );

  const renderAwbResult = () => {
    if (awbOutcome.kind === 'loading') {
      return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 12 }}>
            Validating AWB with XpressBees logistics system…
          </div>
          <div className="shimmer" style={{ height: 11, width: '55%', marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 11, width: '75%', marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 11, width: '40%' }} />
        </div>
      );
    }
    if (awbOutcome.kind === 'not_found') return <NotFoundBlock awb={awbOutcome.awb} />;
    if (awbOutcome.kind === 'eligible')   return <EligibleBlock record={awbOutcome.record} />;
    if (awbOutcome.kind === 'duplicate')  {
      const ex = awbOutcome.record.existingTicket;
      return (
        <DuplicateBlock
          record={awbOutcome.record}
          onViewExisting={() => ex && onOpenExisting(ex.id, awbOutcome.record.awb)}
        />
      );
    }
    if (awbOutcome.kind === 'ineligible') return <IneligibleBlock record={awbOutcome.record} />;
    return null;
  };

  const renderShipmentRequestForm = () => {
    if (!requestType) return null;
    if (requestType === 'RTO Cancellation Request') return renderRtoForm();
    if (requestType === 'Callback Request')         return renderCallbackForm();
    if (requestType === 'Update Contact Details')   return renderUpdateContactForm();
    if (requestType === 'Address Change')           return renderAddressChangeForm();
    return null;
  };

  const renderShipmentForm = () => {
    if (!issueCategory) return null;
    if (issueCategory === 'Request') {
      return (
        <>
          {renderRequestTypeField()}
          {renderShipmentRequestForm()}
        </>
      );
    }
    if (issueCategory === 'Complaint') return renderComplaintForm();
    return renderEnquiryForm();
  };

  const renderGenericForm = () => {
    // Simple AWB + remark + upload — used for Billing/Weight/General
    return (
      <>
        <div className="sup-mf">
          <div className="sup-ml">AWB No. <span style={{ color: 'var(--red)' }}>*</span></div>
          <AwbValidator onChange={setAwbOutcome} />
        </div>
        {renderAwbResult()}
        {renderRemark()}
        {renderUpload()}
      </>
    );
  };

  const renderTechForm = () => (
    <>
      {renderRemark('Describe the integration / API issue...')}
      {renderUpload()}
    </>
  );

  const renderPickupForm = () => (
    <>
      <div className="sup-mf">
        <div className="sup-ml">AWB No. <span style={{ color: 'var(--red)' }}>*</span></div>
        <AwbValidator onChange={setAwbOutcome} />
      </div>
      {renderAwbResult()}
      {renderRemark()}
      {renderUpload()}
    </>
  );

  const renderCategoryBody = () => {
    if (!category) return null;
    if (category === 'Shipment Related Issues') return renderShipmentForm();
    if (category === 'Pickup Related Issues')   return renderPickupForm();
    if (isTechCategory)                          return renderTechForm();
    return renderGenericForm();
  };

  return (
    <div className="sup-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sup-panel w-create">
        <div className="sup-panel-hdr">
          <div className="sup-panel-hdr-t">
            <div>
              <div className="sup-panel-title">Create Ticket</div>
              <div className="sup-panel-sub">Select category, subcategory, and enter details</div>
            </div>
            <div className="sup-panel-x" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="sup-panel-body">
          <div className="sup-row">
            <div className="sup-mf">
              <div className="sup-ml">Select Category</div>
              <CddSelect
                value={category}
                placeholder="Select category"
                options={categoryOptions}
                searchable
                onChange={onPickCategory}
              />
            </div>
            <div className="sup-mf" style={{ opacity: showIssueCategory ? 1 : 0.35, pointerEvents: showIssueCategory ? 'auto' : 'none' }}>
              <div className="sup-ml">Select Sub-category</div>
              <CddSelect
                value={issueCategory}
                placeholder="Select sub-category"
                options={issueCategoryOptions}
                disabled={!showIssueCategory}
                onChange={(v) => {
                  setIssueCategory(v as IssueCategory);
                  setRequestType(null);
                  setComplaintType(null);
                  setAwbOutcome({ kind: 'idle' });
                  setRemark('');
                }}
              />
            </div>
          </div>

          {renderCategoryBody()}
        </div>

        <div className="sup-panel-ft">
          <button type="button" className="btn btn-s" onClick={onClose}>Cancel</button>
          <button type="button" className="sup-btn-clear" onClick={reset}>Clear</button>
          <button
            type="button"
            className="btn btn-p"
            disabled={!canSubmit}
            style={!canSubmit ? { background: 'var(--border2)', borderColor: 'var(--border2)', cursor: 'not-allowed', opacity: 0.5 } : undefined}
            onClick={handleCreate}
          >
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketDrawer;
