/**
 * Typed fetch client pointed at the Zarpay backend. Reads `extra.apiUrl`
 * from `app.json` so the URL can be swapped per environment without
 * code changes. Carries a bearer token from `expo-secure-store` on
 * authenticated calls.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStoreNative from "expo-secure-store";

const SecureStore = Platform.OS === "web"
  ? {
      getItemAsync: async (key: string) =>
        typeof localStorage !== "undefined" ? localStorage.getItem(key) : null,
      setItemAsync: async (key: string, value: string) => {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      },
      deleteItemAsync: async (key: string) => {
        if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      },
    }
  : SecureStoreNative;
import type {
  ApiError,
  CreateRecipientRequest,
  CreateTransferRequest,
  CurrentRateResponse,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PublicUser,
  QuoteRequest,
  QuoteResponse,
  Recipient,
  RecipientListResponse,
  RecipientResponse,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  TransferDetail,
  TransferSummary,
  UpdateRecipientRequest,
} from "@zarpay/types";

/**
 * Resolve the backend base URL.
 *
 * Order of precedence:
 * 1. `extra.apiUrl` in app.json, if it points to a non-localhost host (useful
 *    for EAS builds pointing at a staging or production URL).
 * 2. `hostUri` from Expo Constants. In Expo Go on LAN mode this is always the
 *    dev machine's LAN IP plus Metro's port (e.g. "192.168.40.151:8081").
 *    We strip the Metro port and swap in 3010 for the Next.js API.
 * 3. localhost fallback for tests.
 */
function resolveApiUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (
    extra?.apiUrl &&
    !extra.apiUrl.includes("localhost") &&
    !extra.apiUrl.includes("127.0.0.1")
  ) {
    return extra.apiUrl;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3010`;
  }
  return "http://localhost:3010";
}

const API_URL = resolveApiUrl();

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[zarpay-mobile] API base URL = ${API_URL}`);
}

const TOKEN_KEY = "zarpay.auth.token";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string>;
  constructor(status: number, payload: ApiError) {
    super(payload.error);
    this.name = "ApiClientError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    throw new ApiClientError(res.status, (data as ApiError) ?? { error: res.statusText });
  }
  return data as T;
}

export const api = {
  async getCurrentRate(): Promise<CurrentRateResponse> {
    return request<CurrentRateResponse>("/api/rates/current", { auth: false });
  },

  async signIn(body: SignInRequest): Promise<SignInResponse> {
    const result = await request<SignInResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    return result;
  },

  async signUp(body: SignUpRequest): Promise<SignUpResponse> {
    const result = await request<SignUpResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    return result;
  },

  async signOut(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getMe(): Promise<{ user: PublicUser }> {
    return request<{ user: PublicUser }>("/api/me");
  },

  async sendOtp(): Promise<OtpSendResponse> {
    return request<OtpSendResponse>("/api/auth/otp/send", { method: "POST" });
  },

  async verifyOtp(body: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    return request<OtpVerifyResponse>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async uploadKyc(args: {
    idType: "passport" | "driving_licence" | "national_id";
    idFront: { uri: string; mimeType: string };
    idBack: { uri: string; mimeType: string };
    selfie: { uri: string; mimeType: string };
  }): Promise<{ ok: boolean; user: PublicUser }> {
    const form = new FormData();
    form.append("id_type", args.idType);
    const toPart = (uri: string, mimeType: string, name: string) =>
      // React Native extends FormData to accept { uri, name, type } objects
      // for file uploads. Cast through unknown to satisfy the DOM lib typing.
      ({ uri, name, type: mimeType || "image/jpeg" }) as unknown as Blob;
    form.append("id_front", toPart(args.idFront.uri, args.idFront.mimeType, "id_front.jpg"));
    form.append("id_back", toPart(args.idBack.uri, args.idBack.mimeType, "id_back.jpg"));
    form.append("selfie", toPart(args.selfie.uri, args.selfie.mimeType, "selfie.jpg"));

    // Do not set Content-Type so fetch sets the multipart boundary itself.
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const res = await fetch(`${API_URL}/api/kyc`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      throw new ApiClientError(res.status, (data as ApiError) ?? { error: res.statusText });
    }
    return data as { ok: boolean; user: PublicUser };
  },

  async listRecipients(): Promise<Recipient[]> {
    const res = await request<RecipientListResponse>("/api/recipients");
    return res.recipients;
  },

  async getRecipient(id: string): Promise<Recipient> {
    const res = await request<RecipientResponse>(`/api/recipients/${encodeURIComponent(id)}`);
    return res.recipient;
  },

  async createRecipient(body: CreateRecipientRequest): Promise<Recipient> {
    const res = await request<RecipientResponse>("/api/recipients", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.recipient;
  },

  async updateRecipient(id: string, body: UpdateRecipientRequest): Promise<Recipient> {
    const res = await request<RecipientResponse>(`/api/recipients/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return res.recipient;
  },

  async deleteRecipient(id: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/recipients/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async quoteTransfer(body: QuoteRequest): Promise<QuoteResponse> {
    return request<QuoteResponse>("/api/transfers/quote", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async listTransfers(): Promise<TransferSummary[]> {
    const res = await request<{ transfers: TransferSummary[] }>("/api/transfers");
    return res.transfers;
  },

  async createTransfer(body: CreateTransferRequest): Promise<TransferDetail> {
    return request<TransferDetail>("/api/transfers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async confirmDevPayment(id: string): Promise<TransferDetail> {
    return request<TransferDetail>(
      `/api/transfers/${encodeURIComponent(id)}/confirm-payment`,
      { method: "POST" },
    );
  },

  async cancelTransfer(id: string): Promise<TransferDetail> {
    return request<TransferDetail>(
      `/api/transfers/${encodeURIComponent(id)}/cancel`,
      { method: "POST" },
    );
  },

  async getTransferDetail(id: string): Promise<TransferDetail> {
    return request<TransferDetail>(`/api/transfers/${encodeURIComponent(id)}`);
  },
};

export { API_URL };
