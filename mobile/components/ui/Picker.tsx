import { Pressable, Text, View } from "react-native";

interface PickerOption<T extends string> {
  value: T;
  label: string;
}

interface PickerProps<T extends string> {
  label?: string;
  required?: boolean;
  value: T | null;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
}

/**
 * Simple radio-card picker used for low-cardinality choices (bank, wallet
 * provider, cash network). For long lists (20+ banks) this would be a
 * bottom sheet; for 3 wallets and 2 networks it is fine as an inline list.
 */
export function Picker<T extends string>({ label, required, value, options, onChange }: PickerProps<T>) {
  return (
    <View>
      {label && (
        <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#243447" }}>
          {label}
          {required && <Text style={{ color: "#D64545" }}> *</Text>}
        </Text>
      )}
      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#0B2545" : "#E6EAF0",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: "#FFFFFF",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: selected ? "#0B2545" : "#C9D1DC",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {selected && (
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#0B2545" }}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: selected ? "600" : "500",
                  color: "#0B1A2C",
                  flex: 1,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
