import Decimal from "decimal.js";

export interface PaymentInProvider {
  name: string;
  /** Create a payment intent for the transfer total. Dev provider returns a pseudo-id. */
  createIntent(args: {
    amountGbp: Decimal;
    transferReference: string;
    description?: string;
  }): Promise<{ intentId: string; checkoutUrl: string }>;
  /** Confirm or simulate confirmation. Dev provider auto-confirms. */
  confirmIntent(intentId: string): Promise<{ status: "succeeded" | "failed" | "pending" }>;
}

class DevPaymentInProvider implements PaymentInProvider {
  name = "dev";
  async createIntent(args: { amountGbp: Decimal; transferReference: string }) {
    const intentId = `pi_dev_${args.transferReference}_${Date.now()}`;
    const checkoutUrl = `/dev/payment/${encodeURIComponent(intentId)}?ref=${encodeURIComponent(args.transferReference)}`;
    return { intentId, checkoutUrl };
  }
  async confirmIntent(_intentId: string) {
    return { status: "succeeded" as const };
  }
}

export function getPaymentInProvider(): PaymentInProvider {
  return new DevPaymentInProvider();
}
