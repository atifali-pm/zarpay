/**
 * @zarpay/types
 *
 * Shared types and API DTOs consumed by both the Next.js app (src/) and the
 * Expo mobile app (mobile/). Decimal values always cross the wire as strings
 * to preserve precision. Never floats.
 */

// ---------------------------------------------------------------------------
// Enums (mirror Prisma)
// ---------------------------------------------------------------------------

export type UserRole = "sender" | "reviewer" | "compliance" | "admin";

export type KycStatus = "unverified" | "pending" | "approved" | "rejected";

export type KycDocType = "id_front" | "id_back" | "selfie" | "proof_of_address";

export type KycDocStatus = "pending" | "approved" | "rejected";

export type PayoutMethod = "bank" | "mobile_wallet" | "cash_pickup";

export type TransferStatus =
  | "quote_locked"
  | "pending_payment"
  | "funded"
  | "compliance_hold"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "rejected";

export type TransferEventType =
  | "quote_created"
  | "payment_initiated"
  | "payment_funded"
  | "payment_cancelled"
  | "compliance_flagged"
  | "compliance_cleared"
  | "released_to_payout"
  | "payout_delivered"
  | "payout_failed"
  | "manual_state_change";

export type ActorType = "system" | "sender" | "admin" | "partner";

export type ComplianceRule =
  | "amount_threshold"
  | "velocity"
  | "sanctions_hit"
  | "unusual_pattern"
  | "manual";

export type ComplianceSeverity = "low" | "medium" | "high";

export type ComplianceStatus = "open" | "cleared" | "escalated" | "reported";

// ---------------------------------------------------------------------------
// Public user (what the API exposes to the client)
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  kycTier: number;
  country: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  token: string;
  user: PublicUser;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface SignUpResponse {
  token: string;
  user: PublicUser;
}

export interface OtpSendRequest {
  phone?: string;
}

export interface OtpSendResponse {
  challengeId: string;
}

export interface OtpVerifyRequest {
  challengeId: string;
  code: string;
}

export interface OtpVerifyResponse {
  ok: boolean;
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

export interface CurrentRateResponse {
  base: string;
  quote: string;
  midRate: string;
  spreadBps: number;
  effectiveRate: string;
  feeGbp: string;
  source: string;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

export interface RecipientBankDetails {
  bank_code: string;
  account_number: string;
  account_title: string;
  iban?: string;
  branch?: string;
}

export interface RecipientWalletDetails {
  provider: "easypaisa" | "jazzcash" | "nayapay";
  account_number: string;
}

export interface RecipientCashDetails {
  network: "western_union" | "moneygram";
  full_name: string;
}

export type RecipientAccountDetails =
  | RecipientBankDetails
  | RecipientWalletDetails
  | RecipientCashDetails;

export interface Recipient {
  id: string;
  fullName: string;
  nickname: string | null;
  relationship: string | null;
  phone: string | null;
  country: string;
  payoutMethod: PayoutMethod;
  accountDetails: RecipientAccountDetails;
  isVerified: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Quotes and transfers
// ---------------------------------------------------------------------------

export interface QuoteRequest {
  sendAmountGbp: string;
  recipientId: string;
}

export interface QuoteBreakdown {
  sendAmountGbp: string;
  midRate: string;
  effectiveRate: string;
  spreadBps: number;
  feeGbp: string;
  receiveAmountPkr: string;
  totalChargedGbp: string;
}

export interface QuoteResponse extends QuoteBreakdown {
  // A quote alone does not create a transfer; the client confirms with
  // POST /api/transfers referencing the same inputs.
}

export interface CreateTransferRequest {
  sendAmountGbp: string;
  recipientId: string;
}

export interface TransferSummary {
  id: string;
  reference: string;
  status: TransferStatus;
  sendAmountGbp: string;
  receiveAmountPkr: string;
  feeGbp: string;
  totalChargedGbp: string;
  recipientName: string;
  recipientPayoutMethod: PayoutMethod;
  createdAt: string;
}

export interface TransferEvent {
  id: string;
  eventType: TransferEventType;
  fromStatus: string | null;
  toStatus: string;
  actorType: ActorType;
  createdAt: string;
}

export interface TransferDetail {
  id: string;
  reference: string;
  status: TransferStatus;
  sendAmountGbp: string;
  receiveAmountPkr: string;
  exchangeRate: string;
  spreadBps: number;
  feeGbp: string;
  totalChargedGbp: string;
  paymentIntentId: string | null;
  payoutReference: string | null;
  quoteLockedUntil: string;
  initiatedAt: string | null;
  fundedAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  recipient: {
    id: string;
    fullName: string;
    payoutMethod: PayoutMethod;
    accountDetails: RecipientAccountDetails;
  };
  events: TransferEvent[];
}

// ---------------------------------------------------------------------------
// API errors
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}
