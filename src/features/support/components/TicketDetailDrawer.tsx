import React, { useState } from 'react';
import type { Ticket } from '../types';
import { STATUS_LABEL } from '../data/supportData';
import { supportApi } from '../../../services/supportApi';

interface TicketDetailDrawerProps {
  ticket: Ticket;
  /** When true, hides the input/submit footer (used for closed/resolved tickets). */
  viewOnly: boolean;
  onClose: () => void;
  onMarkResolved: (id: string) => void;
  onSendMessage: (msg?: any) => void;
  onSubmitUpdate: () => void;
}

/**
 * Right-side conversation panel. Reuses the same drawer overlay shell as
 * the Reports drawer but with support-specific content (chips, bubbles,
 * mark-as-resolved CTA).
 */
export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  viewOnly,
  onClose,
  onMarkResolved,
  onSendMessage,
  onSubmitUpdate,
}) => {
  const meta = STATUS_LABEL[ticket.status];
  const isOpenLike = ticket.status !== 'resolved' && ticket.status !== 'closed';

  const [messageText, setMessageText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState(
    ticket.messages && ticket.messages.length > 0 ? ticket.messages : [
      {
        id: '1',
        sender: 'seller',
        text: `Delayed delivery Object ID: ${ticket.awb}`,
        time: `${ticket.date}, ${ticket.time}`,
      },
      {
        id: '2',
        sender: 'support',
        text: `Dear Customer,\nYour response has been registered with the reference number: ${ticket.id}.\nWe will get back to you within 24hrs.\n\nTeam XpressBees`,
        time: `${ticket.date}, ${ticket.time}`,
      }
    ]
  );

  React.useEffect(() => {
    if (ticket.messages && ticket.messages.length > 0) {
      setMessages(ticket.messages as any);
    }
  }, [ticket.messages]);

  const handleSend = async () => {
    if (!messageText.trim() && !file) return;
    
    const msgToSend = messageText.trim();
    
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + 
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (msgToSend || file) {
      const newMsg = {
        id: Date.now().toString(),
        sender: 'seller',
        text: msgToSend + (file ? ` [Attached: ${file.name}]` : ''),
        time: timeStr
      };
      setMessages(prev => [...prev, newMsg]);
      
      const currentFile = file;
      setMessageText('');
      setFile(null);
      
      const internalId = ticket.internal_id ? ticket.internal_id : ticket.id;

      // Send the message/remark via the add_remarks endpoint immediately
      await supportApi.addTicketRemark(internalId, {
        remark: msgToSend || (currentFile ? 'File attached' : 'Updated via portal'), 
        remarks: msgToSend || (currentFile ? 'File attached' : 'Updated via portal'),
        file: currentFile || undefined,
        type: ticket.cat === 'Tech Related Issues' ? 'tech' : ticket.cat === 'Billing Related Issues' ? 'billing' : 'shipment',
        ref_id: ticket.awb !== 'N/A' ? ticket.awb : '',
        subject: ticket.sub,
        ticketid: ticket.id,
        escalation_status: ticket.status
      });

      onSendMessage(newMsg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFinalSubmit = async () => {
    if (messageText.trim() || file) {
      await handleSend();
    }
    
    onSubmitUpdate();
  };

  return (
    <div className="sup-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sup-panel w-detail">
        <div className="sup-panel-hdr">
          <div className="sup-panel-hdr-t">
            <div>
              <div className="sup-panel-title">Ticket Details</div>
              <div className="sup-panel-sub">Ticket ID</div>
            </div>
            <div className="sup-panel-x" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="sup-panel-body">
          <div className="conv-hdr">
            <div>
              <div className="conv-tk-id">{ticket.id}</div>
              <div className="conv-tk-sub">Ticket ID</div>
              <div className="conv-meta-chips">
                <span className="conv-meta-chip">
                  <span className={`st-badge ${meta.cls}`}>{meta.label}</span>
                </span>
                <span className="conv-meta-chip">📅 Last Update: {ticket.updated}</span>
                <span className="conv-meta-chip">👤 Seller Account</span>
              </div>
            </div>
            {!viewOnly && isOpenLike && (
              <button type="button" className="mark-resolved-btn" onClick={() => onMarkResolved(ticket.id)}>
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5.5 8l2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mark as Resolved
              </button>
            )}
          </div>

          <div className="conv-box">
            <div className="conv-box-hdr">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2h12v10H2z" strokeLinejoin="round" />
                <path d="M5 6h6M5 8h4" strokeLinecap="round" />
              </svg>
              Support Conversations
            </div>

            <div className="conv-msg-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`conv-msg ${msg.sender === 'seller' ? 'seller' : ''}`}>
                  <div className={`conv-avatar ${msg.sender}`}>{msg.sender === 'seller' ? 'You' : 'XB'}</div>
                  <div>
                    <div className={`conv-bubble ${msg.sender}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                    <div className="conv-ts" style={msg.sender === 'seller' ? { textAlign: 'right' } : {}}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="conv-reply-hint">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3l2 1" strokeLinecap="round" />
              </svg>
              You can expect a response within 1 business day
            </div>

            {!viewOnly && (
              <div className="conv-input-area" style={{ flexWrap: 'wrap' }}>
                {file && (
                  <div style={{ width: '100%', marginBottom: '8px', padding: '4px 8px', background: 'var(--s2)', borderRadius: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
                      {file.name}
                    </span>
                    <span style={{ cursor: 'pointer', color: 'var(--ink3)' }} onClick={() => setFile(null)}>×</span>
                  </div>
                )}
                <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                  <input 
                    className="conv-input" 
                    type="text" 
                    placeholder="Enter your message" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button type="button" className="conv-send" onClick={handleSend}>
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="#fff" strokeWidth="1.8">
                      <path d="M14 2L2 7l5 2m7-7L9 14l-2-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.csv,.xlsx,.xls,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  <button type="button" className="conv-attach" onClick={() => fileInputRef.current?.click()} style={file ? { borderColor: 'var(--primary)' } : undefined}>
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="2" width="10" height="12" rx="2" />
                      <path d="M5 5h6M5 7h6M5 9h4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sup-panel-ft">
          <button type="button" className="btn btn-s" onClick={onClose}>Close</button>
          {!viewOnly && (
            <button type="button" className="btn btn-p" onClick={handleFinalSubmit}>
              Submit Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailDrawer;
