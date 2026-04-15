import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

type IdType = "passport" | "driving_licence" | "national_id";

type DocSlot = "id_front" | "id_back" | "selfie";

interface CapturedDoc {
  uri: string;
  mimeType: string;
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  idType: IdType | null;
  idFront: CapturedDoc | null;
  idBack: CapturedDoc | null;
  selfie: CapturedDoc | null;
}

const ID_TYPES: Array<{ id: IdType; label: string; description: string }> = [
  {
    id: "passport",
    label: "Passport",
    description: "Any passport with a photo page",
  },
  {
    id: "driving_licence",
    label: "Driving licence",
    description: "Full or provisional, front and back",
  },
  {
    id: "national_id",
    label: "National ID card",
    description: "Government-issued ID card",
  },
];

const DOC_LABELS: Record<DocSlot, { title: string; instruction: string }> = {
  id_front: {
    title: "ID front",
    instruction:
      "Place the front of your ID on a flat surface, good lighting, no glare. All four corners visible.",
  },
  id_back: {
    title: "ID back",
    instruction: "Flip the ID over and capture the back. For passports, capture the photo page again.",
  },
  selfie: {
    title: "Selfie",
    instruction: "Look straight into the camera. Remove glasses. Hold your ID next to your face.",
  },
};

export default function KycScreen() {
  const router = useRouter();
  const { refresh, signOut } = useAuth();
  const [state, setState] = useState<WizardState>({
    step: 1,
    idType: null,
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const capture = async (slot: DocSlot) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera permission needed",
        "Zarpay needs your camera to capture ID documents. Open Settings and allow camera access.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
      cameraType: slot === "selfie" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const doc: CapturedDoc = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
    };
    setState((prev) => ({ ...prev, [slot]: doc }));
  };

  const submit = async () => {
    if (!state.idType || !state.idFront || !state.idBack || !state.selfie) {
      setSubmitError("All documents are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.uploadKyc({
        idType: state.idType,
        idFront: state.idFront,
        idBack: state.idBack,
        selfie: state.selfie,
      });
      await refresh();
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Upload failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-12">
          <View className="mb-6 flex-row items-center justify-between">
            <Logo size="md" />
            <Text
              className="text-sm font-semibold text-primary-700"
              onPress={() => {
                Alert.alert(
                  "Exit verification?",
                  "You can come back later, but you cannot send money until this is complete.",
                  [
                    { text: "Stay", style: "cancel" },
                    {
                      text: "Exit and log out",
                      style: "destructive",
                      onPress: () => {
                        void signOut();
                        router.replace("/");
                      },
                    },
                  ],
                );
              }}
            >
              Exit
            </Text>
          </View>

          <ProgressBar step={state.step} total={5} />

          {state.step === 1 && (
            <StepIdType
              selected={state.idType}
              onSelect={(id) => setState((prev) => ({ ...prev, idType: id, step: 2 }))}
            />
          )}

          {state.step === 2 && (
            <StepCapture
              slot="id_front"
              doc={state.idFront}
              onCapture={() => capture("id_front")}
              onBack={() => setState((prev) => ({ ...prev, step: 1 }))}
              onNext={() => setState((prev) => ({ ...prev, step: 3 }))}
            />
          )}
          {state.step === 3 && (
            <StepCapture
              slot="id_back"
              doc={state.idBack}
              onCapture={() => capture("id_back")}
              onBack={() => setState((prev) => ({ ...prev, step: 2 }))}
              onNext={() => setState((prev) => ({ ...prev, step: 4 }))}
            />
          )}
          {state.step === 4 && (
            <StepCapture
              slot="selfie"
              doc={state.selfie}
              onCapture={() => capture("selfie")}
              onBack={() => setState((prev) => ({ ...prev, step: 3 }))}
              onNext={() => setState((prev) => ({ ...prev, step: 5 }))}
            />
          )}

          {state.step === 5 && (
            <StepReview
              idType={state.idType}
              idFront={state.idFront}
              idBack={state.idBack}
              selfie={state.selfie}
              submitting={submitting}
              error={submitError}
              onBack={() => setState((prev) => ({ ...prev, step: 4 }))}
              onSubmit={submit}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="mb-6 flex-row items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${i < step ? "bg-primary-900" : "bg-border"}`}
        />
      ))}
    </View>
  );
}

