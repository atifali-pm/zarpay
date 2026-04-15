import { Pressable, Text, View } from "react-native";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F6F8FB",
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: "#E6EAF0",
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: selected ? "#FFFFFF" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: selected ? "#0B1A2C" : "transparent",
              shadowOpacity: selected ? 0.06 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: selected ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: selected ? "#0B2545" : "#5B6B7F",
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
