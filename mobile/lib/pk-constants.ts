export const PK_BANKS = [
  { code: "HBL", name: "Habib Bank Limited" },
  { code: "MCB", name: "MCB Bank" },
  { code: "UBL", name: "United Bank Limited" },
  { code: "ABL", name: "Allied Bank Limited" },
  { code: "NBP", name: "National Bank of Pakistan" },
  { code: "BAFL", name: "Bank Alfalah" },
  { code: "MEEZAN", name: "Meezan Bank" },
  { code: "FBL", name: "Faysal Bank" },
  { code: "BAHL", name: "Bank Al Habib" },
  { code: "ASKARI", name: "Askari Bank" },
  { code: "JS", name: "JS Bank" },
  { code: "SCB", name: "Standard Chartered Pakistan" },
  { code: "SONERI", name: "Soneri Bank" },
  { code: "BOP", name: "Bank of Punjab" },
  { code: "DUBAI", name: "Dubai Islamic Bank Pakistan" },
  { code: "BIPL", name: "BankIslami Pakistan" },
] as const;

export const MOBILE_WALLETS = [
  { code: "easypaisa" as const, name: "Easypaisa" },
  { code: "jazzcash" as const, name: "JazzCash" },
  { code: "nayapay" as const, name: "NayaPay" },
] as const;

export const CASH_NETWORKS = [
  { code: "western_union" as const, name: "Western Union" },
  { code: "moneygram" as const, name: "MoneyGram" },
] as const;
