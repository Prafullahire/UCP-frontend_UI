/**
 * Support module types.
 *
 * Shapes for tickets, AWB validation results, categories, and the various
 * panel/drawer payloads. Mirrors the data model used by the original
 * `ui-source/screens/support_prototype_v7b.html` prototype.
 */

export type TicketStatus = 'open' | 'wip' | 'awaiting' | 'resolved' | 'closed';

export type SlaStatus = 'ok' | 'breach';

export interface Ticket {
  id: string;
  date: string;
  time: string;
  awb: string;
  sub: string;
  cat: string;
  status: TicketStatus;
  due: string;
  updated: string;
  sla: SlaStatus;
  internal_id?: string | number;
  /** Hours remaining in the 48hr re-open window once status === 'resolved'. */
  reopenHrsLeft?: number;
  /** Highlights the row briefly after creation/reopen. */
  isNew?: boolean;
  messages?: Array<{
    id: string;
    sender: 'seller' | 'support';
    text: string;
    time: string;
  }>;
}

export type TabId = 'open' | 'resolved' | 'closed';

export interface CategorySpec {
  desc: string;
}

export interface MovementStep {
  loc: string;
  time: string;
  status: string;
  cur: boolean;
}

export interface ExistingTicket {
  id: string;
  date: string;
  status: TicketStatus;
  cat: string;
  sub: string;
  due: string;
  updated: string;
  desc: string;
}

export interface AwbRecord {
  awb: string;
  courier: string;
  origin: string;
  destination: string;
  weight: string;
  status: string;
  lastScan: string;
  lastLoc: string;
  edd: string;
  eligible?: boolean;
  duplicate?: boolean;
  ineligible?: boolean;
  slaPercent?: number;
  movements?: MovementStep[];
  existingTicket?: ExistingTicket;
  orderDate?: string;
  hoursElapsed?: number;
  slaWindowHours?: number;
  slaDue?: string;
}

export type AwbValidationOutcome =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'not_found'; awb: string }
  | { kind: 'eligible'; record: AwbRecord }
  | { kind: 'duplicate'; record: AwbRecord }
  | { kind: 'ineligible'; record: AwbRecord };

export type IssueCategory = 'Request' | 'Complaint' | 'Enquiry';

export type RequestType =
  | 'RTO Cancellation Request'
  | 'Callback Request'
  | 'Update Contact Details'
  | 'Address Change';

export interface BulkAwbRow {
  order: string;
  awb: string;
  origin: string;
  dest: string;
  lastUpdate: string;
  lastScan: string;
  status: 'created' | 'not_eligible' | 'exists';
  tkId?: string;
  reason?: string;
  existingId?: string;
}
