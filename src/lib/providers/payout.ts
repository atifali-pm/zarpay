import Decimal from "decimal.js";

export interface PayoutProvider {
  name: string;
  instruct(args: {
    amountPkr: Decimal;
    transferReference: string;
    method: "bank" | "mobile_wallet" | "cash_pickup";
    accountDetails: Record<string, unknown>;
  }): Promise<{ payoutReference: string }>;
}

class DevPayoutProvider implements PayoutProvider {
  name = "dev";
  async instruct(args: { transferReference: string }) {
    return { payoutReference: `po_dev_${args.transferReference}_${Date.now()}` };
  }
}

export function getPayoutProvider(): PayoutProvider {
  return new DevPayoutProvider();
}
