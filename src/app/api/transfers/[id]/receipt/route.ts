import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { TRANSFER_STATUS_LABELS } from "@/lib/transfer-state";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await prisma.transfer.findUnique({
    where: { id: params.id },
    include: { sender: true, recipient: true },
  });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = session.user.role;
  const isAdmin = role === "reviewer" || role === "compliance" || role === "admin";
  if (!isAdmin && t.senderId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const details = t.recipient.accountDetails as Record<string, string>;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Zarpay receipt ${t.reference}</title>
<style>
  @page { size: A4; margin: 24mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; color: #0B1A2C; max-width: 760px; margin: 24px auto; padding: 0 24px; font-size: 14px; line-height: 1.55; }
  h1 { font-size: 28px; margin: 0; letter-spacing: -0.01em; }
  h2 { font-size: 16px; margin: 32px 0 12px; color: #243447; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  .brand-z { color: #FFB400; }
  .brand-rest { color: #0B2545; }
  .meta { color: #5B6B7F; font-size: 13px; margin-top: 4px; }
  .big { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #E6EAF0; vertical-align: top; }
  td.label { color: #5B6B7F; width: 40%; }
  td.value { font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }
  .total td { font-weight: 700; border-top: 2px solid #0B2545; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E6EAF0; color: #9BA8B8; font-size: 11px; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #E8EEF7; color: #0B2545; }
</style>
</head>
<body>
  <header>
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div style="font-weight:700; font-size: 22px;"><span class="brand-z">Z</span><span class="brand-rest">arpay</span></div>
        <div class="meta">UK to Pakistan transfer receipt</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family: ui-monospace, monospace; font-size: 13px;">${t.reference}</div>
        <div class="pill">${TRANSFER_STATUS_LABELS[t.status]}</div>
      </div>
    </div>
  </header>

  <h2>Amount</h2>
  <table>
    <tr>
      <td class="label">Sender pays</td>
      <td class="value big">${formatGbp(t.sendAmountGbp.toString())}</td>
    </tr>
    <tr>
      <td class="label">Recipient receives</td>
      <td class="value big">${formatPkr(t.receiveAmountPkr.toString())}</td>
    </tr>
    <tr>
      <td class="label">Exchange rate</td>
      <td class="value">1 GBP = ${t.exchangeRate.toString()} PKR</td>
    </tr>
    <tr>
      <td class="label">Spread</td>
      <td class="value">${(t.spreadBps / 100).toFixed(2)}%</td>
    </tr>
    <tr>
      <td class="label">Fee</td>
      <td class="value">${formatGbp(t.feeGbp.toString())}</td>
    </tr>
    <tr class="total">
      <td class="label">Total charged</td>
      <td class="value">${formatGbp(t.totalChargedGbp.toString())}</td>
    </tr>
  </table>

  <h2>Sender</h2>
  <table>
    <tr><td class="label">Name</td><td class="value">${escapeHtml(t.sender.fullName)}</td></tr>
    <tr><td class="label">Email</td><td class="value">${escapeHtml(t.sender.email)}</td></tr>
  </table>

  <h2>Recipient</h2>
  <table>
    <tr><td class="label">Name</td><td class="value">${escapeHtml(t.recipient.fullName)}</td></tr>
    <tr><td class="label">Method</td><td class="value">${t.recipient.payoutMethod.replace(/_/g, " ")}</td></tr>
    ${
      t.recipient.payoutMethod === "bank"
        ? `<tr><td class="label">Bank</td><td class="value">${escapeHtml(details.bank_code ?? "")}</td></tr>
           <tr><td class="label">Account</td><td class="value">${escapeHtml(details.account_number ?? "")}</td></tr>
           <tr><td class="label">Account title</td><td class="value">${escapeHtml(details.account_title ?? "")}</td></tr>`
        : ""
    }
    ${
      t.recipient.payoutMethod === "mobile_wallet"
        ? `<tr><td class="label">Wallet</td><td class="value">${escapeHtml(details.provider ?? "")}</td></tr>
           <tr><td class="label">Number</td><td class="value">${escapeHtml(details.account_number ?? "")}</td></tr>`
        : ""
    }
    ${
      t.recipient.payoutMethod === "cash_pickup"
        ? `<tr><td class="label">Network</td><td class="value">${escapeHtml(details.network ?? "")}</td></tr>`
        : ""
    }
  </table>

  <h2>Timestamps</h2>
  <table>
    <tr><td class="label">Created</td><td class="value">${formatDateTime(t.createdAt)}</td></tr>
    <tr><td class="label">Funded</td><td class="value">${formatDateTime(t.fundedAt)}</td></tr>
    <tr><td class="label">In transit</td><td class="value">${formatDateTime(t.inTransitAt)}</td></tr>
    <tr><td class="label">Delivered</td><td class="value">${formatDateTime(t.deliveredAt)}</td></tr>
    <tr><td class="label">Payment intent</td><td class="value" style="font-family: ui-monospace, monospace; font-size: 11px;">${escapeHtml(t.paymentIntentId ?? "·")}</td></tr>
    <tr><td class="label">Payout reference</td><td class="value" style="font-family: ui-monospace, monospace; font-size: 11px;">${escapeHtml(t.payoutReference ?? "·")}</td></tr>
  </table>

  <p class="footer">
    Zarpay is a portfolio product. Live operation requires UK FCA authorization (or partnership with a licensed Authorised Payment Institution) and SBP-licensed delivery partners in Pakistan. This document is a printable receipt; use your browser to print or save as PDF.
  </p>
  <script>setTimeout(() => window.print(), 200);</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
