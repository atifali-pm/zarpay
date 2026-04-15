import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import type {
  CreateRecipientRequest,
  PayoutMethod,
  Recipient,
  RecipientBankDetails,
  RecipientCashDetails,
  RecipientWalletDetails,
} from "@zarpay/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Picker } from "@/components/ui/Picker";
import { Segmented } from "@/components/ui/Segmented";
import { MOBILE_WALLETS, PK_BANKS, CASH_NETWORKS } from "@/lib/pk-constants";

/**
 * Reusable form for creating or editing a recipient. Handles all three
 * payout methods via a segmented control at the top. The initial prop
 * seeds an edit flow with existing values.
 */
interface RecipientFormProps {
  initial?: Recipient;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (payload: CreateRecipientRequest) => void;
}

export function RecipientForm({
  initial,
  submitLabel,
  submitting,
  error,
  fieldErrors,
  onSubmit,
}: RecipientFormProps) {
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>(
    initial?.payoutMethod ?? "bank",
  );
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  // Bank fields
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");

  // Wallet fields
  const [walletProvider, setWalletProvider] = useState<
    "easypaisa" | "jazzcash" | "nayapay" | null
  >(null);
  const [walletNumber, setWalletNumber] = useState("");

  // Cash fields
  const [cashNetwork, setCashNetwork] = useState<"western_union" | "moneygram" | null>(null);

  useEffect(() => {
    if (!initial) return;
    if (initial.payoutMethod === "bank") {
      const details = initial.accountDetails as RecipientBankDetails;
      setBankCode(details.bank_code);
      setAccountNumber(details.account_number);
      setAccountTitle(details.account_title);
    } else if (initial.payoutMethod === "mobile_wallet") {
      const details = initial.accountDetails as RecipientWalletDetails;
      setWalletProvider(details.provider);
      setWalletNumber(details.account_number);
    } else if (initial.payoutMethod === "cash_pickup") {
      const details = initial.accountDetails as RecipientCashDetails;
      setCashNetwork(details.network);
    }
  }, [initial]);

  const handleSubmit = () => {
    const base = {
      fullName: fullName.trim(),
      nickname: nickname.trim() || null,
      relationship: relationship.trim() || null,
      phone: phone.trim() || null,
    };
    if (payoutMethod === "bank") {
      onSubmit({
        ...base,
        payoutMethod: "bank",
        bankCode: bankCode ?? "",
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim() || fullName.trim(),
      });
    } else if (payoutMethod === "mobile_wallet") {
      onSubmit({
        ...base,
        payoutMethod: "mobile_wallet",
        walletProvider: walletProvider ?? "easypaisa",
        walletNumber: walletNumber.trim(),
      });
    } else {
      onSubmit({
        ...base,
        payoutMethod: "cash_pickup",
        cashNetwork: cashNetwork ?? "western_union",
      });
    }
  };

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: "600", color: "#243447" }}>
          Payout method
        </Text>
        <Segmented
          value={payoutMethod}
          onChange={(v) => setPayoutMethod(v)}
          options={[
            { value: "bank", label: "Bank" },
            { value: "mobile_wallet", label: "Wallet" },
            { value: "cash_pickup", label: "Cash" },
          ]}
        />
      </View>

      <View style={{ gap: 16 }}>
        <Input
          label="Full legal name"
          required
          placeholder="Sara Khan"
          value={fullName}
          onChangeText={setFullName}
          errorText={fieldErrors.fullName}
        />
        <Input
          label="Nickname (optional)"
          placeholder="Family, Mum, Cousin Ali"
          value={nickname}
          onChangeText={setNickname}
        />
        <Input
          label="Relationship (optional)"
          placeholder="Family, friend, business"
          value={relationship}
          onChangeText={setRelationship}
        />
        <Input
          label="Phone (for SMS on delivery, optional)"
          keyboardType="phone-pad"
          placeholder="+923001234567"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      {payoutMethod === "bank" && (
        <View style={{ gap: 16 }}>
          <Picker
            label="Bank"
            required
            value={bankCode}
            onChange={setBankCode}
            options={PK_BANKS.slice(0, 10).map((b) => ({ value: b.code, label: b.name }))}
          />
          <Input
            label="Account number"
            required
            keyboardType="number-pad"
            placeholder="1234567890"
            value={accountNumber}
            onChangeText={setAccountNumber}
            errorText={fieldErrors.accountNumber}
          />
          <Input
            label="Account title"
            required
            placeholder="As printed on the account"
            value={accountTitle}
            onChangeText={setAccountTitle}
            errorText={fieldErrors.accountTitle}
            helperText="Must match exactly what the bank has on file."
          />
        </View>
      )}

      {payoutMethod === "mobile_wallet" && (
        <View style={{ gap: 16 }}>
          <Picker
            label="Wallet"
            required
            value={walletProvider}
            onChange={setWalletProvider}
            options={MOBILE_WALLETS.map((w) => ({ value: w.code, label: w.name }))}
          />
          <Input
            label="Wallet phone number"
            required
            keyboardType="phone-pad"
            placeholder="03001234567"
            value={walletNumber}
            onChangeText={setWalletNumber}
            errorText={fieldErrors.walletNumber}
          />
        </View>
      )}

      {payoutMethod === "cash_pickup" && (
        <View style={{ gap: 16 }}>
          <Picker
            label="Pickup network"
            required
            value={cashNetwork}
            onChange={setCashNetwork}
            options={CASH_NETWORKS.map((n) => ({ value: n.code, label: n.name }))}
          />
          <Text style={{ fontSize: 12, color: "#5B6B7F" }}>
            The recipient will use the legal name above to collect funds at any agent location.
          </Text>
        </View>
      )}

      {error && (
        <View
          style={{
            backgroundColor: "#FBEAEA",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 13, color: "#D64545" }}>{error}</Text>
        </View>
      )}

      <Button size="lg" loading={submitting} onPress={handleSubmit}>
        {submitLabel}
      </Button>
    </View>
  );
}
