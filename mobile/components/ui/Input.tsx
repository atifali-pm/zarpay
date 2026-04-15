import { forwardRef, type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  right?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helperText, errorText, required, right, className, ...rest },
  ref,
) {
  const hasError = Boolean(errorText);
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-xs font-semibold text-text-700">
          {label}
          {required && <Text className="text-danger-500"> *</Text>}
        </Text>
      )}
      <View
        className={`flex-row items-center rounded-xl border bg-white px-4 ${
          hasError ? "border-danger-500" : "border-border-strong"
        }`}
      >
        <TextInput
          ref={ref}
          placeholderTextColor="#9BA8B8"
          className={`flex-1 py-3 text-base text-text-900 ${className ?? ""}`}
          {...rest}
        />
        {right}
      </View>
      {errorText ? (
        <Text className="mt-1 text-xs text-danger-500">{errorText}</Text>
      ) : helperText ? (
        <Text className="mt-1 text-xs text-text-500">{helperText}</Text>
      ) : null}
    </View>
  );
});