function StepIdType({
  selected,
  onSelect,
}: {
  selected: IdType | null;
  onSelect: (id: IdType) => void;
}) {
  return (
    <View>
      <Text className="text-3xl font-bold text-text-900">Which ID will you use?</Text>
      <Text className="mt-2 text-base text-text-500">
        Pick one. You will capture the front, the back, and a selfie in the next steps.
      </Text>
      <View className="mt-6 gap-3">
        {ID_TYPES.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={{
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? "#0B2545" : "#E6EAF0",
                borderRadius: 16,
                padding: 20,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text className="text-lg font-bold text-text-900">{opt.label}</Text>
              <Text className="mt-1 text-sm text-text-500">{opt.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepCapture({
  slot,
  doc,
  onCapture,
  onBack,
  onNext,
}: {
  slot: DocSlot;
  doc: CapturedDoc | null;
  onCapture: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const meta = DOC_LABELS[slot];
  return (
    <View>
      <Text className="text-3xl font-bold text-text-900">Capture your {meta.title.toLowerCase()}</Text>
      <Text className="mt-2 text-base text-text-500">{meta.instruction}</Text>

      <Card className="mt-6">
        <CardBody>
          {doc ? (
            <View>
              <View
                style={{
                  aspectRatio: 3 / 2,
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#F6F8FB",
                }}
              >
                <Image
                  source={{ uri: doc.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
              <View className="mt-4">
                <Button variant="secondary" onPress={onCapture}>
                  Retake photo
                </Button>
              </View>
            </View>
          ) : (
            <View
              style={{
                aspectRatio: 3 / 2,
                borderRadius: 16,
                borderStyle: "dashed",
                borderWidth: 2,
                borderColor: "#C9D1DC",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F6F8FB",
              }}
            >
              <Text className="text-sm text-text-500">No photo yet</Text>
            </View>
          )}
        </CardBody>
      </Card>

      <View className="mt-6 gap-3">
        {!doc && (
          <Button size="lg" onPress={onCapture}>
            Open camera
          </Button>
        )}
        {doc && (
          <Button size="lg" onPress={onNext}>
            Next step
          </Button>
        )}
        <Button size="md" variant="ghost" onPress={onBack}>
          Back
        </Button>
      </View>
    </View>
  );
}

function StepReview({
  idType,
  idFront,
  idBack,
  selfie,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  idType: IdType | null;
  idFront: CapturedDoc | null;
  idBack: CapturedDoc | null;
  selfie: CapturedDoc | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const idLabel = ID_TYPES.find((opt) => opt.id === idType)?.label ?? "ID";

  return (
    <View>
      <Text className="text-3xl font-bold text-text-900">Review and submit</Text>
      <Text className="mt-2 text-base text-text-500">
        Zarpay compliance will review these documents. You will get an email and a status update
        in-app when a decision is made.
      </Text>

      <Card className="mt-6">
        <CardHeader title={idLabel} description="Front, back, and selfie captures" />
        <CardBody>
          <View className="gap-3">
            {(
              [
                ["id_front", idFront, "Front"],
                ["id_back", idBack, "Back"],
                ["selfie", selfie, "Selfie"],
              ] as const
            ).map(([key, doc, label]) => (
              <View key={key} className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 72,
                    height: 48,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#F6F8FB",
                  }}
                >
                  {doc && (
                    <Image
                      source={{ uri: doc.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <Text className="flex-1 text-sm font-semibold text-text-900">{label}</Text>
                <Text className="text-xs text-success-500">captured</Text>
              </View>
            ))}
          </View>
        </CardBody>
      </Card>

      {error && (
        <View className="mt-4 rounded-xl bg-danger-100 px-4 py-3">
          <Text className="text-sm text-danger-500">{error}</Text>
        </View>
      )}

      <View className="mt-6 gap-3">
        <Button size="lg" loading={submitting} onPress={onSubmit}>
          Submit for review
        </Button>
        <Button size="md" variant="ghost" disabled={submitting} onPress={onBack}>
          Back
        </Button>
      </View>

      <Text className="mt-4 text-center text-xs text-text-500">
        Documents are stored securely in a dedicated KYC bucket with short-lived signed URLs for
        reviewers only.
      </Text>
    </View>
  );
}
